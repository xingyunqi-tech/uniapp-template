/**
 * UniApp 统一请求封装
 * 基于 luch-request 库实现，支持多端
 * 支持请求去重、自动重试、错误处理
 */
import Request, { type HttpRequestConfig, type HttpResponse } from 'luch-request';
import { storage, STORAGE_KEYS } from '@/utils/storage';
import { reportApiError } from '@/utils/errorReporter';

// ==================== 类型定义 ====================

// API 响应通用接口
export interface ApiResponse<T = any> {
  code: number;
  data?: T;
  message: string;
  timestamp?: number;
}

// 请求配置扩展
export interface RequestConfig extends HttpRequestConfig {
  /** 是否显示 loading */
  showLoading?: boolean;
  /** loading 提示文字 */
  loadingText?: string;
  /** 是否显示错误提示 */
  showError?: boolean;
  /** 是否启用请求去重 (默认 true，仅对 GET 请求生效) */
  dedupe?: boolean;
  /** 去重时间窗口 (ms)，默认 500ms */
  dedupeInterval?: number;
  /** 是否启用重试 (默认 false) */
  retry?: boolean;
  /** 最大重试次数 (默认 3) */
  retryCount?: number;
  /** 重试延迟 (ms)，默认 1000ms */
  retryDelay?: number;
  /** 可重试的 HTTP 状态码 */
  retryStatusCodes?: number[];
  /** 当前重试次数 (内部使用) */
  __retryAttempt?: number;
  /** 请求唯一标识 (内部使用) */
  __requestKey?: string;
}

// ==================== 请求去重管理 ====================

interface PendingRequest {
  /** 请求的 Promise */
  promise: Promise<any>;
  /** 创建时间 */
  timestamp: number;
  /** 订阅者数量 */
  subscribers: number;
}

/** 进行中的请求映射表 */
const pendingRequests = new Map<string, PendingRequest>();

/** 请求方法类型 */
type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/** 请求标识配置 */
interface RequestKeyConfig {
  url?: string;
  method?: RequestMethod | string;
  params?: Record<string, any>;
  data?: any;
}

/**
 * 生成请求唯一标识
 */
function generateRequestKey(config: RequestKeyConfig): string {
  const { url, method = 'GET', params, data } = config;
  const paramsStr = params ? JSON.stringify(params) : '';
  const dataStr = data ? JSON.stringify(data) : '';
  return `${method}:${url}:${paramsStr}:${dataStr}`;
}

/**
 * 清理过期的 pending 请求
 */
function cleanupPendingRequests(interval: number = 500): void {
  const now = Date.now();
  for (const [key, request] of pendingRequests.entries()) {
    if (now - request.timestamp > interval && request.subscribers === 0) {
      pendingRequests.delete(key);
    }
  }
}

/**
 * 添加请求到 pending 队列
 */
function addPendingRequest(key: string, promise: Promise<any>): void {
  pendingRequests.set(key, {
    promise,
    timestamp: Date.now(),
    subscribers: 1,
  });
  // 懒启动清理定时器
  startCleanupTimer();
}

/**
 * 获取 pending 请求
 */
function getPendingRequest(key: string, dedupeInterval: number): PendingRequest | null {
  const pending = pendingRequests.get(key);
  if (pending && Date.now() - pending.timestamp < dedupeInterval) {
    pending.subscribers++;
    return pending;
  }
  return null;
}

/**
 * 移除 pending 请求
 */
function removePendingRequest(key: string): void {
  const pending = pendingRequests.get(key);
  if (pending) {
    pending.subscribers--;
    if (pending.subscribers <= 0) {
      pendingRequests.delete(key);
    }
  }
}

// ==================== 清理定时器管理 (懒启动) ====================

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

/**
 * 启动清理定时器 (懒启动模式)
 */
function startCleanupTimer(): void {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    cleanupPendingRequests(5000);
    // 如果没有 pending 请求了，停止定时器
    if (pendingRequests.size === 0) {
      stopCleanupTimer();
    }
  }, 10000);
}

/**
 * 停止清理定时器
 */
function stopCleanupTimer(): void {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}

// ==================== 401 防重复跳转 ====================

/** 是否正在处理 401 跳转 */
let isRedirectingToLogin = false;

/** 重置 401 跳转状态 (用于登录成功后) */
export function resetLoginRedirectState(): void {
  isRedirectingToLogin = false;
}

// ==================== 重试逻辑 ====================

/** 默认可重试的状态码 */
const DEFAULT_RETRY_STATUS_CODES = [408, 500, 502, 503, 504];

/**
 * 判断是否应该重试
 */
function shouldRetry(error: any, config: RequestConfig): boolean {
  const { retry = false, retryCount = 3, retryStatusCodes = DEFAULT_RETRY_STATUS_CODES, __retryAttempt = 0 } = config;

  // 未启用重试
  if (!retry) return false;

  // 超过最大重试次数
  if (__retryAttempt >= retryCount) return false;

  // 检查是否是网络错误
  if (error.errMsg?.includes('request:fail') || error.errMsg?.includes('timeout')) {
    return true;
  }

  // 检查 HTTP 状态码
  const statusCode = error.statusCode || error.status;
  if (statusCode && retryStatusCodes.includes(statusCode)) {
    return true;
  }

  return false;
}

/**
 * 延迟执行
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 创建 luch-request 实例
const http = new Request({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 30000,
  header: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
http.interceptors.request.use(
  config => {
    // 从 storage 获取 Token（无依赖，可立即读取）
    const token = storage.get<string>(STORAGE_KEYS.TOKEN);
    if (token) {
      config.header = {
        ...config.header,
        Authorization: `Bearer ${token}`,
      };
    }

    // 显示 loading
    const customConfig = config.custom as RequestConfig;
    if (customConfig?.showLoading) {
      uni.showLoading({
        title: customConfig.loadingText || '加载中...',
        mask: true,
      });
    }

    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

// 响应拦截器
http.interceptors.response.use(
  (response: HttpResponse<ApiResponse>) => {
    // 隐藏 loading
    const customConfig = response.config?.custom as RequestConfig;
    if (customConfig?.showLoading) {
      uni.hideLoading();
    }

    const { statusCode, data } = response;

    // HTTP 状态码检查
    if (statusCode >= 200 && statusCode < 300) {
      // 检查业务状态码
      if (data.code !== 200 && data.code !== 0) {
        const showError = customConfig?.showError !== false;
        if (showError) {
          uni.showToast({
            title: data.message || '请求失败',
            icon: 'none',
          });
        }
        // 上报业务错误
        reportApiError(
          response.config?.url || '',
          response.config?.method || 'GET',
          data.message || '业务错误',
          data.code,
        );
        return Promise.reject(data);
      }

      return data as any;
    }

    // 401 未授权
    if (statusCode === 401) {
      // 清除 Token
      storage.remove(STORAGE_KEYS.TOKEN);

      // 上报 401 错误
      reportApiError(response.config?.url || '', response.config?.method || 'GET', 'Unauthorized', 401);

      // 防止重复跳转
      if (!isRedirectingToLogin) {
        isRedirectingToLogin = true;

        uni.showToast({
          title: '登录已过期，请重新登录',
          icon: 'none',
        });

        setTimeout(() => {
          uni.redirectTo({
            url: '/pages/login/index',
            success: () => {
              // 跳转成功后重置状态
              isRedirectingToLogin = false;
            },
            fail: () => {
              // 跳转失败也要重置状态，避免锁死
              isRedirectingToLogin = false;
              console.warn('[Request] 跳转登录页失败，请检查页面是否存在');
            },
          });
        }, 1500);
      }

      return Promise.reject({ statusCode, message: 'Unauthorized' });
    }

    // 其他错误
    const errorMessage = data?.message || `请求失败 (${statusCode})`;
    const showError = customConfig?.showError !== false;
    if (showError) {
      uni.showToast({
        title: errorMessage,
        icon: 'none',
      });
    }

    // 上报 HTTP 错误
    reportApiError(response.config?.url || '', response.config?.method || 'GET', errorMessage, statusCode);

    return Promise.reject({ statusCode, message: errorMessage, data });
  },
  error => {
    // 隐藏 loading
    uni.hideLoading();

    const errorMessage = error.errMsg || '网络请求失败';
    const showError = error.config?.custom?.showError !== false;

    if (showError) {
      uni.showToast({
        title: errorMessage,
        icon: 'none',
      });
    }

    // 上报网络错误
    reportApiError(error.config?.url || '', error.config?.method || 'GET', errorMessage);

    return Promise.reject({ message: errorMessage, error });
  },
);

// ==================== 核心请求执行器 ====================

/**
 * 执行实际的 HTTP 请求
 */
async function executeRequest<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  url: string,
  dataOrParams?: any,
  config: RequestConfig = {},
): Promise<ApiResponse<T>> {
  const fullConfig: RequestConfig = {
    ...config,
    custom: config,
  };

  try {
    let result: any;

    switch (method) {
      case 'GET':
        result = await http.get(url, { params: dataOrParams, ...fullConfig });
        break;
      case 'POST':
        result = await http.post(url, dataOrParams, fullConfig);
        break;
      case 'PUT':
        result = await http.put(url, dataOrParams, fullConfig);
        break;
      case 'DELETE':
        result = await http.delete(url, { params: dataOrParams, ...fullConfig });
        break;
      case 'PATCH':
        result = await http.request({
          url,
          method: 'POST', // luch-request 不支持 PATCH，用 POST 模拟
          data: dataOrParams,
          header: { 'X-HTTP-Method-Override': 'PATCH' },
          ...fullConfig,
        });
        break;
    }

    return result as ApiResponse<T>;
  } catch (error: any) {
    // 检查是否需要重试
    if (shouldRetry(error, config)) {
      const retryDelay = config.retryDelay || 1000;
      const currentAttempt = (config.__retryAttempt || 0) + 1;

      console.warn(`[Request] 请求失败，${retryDelay}ms 后进行第 ${currentAttempt} 次重试:`, url);

      await delay(retryDelay);

      // 递归重试
      return executeRequest<T>(method, url, dataOrParams, {
        ...config,
        __retryAttempt: currentAttempt,
      });
    }

    throw error;
  }
}

/**
 * 带去重的请求包装器
 */
async function requestWithDedupe<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  url: string,
  dataOrParams?: any,
  config: RequestConfig = {},
): Promise<ApiResponse<T>> {
  const {
    dedupe = method === 'GET', // GET 请求默认启用去重
    dedupeInterval = 500,
  } = config;

  // 生成请求唯一标识
  const isParamsMethod = method === 'GET' || method === 'DELETE';
  const requestKey = generateRequestKey({
    url,
    method,
    params: isParamsMethod ? dataOrParams : undefined,
    data: !isParamsMethod ? dataOrParams : undefined,
  });

  // 如果启用了去重，检查是否有相同的进行中请求
  if (dedupe) {
    const pending = getPendingRequest(requestKey, dedupeInterval);
    if (pending) {
      console.log('[Request] 检测到重复请求，复用进行中的请求:', url);
      try {
        return await pending.promise;
      } finally {
        removePendingRequest(requestKey);
      }
    }
  }

  // 创建新请求
  const requestPromise = executeRequest<T>(method, url, dataOrParams, {
    ...config,
    __requestKey: requestKey,
  });

  // 如果启用去重，将请求添加到 pending 队列
  if (dedupe) {
    addPendingRequest(requestKey, requestPromise);
  }

  try {
    const result = await requestPromise;
    return result;
  } finally {
    if (dedupe) {
      removePendingRequest(requestKey);
    }
  }
}

// ==================== 封装请求方法 ====================

export const request = {
  /**
   * GET 请求
   * @param url 请求地址
   * @param params 查询参数
   * @param config 请求配置
   *
   * @example
   * ```ts
   * // 基本用法
   * const res = await request.get('/api/users');
   *
   * // 带参数
   * const res = await request.get('/api/users', { page: 1, size: 10 });
   *
   * // 启用重试 (网络不稳定时自动重试 3 次)
   * const res = await request.get('/api/users', {}, { retry: true });
   *
   * // 禁用去重 (允许并发相同请求)
   * const res = await request.get('/api/users', {}, { dedupe: false });
   * ```
   */
  get<T = any>(url: string, params?: Record<string, any>, config?: RequestConfig): Promise<ApiResponse<T>> {
    return requestWithDedupe<T>('GET', url, params, config);
  },

  /**
   * POST 请求
   * @param url 请求地址
   * @param data 请求体数据
   * @param config 请求配置
   *
   * @example
   * ```ts
   * // 基本用法
   * const res = await request.post('/api/users', { name: 'John' });
   *
   * // 启用重试
   * const res = await request.post('/api/users', { name: 'John' }, { retry: true, retryCount: 2 });
   *
   * // 启用去重 (防止表单重复提交)
   * const res = await request.post('/api/orders', orderData, { dedupe: true, dedupeInterval: 1000 });
   * ```
   */
  post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return requestWithDedupe<T>('POST', url, data, config);
  },

  /**
   * PUT 请求
   */
  put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return requestWithDedupe<T>('PUT', url, data, config);
  },

  /**
   * DELETE 请求
   * @param url 请求地址
   * @param params 查询参数 (可选)
   * @param config 请求配置
   *
   * @example
   * ```ts
   * // 无参数
   * await request.delete('/api/users/123');
   *
   * // 带查询参数
   * await request.delete('/api/users', { ids: [1, 2, 3] });
   * ```
   */
  delete<T = any>(url: string, params?: Record<string, any>, config?: RequestConfig): Promise<ApiResponse<T>> {
    return requestWithDedupe<T>('DELETE', url, params, config);
  },

  /**
   * PATCH 请求
   */
  patch<T = any>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return requestWithDedupe<T>('PATCH', url, data, config);
  },

  /**
   * 上传文件 (不支持去重和重试)
   */
  upload<T = any>(
    url: string,
    filePath: string,
    name = 'file',
    formData?: Record<string, any>,
    config?: RequestConfig,
  ): Promise<ApiResponse<T>> {
    return http.upload(url, {
      filePath,
      name,
      formData,
      ...config,
      custom: config,
    } as any) as unknown as Promise<ApiResponse<T>>;
  },

  /**
   * 下载文件 (不支持去重和重试)
   */
  download(url: string, config?: RequestConfig): Promise<UniApp.DownloadSuccessData> {
    return http.download(url, {
      ...config,
      custom: config,
    });
  },

  /**
   * 取消所有进行中的请求 (清空 pending 队列)
   */
  cancelAllPending(): void {
    pendingRequests.clear();
    console.log('[Request] 已清空所有 pending 请求');
  },

  /**
   * 获取当前 pending 请求数量
   */
  getPendingCount(): number {
    return pendingRequests.size;
  },
};

export { http };
export default request;
