<template>
  <!--
    UImage - 图片组件
    封装懒加载、错误处理、重试等功能
  -->
  <view class="u-image" :class="imageClasses" :style="imageStyle">
    <!-- 加载中状态 -->
    <view v-if="loading" class="u-image__loading">
      <slot name="loading">
        <!-- 有占位图时显示占位图 -->
        <image v-if="placeholder" class="u-image__placeholder" :src="placeholder" :mode="mode" />
        <!-- 无占位图时显示图标 -->
        <view v-else class="u-image__icon">
          <UIcon name="image" />
        </view>
      </slot>
    </view>

    <!-- 加载失败状态 -->
    <view v-else-if="error && showError" class="u-image__error" @click="handleRetry">
      <slot name="error">
        <!-- 有错误图时显示错误图 -->
        <image v-if="errorImage" class="u-image__error-img" :src="errorImage" :mode="mode" />
        <!-- 无错误图时显示图标 -->
        <template v-else>
          <view class="u-image__icon">
            <UIcon name="info" />
          </view>
          <text class="u-image__error-text">加载失败</text>
        </template>
      </slot>
    </view>

    <!-- 图片 -->
    <image
      v-if="src"
      :key="retryKey"
      class="u-image__img"
      :class="{ 'u-image__img--pending': loading || error }"
      :src="src"
      :mode="mode"
      :lazy-load="lazyLoad"
      :fade-show="fadeShow"
      :webp="webp"
      @load="handleLoad"
      @error="handleError"
      @click="handlePreview"
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
  options: {
    virtualHost: true,
  },
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
  /** 点击是否预览大图 */
  preview?: boolean;
  /** 预览时可左右切换的图片列表，默认只预览当前图片 */
  previewUrls?: string[];
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
  preview: false,
  previewUrls: () => [],
});

const emit = defineEmits<{
  load: [event: any];
  error: [event: any];
}>();

// 状态
const loading = ref(props.showLoading && !!props.src);
const error = ref(!props.src);
const retryKey = ref(0); // 用于强制重新加载图片

/** 高度自适应且处于加载态或失败态 */
const isStatePlaceholder = computed(
  () => props.height === 'auto' && (loading.value || (error.value && props.showError)),
);

const imageClasses = computed(() => ({
  'u-image--round': props.round,
  'u-image--state': isStatePlaceholder.value,
}));

// 计算样式
const imageStyle = computed(() => {
  const width = typeof props.width === 'number' ? `${props.width}rpx` : props.width;
  const height = typeof props.height === 'number' ? `${props.height}rpx` : props.height;
  const radius = props.round ? '50%' : typeof props.radius === 'number' ? `${props.radius}rpx` : props.radius;

  // 固定宽度时占位为正方形，百分比或 auto 宽度使用样式中的默认高度
  const fixedWidth = !/%$|^auto$/.test(width);

  return {
    width,
    height,
    borderRadius: radius,
    ...(isStatePlaceholder.value && fixedWidth ? { minHeight: width } : {}),
  };
});

watch(
  () => props.src,
  newSrc => {
    loading.value = props.showLoading && !!newSrc;
    error.value = !newSrc;
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

// 预览大图
function handlePreview() {
  if (!props.preview || !props.src || loading.value || error.value) return;
  uni.previewImage({
    urls: props.previewUrls.length > 0 ? props.previewUrls : [props.src],
    current: props.src,
  });
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

  /* 高度自适应且宽度为百分比时，加载态、失败态的占位高度 */
  &--state {
    min-height: 200rpx;
  }

  &__img {
    display: block;
    width: 100%;
    height: 100%;

    /* 加载中保留布局尺寸，lazy-load 才能判断进入视口 */
    &--pending {
      position: absolute;
      opacity: 0;
      inset: 0;
    }
  }

  &__loading,
  &__error {
    display: flex;
    position: absolute;
    z-index: 1;
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
