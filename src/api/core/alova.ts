/**
 * HTTP 客户端实例
 * 基于 Alova.js 实现，业务代码通过 http 导出使用
 */
import { createAlova } from 'alova';
import AdapterUniapp from '@alova/adapter-uniapp';
import { storage, STORAGE_KEYS } from '@/utils/storage';
import { reportApiError } from '@/utils/errorReporter';
import { PAGES } from '@/constants';

// ==================== 类型定义 ====================

/** API 响应格式 */
export interface ApiResponse<T = any> {
  code: number;
  data?: T;
  message: string;
  timestamp?: number;
}

/** 请求 meta 配置 */
export interface RequestMeta {
  /** 是否显示 loading */
  showLoading?: boolean;
  /** loading 提示文字 */
  loadingText?: string;
  /** 是否显示错误提示 */
  showError?: boolean;
  /** 401 时不刷新 Token、不清理登录态，直接抛错（刷新、登出等认证接口使用） */
  skipAuthHandling?: boolean;
}

/** 拦截器内部使用的 meta 字段 */
interface InternalRequestMeta extends RequestMeta {
  /** 已用刷新后的 Token 重发过一次 */
  authRetried?: boolean;
}

// ==================== 401 处理 ====================

/** 登录态处理回调，由 main.ts 在 pinia 安装后注册 */
export interface AuthHandlers {
  /** 用 Refresh Token 换新的 Token，失败返回 null */
  refreshToken: () => Promise<string | null>;
  /** 清理本地登录态（不调用登出接口） */
  clearAuth: () => void;
}

let authHandlers: AuthHandlers | null = null;

/** 注册登录态处理回调（在 main.ts 中调用一次） */
export function setAuthHandlers(handlers: AuthHandlers | null): void {
  authHandlers = handlers;
}

let refreshingToken: Promise<string | null> | null = null;

/** 并发的 401 共用同一次刷新 */
function refreshTokenOnce(): Promise<string | null> {
  if (!authHandlers) return Promise.resolve(null);
  if (!refreshingToken) {
    refreshingToken = authHandlers
      .refreshToken()
      .catch(() => null)
      .finally(() => {
        refreshingToken = null;
      });
  }
  return refreshingToken;
}

let isRedirectingToLogin = false;

/** 清理登录态并跳转登录页，重复触发只执行一次 */
function handleUnauthorized(): void {
  if (isRedirectingToLogin) return;
  isRedirectingToLogin = true;

  authHandlers?.clearAuth();
  uni.showToast({ title: '登录已过期，请重新登录', icon: 'none' });

  setTimeout(() => {
    uni.redirectTo({
      url: PAGES.LOGIN,
      complete: () => {
        isRedirectingToLogin = false;
      },
    });
  }, 1500);
}

// ==================== 创建 Alova 实例 ====================

const alovaInstance = createAlova({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 30000,

  // UniApp 适配器（自动配置请求适配器、存储适配器、Vue Hooks）
  ...AdapterUniapp(),

  // ==================== 请求拦截器 ====================
  beforeRequest(method) {
    // 1. 添加 Token
    const token = storage.get<string>(STORAGE_KEYS.TOKEN);
    if (token && !method.config.headers.Authorization) {
      method.config.headers.Authorization = `Bearer ${token}`;
    }

    // 2. 显示 Loading
    const meta = method.meta as RequestMeta | undefined;
    if (meta?.showLoading) {
      uni.showLoading({
        title: meta.loadingText || '加载中...',
        mask: true,
      });
    }
  },

  // ==================== 响应拦截器 ====================
  responded: {
    // 成功响应
    onSuccess: async (response, method) => {
      const { statusCode, data } = response as UniNamespace.RequestSuccessCallbackResult;
      const meta = method.meta as InternalRequestMeta | undefined;

      // 隐藏 Loading
      if (meta?.showLoading) {
        uni.hideLoading();
      }

      // 401 未授权 - 换用最新 Token 重发一次
      if (statusCode === 401) {
        if (meta?.skipAuthHandling) {
          reportApiError(method.url, method.type, 'Unauthorized', 401);
          throw new Error('Unauthorized');
        }

        if (!meta?.authRetried) {
          // 请求发出后 Token 已被其他请求刷新时，直接用当前 Token 重发
          const currentToken = storage.get<string>(STORAGE_KEYS.TOKEN);
          const sentToken = method.config.headers.Authorization;
          const newToken =
            currentToken && sentToken !== `Bearer ${currentToken}` ? currentToken : await refreshTokenOnce();
          if (newToken) {
            method.meta = { ...meta, authRetried: true };
            method.config.headers.Authorization = `Bearer ${newToken}`;
            // 重发请求不与进行中的同 key 请求合并
            method.config.shareRequest = false;
            return method.send();
          }
        }

        reportApiError(method.url, method.type, 'Unauthorized', 401);
        handleUnauthorized();
        throw new Error('Unauthorized');
      }

      // HTTP 错误
      if (statusCode >= 400) {
        const msg = (data as ApiResponse)?.message || `请求失败(${statusCode})`;
        if (meta?.showError !== false) {
          uni.showToast({ title: msg, icon: 'none' });
        }
        reportApiError(method.url, method.type, msg, statusCode);
        throw new Error(msg);
      }

      const result = data as ApiResponse;

      // 业务错误
      if (result.code !== 200 && result.code !== 0) {
        if (meta?.showError !== false) {
          uni.showToast({ title: result.message || '请求失败', icon: 'none' });
        }
        reportApiError(method.url, method.type, result.message || '业务错误', result.code);
        throw new Error(result.message || '业务错误');
      }

      return result;
    },

    // 请求失败
    onError: (error, method) => {
      uni.hideLoading();

      const meta = method.meta as RequestMeta | undefined;
      const errorMessage = error.message || '网络请求失败';

      if (meta?.showError !== false) {
        uni.showToast({ title: errorMessage, icon: 'none' });
      }

      reportApiError(method.url, method.type, errorMessage);
      throw error;
    },
  },

  // ==================== 缓存配置 ====================
  // 不缓存响应结果；进行中的相同请求由 alova 的 shareRequest 合并
  cacheFor: null,
});

/** HTTP 客户端（对外导出，隐藏 alova 实现细节） */
export const http = alovaInstance;
