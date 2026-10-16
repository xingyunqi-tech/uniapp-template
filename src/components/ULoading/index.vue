<template>
  <!--
    ULoading - 加载动画组件
    支持命令式 API 和组件式调用，可全屏或局部显示
  -->
  <view v-if="isVisible" class="u-loading" :class="[`u-loading--${type}`, { 'u-loading--fullscreen': fullscreen }]">
    <!-- 全屏时遮罩拦截滑动，阻止背后页面滚动 -->
    <view
      v-if="fullscreen"
      class="u-loading__mask"
      :style="maskStyle"
      @click="handleMaskClick"
      @touchmove.stop.prevent
    />
    <view v-else class="u-loading__mask" :style="maskStyle" @click="handleMaskClick" />
    <view class="u-loading__content">
      <!-- 加载图标 -->
      <view class="u-loading__spinner" :class="`u-loading__spinner--${spinnerType}`" :style="spinnerStyle">
        <view v-if="spinnerType === 'circular'" class="u-loading__circular" />
        <view v-for="i in 12" v-else :key="i" class="u-loading__spinner-dot" />
      </view>
      <!-- 加载文字 -->
      <text v-if="displayText" class="u-loading__text" :style="textStyle">{{ displayText }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
definePage({
  meta: {
    isComponent: true,
  },
});

import { computed } from 'vue';
import type { CSSProperties } from 'vue';
import { useLoading } from '@/composables/useLoading';

/** Loading 类型 */
export type LoadingType = 'default' | 'primary';

/** 加载图标类型 */
export type SpinnerType = 'circular' | 'spinner';

/** Props 定义 */
export interface ULoadingProps {
  /** 是否显示（组件模式） */
  visible?: boolean;
  /** 加载类型 */
  type?: LoadingType;
  /** 加载图标类型 */
  spinnerType?: SpinnerType;
  /** 加载文字 */
  text?: string;
  /** 是否全屏，为 false 时覆盖最近的定位父元素 */
  fullscreen?: boolean;
  /** 图标颜色 */
  color?: string;
  /** 图标大小（rpx） */
  size?: number;
  /** 遮罩层背景色 */
  maskBackground?: string;
  /** 点击遮罩是否关闭 */
  closeOnClickMask?: boolean;
  /** 是否使用全局状态（命令式 API） */
  global?: boolean;
}

/** Emits 定义 */
export interface ULoadingEmits {
  (e: 'update:visible', value: boolean): void;
  (e: 'close'): void;
}

const props = withDefaults(defineProps<ULoadingProps>(), {
  visible: false,
  type: 'default',
  spinnerType: 'circular',
  text: '',
  fullscreen: true,
  color: '',
  size: 64,
  maskBackground: 'var(--color-bg-mask-light)',
  closeOnClickMask: false,
  global: false,
});

const emit = defineEmits<ULoadingEmits>();

// 全局状态
const { visible: globalVisible, text: globalText } = useLoading();

// 是否显示（支持 props 和全局状态两种模式）
const isVisible = computed(() => (props.global ? globalVisible.value : props.visible));

// 显示的文字
const displayText = computed(() => (props.global ? globalText.value : props.text));

/** 遮罩样式 */
const maskStyle = computed<CSSProperties>(() => ({
  backgroundColor: props.maskBackground,
}));

/** 图标样式 */
const spinnerStyle = computed<CSSProperties>(() => {
  const style: CSSProperties = {
    width: `${props.size}rpx`,
    height: `${props.size}rpx`,
  };
  if (props.color) {
    style['--u-loading-color'] = props.color;
  }
  return style;
});

/** 文字样式 */
const textStyle = computed<CSSProperties>(() => {
  const style: CSSProperties = {};
  if (props.color) {
    style.color = props.color;
  }
  return style;
});

/** 点击遮罩 */
function handleMaskClick() {
  if (props.closeOnClickMask) {
    emit('update:visible', false);
    emit('close');
  }
}
</script>

<style lang="scss" scoped>
.u-loading {
  display: flex;
  position: absolute;
  z-index: var(--z-index-loading);
  inset: 0;
  align-items: center;
  justify-content: center;

  &--fullscreen {
    position: fixed;

    .u-loading__content {
      pointer-events: none;
    }
  }

  &__mask {
    position: absolute;
    inset: 0;
  }

  &__content {
    display: flex;
    position: relative;
    z-index: 1;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-lg);
    border-radius: var(--radius-lg);
    background-color: var(--color-bg-mask);
  }

  &__spinner {
    position: relative;

    // 圆形加载
    &--circular {
      .u-loading__circular {
        width: 100%;
        height: 100%;
        animation: u-loading-rotate 0.8s linear infinite;
        border: 4rpx solid var(--color-overlay-medium);
        border-radius: 50%;
        border-top-color: var(--u-loading-color, var(--color-text-inverse));
      }
    }

    // 菊花加载
    &--spinner {
      .u-loading__spinner-dot {
        position: absolute;
        top: 0;
        left: 50%;
        width: 4rpx;
        height: 25%;
        margin-left: -2rpx;
        transform-origin: center bottom;
        animation: u-loading-fade 1s linear infinite;
        border-radius: 2rpx;
        background-color: var(--u-loading-color, var(--color-overlay-heavy));

        @for $i from 1 through 12 {
          &:nth-child(#{$i}) {
            transform: rotate(#{($i - 1) * 30}deg);
            animation-delay: #{($i - 1) * 0.083}s;
          }
        }
      }
    }
  }

  &__text {
    margin-top: var(--spacing-sm);
    color: var(--color-text-inverse);
    font-size: var(--font-size-base);
  }

  // 主色调
  &--primary {
    .u-loading__content {
      background-color: var(--color-primary);
    }
  }
}

@keyframes u-loading-rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

@keyframes u-loading-fade {
  0%,
  100% {
    opacity: 0.3;
  }

  50% {
    opacity: 1;
  }
}
</style>
