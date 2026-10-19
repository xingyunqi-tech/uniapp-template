import { createSSRApp, watch } from 'vue';
import type { App } from 'vue';
import AppComponent from './App.vue';
import { setAuthHandlers } from './api';
import pinia, {
  useAppProfileStore,
  useConsentStore,
  useGlobalStore,
  useNotificationStore,
  useUserStore,
} from './store';
import { i18n } from './utils/locale';
import { guardCurrentPage, setupRouterInterceptor } from './utils/router-interceptor';
import { getCurrentRoute, getShareTarget, isPrivatePage, isTabBarPage } from './utils/router';
import { syncTabBarBadge } from './utils/tabbar-badge';
import { openConsentGate } from './utils/consent-gate';
import { TAB_BAR_BADGE } from './constants';

/** 是否为当前栈顶页面的实例（排除组件） */
function isCurrentPageVm(vm: unknown): boolean {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1] as { $vm?: unknown } | undefined;
  return currentPage?.$vm === vm;
}

/** 私有页隐藏转发与分享到朋友圈菜单 */
function hidePrivatePageShareMenu(): void {
  // #ifdef MP
  if (isPrivatePage(getCurrentRoute())) {
    uni.hideShareMenu({
      hideShareItems: [],
      menus: ['shareAppMessage', 'shareTimeline'],
    } as UniNamespace.HideShareMenuOptions);
  }
  // #endif
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

  // 未读数变化时同步 TabBar 角标
  watch(() => useNotificationStore(pinia).unreadCount, syncTabBarBadge);

  // 有未同意的协议时打开协议同意页
  watch(
    () => useConsentStore(pinia).required.length > 0,
    required => {
      if (required) openConsentGate();
    },
  );

  app.mixin({
    // 页面加载时校验访问权限
    onLoad(this: unknown) {
      if (!isCurrentPageVm(this)) return;
      guardCurrentPage();
      hidePrivatePageShareMenu();
    },
    // 页面显示时重新应用主题，同步原生导航栏与 TabBar 样式
    onShow(this: unknown) {
      if (!isCurrentPageVm(this)) return;
      useGlobalStore(pinia).initTheme();
      if (useConsentStore(pinia).required.length > 0) openConsentGate();

      // 进入 TabBar 页时刷新未读数并同步角标
      if (TAB_BAR_BADGE.enabled && isTabBarPage(getCurrentRoute())) {
        const notificationStore = useNotificationStore(pinia);
        syncTabBarBadge(notificationStore.unreadCount);
        if (useUserStore(pinia).isLoggedIn) notificationStore.fetchUnreadCount();
      }
    },
    // 默认开启转发与分享到朋友圈（私有页除外），页面自行注册时以页面为准
    onShareAppMessage() {
      return { title: useAppProfileStore(pinia).shareTitle, path: getShareTarget().path };
    },
    onShareTimeline() {
      return { title: useAppProfileStore(pinia).shareTitle, query: getShareTarget().query };
    },
  });

  return { app };
}
