import { createSSRApp } from 'vue';
import type { App } from 'vue';
import AppComponent from './App.vue';
import { setAuthHandlers } from './api';
import pinia, { useUserStore } from './store';
import { i18n } from './utils/locale';
import { setupRouterInterceptor } from './utils/routerInterceptor';

/**
 * UniApp 应用入口
 */
export function createApp() {
  const app: App = createSSRApp(AppComponent);

  // 使用插件
  app.use(i18n);
  app.use(pinia);

  // 401 时的刷新与清理回调
  setAuthHandlers({
    refreshToken: () => useUserStore(pinia).refreshToken(),
    clearAuth: () => void useUserStore(pinia).resetUserState(),
  });

  // 设置路由拦截器
  setupRouterInterceptor();

  return { app };
}
