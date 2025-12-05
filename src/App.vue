<template>
  <view class="app">
    <!-- 页面容器 -->
  </view>
</template>

<script setup lang="ts">
import { onLaunch, onShow, onHide, onError } from '@dcloudio/uni-app';
import { useGlobalStore } from '@/store/modules/global';
import { checkUpdate } from '@/utils/update';

// 应用启动
onLaunch(options => {
  console.log('App Launch', options);

  // 初始化全局状态
  useGlobalStore();

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
});

// 应用错误
onError(error => {
  console.error('App Error:', error);
  // 可以在这里上报错误到监控平台
  // 例如: reportError(error)
});
</script>

<style lang="scss">
@use './styles/index';
</style>
