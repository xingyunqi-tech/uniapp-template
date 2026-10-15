import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { ApiError } from '@/api/core/alova';

const deleteCurrentUser = vi.hoisted(() => vi.fn());

vi.mock('@/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@/api')>()),
  deleteCurrentUser,
}));

const { useUserStore } = await import('@/store/modules/user');

describe('useUserStore.deleteAccount', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    deleteCurrentUser.mockReset();
  });

  it('透传身份凭证，成功后清除登录态', async () => {
    deleteCurrentUser.mockResolvedValue(undefined);
    const store = useUserStore();
    store.setToken('token');

    await store.deleteAccount({ smsCode: '123456' });

    expect(deleteCurrentUser).toHaveBeenCalledWith({ smsCode: '123456' });
    expect(store.isLoggedIn).toBe(false);
  });

  it('接口失败时保留登录态', async () => {
    deleteCurrentUser.mockRejectedValue(new ApiError('incorrectOldPassword', 422));
    const store = useUserStore();
    store.setToken('token');

    await expect(store.deleteAccount({ oldPassword: 'md5' })).rejects.toThrow('incorrectOldPassword');
    expect(store.isLoggedIn).toBe(true);
  });
});
