<template>
  <view class="u-image" :class="{ 'u-image--round': round }" :style="imageStyle">
    <!-- 加载中状态 -->
    <view v-if="loading" class="u-image__loading">
      <slot name="loading">
        <text class="i-carbon-image u-image__icon" />
      </slot>
    </view>

    <!-- 加载失败状态 -->
    <view v-else-if="error" class="u-image__error" @click="handleRetry">
      <slot name="error">
        <text class="i-carbon-warning-alt u-image__icon" />
        <text class="u-image__error-text">加载失败</text>
      </slot>
    </view>

    <!-- 图片 -->
    <image
      v-show="!loading && !error"
      class="u-image__img"
      :src="src"
      :mode="mode"
      :lazy-load="lazyLoad"
      :fade-show="fadeShow"
      :webp="webp"
      @load="handleLoad"
      @error="handleError"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

export interface Props {
  /** 图片地址 */
  src: string;
  /** 图片宽度 */
  width?: string | number;
  /** 图片高度 */
  height?: string | number;
  /** 图片裁剪模式 */
  mode?:
    | 'scaleToFill'
    | 'aspectFit'
    | 'aspectFill'
    | 'widthFix'
    | 'heightFix'
    | 'top'
    | 'bottom'
    | 'center'
    | 'left'
    | 'right';
  /** 是否圆形 */
  round?: boolean;
  /** 圆角大小 */
  radius?: string | number;
  /** 是否懒加载 */
  lazyLoad?: boolean;
  /** 是否显示淡入效果 */
  fadeShow?: boolean;
  /** 是否支持 webp */
  webp?: boolean;
  /** 是否显示加载中状态 */
  showLoading?: boolean;
  /** 是否显示加载失败状态 */
  showError?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  width: '100%',
  height: 'auto',
  mode: 'aspectFill',
  round: false,
  radius: 0,
  lazyLoad: true,
  fadeShow: true,
  webp: true,
  showLoading: true,
  showError: true,
});

const emit = defineEmits<{
  load: [event: any];
  error: [event: any];
}>();

// 状态
const loading = ref(props.showLoading);
const error = ref(false);

// 计算样式
const imageStyle = computed(() => {
  const width = typeof props.width === 'number' ? `${props.width}rpx` : props.width;
  const height = typeof props.height === 'number' ? `${props.height}rpx` : props.height;
  const radius = props.round ? '50%' : typeof props.radius === 'number' ? `${props.radius}rpx` : props.radius;

  return {
    width,
    height,
    borderRadius: radius,
  };
});

// 监听 src 变化重新加载
watch(
  () => props.src,
  () => {
    if (props.src) {
      loading.value = props.showLoading;
      error.value = false;
    }
  },
);

// 加载完成

function handleLoad(event: any) {
  loading.value = false;
  error.value = false;
  emit('load', event);
}

// 加载失败

function handleError(event: any) {
  loading.value = false;
  error.value = true;
  emit('error', event);
}

// 重试加载
function handleRetry() {
  if (props.src) {
    loading.value = props.showLoading;
    error.value = false;
  }
}
</script>

<style scoped lang="scss">
.u-image {
  display: inline-block;
  position: relative;
  overflow: hidden;

  &--round {
    border-radius: 50%;
  }

  &__img {
    display: block;
    width: 100%;
    height: 100%;
  }

  &__loading,
  &__error {
    display: flex;
    position: absolute;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: var(--color-bg-grey);
    inset: 0;
    gap: 8rpx;
  }

  &__icon {
    color: var(--color-text-placeholder);
    font-size: 48rpx;
  }

  &__error-text {
    color: var(--color-text-secondary);
    font-size: 24rpx;
  }
}
</style>
