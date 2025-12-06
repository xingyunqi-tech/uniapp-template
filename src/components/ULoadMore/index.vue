<route lang="json5">
{
  meta: {
    isComponent: true,
  },
}
</route>

<template>
  <!--
    ULoadMore - 加载更多组件
    用于列表底部的加载状态展示
  -->
  <view class="u-load-more" :class="{ 'u-load-more--line': showLine }">
    <!-- 加载中 -->
    <template v-if="status === 'loading'">
      <view class="u-load-more__spinner" />
      <text class="u-load-more__text">{{ loadingText }}</text>
    </template>

    <!-- 没有更多 -->
    <template v-else-if="status === 'nomore'">
      <view v-if="showLine" class="u-load-more__line" />
      <text class="u-load-more__text">{{ nomoreText }}</text>
      <view v-if="showLine" class="u-load-more__line" />
    </template>

    <!-- 加载更多 -->
    <template v-else>
      <text class="u-load-more__text">{{ loadmoreText }}</text>
    </template>
  </view>
</template>

<script setup lang="ts">
defineOptions({
  name: 'ULoadMore',
});

// ==================== Types ====================

export type LoadMoreStatus = 'loadmore' | 'loading' | 'nomore';

// ==================== Props ====================

interface Props {
  /** 加载状态 */
  status?: LoadMoreStatus;
  /** 加载中文案 */
  loadingText?: string;
  /** 加载更多文案 */
  loadmoreText?: string;
  /** 没有更多文案 */
  nomoreText?: string;
  /** 是否显示分割线（仅 nomore 状态） */
  showLine?: boolean;
}

withDefaults(defineProps<Props>(), {
  status: 'loadmore',
  loadingText: '加载中...',
  loadmoreText: '上拉加载更多',
  nomoreText: '没有更多了',
  showLine: false,
});
</script>

<style scoped lang="scss">
.u-load-more {
  display: flex;
  gap: 16rpx;
  align-items: center;
  justify-content: center;
  padding: 32rpx;

  &__spinner {
    width: 32rpx;
    height: 32rpx;
    animation: u-load-more-rotate 0.8s linear infinite;
    border: 3rpx solid var(--color-border);
    border-radius: 50%;
    border-top-color: var(--color-primary);
  }

  &__text {
    color: var(--color-text-placeholder);
    font-size: 26rpx;
  }

  &__line {
    flex: 1;
    max-width: 100rpx;
    height: 1rpx;
    background: var(--color-border);
  }

  &--line {
    .u-load-more__text {
      padding: 0 16rpx;
    }
  }
}

@keyframes u-load-more-rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
