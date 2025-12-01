/**
 * Orval 自定义 Mutator
 * 让 Orval 生成的代码使用 luch-request 实例
 */
import { request, type ApiResponse } from './request';

/**
 * 请求配置
 */
export interface CustomRequestConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

  data?: any;

  params?: Record<string, any>;
  headers?: Record<string, string>;
  /** 是否显示 loading */
  showLoading?: boolean;
  /** loading 提示文字 */
  loadingText?: string;
  /** 是否显示错误提示 */
  showError?: boolean;
}

/**
 * 提取响应对象中的 data 字段类型
 */
export type ExtractResult<T> = T extends ApiResponse<infer R> ? R : T extends { data?: infer D } ? D : T;

/**
 * Orval 自定义 Mutator
 *
 * 作用：
 * 1. 让 Orval 生成的代码使用我们自定义的 http 实例
 * 2. 确保所有请求都经过拦截器
 * 3. 统一响应格式，自动提取 data 字段
 *
 * @example
 * // Orval 生成的函数会自动调用此 mutator
 * customMutator<PostAuthLogin200>({ method: 'post', url: '/auth/login', data: loginData })
 */
export const customMutator = async <T>(config: CustomRequestConfig): Promise<ExtractResult<T>> => {
  const { method = 'GET', url, data, params, headers, showLoading, loadingText, showError } = config;

  const requestConfig = {
    header: headers,
    showLoading,
    loadingText,
    showError,
  };

  let response: ApiResponse<any>;

  switch (method.toUpperCase()) {
    case 'GET':
      response = await request.get(url, params, requestConfig);
      break;
    case 'POST':
      response = await request.post(url, data, requestConfig);
      break;
    case 'PUT':
      response = await request.put(url, data, requestConfig);
      break;
    case 'DELETE':
      response = await request.delete(url, requestConfig);
      break;
    case 'PATCH':
      response = await request.patch(url, data, requestConfig);
      break;
    default:
      response = await request.get(url, params, requestConfig);
  }

  // 返回 data 字段（适配 ApiResponse<T> 格式）
  return response.data as ExtractResult<T>;
};

export default customMutator;
