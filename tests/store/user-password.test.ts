import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { encryptPassword } from '@/utils/crypto';

const authResponse = {
  token: 't',
  refreshToken: 'r',
  tokenExpires: 1,
  user: { id: 1, role: { id: 2 }, status: { id: 1 } },
};

const api = vi.hoisted(() => ({
  loginWithPhone: vi.fn(),
  registerWithPhone: vi.fn(),
  changePassword: vi.fn(),
  resetPasswordByPhone: vi.fn(),
}));

vi.mock('@/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@/api')>()),
  ...api,
}));

const { useUserStore } = await import('@/store/modules/user');

const md5 = encryptPassword('secret123');

beforeEach(() => {
  setActivePinia(createPinia());
  api.loginWithPhone.mockReset().mockResolvedValue(authResponse);
  api.registerWithPhone.mockReset().mockResolvedValue(authResponse);
  api.changePassword.mockReset().mockResolvedValue(undefined);
  api.resetPasswordByPhone.mockReset().mockResolvedValue(undefined);
});

describe('useUserStore 密码加密', () => {
  it('login 提交 MD5 后的密码', async () => {
    await useUserStore().login({ phone: '13800000000', password: 'secret123' });

    expect(api.loginWithPhone).toHaveBeenCalledWith({ phone: '13800000000', password: md5 });
  });

  it('register 提交 MD5 后的密码', async () => {
    await useUserStore().register({ phone: '13800000000', password: 'secret123', code: '123456' });

    expect(api.registerWithPhone).toHaveBeenCalledWith({ phone: '13800000000', password: md5, code: '123456' });
  });

  it('changePassword 提交 MD5 后的新旧密码', async () => {
    await useUserStore().changePassword('secret123', 'secret123');

    expect(api.changePassword).toHaveBeenCalledWith({ oldPassword: md5, newPassword: md5 });
  });

  it('resetPasswordByPhone 提交 MD5 后的密码', async () => {
    await useUserStore().resetPasswordByPhone('13800000000', '123456', 'secret123');

    expect(api.resetPasswordByPhone).toHaveBeenCalledWith({ phone: '13800000000', code: '123456', password: md5 });
  });
});
