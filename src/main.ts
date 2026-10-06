import { createSSRApp } from 'vue';
import type { App } from 'vue';
import AppComponent from './App.vue';
import { setAuthHandlers } from './api';
import pinia, { useGlobalStore, useUserStore } from './store';
import { i18n } from './utils/locale';
import { guardCurrentPage, setupRouterInterceptor } from './utils/router-interceptor';

/** 是否为当前栈顶页面的实例（排除组件） */
function isCurrentPageVm(vm: unknown): boolean {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1] as { $vm?: unknown } | undefined;
  return currentPage?.$vm === vm;
}

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
    clearAuth: () => useUserStore(pinia).resetUserState(),
  });

  // 设置路由拦截器
  setupRouterInterceptor();

  app.mixin({
    // 页面加载时校验访问权限
    onLoad(this: unknown) {
      if (!isCurrentPageVm(this)) return;
      guardCurrentPage();
    },
    // 页面显示时重新应用主题，同步原生导航栏与 TabBar 样式
    onShow(this: unknown) {
      if (!isCurrentPageVm(this)) return;
      useGlobalStore(pinia).initTheme();
    },
  });

  return { app };
}
