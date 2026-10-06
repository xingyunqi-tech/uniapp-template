<template>
  <!--
    UImage - 图片组件
    封装懒加载、错误处理、重试等功能
  -->
  <view class="u-image" :class="{ 'u-image--round': round }" :style="imageStyle">
    <!-- 加载中状态 -->
    <view v-if="loading" class="u-image__loading">
      <slot name="loading">
        <!-- 有占位图时显示占位图 -->
        <image v-if="placeholder" class="u-image__placeholder" :src="placeholder" :mode="mode" />
        <!-- 无占位图时显示图标 -->
        <view v-else class="u-image__icon">
          <uni-icons type="image" color="inherit" size="inherit" />
        </view>
      </slot>
    </view>

    <!-- 加载失败状态 -->
    <view v-else-if="error" class="u-image__error" @click="handleRetry">
      <slot name="error">
        <!-- 有错误图时显示错误图 -->
        <image v-if="errorImage" class="u-image__error-img" :src="errorImage" :mode="mode" />
        <!-- 无错误图时显示图标 -->
        <template v-else>
          <view class="u-image__icon">
            <uni-icons type="info" color="inherit" size="inherit" />
          </view>
          <text class="u-image__error-text">加载失败</text>
        </template>
      </slot>
    </view>

    <!-- 图片 -->
    <image
      v-show="!loading && !error"
      :key="retryKey"
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
definePage({
  meta: {
    isComponent: true,
  },
});

import { ref, computed, watch } from 'vue';

defineOptions({
  name: 'UImage',
});

/** 图片裁剪模式类型 */
export type ImageMode =
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

export interface Props {
  /** 图片地址 */
  src: string;
  /** 图片宽度 */
  width?: string | number;
  /** 图片高度 */
  height?: string | number;
  /** 图片裁剪模式 */
  mode?: ImageMode;
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
  /** 占位图地址 */
  placeholder?: string;
  /** 错误时显示的图片地址 */
  errorImage?: string;
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
  placeholder: '',
  errorImage: '',
});

const emit = defineEmits<{
  load: [event: any];
  error: [event: any];
}>();

// 状态
const loading = ref(props.showLoading);
const error = ref(false);
const retryKey = ref(0); // 用于强制重新加载图片

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
  (newSrc, oldSrc) => {
    // 仅当 src 实际变化时重置状态（排除初始化时 undefined -> value 的情况由 image 组件自行处理）
    if (newSrc && newSrc !== oldSrc) {
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
    retryKey.value++; // 强制重新渲染图片组件
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
    gap: var(--spacing-xs);
  }

  &__placeholder,
  &__error-img {
    width: 100%;
    height: 100%;
  }

  &__icon {
    color: var(--color-text-placeholder);
    font-size: var(--font-size-xl);
  }

  &__error-text {
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }
}
</style>
