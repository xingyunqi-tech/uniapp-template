import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { storage, STORAGE_KEYS } from '@/utils/storage';
import { ApiError } from '@/api/core/alova';

const mocks = vi.hoisted(() => ({
  autoSilentLogin: false,
  platform: 'h5' as 'h5' | 'mp-weixin' | 'mp-alipay',
  getCurrentUser: vi.fn(),
  refreshToken: vi.fn(),
  loginWithWechat: vi.fn(),
  loginWithAlipay: vi.fn(),
}));

vi.mock('@/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@/api')>()),
  getCurrentUser: mocks.getCurrentUser,
  refreshToken: mocks.refreshToken,
  loginWithWechat: mocks.loginWithWechat,
  loginWithAlipay: mocks.loginWithAlipay,
}));

vi.mock('@/constants/system', async importOriginal => ({
  ...(await importOriginal<typeof import('@/constants/system')>()),
  get AUTO_SILENT_LOGIN() {
    return mocks.autoSilentLogin;
  },
}));

vi.mock('@/utils/platform', () => ({
  isWeixin: () => mocks.platform === 'mp-weixin',
  isAlipay: () => mocks.platform === 'mp-alipay',
}));

const { useUserStore } = await import('@/store/modules/user');

const user = { id: '1', nickname: 'Tom', role: { id: 2 }, status: { id: 1 } };
const loginResponse = { token: 'mp-token', refreshToken: 'mp-refresh', tokenExpires: 1, user };
const uniLogin = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  mocks.autoSilentLogin = false;
  mocks.platform = 'h5';
  storage.remove(STORAGE_KEYS.TOKEN);
  storage.remove(STORAGE_KEYS.REFRESH_TOKEN);
  storage.remove(STORAGE_KEYS.TOKEN_EXPIRES);
  (uni as unknown as { login: typeof uniLogin }).login = uniLogin;
  uniLogin.mockImplementation(({ success }) => success({ code: 'code-1' }));
  setActivePinia(createPinia());
});

function loggedInStore() {
  const store = useUserStore();
  store.setToken('token-1');
  store.setRefreshToken('refresh-1');
  store.setUserInfo({ id: 1, nickname: 'Cached' });
  return store;
}

describe('useUserStore.ensureSession 已有 Token', () => {
  it('静默请求当前用户并刷新 userInfo', async () => {
    const store = loggedInStore();
    mocks.getCurrentUser.mockResolvedValue(user);

    await store.ensureSession();

    expect(mocks.getCurrentUser).toHaveBeenCalledWith({ showError: false, skipAuthHandling: true });
    expect(store.userInfo?.nickname).toBe('Tom');
  });

  it('同一次启动只请求一次', async () => {
    const store = loggedInStore();
    mocks.getCurrentUser.mockResolvedValue(user);

    await Promise.all([store.ensureSession(), store.ensureSession()]);
    await store.ensureSession();

    expect(mocks.getCurrentUser).toHaveBeenCalledTimes(1);
  });

  it('进行中 sessionPending 为 true，结束后为 false', async () => {
    const store = loggedInStore();
    mocks.getCurrentUser.mockResolvedValue(user);

    const pending = store.ensureSession();
    expect(store.sessionPending).toBe(true);
    await pending;
    expect(store.sessionPending).toBe(false);
  });

  it('网络错误时保留本地登录态与缓存', async () => {
    const store = loggedInStore();
    mocks.getCurrentUser.mockRejectedValue(new Error('request:fail'));

    await expect(store.ensureSession()).resolves.toBeUndefined();

    expect(store.isLoggedIn).toBe(true);
    expect(store.userInfo?.nickname).toBe('Cached');
  });

  it('401 时刷新 Token 后重试', async () => {
    const store = loggedInStore();
    mocks.getCurrentUser.mockRejectedValueOnce(new ApiError('Unauthorized', 401)).mockResolvedValueOnce(user);
    mocks.refreshToken.mockResolvedValue({ token: 'token-2', refreshToken: 'refresh-2', tokenExpires: 1 });

    await store.ensureSession();

    expect(mocks.getCurrentUser).toHaveBeenCalledTimes(2);
    expect(store.token).toBe('token-2');
    expect(store.userInfo?.nickname).toBe('Tom');
  });

  it('401 且刷新失败时只清理本地登录态，不跳转登录页', async () => {
    const store = loggedInStore();
    mocks.getCurrentUser.mockRejectedValue(new ApiError('Unauthorized', 401));
    mocks.refreshToken.mockRejectedValue(new ApiError('Unauthorized', 401));

    await store.ensureSession();

    expect(store.isLoggedIn).toBe(false);
    expect(store.userInfo).toBeNull();
    expect(storage.get(STORAGE_KEYS.TOKEN)).toBeFalsy();
    expect(uni.redirectTo).not.toHaveBeenCalled();
  });

  it('401 且刷新遇到网络错误时保留登录态', async () => {
    const store = loggedInStore();
    mocks.getCurrentUser.mockRejectedValue(new ApiError('Unauthorized', 401));
    mocks.refreshToken.mockRejectedValue(new Error('request:fail'));

    await store.ensureSession();

    expect(store.isLoggedIn).toBe(true);
    expect(store.userInfo?.nickname).toBe('Cached');
  });

  it('请求期间 Token 变化时不写入迟到的用户信息', async () => {
    const store = loggedInStore();
    let resolveUser: (value: typeof user) => void = () => {};
    mocks.getCurrentUser.mockReturnValue(new Promise(resolve => (resolveUser = resolve)));

    const pending = store.ensureSession();
    await vi.waitFor(() => expect(mocks.getCurrentUser).toHaveBeenCalled());
    store.setToken('token-new');
    store.setUserInfo({ id: 2, nickname: 'Jerry' });
    resolveUser(user);
    await pending;

    expect(store.token).toBe('token-new');
    expect(store.userInfo?.nickname).toBe('Jerry');
  });

  it('401 刷新后重试期间 Token 变化时不写入迟到的用户信息', async () => {
    const store = loggedInStore();
    let resolveUser: (value: typeof user) => void = () => {};
    mocks.getCurrentUser
      .mockRejectedValueOnce(new ApiError('Unauthorized', 401))
      .mockReturnValueOnce(new Promise(resolve => (resolveUser = resolve)));
    mocks.refreshToken.mockResolvedValue({ token: 'token-2', refreshToken: 'refresh-2', tokenExpires: 1 });

    const pending = store.ensureSession();
    await vi.waitFor(() => expect(mocks.getCurrentUser).toHaveBeenCalledTimes(2));
    store.setToken('token-new');
    store.setUserInfo({ id: 2, nickname: 'Jerry' });
    resolveUser(user);
    await pending;

    expect(store.userInfo?.nickname).toBe('Jerry');
  });
});

describe('useUserStore.ensureSession 静默登录', () => {
  it('开关关闭时不登录', async () => {
    mocks.platform = 'mp-weixin';
    const store = useUserStore();

    await store.ensureSession();

    expect(uniLogin).not.toHaveBeenCalled();
    expect(store.isLoggedIn).toBe(false);
  });

  it('微信小程序用 uni.login 的 code 登录', async () => {
    mocks.autoSilentLogin = true;
    mocks.platform = 'mp-weixin';
    mocks.loginWithWechat.mockResolvedValue(loginResponse);
    const store = useUserStore();

    await store.ensureSession();

    expect(mocks.loginWithWechat).toHaveBeenCalledWith(
      { code: 'code-1', type: 'mini_app' },
      { showError: false, skipAuthHandling: true },
    );
    expect(store.isLoggedIn).toBe(true);
    expect(storage.get(STORAGE_KEYS.TOKEN)).toBe('mp-token');
    expect(store.userInfo?.nickname).toBe('Tom');
  });

  it('支付宝小程序用授权码登录', async () => {
    mocks.autoSilentLogin = true;
    mocks.platform = 'mp-alipay';
    mocks.loginWithAlipay.mockResolvedValue(loginResponse);
    const store = useUserStore();

    await store.ensureSession();

    expect(mocks.loginWithAlipay).toHaveBeenCalledWith(
      { authCode: 'code-1' },
      { showError: false, skipAuthHandling: true },
    );
    expect(store.isLoggedIn).toBe(true);
  });

  it('H5 不静默登录', async () => {
    mocks.autoSilentLogin = true;
    const store = useUserStore();

    await store.ensureSession();

    expect(uniLogin).not.toHaveBeenCalled();
    expect(store.isLoggedIn).toBe(false);
  });

  it('登录失败时静默保持未登录', async () => {
    mocks.autoSilentLogin = true;
    mocks.platform = 'mp-weixin';
    mocks.loginWithWechat.mockRejectedValue(new ApiError('Bad Request', 400));
    const store = useUserStore();

    await expect(store.ensureSession()).resolves.toBeUndefined();

    expect(store.isLoggedIn).toBe(false);
    expect(uni.showToast).not.toHaveBeenCalled();
  });

  it('静默登录期间已手动登录时不覆盖登录态', async () => {
    mocks.autoSilentLogin = true;
    mocks.platform = 'mp-weixin';
    let resolveLogin: (value: typeof loginResponse) => void = () => {};
    mocks.loginWithWechat.mockReturnValue(new Promise(resolve => (resolveLogin = resolve)));
    const store = useUserStore();

    const pending = store.ensureSession();
    await vi.waitFor(() => expect(mocks.loginWithWechat).toHaveBeenCalled());
    store.setToken('manual-token');
    resolveLogin(loginResponse);
    await pending;

    expect(store.token).toBe('manual-token');
  });
});
