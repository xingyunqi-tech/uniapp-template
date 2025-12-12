/**
 * Orval 自定义 Mutator
 * 让 Orval 生成的代码使用 http 实例
 */
import { http, type ApiResponse } from './alova';

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
 * 注意：只从 ApiResponse 中提取，不从业务对象中提取
 */
export type ExtractResult<T> = T extends ApiResponse<infer R> ? R : T;

/**
 * Orval 自定义 Mutator
 *
 * 作用：
 * 1. 让 Orval 生成的代码使用我们自定义的 http 实例
 * 2. 确保所有请求都经过拦截器
 * 3. 统一响应格式，自动提取 data 字段
 */
export const customMutator = async <T>(config: CustomRequestConfig): Promise<ExtractResult<T>> => {
  const { method = 'GET', url, data, params, headers, showLoading, loadingText, showError } = config;

  // 构建 meta 配置
  const meta = { showLoading, loadingText, showError };

  // 构建请求配置
  const options = { headers, params, meta };

  let response: ApiResponse;

  switch (method) {
    case 'GET':
      response = await http.Get(url, options);
      break;
    case 'POST':
      response = await http.Post(url, data, { ...options, cacheFor: 0 });
      break;
    case 'PUT':
      response = await http.Put(url, data, { ...options, cacheFor: 0 });
      break;
    case 'DELETE':
      response = await http.Delete(url, { ...options, cacheFor: 0 });
      break;
    case 'PATCH':
      // Alova 没有原生 PATCH，用 Post + header 模拟
      response = await http.Post(url, data, {
        ...options,
        headers: { ...headers, 'X-HTTP-Method-Override': 'PATCH' },
        cacheFor: 0,
      });
      break;
    default:
      response = await http.Get(url, options);
  }

  // 返回 data 字段（适配 ApiResponse<T> 格式）
  return response.data as ExtractResult<T>;
};

export default customMutator;
