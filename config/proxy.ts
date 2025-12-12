import { hostDict, protocol } from './host';

/**
 * 开发环境代理配置
 * 用于解决跨域问题
 */
export const proxy = {
  '/api': {
    target: `${protocol}//${hostDict.API_SERVICE}`,
    changeOrigin: true,
  },
};
