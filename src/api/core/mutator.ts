/**
 * Orval 自定义 Mutator
 * 让 Orval 生成的代码使用 http 实例
 */
import { http, resolveRequestToken, type ApiResponse, type RequestMeta } from './alova';

/**
 * 请求配置
 */
export interface CustomRequestConfig extends RequestMeta {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
}

/**
 * 单次请求参数：Orval 生成函数的最后一个可选参数，合并进本次请求
 *
 * 不含 params / data：它们由生成函数的前几个参数给出。
 *
 * @example getOrders(params, { showError: false })
 */
export type RequestOptions = Omit<CustomRequestConfig, 'url' | 'method' | 'params' | 'data'>;

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
 *
 * 第二个参数让 Orval 给每个生成函数加上可选的最后一个参数，见 RequestOptions。
 */
export const customMutator = async <T>(
  config: CustomRequestConfig,
  options?: RequestOptions,
): Promise<ExtractResult<T>> => {
  const {
    method = 'GET',
    url,
    data,
    params,
    showLoading,
    loadingText,
    showError,
    skipAuthHandling,
    withDeviceId,
  } = {
    ...config,
    ...options,
  };
  // Token 在创建请求时写入，参与 alova 的请求 key，不同 Token 的相同请求不会合并
  const token = await resolveRequestToken(skipAuthHandling);
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...config.headers,
    ...options?.headers,
  };
  const meta: RequestMeta = { showLoading, loadingText, showError, skipAuthHandling, withDeviceId };
  const methodConfig = { headers, params, meta };

  let response: ApiResponse;

  switch (method) {
    case 'POST':
      response = await http.Post(url, data, methodConfig);
      break;
    case 'PUT':
      response = await http.Put(url, data, methodConfig);
      break;
    case 'PATCH':
      response = await http.Patch(url, data, methodConfig);
      break;
    case 'DELETE':
      response = await http.Delete(url, data, methodConfig);
      break;
    default:
      response = await http.Get(url, methodConfig);
  }

  // 返回 data 字段（适配 ApiResponse<T> 格式）
  return response.data as ExtractResult<T>;
};

export default customMutator;
