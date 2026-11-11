import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { recoverUnauthorized, resolveRequestHeaders, setAuthHandlers } from '@/api/core/alova';
import { i18n } from '@/utils/locale';
import { LOCALE_TYPE } from '@/constants/system';
import { storage, STORAGE_KEYS } from '@/utils/storage';

const originalLocale = i18n.global.locale.value;

describe('不经过 alova 的请求的鉴权', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout'] });
    (uni.redirectTo as Mock)
      .mockReset()
      .mockImplementation((options: { complete?: () => void }) => options.complete?.());
  });

  afterEach(() => {
    vi.runAllTimers();
    vi.useRealTimers();
    setAuthHandlers(null);
    storage.remove(STORAGE_KEYS.TOKEN);
    i18n.global.locale.value = originalLocale;
  });

  it('请求头带当前 Token 与界面语言', async () => {
    storage.set(STORAGE_KEYS.TOKEN, 't1');
    i18n.global.locale.value = LOCALE_TYPE.EN_US;

    await expect(resolveRequestHeaders()).resolves.toEqual({ Authorization: 'Bearer t1', 'Accept-Language': 'en' });
  });

  it('未登录时只带语言', async () => {
    await expect(resolveRequestHeaders()).resolves.toEqual({ 'Accept-Language': 'zh' });
  });

  it('Token 已被其他请求刷新时直接重发', async () => {
    storage.set(STORAGE_KEYS.TOKEN, 'fresh');
    const refreshToken = vi.fn();
    setAuthHandlers({ refreshToken, clearAuth: vi.fn() });

    await expect(recoverUnauthorized('Bearer old')).resolves.toBe(true);
    expect(refreshToken).not.toHaveBeenCalled();
  });

  it('刷新成功后可重发', async () => {
    storage.set(STORAGE_KEYS.TOKEN, 'old');
    setAuthHandlers({ refreshToken: vi.fn().mockResolvedValue('fresh'), clearAuth: vi.fn() });

    await expect(recoverUnauthorized('Bearer old')).resolves.toBe(true);
  });

  it('凭证失效时清理登录态并跳转登录页', async () => {
    storage.set(STORAGE_KEYS.TOKEN, 'old');
    const clearAuth = vi.fn();
    setAuthHandlers({ refreshToken: vi.fn().mockResolvedValue(null), clearAuth });

    await expect(recoverUnauthorized('Bearer old')).resolves.toBe(false);
    expect(clearAuth).toHaveBeenCalled();
    vi.runAllTimers();
    expect(uni.redirectTo).toHaveBeenCalled();
  });
});
