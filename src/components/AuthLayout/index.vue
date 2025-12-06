<route lang="json5">
{
  meta: {
    isComponent: true,
  },
}
</route>

<template>
  <!--
    AuthLayout - 认证页面布局组件
    用于登录、注册、忘记密码等认证页面的统一布局
  -->
  <view class="auth-page">
    <!-- Logo 头部 -->
    <view class="auth-header">
      <image class="logo-icon" src="/static/images/logo.png" mode="aspectFit" />
      <view class="logo-text">
        <text class="logo-title">{{ title }}</text>
        <text class="logo-subtitle">{{ subtitle }}</text>
      </view>
    </view>

    <!-- 表单卡片 -->
    <view class="auth-card">
      <text class="card-title">{{ cardTitle }}</text>

      <!-- 插槽：表单内容 -->
      <slot />
    </view>
  </view>
</template>

<script setup lang="ts">
defineOptions({
  name: 'AuthLayout',
});

interface Props {
  /** 页面标题 */
  title?: string;
  /** 页面副标题 */
  subtitle?: string;
  /** 卡片标题 */
  cardTitle?: string;
}

withDefaults(defineProps<Props>(), {
  title: '欢迎',
  subtitle: 'UniApp 多端开发模板',
  cardTitle: '',
});
</script>

<style scoped lang="scss">
.auth-page {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  min-height: 100vh;
  padding: 40rpx;
  padding-top: calc($uni-safe-area-inset-top + 40rpx);
  padding-bottom: calc($uni-safe-area-inset-bottom + 40rpx);
  overflow-y: auto;
  background: linear-gradient(135deg, var(--color-primary-bg) 0%, var(--color-success-bg) 100%);
}

// Logo 头部
.auth-header {
  display: flex;
  gap: 32rpx;
  align-items: center;
  margin-bottom: 80rpx;
  padding-top: 40rpx;

  .logo-icon {
    flex-shrink: 0;
    width: 128rpx;
    height: 128rpx;
    border-radius: 24rpx;
    box-shadow: var(--shadow-base);
  }

  .logo-text {
    display: flex;
    flex-direction: column;
    gap: 8rpx;

    .logo-title {
      color: var(--color-text);
      font-size: 48rpx;
      font-weight: 600;
      line-height: 1.3;
    }

    .logo-subtitle {
      color: var(--color-text-secondary);
      font-size: 28rpx;
      line-height: 1.4;
    }
  }
}

// 表单卡片
.auth-card {
  box-sizing: border-box;
  width: 100%;
  padding: 64rpx 48rpx;
  border-radius: 32rpx;
  background: var(--color-bg);
  box-shadow: var(--shadow-lg);

  .card-title {
    display: block;
    margin-bottom: 32rpx;
    color: var(--color-text);
    font-size: 44rpx;
    font-weight: 600;
    line-height: 1.3;
    text-align: center;
  }
}
</style>
