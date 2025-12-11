/**
 * API Core 模块统一导出
 */

// HTTP 客户端（业务代码使用）
export { http, resetLoginRedirectState, type ApiResponse, type RequestMeta } from './alova';

// Orval 适配器
export { customMutator, type CustomRequestConfig, type ExtractResult } from './mutator';

// Alova Hooks（从 alova/client 导出）
export { useRequest, useWatcher, useFetcher } from 'alova/client';
