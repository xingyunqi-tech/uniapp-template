/**
 * 登录凭证的本地存储，请求拦截器与用户 Store 统一经由此处读写
 */
import { storage, STORAGE_KEYS } from './storage';

export interface AuthTokens {
  token: string;
  refreshToken: string;
  /** Token 过期时间戳 (毫秒)，0 表示未知 */
  tokenExpires: number;
}

/** Token 过期前提前刷新的时间 (毫秒) */
export const TOKEN_REFRESH_AHEAD = 60 * 1000;

const KEY_OF: Record<keyof AuthTokens, string> = {
  token: STORAGE_KEYS.TOKEN,
  refreshToken: STORAGE_KEYS.REFRESH_TOKEN,
  tokenExpires: STORAGE_KEYS.TOKEN_EXPIRES,
};

/**
 * 读取全部登录凭证
 */
export function getAuthTokens(): AuthTokens {
  return {
    token: storage.get<string>(KEY_OF.token) || '',
    refreshToken: storage.get<string>(KEY_OF.refreshToken) || '',
    tokenExpires: storage.get<number>(KEY_OF.tokenExpires) || 0,
  };
}

/**
 * 读取 Token
 */
export function getAccessToken(): string {
  return storage.get<string>(KEY_OF.token) || '';
}

/**
 * 保存传入的凭证字段，空值的字段从存储中移除
 */
export function saveAuthTokens(tokens: Partial<AuthTokens>): void {
  (Object.keys(tokens) as (keyof AuthTokens)[]).forEach(field => {
    const value = tokens[field];
    if (value) {
      storage.set(KEY_OF[field], value);
    } else {
      storage.remove(KEY_OF[field]);
    }
  });
}

/**
 * 清除全部登录凭证
 */
export function clearAuthTokens(): void {
  saveAuthTokens({ token: '', refreshToken: '', tokenExpires: 0 });
}

/**
 * Token 已过期或将在 TOKEN_REFRESH_AHEAD 内过期；未记录过期时间时返回 false
 */
export function isAccessTokenExpiring(now = Date.now()): boolean {
  const expires = storage.get<number>(KEY_OF.tokenExpires) || 0;
  return expires > 0 && now >= expires - TOKEN_REFRESH_AHEAD;
}
