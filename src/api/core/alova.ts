/**
 * HTTP 客户端实例
 * 基于 Alova.js 实现，业务代码通过 http 导出使用
 */
import { createAlova } from 'alova';
import AdapterUniapp from '@alova/adapter-uniapp';
import { storage, STORAGE_KEYS } from '@/utils/storage';
import { reportApiError } from '@/utils/error-reporter';
import { PAGES, TAB_BAR_PAGES, WHITE_LIST } from '@/constants/pages';
import { getCurrentFullPath, getPathFromUrl, isInWhiteList } from '@/utils/router';
import { i18n } from '@/utils/locale';
import { LOCALE_TYPE } from '@/constants/system';

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

/** 请求层抛出的错误，携带 HTTP 状态码与业务码 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly code?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** 是否为临时错误：网络层失败、请求超时（408）、限流（429）或服务端 5xx */
export function isTransientError(error: unknown): boolean {
  if (!(error instanceof ApiError)) return true;
  const { status } = error;
  return status !== undefined && (status === 408 || status === 429 || status >= 500);
}

/** 拦截器内部使用的 meta 字段 */
interface InternalRequestMeta extends RequestMeta {
  /** 已用刷新后的 Token 重发过一次 */
  authRetried?: boolean;
}

// ==================== 语言与错误信息 ====================

/** 后端按此请求头选择返回语言，与后端 APP_HEADER_LANGUAGE 一致 */
const LANGUAGE_HEADER = 'x-custom-lang';

/** 当前界面语言对应的后端语言 */
function getRequestLanguage(): string {
  return i18n.global.locale.value === LOCALE_TYPE.EN_US ? 'en' : 'zh';
}

/**
 * 取后端字段错误（data）中的第一条提示，跳过未翻译的错误码（如 emailExists）
 */
function getFirstFieldError(errors: unknown): string | undefined {
  if (!errors || typeof errors !== 'object') return undefined;
  for (const value of Object.values(errors)) {
    if (typeof value === 'string') {
      if (value && !/^[a-z][a-zA-Z0-9]*$/.test(value)) return value;
      continue;
    }
    const nested = getFirstFieldError(value);
    if (nested) return nested;
  }
  return undefined;
}

// ==================== 401 处理 ====================

/** 登录态处理回调，由 main.ts 在 pinia 安装后注册 */
export interface AuthHandlers {
  /** 用 Refresh Token 换新的 Token，凭证失效返回 null，网络错误或服务端 5xx 时抛出 */
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
    refreshingToken = authHandlers.refreshToken().finally(() => {
      refreshingToken = null;
    });
  }
  return refreshingToken;
}

let isRedirectingToLogin = false;

/** 请求发出时所在的页面，用于判断未登录请求是否由受保护页发起 */
const methodSourcePath = new WeakMap<object, string>();

/**
 * 清理登录态并跳转登录页（非 TabBar 页登录后跳回），重复触发只执行一次
 * 已在登录页时不跳转，按 showError 提示接口返回的错误信息
 * @param expired 带 Token 请求被拒为 true，未登录请求为 false
 */
function handleUnauthorized(message: string, showError: boolean, expired: boolean): void {
  if (isRedirectingToLogin) return;

  const currentPath = getCurrentFullPath();
  const currentRoute = getPathFromUrl(currentPath);
  authHandlers?.clearAuth();
  if (currentRoute === PAGES.LOGIN) {
    if (showError) showRequestToast(message);
    return;
  }

  isRedirectingToLogin = true;
  showRequestToast(expired ? '登录已过期，请重新登录' : '请先登录');

  const isTabBarPage = (TAB_BAR_PAGES as readonly string[]).includes(currentRoute);
  const loginUrl =
    currentPath && !isTabBarPage ? `${PAGES.LOGIN}?redirect=${encodeURIComponent(currentPath)}` : PAGES.LOGIN;

  setTimeout(() => {
    uni.redirectTo({
      url: loginUrl,
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
/** Toast 顶替 Loading 时递增，之前开启的请求结束时不再计数 */
let loadingGeneration = 0;
const methodLoadingGeneration = new WeakMap<object, number>();

/** 并发请求共用一个 Loading，最后一个结束时关闭 */
function showRequestLoading(method: object, title: string): void {
  methodLoadingGeneration.set(method, loadingGeneration);
  if (loadingCount++ === 0) {
    uni.showLoading({ title, mask: true });
  }
}

function hideRequestLoading(method: object): void {
  const generation = methodLoadingGeneration.get(method);
  methodLoadingGeneration.delete(method);
  if (generation !== loadingGeneration) return;
  if (loadingCount > 0 && --loadingCount === 0) {
    uni.hideLoading();
  }
}

/** 小程序中 Toast 会顶替 Loading，计数清零，避免后续 hideLoading 关掉这条 Toast */
function showRequestToast(title: string): void {
  loadingCount = 0;
  loadingGeneration++;
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
    methodSourcePath.set(method, getCurrentFullPath());

    // 1. 添加 Token
    const token = storage.get<string>(STORAGE_KEYS.TOKEN);
    if (token && !method.config.headers.Authorization) {
      method.config.headers.Authorization = `Bearer ${token}`;
    }

    // 2. 语言
    method.config.headers[LANGUAGE_HEADER] = getRequestLanguage();

    // 3. 查询参数编码
    const { params } = method.config;
    if (params && typeof params === 'object') {
      (method.config as { params: unknown }).params = serializeParams(params);
    }

    // 4. 只合并进行中的 GET/HEAD 请求
    if (method.type !== 'GET' && method.type !== 'HEAD') {
      method.config.shareRequest = false;
    }

    // 5. 显示 Loading
    const meta = method.meta as RequestMeta | undefined;
    if (meta?.showLoading) {
      showRequestLoading(method, meta.loadingText || '加载中...');
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
        hideRequestLoading(method);
      }

      // 401 未授权 - 换用最新 Token 重发一次
      if (statusCode === 401) {
        if (meta?.skipAuthHandling) {
          reportApiError(method.url, method.type, 'Unauthorized', 401);
          throw new ApiError('Unauthorized', 401);
        }

        const sentToken = method.config.headers.Authorization;
        if (!meta?.authRetried) {
          // 请求发出后 Token 已被其他请求刷新时，直接用当前 Token 重发
          const currentToken = storage.get<string>(STORAGE_KEYS.TOKEN);
          let newToken: string | null;
          try {
            newToken = currentToken && sentToken !== `Bearer ${currentToken}` ? currentToken : await refreshTokenOnce();
          } catch (error) {
            // 刷新遇到网络错误或服务端异常：保留登录态，仅本次请求失败
            if (meta?.showError !== false) showRequestToast((error as Error).message || '网络请求失败');
            throw error;
          }
          if (newToken) {
            method.meta = { ...meta, authRetried: true };
            method.config.headers.Authorization = `Bearer ${newToken}`;
            // 重发请求不与进行中的同 key 请求合并
            method.config.shareRequest = false;
            return method.send();
          }
        }

        reportApiError(method.url, method.type, 'Unauthorized', 401);
        const message = (data as ApiResponse)?.message || '认证失败，请重试';
        const showError = meta?.showError !== false;
        if (sentToken) {
          // 带 Token 发出、当前已无 Token 说明期间已主动登出，不提示过期也不跳转
          if (storage.get<string>(STORAGE_KEYS.TOKEN)) handleUnauthorized(message, showError, true);
        } else {
          // 受保护页发起的未登录请求由路由守卫跳转登录页
          const sourcePath = methodSourcePath.get(method);
          if (!sourcePath || isInWhiteList(sourcePath, WHITE_LIST)) handleUnauthorized(message, showError, false);
        }
        throw new ApiError('Unauthorized', 401);
      }

      // HTTP 错误
      if (statusCode >= 400) {
        const body = data as ApiResponse | undefined;
        const msg = getFirstFieldError(body?.data) || body?.message || `请求失败(${statusCode})`;
        if (meta?.showError !== false) {
          showRequestToast(msg);
        }
        reportApiError(method.url, method.type, msg, statusCode);
        throw new ApiError(msg, statusCode);
      }

      const result = data as ApiResponse;

      // 业务错误
      if (result.code !== 200 && result.code !== 0) {
        if (meta?.showError !== false) {
          showRequestToast(result.message || '请求失败');
        }
        reportApiError(method.url, method.type, result.message || '业务错误', result.code);
        throw new ApiError(result.message || '业务错误', statusCode, result.code);
      }

      return result;
    },

    // 请求失败
    onError: (error, method) => {
      const meta = method.meta as RequestMeta | undefined;
      if (meta?.showLoading) {
        hideRequestLoading(method);
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
        hideRequestLoading(method);
      }
    },
  },

  // ==================== 缓存配置 ====================
  // 不缓存响应结果；进行中的相同 GET/HEAD 请求由 alova 的 shareRequest 合并
  cacheFor: null,
});

/** HTTP 客户端（对外导出，隐藏 alova 实现细节） */
export const http = alovaInstance;
