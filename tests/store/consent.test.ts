import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setActivePinia } from 'pinia';
import { createApp } from 'vue';
import { createPersistedPinia } from '@/store/plugins/persist';
import { ApiError, ConsentType, type ConsentStatusDto } from '@/api';
import type { UserInfo } from '@/interface';

const api = vi.hoisted(() => ({
  getConfig: vi.fn(),
  getMyConsents: vi.fn(),
  agreeConsent: vi.fn(),
}));

vi.mock('@/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@/api')>()),
  ...api,
}));

const network = vi.hoisted(() => ({
  listeners: [] as Array<(isConnected: boolean) => void>,
}));

vi.mock('@/utils/network', () => ({
  onNetworkChange: (callback: (isConnected: boolean) => void) => {
    network.listeners.push(callback);
    return () => {};
  },
}));

const { useConsentStore } = await import('@/store/modules/consent');
const { useUserStore } = await import('@/store/modules/user');

const VERSION_KEYS: Record<string, ConsentType> = {
  'consent.privacyPolicyVersion': ConsentType.PRIVACY_POLICY,
  'consent.userAgreementVersion': ConsentType.USER_AGREEMENT,
  'consent.aiServiceVersion': ConsentType.AI_SERVICE,
};

let versions: Partial<Record<ConsentType, string>> = {};

function setVersions(next: Partial<Record<ConsentType, string>>) {
  versions = next;
}

function status(type: ConsentType, agreedVersion: string | null): ConsentStatusDto {
  const currentVersion = versions[type] ?? null;
  const agreed = currentVersion !== null && agreedVersion === currentVersion;
  return {
    type,
    currentVersion,
    agreedVersion,
    agreedAt: agreedVersion ? '2026-01-01T00:00:00.000Z' : null,
    agreed,
    needsConsent: currentVersion !== null && !agreed,
  };
}

function versionNotCurrent() {
  return new ApiError('协议版本已更新，请重新查看后同意', 422, undefined, undefined, {
    version: '协议版本已更新，请重新查看后同意',
  });
}

function otherUnprocessable() {
  return new ApiError('类型不合法', 422, undefined, undefined, { type: '类型不合法' });
}

function login(user: ReturnType<typeof useUserStore>, id: number, token = `token-${id}`) {
  user.setUserInfo({ id } as UserInfo);
  user.setToken(token);
}

async function flush() {
  await new Promise(resolve => setTimeout(resolve, 0));
}

function createStores() {
  const pinia = createPersistedPinia();
  createApp({}).use(pinia);
  setActivePinia(pinia);
  return { consent: useConsentStore(), user: useUserStore() };
}

beforeEach(() => {
  ['consent', 'config', 'user', 'token', 'refreshToken', 'tokenExpires'].forEach(key => uni.removeStorageSync(key));
  network.listeners.length = 0;
  setVersions({
    [ConsentType.PRIVACY_POLICY]: 'p1',
    [ConsentType.USER_AGREEMENT]: 'u1',
    [ConsentType.AI_SERVICE]: 'a1',
  });
  api.getConfig.mockReset().mockImplementation((key: string) => {
    const version = versions[VERSION_KEYS[key]];
    return version
      ? Promise.resolve({ key, value: version, isPublic: true, createdAt: '', updatedAt: '' })
      : Promise.reject(new ApiError('Config not found', 404));
  });
  api.getMyConsents.mockReset();
  api.agreeConsent
    .mockReset()
    .mockImplementation(({ type, version }: { type: ConsentType; version: string }) =>
      Promise.resolve(status(type, version)),
    );
});

describe('consent store：游客', () => {
  it('首次启动时需要同意用户协议与隐私政策，不请求服务端同意状态', async () => {
    const { consent } = createStores();

    const required = await consent.check();

    expect(required).toEqual([ConsentType.USER_AGREEMENT, ConsentType.PRIVACY_POLICY]);
    expect(consent.required).toEqual(required);
    expect(api.getMyConsents).not.toHaveBeenCalled();
    expect(consent.isUpgrade(ConsentType.PRIVACY_POLICY)).toBe(false);
  });

  it('首次检查完成前 required 为空', () => {
    const { consent } = createStores();

    expect(consent.required).toEqual([]);
  });

  it('同意后记在本机待上报，不调用上报接口，再次检查不再需要同意', async () => {
    const { consent } = createStores();
    await consent.check();

    await expect(consent.agree(consent.required)).resolves.toBe(true);

    expect(api.agreeConsent).not.toHaveBeenCalled();
    expect(consent.required).toEqual([]);
    expect(consent.pendingVersions).toEqual({
      [ConsentType.USER_AGREEMENT]: { version: 'u1', userId: null },
      [ConsentType.PRIVACY_POLICY]: { version: 'p1', userId: null },
    });
    await expect(consent.check()).resolves.toEqual([]);
  });

  it('协议版本升级后重新需要同意并标记为升级', async () => {
    const { consent } = createStores();
    await consent.check();
    await consent.agree(consent.required);

    setVersions({ ...versions, [ConsentType.PRIVACY_POLICY]: 'p2' });
    const required = await consent.check();

    expect(required).toEqual([ConsentType.PRIVACY_POLICY]);
    expect(consent.isUpgrade(ConsentType.PRIVACY_POLICY)).toBe(true);
  });

  it('协议版本未配置时不需要同意', async () => {
    setVersions({});
    const { consent } = createStores();

    await expect(consent.check()).resolves.toEqual([]);
  });

  it('AI 服务声明不在启动时要求同意，但可查询与同意', async () => {
    const { consent } = createStores();
    await consent.check();

    expect(consent.required).not.toContain(ConsentType.AI_SERVICE);
    expect(consent.needsConsent(ConsentType.AI_SERVICE)).toBe(true);

    await consent.agree([ConsentType.AI_SERVICE]);

    expect(consent.needsConsent(ConsentType.AI_SERVICE)).toBe(false);
  });
});

describe('consent store：登录用户', () => {
  it('以服务端同意状态为准，本机已同意也按服务端结果弹出', async () => {
    const { consent, user } = createStores();
    await consent.check();
    await consent.agree(consent.required);
    consent.pendingVersions = {};
    login(user, 1);
    api.getMyConsents.mockResolvedValue([
      status(ConsentType.PRIVACY_POLICY, null),
      status(ConsentType.USER_AGREEMENT, 'u1'),
      status(ConsentType.AI_SERVICE, null),
    ]);

    const required = await consent.check();

    expect(api.getMyConsents).toHaveBeenCalledWith({ showError: false, skipAuthHandling: true });
    expect(required).toEqual([ConsentType.PRIVACY_POLICY]);
    expect(consent.isUpgrade(ConsentType.PRIVACY_POLICY)).toBe(false);
  });

  it('同意后上报当前版本', async () => {
    const { consent, user } = createStores();
    login(user, 1);
    api.getMyConsents.mockResolvedValue([
      status(ConsentType.PRIVACY_POLICY, null),
      status(ConsentType.USER_AGREEMENT, null),
      status(ConsentType.AI_SERVICE, null),
    ]);
    await consent.check();

    await expect(consent.agree(consent.required)).resolves.toBe(true);

    expect(api.agreeConsent).toHaveBeenCalledWith(
      { type: ConsentType.USER_AGREEMENT, version: 'u1' },
      { showError: false, skipAuthHandling: true },
    );
    expect(api.agreeConsent).toHaveBeenCalledWith(
      { type: ConsentType.PRIVACY_POLICY, version: 'p1' },
      { showError: false, skipAuthHandling: true },
    );
    expect(consent.required).toEqual([]);
    expect(consent.pendingVersions).toEqual({});
  });

  it('服务端版本升级后重新需要同意', async () => {
    const { consent, user } = createStores();
    login(user, 1);
    setVersions({ ...versions, [ConsentType.USER_AGREEMENT]: 'u2' });
    api.getMyConsents.mockResolvedValue([
      status(ConsentType.PRIVACY_POLICY, 'p1'),
      status(ConsentType.USER_AGREEMENT, 'u1'),
      status(ConsentType.AI_SERVICE, null),
    ]);

    await expect(consent.check()).resolves.toEqual([ConsentType.USER_AGREEMENT]);
    expect(consent.isUpgrade(ConsentType.USER_AGREEMENT)).toBe(true);
  });

  it('同意时版本已非当前则刷新状态并返回 false', async () => {
    const { consent, user } = createStores();
    login(user, 1);
    api.getMyConsents.mockImplementation(() =>
      Promise.resolve([
        status(ConsentType.PRIVACY_POLICY, null),
        status(ConsentType.USER_AGREEMENT, 'u1'),
        status(ConsentType.AI_SERVICE, null),
      ]),
    );
    await consent.check();
    setVersions({ ...versions, [ConsentType.PRIVACY_POLICY]: 'p2' });
    api.agreeConsent.mockRejectedValueOnce(versionNotCurrent());

    await expect(consent.agree([ConsentType.PRIVACY_POLICY])).resolves.toBe(false);

    expect(api.getMyConsents).toHaveBeenCalledTimes(2);
    expect(consent.currentVersion(ConsentType.PRIVACY_POLICY)).toBe('p2');
    expect(consent.required).toEqual([ConsentType.PRIVACY_POLICY]);
    expect(consent.pendingVersions).toEqual({});
  });

  it('上报失败时不阻塞使用，记为待上报并在网络恢复后重试', async () => {
    const { consent, user } = createStores();
    login(user, 1);
    api.getMyConsents.mockResolvedValue([
      status(ConsentType.PRIVACY_POLICY, null),
      status(ConsentType.USER_AGREEMENT, 'u1'),
      status(ConsentType.AI_SERVICE, null),
    ]);
    await consent.check();
    api.agreeConsent.mockRejectedValueOnce(new Error('network'));

    await expect(consent.agree([ConsentType.PRIVACY_POLICY])).resolves.toBe(true);

    expect(consent.required).toEqual([]);
    expect(consent.pendingVersions).toEqual({ [ConsentType.PRIVACY_POLICY]: { version: 'p1', userId: 1 } });

    network.listeners.forEach(listener => listener(true));
    await flush();

    expect(api.agreeConsent).toHaveBeenCalledTimes(2);
    expect(consent.pendingVersions).toEqual({});
  });

  it('同意时其他 422 错误按普通失败处理，记为待上报且保留本机同意', async () => {
    const { consent, user } = createStores();
    login(user, 1);
    api.getMyConsents.mockResolvedValue([
      status(ConsentType.PRIVACY_POLICY, null),
      status(ConsentType.USER_AGREEMENT, 'u1'),
      status(ConsentType.AI_SERVICE, null),
    ]);
    await consent.check();
    api.agreeConsent.mockRejectedValueOnce(otherUnprocessable());

    await expect(consent.agree([ConsentType.PRIVACY_POLICY])).resolves.toBe(true);

    expect(api.getMyConsents).toHaveBeenCalledTimes(1);
    expect(consent.required).toEqual([]);
    expect(consent.agreedVersions[ConsentType.PRIVACY_POLICY]).toBe('p1');
    expect(consent.pendingVersions).toEqual({ [ConsentType.PRIVACY_POLICY]: { version: 'p1', userId: 1 } });
  });

  it('用户切换后进行中的检查不复用，前一用户的服务端状态被丢弃', async () => {
    const { consent, user } = createStores();
    let resolveA: (value: ConsentStatusDto[]) => void = () => {};
    api.getMyConsents.mockImplementationOnce(
      () =>
        new Promise<ConsentStatusDto[]>(resolve => {
          resolveA = resolve;
        }),
    );
    login(user, 1);
    const checkA = consent.check();
    await flush();

    api.getMyConsents.mockResolvedValue([
      status(ConsentType.PRIVACY_POLICY, null),
      status(ConsentType.USER_AGREEMENT, null),
      status(ConsentType.AI_SERVICE, null),
    ]);
    login(user, 2);
    const checkB = consent.check();

    expect(checkB).not.toBe(checkA);
    await checkB;
    resolveA([
      status(ConsentType.PRIVACY_POLICY, 'p1'),
      status(ConsentType.USER_AGREEMENT, 'u1'),
      status(ConsentType.AI_SERVICE, null),
    ]);
    await checkA;

    expect(api.getMyConsents).toHaveBeenCalledTimes(2);
    expect(consent.required).toEqual([ConsentType.USER_AGREEMENT, ConsentType.PRIVACY_POLICY]);
  });

  it('读取服务端状态失败时按本机记录判断', async () => {
    const { consent, user } = createStores();
    await consent.check();
    await consent.agree(consent.required);
    login(user, 1);
    api.agreeConsent.mockRejectedValue(new Error('network'));
    api.getMyConsents.mockRejectedValue(new Error('network'));

    await expect(consent.check()).resolves.toEqual([]);
  });
});

describe('consent store：游客登录后同步', () => {
  it('登录后上报本机同意记录并读取服务端状态', async () => {
    const { consent, user } = createStores();
    await consent.check();
    await consent.agree(consent.required);
    api.getMyConsents.mockImplementation(() =>
      Promise.resolve([
        status(ConsentType.PRIVACY_POLICY, api.agreeConsent.mock.calls.length > 0 ? 'p1' : null),
        status(ConsentType.USER_AGREEMENT, api.agreeConsent.mock.calls.length > 0 ? 'u1' : null),
        status(ConsentType.AI_SERVICE, null),
      ]),
    );

    login(user, 1);
    await flush();

    expect(api.agreeConsent).toHaveBeenCalledWith(
      { type: ConsentType.USER_AGREEMENT, version: 'u1' },
      { showError: false, skipAuthHandling: true },
    );
    expect(api.agreeConsent).toHaveBeenCalledWith(
      { type: ConsentType.PRIVACY_POLICY, version: 'p1' },
      { showError: false, skipAuthHandling: true },
    );
    expect(consent.pendingVersions).toEqual({});
    expect(consent.serverStatuses).not.toBeNull();
    expect(consent.required).toEqual([]);
  });

  it('同步时版本已非当前则丢弃本机记录并重新需要同意', async () => {
    const { consent, user } = createStores();
    await consent.check();
    await consent.agree(consent.required);
    setVersions({ ...versions, [ConsentType.PRIVACY_POLICY]: 'p2' });
    api.agreeConsent.mockImplementation(({ type, version }: { type: ConsentType; version: string }) =>
      versions[type] === version ? Promise.resolve(status(type, version)) : Promise.reject(versionNotCurrent()),
    );
    api.getMyConsents.mockImplementation(() =>
      Promise.resolve([
        status(ConsentType.PRIVACY_POLICY, null),
        status(ConsentType.USER_AGREEMENT, 'u1'),
        status(ConsentType.AI_SERVICE, null),
      ]),
    );

    login(user, 1);
    await flush();

    expect(consent.pendingVersions).toEqual({});
    expect(consent.agreedVersions[ConsentType.PRIVACY_POLICY]).toBeUndefined();
    expect(consent.required).toEqual([ConsentType.PRIVACY_POLICY]);
  });

  it('同步时其他 422 错误保留待上报记录与本机同意', async () => {
    const { consent, user } = createStores();
    await consent.check();
    await consent.agree(consent.required);
    api.agreeConsent.mockRejectedValue(otherUnprocessable());
    api.getMyConsents.mockRejectedValue(new Error('network'));

    login(user, 1);
    await flush();

    expect(consent.pendingVersions).toEqual({
      [ConsentType.USER_AGREEMENT]: { version: 'u1', userId: null },
      [ConsentType.PRIVACY_POLICY]: { version: 'p1', userId: null },
    });
    expect(consent.agreedVersions).toMatchObject({
      [ConsentType.USER_AGREEMENT]: 'u1',
      [ConsentType.PRIVACY_POLICY]: 'p1',
    });
    expect(consent.required).toEqual([]);
  });

  it('用户 A 上报失败后退出，B 登录不会把 A 的同意上报到 B 名下', async () => {
    const { consent, user } = createStores();
    login(user, 1);
    api.getMyConsents.mockResolvedValue([
      status(ConsentType.PRIVACY_POLICY, null),
      status(ConsentType.USER_AGREEMENT, null),
      status(ConsentType.AI_SERVICE, null),
    ]);
    await consent.check();
    api.agreeConsent.mockRejectedValue(new Error('network'));
    await consent.agree(consent.required);
    api.agreeConsent.mockClear();

    user.resetUserState();
    await flush();

    expect(consent.pendingVersions).toEqual({});

    login(user, 2);
    await flush();

    expect(api.agreeConsent).not.toHaveBeenCalled();
    expect(consent.required).toEqual([ConsentType.USER_AGREEMENT, ConsentType.PRIVACY_POLICY]);
  });

  it('用户 A 上报失败后直接切换到 B，不会把 A 的同意上报到 B 名下', async () => {
    const { consent, user } = createStores();
    login(user, 1);
    api.getMyConsents.mockResolvedValue([
      status(ConsentType.PRIVACY_POLICY, null),
      status(ConsentType.USER_AGREEMENT, null),
      status(ConsentType.AI_SERVICE, null),
    ]);
    await consent.check();
    api.agreeConsent.mockRejectedValue(new Error('network'));
    await consent.agree(consent.required);
    api.agreeConsent.mockClear();

    login(user, 2);
    await consent.check();

    expect(api.agreeConsent).not.toHaveBeenCalled();
    expect(consent.pendingVersions).toEqual({});
    expect(consent.required).toEqual([ConsentType.USER_AGREEMENT, ConsentType.PRIVACY_POLICY]);
  });

  it('同步失败的记录保留，下次检查时重试', async () => {
    const { consent, user } = createStores();
    await consent.check();
    await consent.agree(consent.required);
    api.agreeConsent.mockRejectedValue(new Error('network'));
    api.getMyConsents.mockRejectedValue(new Error('network'));

    login(user, 1);
    await flush();

    expect(consent.pendingVersions).toEqual({
      [ConsentType.USER_AGREEMENT]: { version: 'u1', userId: null },
      [ConsentType.PRIVACY_POLICY]: { version: 'p1', userId: null },
    });

    api.agreeConsent.mockImplementation(({ type, version }: { type: ConsentType; version: string }) =>
      Promise.resolve(status(type, version)),
    );
    await consent.check();

    expect(consent.pendingVersions).toEqual({});
  });

  it('退出登录后清除服务端状态，按本机记录判断', async () => {
    const { consent, user } = createStores();
    login(user, 1);
    api.getMyConsents.mockResolvedValue([
      status(ConsentType.PRIVACY_POLICY, 'p1'),
      status(ConsentType.USER_AGREEMENT, 'u1'),
      status(ConsentType.AI_SERVICE, null),
    ]);
    await consent.check();

    user.resetUserState();
    await flush();

    expect(consent.serverStatuses).toBeNull();
    expect(consent.required).toEqual([]);
  });
});
