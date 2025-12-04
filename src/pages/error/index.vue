<route lang="json5">
{
  style: {
    navigationBarTitleText: '页面不存在',
  },
}
</route>

<template>
  <view class="error-page">
    <view class="error-content">
      <!-- 错误图标 -->
      <view class="error-icon">
        <text class="i-carbon-warning-alt" />
      </view>

      <!-- 错误信息 -->
      <text class="error-code">{{ errorCode }}</text>
      <text class="error-title">{{ errorTitle }}</text>
      <text class="error-desc">{{ errorDesc }}</text>

      <!-- 操作按钮 -->
      <view class="error-actions">
        <button class="action-btn primary" @click="goHome">返回首页</button>
        <button v-if="canGoBack" class="action-btn" @click="goBack">返回上页</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useRouter } from '@/composables/useRouter';
import { canGoBack as checkCanGoBack } from '@/utils/router';

const router = useRouter();

// 错误类型
type ErrorType = '404' | '403' | '500' | 'network';

// 错误码
const errorCode = ref('404');

// 错误信息配置
const errorConfig: Record<ErrorType, { title: string; desc: string }> = {
  '404': {
    title: '页面不存在',
    desc: '抱歉，您访问的页面不存在或已被移除',
  },
  '403': {
    title: '没有权限',
    desc: '抱歉，您没有权限访问此页面',
  },
  '500': {
    title: '服务器错误',
    desc: '抱歉，服务器出现问题，请稍后重试',
  },
  network: {
    title: '网络异常',
    desc: '请检查您的网络连接后重试',
  },
};

// 计算属性
const errorTitle = computed(() => {
  return errorConfig[errorCode.value as ErrorType]?.title || '出错了';
});

const errorDesc = computed(() => {
  return errorConfig[errorCode.value as ErrorType]?.desc || '页面发生未知错误';
});

const canGoBack = computed(() => checkCanGoBack());

// 页面加载
onLoad(options => {
  if (options?.type && options.type in errorConfig) {
    errorCode.value = options.type;
  }
});

// 返回首页
function goHome() {
  router.switchTab('/pages/index/index');
}

// 返回上页
function goBack() {
  router.back();
}
</script>

<style scoped lang="scss">
.error-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 40rpx;
  background: $uni-bg-color-grey;
}

.error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 600rpx;
  padding: 80rpx 40rpx;
  border-radius: $uni-border-radius-lg;
  background: $uni-bg-color;
  box-shadow: $uni-shadow-base;
  text-align: center;
}

.error-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 160rpx;
  height: 160rpx;
  margin-bottom: 40rpx;
  border-radius: 50%;
  background: rgb(250 173 20 / 0.1);

  .i-carbon-warning-alt {
    color: $uni-color-warning;
    font-size: 80rpx;
  }
}

.error-code {
  margin-bottom: 16rpx;
  color: $uni-text-color-disabled;
  font-size: 100rpx;
  font-weight: 700;
  line-height: 1;
}

.error-title {
  margin-bottom: 16rpx;
  color: $uni-text-color;
  font-size: 36rpx;
  font-weight: 600;
}

.error-desc {
  margin-bottom: 48rpx;
  color: $uni-text-color-secondary;
  font-size: 28rpx;
  line-height: 1.6;
}

.error-actions {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  width: 100%;

  .action-btn {
    width: 100%;
    height: 88rpx;
    border: 1px solid $uni-border-color;
    border-radius: $uni-border-radius-lg;
    background: $uni-bg-color;
    color: $uni-text-color;
    font-size: 30rpx;
    line-height: 88rpx;

    &::after {
      display: none;
    }

    &:active {
      opacity: 0.8;
    }

    &.primary {
      border: none;
      background: $uni-color-primary;
      color: #fff;
    }
  }
}
</style>
