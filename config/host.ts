/**
 * 开发服务器主机配置
 */

/** hostname */
export const hostname = '0.0.0.0';

/** protocol */
export const protocol = 'http:';

/** port */
export const port = 5173;

/**
 * 后端服务地址配置
 * 在 proxy.ts 中引用
 */
export const hostDict = {
  /** 主 API 服务 */
  API_SERVICE: 'localhost:8080',
} as const;
