/** dev server 绑定地址，0.0.0.0 便于局域网内真机预览 H5 */
export const hostname = '0.0.0.0';

export const port = 5173;

/**
 * 开发服务器配置
 *
 * 不配置代理：各端统一直接请求 VITE_API_BASE_URL，H5 跨域由后端 CORS 放行
 */
export const devServer = () => ({
  host: hostname,
  port,
});
