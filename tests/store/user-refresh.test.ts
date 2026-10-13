import { describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { storage, STORAGE_KEYS } from '@/utils/storage';
import { ApiError } from '@/api/core/alova';

const refreshDeferred = vi.hoisted(() => {
  let resolve: (value: { token: string; refreshToken: string; tokenExpires: number }) => void = () => {};
  let reject: (error: unknown) => void = () => {};
  const refreshToken = vi.fn(
    () =>
      new Promise<{ token: string; refreshToken: string; tokenExpires: number }>((res, rej) => {
        resolve = res;
        reject = rej;
      }),
  );
  return {
    refreshToken,
    resolve: (value: Parameters<typeof resolve>[0]) => resolve(value),
    reject: (error: unknown) => reject(error),
  };
});

vi.mock('@/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@/api')>()),
  refreshToken: refreshDeferred.refreshToken,
}));

const { useUserStore } = await import('@/store/modules/user');

describe('useUserStore.refreshToken', () => {
  it('刷新期间登出时丢弃刷新结果，不恢复登录态', async () => {
    setActivePinia(createPinia());
    const store = useUserStore();
    store.setToken('old');
    store.setRefreshToken('refresh-old');

    const pending = store.refreshToken();
    store.resetUserState();
    refreshDeferred.resolve({ token: 'new', refreshToken: 'refresh-new', tokenExpires: 1 });

    await expect(pending).resolves.toBeNull();
    expect(store.isLoggedIn).toBe(false);
    expect(storage.get(STORAGE_KEYS.TOKEN)).toBeFalsy();
  });

  it('刷新期间重新登录时丢弃刷新结果，返回当前登录的 Token', async () => {
    setActivePinia(createPinia());
    const store = useUserStore();
    store.setToken('old');
    store.setRefreshToken('refresh-old');

    const pending = store.refreshToken();
    store.setToken('relogin');
    store.setRefreshToken('refresh-relogin');
    refreshDeferred.resolve({ token: 'stale', refreshToken: 'refresh-stale', tokenExpires: 1 });

    await expect(pending).resolves.toBe('relogin');
    expect(storage.get(STORAGE_KEYS.TOKEN)).toBe('relogin');
  });

  it('刷新接口返回 401 时返回 null', async () => {
    setActivePinia(createPinia());
    const store = useUserStore();
    store.setToken('old');
    store.setRefreshToken('refresh-old');

    const pending = store.refreshToken();
    refreshDeferred.reject(new ApiError('Unauthorized', 401));

    await expect(pending).resolves.toBeNull();
  });

  it('刷新遇到网络错误时抛出错误，保留登录态', async () => {
    setActivePinia(createPinia());
    const store = useUserStore();
    store.setToken('old');
    store.setRefreshToken('refresh-old');

    const pending = store.refreshToken();
    refreshDeferred.reject(new Error('request:fail timeout'));

    await expect(pending).rejects.toThrow('request:fail timeout');
    expect(store.isLoggedIn).toBe(true);
    expect(store.refreshTokenValue).toBe('refresh-old');
  });

  it('刷新接口返回 4xx 业务错误时视为凭证失效返回 null', async () => {
    setActivePinia(createPinia());
    const store = useUserStore();
    store.setToken('old');
    store.setRefreshToken('refresh-old');

    const pending = store.refreshToken();
    refreshDeferred.reject(new ApiError('Refresh token invalid', 400));

    await expect(pending).resolves.toBeNull();
  });

  it('刷新接口返回 5xx 时抛出错误，保留登录态', async () => {
    setActivePinia(createPinia());
    const store = useUserStore();
    store.setToken('old');
    store.setRefreshToken('refresh-old');

    const pending = store.refreshToken();
    refreshDeferred.reject(new ApiError('Internal Server Error', 500));

    await expect(pending).rejects.toThrow('Internal Server Error');
    expect(store.isLoggedIn).toBe(true);
  });

  it('刷新接口被限流（429）时抛出错误，保留登录态', async () => {
    setActivePinia(createPinia());
    const store = useUserStore();
    store.setToken('old');
    store.setRefreshToken('refresh-old');

    const pending = store.refreshToken();
    refreshDeferred.reject(new ApiError('Too Many Requests', 429));

    await expect(pending).rejects.toThrow('Too Many Requests');
    expect(store.isLoggedIn).toBe(true);
  });
});
