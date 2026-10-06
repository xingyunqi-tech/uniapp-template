/**
 * HTTP 客户端实例
 * 基于 Alova.js 实现，业务代码通过 http 导出使用
 */
import { createAlova } from 'alova';
import AdapterUniapp from '@alova/adapter-uniapp';
import { storage, STORAGE_KEYS } from '@/utils/storage';
import { reportApiError } from '@/utils/error-reporter';
import { PAGES } from '@/constants/pages';

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
  showRequestToast('登录已过期，请重新登录');

  setTimeout(() => {
    uni.redirectTo({
      url: PAGES.LOGIN,
      complete: () => {
        isRedirectingToLogin = false;
      },
    });
  }, 1500);
}

// ==================== 请求辅助 ====================

/** 序列化查询参数：键值做 URL 编码，忽略 undefined/null，数组展开为同名多项 */
export function serializeParams(params: Record<string, unknown>): string {
  return Object.entries(params)
    .flatMap(([key, value]) => (Array.isArray(value) ? value.map(item => [key, item]) : [[key, value]]))
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => {
      const text = value instanceof Date ? value.toISOString() : String(value);
      return `${encodeURIComponent(key)}=${encodeURIComponent(text)}`;
    })
    .join('&');
}

let loadingCount = 0;

/** 并发请求共用一个 Loading，最后一个结束时关闭 */
function showRequestLoading(title: string): void {
  if (loadingCount++ === 0) {
    uni.showLoading({ title, mask: true });
  }
}

function hideRequestLoading(): void {
  if (loadingCount > 0 && --loadingCount === 0) {
    uni.hideLoading();
  }
}

/** 小程序中 Toast 会顶替 Loading，计数清零，避免后续 hideLoading 关掉这条 Toast */
function showRequestToast(title: string): void {
  loadingCount = 0;
  uni.showToast({ title, icon: 'none' });
}

/** uni.uploadFile 的响应体是字符串，统一解析为对象 */
function parseResponseData(data: unknown): unknown {
  if (typeof data !== 'string') return data;
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
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

    // 2. 查询参数编码
    const { params } = method.config;
    if (params && typeof params === 'object') {
      (method.config as { params: unknown }).params = serializeParams(params);
    }

    // 3. 只合并进行中的 GET/HEAD 请求
    if (method.type !== 'GET' && method.type !== 'HEAD') {
      method.config.shareRequest = false;
    }

    // 4. 显示 Loading
    const meta = method.meta as RequestMeta | undefined;
    if (meta?.showLoading) {
      showRequestLoading(meta.loadingText || '加载中...');
    }
  },

  // ==================== 响应拦截器 ====================
  responded: {
    // 成功响应
    onSuccess: async (response, method) => {
      const { statusCode } = response as UniNamespace.RequestSuccessCallbackResult;
      const data = parseResponseData((response as UniNamespace.RequestSuccessCallbackResult).data);
      const meta = method.meta as InternalRequestMeta | undefined;

      // 隐藏 Loading
      if (meta?.showLoading) {
        hideRequestLoading();
      }

      // 401 未授权 - 换用最新 Token 重发一次
      if (statusCode === 401) {
        if (meta?.skipAuthHandling) {
          reportApiError(method.url, method.type, 'Unauthorized', 401);
          throw new Error('Unauthorized');
        }

        const sentToken = method.config.headers.Authorization;
        if (!meta?.authRetried) {
          // 请求发出后 Token 已被其他请求刷新时，直接用当前 Token 重发
          const currentToken = storage.get<string>(STORAGE_KEYS.TOKEN);
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
        // 带 Token 发出、当前已无 Token：期间已主动登出，不再提示过期和跳转
        if (!sentToken || storage.get<string>(STORAGE_KEYS.TOKEN)) {
          handleUnauthorized();
        }
        throw new Error('Unauthorized');
      }

      // HTTP 错误
      if (statusCode >= 400) {
        const msg = (data as ApiResponse)?.message || `请求失败(${statusCode})`;
        if (meta?.showError !== false) {
          showRequestToast(msg);
        }
        reportApiError(method.url, method.type, msg, statusCode);
        throw new Error(msg);
      }

      const result = data as ApiResponse;

      // 业务错误
      if (result.code !== 200 && result.code !== 0) {
        if (meta?.showError !== false) {
          showRequestToast(result.message || '请求失败');
        }
        reportApiError(method.url, method.type, result.message || '业务错误', result.code);
        throw new Error(result.message || '业务错误');
      }

      return result;
    },

    // 请求失败
    onError: (error, method) => {
      const meta = method.meta as RequestMeta | undefined;
      if (meta?.showLoading) {
        hideRequestLoading();
      }

      const errorMessage = error.message || '网络请求失败';

      if (meta?.showError !== false) {
        showRequestToast(errorMessage);
      }

      reportApiError(method.url, method.type, errorMessage);
      throw error;
    },

    // 命中缓存时不经过 onSuccess/onError，在此关闭对应的 Loading
    onComplete: method => {
      const meta = method.meta as RequestMeta | undefined;
      if (method.fromCache && meta?.showLoading) {
        hideRequestLoading();
      }
    },
  },

  // ==================== 缓存配置 ====================
  // 不缓存响应结果；进行中的相同 GET/HEAD 请求由 alova 的 shareRequest 合并
  cacheFor: null,
});

/** HTTP 客户端（对外导出，隐藏 alova 实现细节） */
export const http = alovaInstance;
