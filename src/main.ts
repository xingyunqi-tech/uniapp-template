import { createSSRApp } from 'vue';
import type { App } from 'vue';
import AppComponent from './App.vue';
import { setupStore } from './store';
import { setupRouterInterceptor } from './utils/routerInterceptor';

// 引入 UnoCSS
import 'virtual:uno.css';

/**
 * UniApp 应用入口
 * 使用 createSSRApp 以支持服务端渲染
 */
export function createApp() {
  const app: App = createSSRApp(AppComponent);

  // 安装 Pinia Store
  setupStore(app);

  // 设置路由拦截器
  setupRouterInterceptor();

  return { app };
}
