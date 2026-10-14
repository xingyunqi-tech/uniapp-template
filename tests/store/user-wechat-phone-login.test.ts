import { describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { storage, STORAGE_KEYS } from '@/utils/storage';

const loginWithWechatPhone = vi.hoisted(() =>
  vi.fn(() =>
    Promise.resolve({
      token: 'phone-token',
      refreshToken: 'phone-refresh',
      tokenExpires: 1,
      user: { id: 1, phone: '13800000000', role: { id: 2 }, status: { id: 1 } },
    }),
  ),
);

vi.mock('@/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@/api')>()),
  loginWithWechatPhone,
}));

const { useUserStore } = await import('@/store/modules/user');

describe('useUserStore.wechatPhoneLogin', () => {
  it('提交两个 code 并保存登录态', async () => {
    setActivePinia(createPinia());
    const store = useUserStore();

    await expect(store.wechatPhoneLogin({ loginCode: 'L1', phoneCode: 'P1' })).resolves.toBe('phone-token');

    expect(loginWithWechatPhone).toHaveBeenCalledWith({ loginCode: 'L1', phoneCode: 'P1' });
    expect(store.isLoggedIn).toBe(true);
    expect(storage.get(STORAGE_KEYS.TOKEN)).toBe('phone-token');
    expect(store.userInfo?.phone).toBe('13800000000');
  });
});
