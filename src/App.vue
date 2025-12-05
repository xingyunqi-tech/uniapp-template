<template>
  <view class="app">
    <!-- 页面容器 -->
  </view>
</template>

<script setup lang="ts">
import { onLaunch, onShow, onHide, onError } from '@dcloudio/uni-app';
import { useGlobalStore } from '@/store/modules/global';
import { useUserStore } from '@/store/modules/user';
import { checkUpdate, setupNetworkListener, setupErrorReporter, reportError, flushErrors } from '@/utils';

// 应用启动
onLaunch(options => {
  console.log('App Launch', options);

  // 初始化全局状态和主题
  const globalStore = useGlobalStore();
  globalStore.initTheme();

  // 初始化全局网络状态监听
  setupNetworkListener({
    offlineMessage: '网络已断开，请检查网络设置',
    onlineMessage: '网络已恢复',
    showToast: true,
  });

  // 初始化错误上报
  setupErrorReporter({
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

  // 检查小程序更新
  checkUpdate({
    title: '发现新版本',
    content: '新版本已准备好，是否立即更新？',
    confirmText: '立即更新',
    forceUpdate: false,
  });
});

// 应用显示 (从后台进入前台)
onShow(options => {
  console.log('App Show', options);
});

// 应用隐藏 (从前台进入后台)
onHide(() => {
  console.log('App Hide');
  // 应用切到后台时，立即上报缓存的错误
  flushErrors();
});

// 应用错误
onError(error => {
  console.error('App Error:', error);
  // 上报错误到监控平台
  reportError(error, 'js', 'error', { source: 'onError' });
});
</script>

<style lang="scss">
@use './styles/index';
</style>
