/**
 * API Core 模块统一导出
 */

// HTTP 客户端（业务代码使用）
export {
  http,
  setAuthHandlers,
  ApiError,
  isTransientError,
  API_BASE_URL,
  resolveRequestHeaders,
  recoverUnauthorized,
  type ApiResponse,
  type AuthHandlers,
  type RequestMeta,
} from './alova';

// Orval 适配器
export { customMutator, type CustomRequestConfig, type ExtractResult, type RequestOptions } from './mutator';

// Alova Hooks（从 alova/client 导出）
export { useRequest, useWatcher, useFetcher } from 'alova/client';
