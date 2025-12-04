import { createSSRApp } from 'vue';
import type { App } from 'vue';
import AppComponent from './App.vue';
import pinia from './store';
import { i18n } from './utils/locale';
import { setupRouterInterceptor } from './utils/routerInterceptor';

// 引入 UnoCSS
import 'virtual:uno.css';

/**
 * UniApp 应用入口
 */
export function createApp() {
  const app: App = createSSRApp(AppComponent);

  // 使用插件
  app.use(i18n);
  app.use(pinia);

  // 设置路由拦截器
  setupRouterInterceptor();

  return { app };
}
