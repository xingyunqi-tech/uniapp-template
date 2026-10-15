<template>
  <view class="app">
    <!-- 页面容器 -->
  </view>
</template>

<script setup lang="ts">
import {
  onLaunch,
  onShow,
  onHide,
  onError,
  onUnhandledRejection,
  onThemeChange,
  onPageNotFound,
} from '@dcloudio/uni-app';
import { useGlobalStore } from '@/store/modules/global';
import { useUserStore } from '@/store/modules/user';
import { checkUpdate } from '@/utils/update';
import { setupNetworkListener, onNetworkChange } from '@/utils/network';
import { initErrorReporter, resetReportFailureCount } from '@/utils/error-reporter';
import { initPerformanceReporter } from '@/utils/performance-reporter';
import { PAGES, type ThemeType } from '@/constants';

// 错误处理器 (在 onLaunch 中初始化后使用)
let errorHandlers: ReturnType<typeof initErrorReporter>;

// 应用启动
onLaunch(options => {
  console.log('App Launch', options);

  // 初始化全局状态
  const globalStore = useGlobalStore();
  globalStore.initTheme();
  globalStore.initLocale();

  // 初始化全局网络状态监听
  setupNetworkListener({
    offlineMessage: '网络已断开，请检查网络设置',
    onlineMessage: '网络已恢复',
    showToast: true,
  });

  // 网络恢复时重置错误上报失败计数
  onNetworkChange(isConnected => {
    if (isConnected) {
      resetReportFailureCount();
    }
  });

  // 一站式初始化错误上报 (包含配置 + H5 全局监听)
  errorHandlers = initErrorReporter({
    // 上报地址 (生产环境配置)
    reportUrl: import.meta.env.VITE_ERROR_REPORT_URL || '',
    // 生产环境启用
    enabled: import.meta.env.PROD,
    // 开发环境打印日志
    consoleLog: import.meta.env.DEV,
    // 采样率 (1 = 100%)
    sampleRate: 1,
    // 获取当前用户 ID
    getUserId: () => {
      const userStore = useUserStore();
      return userStore.userInfo?.id;
    },
    // 自定义上报函数 (可选，如需对接第三方平台如 Sentry)
    // customReport: async (errors) => {
    //   // 对接 Sentry 或其他监控平台
    //   errors.forEach(err => Sentry.captureException(err));
    // },
  });

  // 性能指标采集，传入 report 后生效
  initPerformanceReporter({
    enabled: import.meta.env.PROD,
    sampleRate: 1,
    // report: metric => {
    //   wx.reportPerformance(METRIC_IDS[metric.name], metric.duration, metric.path);
    // },
  });

  // 检查小程序更新
  checkUpdate({
    title: '发现新版本',
    content: '新版本已准备好，是否立即更新？',
    confirmText: '立即更新',
    forceUpdate: false,
  });
});

// 应用显示 (从后台进入前台)
onShow((options?: unknown) => {
  console.log('App Show', options);
});

// 应用隐藏 (从前台进入后台)
onHide(() => {
  console.log('App Hide');
  errorHandlers?.onHide();
});

// 应用错误 (同步 JS 错误)
// 文档: https://uniapp.dcloud.net.cn/collocation/App.html#onerror
onError(error => {
  errorHandlers?.onError(error);
});

// 未处理的 Promise 拒绝 (Uni-app 官方 API，支持全平台)
// 文档: https://uniapp.dcloud.net.cn/collocation/App.html#onunhandledrejection
onUnhandledRejection(event => {
  errorHandlers?.onUnhandledRejection(event);
});

// 页面不存在 (小程序要求在回调中同步重定向)
onPageNotFound(() => {
  uni.redirectTo({ url: `${PAGES.ERROR}?type=404` });
});

// 系统主题变化监听 (跟随系统时自动切换)
// 文档: https://uniapp.dcloud.net.cn/tutorial/darkmode.html
onThemeChange(res => {
  console.log('System theme changed:', res.theme);
  const globalStore = useGlobalStore();
  globalStore.syncSystemTheme(res.theme as ThemeType);
});
</script>

<style lang="scss">
@use './styles/index';
</style>
