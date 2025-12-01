/**
 * UniApp 统一请求封装
 * 基于 luch-request 库实现，支持多端
 */
import Request, { type HttpRequestConfig, type HttpResponse } from 'luch-request';
import { storage, STORAGE_KEYS } from '@/utils/storage';

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
    // 添加 Token
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
        return Promise.reject(data);
      }

      return data as any;
    }

    // 401 未授权
    if (statusCode === 401) {
      storage.remove(STORAGE_KEYS.TOKEN);
      storage.remove(STORAGE_KEYS.USER_INFO);

      uni.showToast({
        title: '登录已过期，请重新登录',
        icon: 'none',
      });

      setTimeout(() => {
        uni.redirectTo({ url: '/pages/login/index' });
      }, 1500);

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

    return Promise.reject({ statusCode, message: errorMessage, data });
  },
  error => {
    // 隐藏 loading
    uni.hideLoading();

    const errorMessage = error.errMsg || '网络请求失败';

    uni.showToast({
      title: errorMessage,
      icon: 'none',
    });

    return Promise.reject({ message: errorMessage, error });
  },
);

/**
 * 封装请求方法
 */

export const request = {
  /**
   * GET 请求
   */
  get<T = any>(url: string, params?: Record<string, any>, config?: RequestConfig): Promise<ApiResponse<T>> {
    return http.get(url, {
      params,
      ...config,
      custom: config,
    }) as unknown as Promise<ApiResponse<T>>;
  },

  /**
   * POST 请求
   */
  post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return http.post(url, data, {
      ...config,
      custom: config,
    }) as unknown as Promise<ApiResponse<T>>;
  },

  /**
   * PUT 请求
   */
  put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return http.put(url, data, {
      ...config,
      custom: config,
    }) as unknown as Promise<ApiResponse<T>>;
  },

  /**
   * DELETE 请求
   */
  delete<T = any>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return http.delete(url, {
      ...config,
      custom: config,
    }) as unknown as Promise<ApiResponse<T>>;
  },

  /**
   * PATCH 请求
   */
  patch<T = any>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return http.request({
      url,
      method: 'POST', // luch-request 不支持 PATCH，用 POST 模拟
      data,
      header: { 'X-HTTP-Method-Override': 'PATCH' },
      ...config,
      custom: config,
    }) as unknown as Promise<ApiResponse<T>>;
  },

  /**
   * 上传文件
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
   * 下载文件
   */
  download(url: string, config?: RequestConfig): Promise<UniApp.DownloadSuccessData> {
    return http.download(url, {
      ...config,
      custom: config,
    });
  },
};

export { http };
export default request;
