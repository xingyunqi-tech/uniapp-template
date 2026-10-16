<template>
  <!--
    AuthLayout - 认证页面布局组件
    用于登录、注册、忘记密码等认证页面的统一布局
  -->
  <view class="auth-page">
    <!-- 自定义导航栏：状态栏占位 + 返回按钮 -->
    <view class="auth-nav" :style="navStyle">
      <view class="auth-nav__back" @click="goBack">
        <UIcon name="left" size="44rpx" color="var(--color-text)" />
      </view>
    </view>

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
definePage({
  meta: {
    isComponent: true,
  },
});

import { useSafeBack } from '@/composables/useSafeBack';
import { useStatusBar } from '@/composables/useStatusBar';

defineOptions({
  name: 'AuthLayout',
  options: {
    virtualHost: true,
  },
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

const { statusBarHeight, navBarHeight } = useStatusBar();

const navStyle = {
  paddingTop: `${statusBarHeight.value}px`,
  height: `${navBarHeight.value}px`,
};

/** 页面栈有上一页时返回，否则回首页 */
const goBack = useSafeBack();
</script>

<style scoped lang="scss">
.auth-page {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  min-height: 100vh;
  padding: var(--spacing-xl);
  padding-top: 0;
  padding-bottom: calc(var(--safe-area-inset-bottom) + var(--spacing-xl));
  overflow-y: auto;
  background: linear-gradient(135deg, var(--color-primary-bg) 0%, var(--color-success-bg) 100%);
}

// 导航栏
.auth-nav {
  display: flex;
  box-sizing: content-box;
  align-items: center;
  margin: 0 calc(-1 * var(--spacing-xl));
  padding-left: var(--spacing-sm);

  &__back {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 88rpx;
    height: 88rpx;
  }
}

// Logo 头部
.auth-header {
  display: flex;
  gap: var(--spacing-lg);
  align-items: center;
  margin-bottom: 80rpx;
  padding-top: var(--spacing-xl);

  .logo-icon {
    flex-shrink: 0;
    width: 128rpx;
    height: 128rpx;
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-base);
  }

  .logo-text {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);

    .logo-title {
      color: var(--color-text);
      font-size: var(--font-size-xxl);
      font-weight: 600;
      line-height: 1.3;
    }

    .logo-subtitle {
      color: var(--color-text-secondary);
      font-size: var(--font-size-base);
      line-height: 1.4;
    }
  }
}

// 表单卡片
.auth-card {
  box-sizing: border-box;
  width: 100%;
  padding: var(--spacing-xxl) var(--spacing-xl);
  border-radius: var(--radius-xl);
  background: var(--color-bg-card);
  box-shadow: var(--shadow-lg);

  .card-title {
    display: block;
    margin-bottom: var(--spacing-lg);
    color: var(--color-text);
    font-size: var(--font-size-xxl);
    font-weight: 600;
    line-height: 1.3;
    text-align: center;
  }
}
</style>
