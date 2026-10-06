import { describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { storage, STORAGE_KEYS } from '@/utils/storage';

const refreshDeferred = vi.hoisted(() => {
  let resolve: (value: { token: string; refreshToken: string; tokenExpires: number }) => void = () => {};
  const refreshToken = vi.fn(
    () =>
      new Promise<{ token: string; refreshToken: string; tokenExpires: number }>(r => {
        resolve = r;
      }),
  );
  return { refreshToken, resolve: (value: Parameters<typeof resolve>[0]) => resolve(value) };
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
});
