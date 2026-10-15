import { afterEach, describe, expect, it } from 'vitest';
import {
  clearAuthTokens,
  getAccessToken,
  getAuthTokens,
  isAccessTokenExpiring,
  saveAuthTokens,
  TOKEN_REFRESH_AHEAD,
} from '@/utils/auth-token';
import { storage, STORAGE_KEYS } from '@/utils/storage';

afterEach(() => {
  clearAuthTokens();
});

describe('auth-token', () => {
  it('保存并读取凭证，沿用原有存储键名', () => {
    saveAuthTokens({ token: 't', refreshToken: 'r', tokenExpires: 123 });

    expect(getAuthTokens()).toEqual({ token: 't', refreshToken: 'r', tokenExpires: 123 });
    expect(getAccessToken()).toBe('t');
    expect(storage.get(STORAGE_KEYS.REFRESH_TOKEN)).toBe('r');
    expect(STORAGE_KEYS.REFRESH_TOKEN).toBe('refreshToken');
    expect(STORAGE_KEYS.TOKEN_EXPIRES).toBe('tokenExpires');
  });

  it('只更新传入的字段，空值的字段被移除', () => {
    saveAuthTokens({ token: 't', refreshToken: 'r', tokenExpires: 123 });
    saveAuthTokens({ refreshToken: '' });

    expect(getAuthTokens()).toEqual({ token: 't', refreshToken: '', tokenExpires: 123 });
  });

  it('清除全部凭证', () => {
    saveAuthTokens({ token: 't', refreshToken: 'r', tokenExpires: 123 });
    clearAuthTokens();

    expect(getAuthTokens()).toEqual({ token: '', refreshToken: '', tokenExpires: 0 });
  });

  it('按提前量判断是否即将过期，未记录过期时间时不算过期', () => {
    const now = 1_000_000;
    expect(isAccessTokenExpiring(now)).toBe(false);

    saveAuthTokens({ tokenExpires: now + TOKEN_REFRESH_AHEAD + 1 });
    expect(isAccessTokenExpiring(now)).toBe(false);

    saveAuthTokens({ tokenExpires: now + TOKEN_REFRESH_AHEAD });
    expect(isAccessTokenExpiring(now)).toBe(true);
  });
});
