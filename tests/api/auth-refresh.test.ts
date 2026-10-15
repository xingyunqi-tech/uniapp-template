import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { http, setAuthHandlers, type AuthHandlers } from '@/api/core/alova';
import { customMutator } from '@/api/core/mutator';
import { refreshToken as refreshTokenApi } from '@/api/custom/override';
import { storage, STORAGE_KEYS } from '@/utils/storage';

interface RequestOptions {
  url: string;
  method: string;
  header: Record<string, string>;
  data?: unknown;
  success: (res: { statusCode: number; data: unknown; header: Record<string, string> }) => void;
}

type Reply = { statusCode: number; data?: unknown };

const requestMock = uni.request as unknown as Mock;

/** 按请求返回响应，记录每次请求 */
function mockServer(handler: (options: RequestOptions) => Reply) {
  const calls: RequestOptions[] = [];
  requestMock.mockImplementation((options: RequestOptions) => {
    const snapshot = { ...options, header: { ...options.header } };
    calls.push(snapshot);
    const reply = handler(snapshot);
    void Promise.resolve().then(() => options.success({ data: reply.data, statusCode: reply.statusCode, header: {} }));
    return { abort: vi.fn() };
  });
  return calls;
}

const ok = (data: unknown = null): Reply => ({ statusCode: 200, data: { code: 200, message: 'ok', data } });
const unauthorized: Reply = { statusCode: 401, data: { code: 401, message: 'Unauthorized' } };

/** 逐个微任务推进，直到条件成立 */
async function until(condition: () => boolean, label: string) {
  for (let i = 0; i < 1000 && !condition(); i++) await Promise.resolve();
  expect(condition(), label).toBe(true);
}

/** 挂起的刷新：调用 finish 后才写入新 Token 并返回 */
function pendingRefresh() {
  let finish = () => {};
  const refreshToken = vi.fn(
    () =>
      new Promise<string>(resolve => {
        finish = () => {
          storage.set(STORAGE_KEYS.TOKEN, 'fresh');
          resolve('fresh');
        };
      }),
  );
  return { refreshToken, finish: () => finish() };
}

function registerHandlers(handlers: Partial<AuthHandlers>) {
  const clearAuth = vi.fn();
  setAuthHandlers({ refreshToken: async () => null, clearAuth, ...handlers });
  return clearAuth;
}

describe('401 刷新 Token', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout'] });
    (uni.redirectTo as Mock)
      .mockReset()
      .mockImplementation((options: { complete?: () => void }) => options.complete?.());
    storage.set(STORAGE_KEYS.TOKEN, 'expired');
  });

  afterEach(() => {
    vi.runAllTimers();
    vi.useRealTimers();
    requestMock.mockReset();
    setAuthHandlers(null);
  });

  it('刷新进行中到达的多个 401 共用一次刷新，并以新 Token 重发原请求', async () => {
    const { refreshToken, finish } = pendingRefresh();
    registerHandlers({ refreshToken });
    const calls = mockServer(({ header }) => (header.Authorization === 'Bearer fresh' ? ok('done') : unauthorized));

    const pending = Promise.all([http.Get('/a').send(), http.Get('/b').send()]);
    await until(() => calls.length === 2, '两个请求已发出');
    for (let i = 0; i < 100; i++) await Promise.resolve();
    finish();
    const results = await pending;

    expect(refreshToken).toHaveBeenCalledTimes(1);
    expect(results.map(result => (result as { data: unknown }).data)).toEqual(['done', 'done']);
    expect(calls.filter(call => call.header.Authorization === 'Bearer fresh')).toHaveLength(2);
  });

  it('刷新接口自身返回 401 时只请求一次刷新，并清理登录态', async () => {
    const clearAuth = registerHandlers({
      refreshToken: async () => {
        try {
          return (await refreshTokenApi('refresh-token')).token;
        } catch {
          return null;
        }
      },
    });
    const calls = mockServer(() => unauthorized);

    await expect(http.Get('/profile')).rejects.toThrow('Unauthorized');

    const refreshCalls = calls.filter(call => call.url.endsWith('/api/v1/auth/refresh'));
    expect(refreshCalls).toHaveLength(1);
    expect(refreshCalls[0].header.Authorization).toBe('Bearer refresh-token');
    expect(clearAuth).toHaveBeenCalledTimes(1);
  });

  it('重发后仍是 401 时只刷新一次并清理登录态', async () => {
    const refreshToken = vi.fn(async () => 'fresh');
    const clearAuth = registerHandlers({ refreshToken });
    const calls = mockServer(() => unauthorized);

    await expect(http.Get('/profile')).rejects.toThrow('Unauthorized');

    expect(refreshToken).toHaveBeenCalledTimes(1);
    expect(calls).toHaveLength(2);
    expect(clearAuth).toHaveBeenCalledTimes(1);
  });

  it('刷新遇到网络错误时保留登录态，原请求失败并提示错误', async () => {
    const clearAuth = registerHandlers({
      refreshToken: async () => {
        throw new Error('request:fail timeout');
      },
    });
    mockServer(() => unauthorized);
    (uni.showToast as Mock).mockClear();

    await expect(http.Get('/profile')).rejects.toThrow('request:fail timeout');
    vi.runAllTimers();

    expect(clearAuth).not.toHaveBeenCalled();
    expect(uni.redirectTo).not.toHaveBeenCalled();
    expect(uni.showToast).toHaveBeenCalledWith({ title: 'request:fail timeout', icon: 'none' });
  });

  it('skipAuthHandling 的请求 401 时直接抛错，不刷新也不清理登录态', async () => {
    const refreshToken = vi.fn(async () => 'fresh');
    const clearAuth = registerHandlers({ refreshToken });
    mockServer(() => unauthorized);

    await expect(customMutator({ url: '/logout', method: 'POST' }, { skipAuthHandling: true })).rejects.toThrow(
      'Unauthorized',
    );

    expect(refreshToken).not.toHaveBeenCalled();
    expect(clearAuth).not.toHaveBeenCalled();
    expect(uni.redirectTo).not.toHaveBeenCalled();
  });

  it('刷新期间已登出时直接抛错，不提示登录过期也不跳转', async () => {
    const clearAuth = registerHandlers({
      refreshToken: async () => {
        storage.remove(STORAGE_KEYS.TOKEN);
        return null;
      },
    });
    (uni.showToast as Mock).mockClear();
    mockServer(() => unauthorized);

    await expect(http.Get('/profile')).rejects.toThrow('Unauthorized');

    expect(clearAuth).not.toHaveBeenCalled();
    expect(uni.showToast).not.toHaveBeenCalled();
    expect(uni.redirectTo).not.toHaveBeenCalled();
  });

  it('刷新期间发出的相同请求不与重发请求合并，且直接用新 Token 重发', async () => {
    const { refreshToken, finish: finishRefresh } = pendingRefresh();
    const clearAuth = registerHandlers({ refreshToken });
    const sentTokens: string[] = [];
    const heldReplies: Array<() => void> = [];
    requestMock.mockImplementation((options: RequestOptions) => {
      sentTokens.push(options.header.Authorization);
      const reply = options.header.Authorization === 'Bearer fresh' ? ok('done') : unauthorized;
      const respond = () => options.success({ data: reply.data, statusCode: reply.statusCode, header: {} });
      if (sentTokens.length === 2) heldReplies.push(respond);
      else void Promise.resolve().then(respond);
      return { abort: vi.fn() };
    });

    const first = http.Get('/me').send();
    await until(() => refreshToken.mock.calls.length > 0, '开始刷新');
    const second = http.Get('/me').send();
    await until(() => sentTokens.length === 2, '第二个请求已发出');
    finishRefresh();
    await until(() => sentTokens.length === 3, '重发请求已发出');
    heldReplies.forEach(respond => respond());

    const results = await Promise.all([first, second]);

    expect(results.map(result => (result as { data: unknown }).data)).toEqual(['done', 'done']);
    expect(sentTokens).toEqual(['Bearer expired', 'Bearer expired', 'Bearer fresh', 'Bearer fresh']);
    expect(refreshToken).toHaveBeenCalledTimes(1);
    expect(clearAuth).not.toHaveBeenCalled();
  });

  it('刷新完成后发起的请求不并入仍带旧 Token 的进行中请求', async () => {
    const { refreshToken, finish } = pendingRefresh();
    const clearAuth = registerHandlers({ refreshToken });
    const sent: string[] = [];
    const heldReplies: Array<() => void> = [];
    requestMock.mockImplementation((options: RequestOptions) => {
      sent.push(`${options.url} ${options.header.Authorization}`);
      const reply = options.header.Authorization === 'Bearer fresh' ? ok(options.url) : unauthorized;
      const respond = () => options.success({ data: reply.data, statusCode: reply.statusCode, header: {} });
      if (options.url === '/list' && sent.length === 1) heldReplies.push(respond);
      else void Promise.resolve().then(respond);
      return { abort: vi.fn() };
    });

    const staleList = customMutator({ url: '/list', method: 'GET' });
    await until(() => sent.length === 1, '旧 Token 的 /list 已发出');
    const other = customMutator({ url: '/other', method: 'GET' });
    await until(() => refreshToken.mock.calls.length === 1, '开始刷新');
    finish();
    await other;
    const freshList = customMutator({ url: '/list', method: 'GET' });
    await until(() => sent.includes('/list Bearer fresh'), '新 Token 的 /list 已单独发出');
    heldReplies.forEach(respond => respond());

    expect(await Promise.all([staleList, freshList])).toEqual(['/list', '/list']);
    expect(refreshToken).toHaveBeenCalledTimes(1);
    expect(clearAuth).not.toHaveBeenCalled();
  });
});

describe('customMutator', () => {
  afterEach(() => {
    requestMock.mockReset();
  });

  it('GET 响应不缓存，相同请求先后发出都会请求服务端', async () => {
    let count = 0;
    const calls = mockServer(() => ok(++count));

    expect(await customMutator({ url: '/me', method: 'GET' })).toBe(1);
    expect(await customMutator({ url: '/me', method: 'GET' })).toBe(2);
    expect(calls).toHaveLength(2);
  });

  it('DELETE 的 params 拼到 URL，data 作为请求体，options 的 headers 合并生效', async () => {
    const calls = mockServer(() => ok());

    await customMutator(
      { url: '/items', method: 'DELETE', params: { id: 1 }, data: { reason: 'x' }, headers: { 'X-A': 'a' } },
      { headers: { 'X-B': 'b' } },
    );

    expect(calls[0].url).toBe('/items?id=1');
    expect(calls[0].data).toEqual({ reason: 'x' });
    expect(calls[0].header).toMatchObject({ 'X-A': 'a', 'X-B': 'b' });
  });

  it('showError: false 时业务错误不弹提示', async () => {
    (uni.showToast as Mock).mockClear();
    mockServer(() => ({ statusCode: 200, data: { code: 500, message: '失败' } }));

    await expect(customMutator({ url: '/x', method: 'GET' }, { showError: false })).rejects.toThrow('失败');

    expect(uni.showToast).not.toHaveBeenCalled();
  });
});

describe('@/api 导出', () => {
  it('custom 中的同名函数覆盖 generated 版本', async () => {
    const api = await import('@/api');
    const override = await import('@/api/custom/override');

    expect(api.refreshToken).toBe(override.refreshToken);
    expect(api.logout).toBe(override.logout);
  });
});

describe('401 跳转登录页', () => {
  const getCurrentPagesMock = getCurrentPages as unknown as Mock;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout'] });
    (uni.redirectTo as Mock)
      .mockReset()
      .mockImplementation((options: { complete?: () => void }) => options.complete?.());
    storage.set(STORAGE_KEYS.TOKEN, 'expired');
  });

  function onPage(fullPath: string) {
    const [path, query = ''] = fullPath.split('?');
    const options = Object.fromEntries(
      query
        .split('&')
        .filter(Boolean)
        .map(pair => pair.split('=')),
    );
    getCurrentPagesMock.mockReturnValue([{ route: path.slice(1), options, $page: { fullPath } }]);
  }

  afterEach(() => {
    vi.useRealTimers();
    requestMock.mockReset();
    setAuthHandlers(null);
    getCurrentPagesMock.mockReset().mockReturnValue([]);
  });

  async function failWith401() {
    const clearAuth = registerHandlers({});
    mockServer(() => unauthorized);
    await expect(http.Get('/profile')).rejects.toThrow('Unauthorized');
    vi.runAllTimers();
    return clearAuth;
  }

  it('非 TabBar 页携带当前页面完整路径作为 redirect', async () => {
    onPage('/pages-sub/order/detail/index?id=1');

    await failWith401();

    expect(uni.redirectTo).toHaveBeenCalledWith(
      expect.objectContaining({
        url: `/pages/login/index?redirect=${encodeURIComponent('/pages-sub/order/detail/index?id=1')}`,
      }),
    );
  });

  it('TabBar 页不携带 redirect', async () => {
    onPage('/pages/mine/index');

    await failWith401();

    expect(uni.redirectTo).toHaveBeenCalledWith(expect.objectContaining({ url: '/pages/login/index' }));
  });

  it('已在登录页时清理登录态并提示接口错误信息，不跳转', async () => {
    onPage('/pages/login/index?redirect=%2Fpages-sub%2Forder%2Flist%2Findex');
    (uni.showToast as Mock).mockClear();

    const clearAuth = await failWith401();

    expect(clearAuth).toHaveBeenCalledTimes(1);
    expect(uni.showToast).toHaveBeenCalledWith({ title: 'Unauthorized', icon: 'none' });
    expect(uni.redirectTo).not.toHaveBeenCalled();
  });

  it('受保护页发起的未登录请求 401 时不提示也不跳转', async () => {
    storage.remove(STORAGE_KEYS.TOKEN);
    onPage('/pages-sub/user/favorite/index');
    (uni.showToast as Mock).mockClear();

    await failWith401();

    expect(uni.showToast).not.toHaveBeenCalled();
    expect(uni.redirectTo).not.toHaveBeenCalled();
  });

  it('白名单页发起的未登录请求 401 时提示请先登录并跳转登录页', async () => {
    storage.remove(STORAGE_KEYS.TOKEN);
    onPage('/pages/index/index');
    (uni.showToast as Mock).mockClear();

    await failWith401();

    expect(uni.showToast).toHaveBeenCalledWith({ title: '请先登录', icon: 'none' });
    expect(uni.redirectTo).toHaveBeenCalledWith(expect.objectContaining({ url: '/pages/login/index' }));
  });

  it('已在登录页且 showError 为 false 时不提示', async () => {
    onPage('/pages/login/index');
    (uni.showToast as Mock).mockClear();
    registerHandlers({});
    mockServer(() => unauthorized);

    await expect(customMutator({ url: '/login', method: 'POST' }, { showError: false })).rejects.toThrow(
      'Unauthorized',
    );

    expect(uni.showToast).not.toHaveBeenCalled();
    expect(uni.redirectTo).not.toHaveBeenCalled();
  });
});

describe('Token 临近过期时主动刷新', () => {
  beforeEach(() => {
    storage.set(STORAGE_KEYS.TOKEN, 'expiring');
  });

  afterEach(() => {
    requestMock.mockReset();
    setAuthHandlers(null);
    storage.remove(STORAGE_KEYS.TOKEN);
    storage.remove(STORAGE_KEYS.TOKEN_EXPIRES);
  });

  function freshOnRefresh() {
    return vi.fn(async () => {
      storage.set(STORAGE_KEYS.TOKEN, 'fresh');
      return 'fresh';
    });
  }

  it('即将过期时先刷新，并发请求共用一次刷新并携带新 Token', async () => {
    storage.set(STORAGE_KEYS.TOKEN_EXPIRES, Date.now() + 10_000);
    const refreshToken = freshOnRefresh();
    registerHandlers({ refreshToken });
    const calls = mockServer(() => ok('done'));

    await Promise.all([customMutator({ url: '/a', method: 'GET' }), customMutator({ url: '/b', method: 'GET' })]);

    expect(refreshToken).toHaveBeenCalledTimes(1);
    expect(calls.map(call => call.header.Authorization)).toEqual(['Bearer fresh', 'Bearer fresh']);
  });

  it('距离过期较远时不刷新', async () => {
    storage.set(STORAGE_KEYS.TOKEN_EXPIRES, Date.now() + 10 * 60_000);
    const refreshToken = freshOnRefresh();
    registerHandlers({ refreshToken });
    const calls = mockServer(() => ok());

    await customMutator({ url: '/a', method: 'GET' });

    expect(refreshToken).not.toHaveBeenCalled();
    expect(calls[0].header.Authorization).toBe('Bearer expiring');
  });

  it('skipAuthHandling 的请求不主动刷新', async () => {
    storage.set(STORAGE_KEYS.TOKEN_EXPIRES, Date.now() + 10_000);
    const refreshToken = freshOnRefresh();
    registerHandlers({ refreshToken });
    mockServer(() => ok());

    await customMutator({ url: '/logout', method: 'POST' }, { skipAuthHandling: true });

    expect(refreshToken).not.toHaveBeenCalled();
  });

  it('主动刷新失败后，同一 Token 的后续请求不再主动刷新', async () => {
    storage.set(STORAGE_KEYS.TOKEN, 'stale-refresh');
    storage.set(STORAGE_KEYS.TOKEN_EXPIRES, Date.now() + 10_000);
    const refreshToken = vi.fn(async () => null);
    registerHandlers({ refreshToken });
    mockServer(() => ok());

    await customMutator({ url: '/a', method: 'GET' });
    await customMutator({ url: '/b', method: 'GET' });

    expect(refreshToken).toHaveBeenCalledTimes(1);
  });

  it('刷新失败时仍用原 Token 发出请求', async () => {
    storage.set(STORAGE_KEYS.TOKEN, 'refresh-failing');
    storage.set(STORAGE_KEYS.TOKEN_EXPIRES, Date.now() + 10_000);
    const refreshToken = vi.fn(async () => {
      throw new Error('request:fail');
    });
    registerHandlers({ refreshToken });
    const calls = mockServer(() => ok());

    await customMutator({ url: '/a', method: 'GET' });

    expect(calls[0].header.Authorization).toBe('Bearer refresh-failing');
  });
});
