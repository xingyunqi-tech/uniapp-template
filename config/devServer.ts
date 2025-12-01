import { hostname, port } from './host';
import { proxy } from './proxy';

/**
 * 开发服务器配置
 */
export const devServer = () => {
  return {
    host: hostname,
    port,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    proxy,
  };
};
