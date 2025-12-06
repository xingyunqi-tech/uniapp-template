<route lang="json5">
{
  meta: {
    isComponent: true,
  },
}
</route>

<template>
  <!--
    UNoticeBar - 基于 uni-notice-bar 的通知公告栏组件
    封装 uni-notice-bar，提供简化 API 和统一样式
  -->
  <uni-notice-bar
    v-if="visible"
    :text="text"
    :speed="speed"
    :scrollable="scrollable"
    :single="single"
    :show-icon="showIcon"
    :show-get-more="showMore"
    :show-close="showClose"
    :background-color="backgroundColor"
    :color="textColor"
    :more-color="moreColor"
    class="u-notice-bar"
    :class="themeClass"
    @click="handleClick"
    @close="handleClose"
    @get-more="handleGetMore"
  >
    <template v-if="$slots.default" #default>
      <slot />
    </template>
  </uni-notice-bar>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

defineOptions({
  name: 'UNoticeBar',
});

// ==================== Types ====================

export type NoticeBarType = 'default' | 'info' | 'success' | 'warning' | 'error';

// ==================== Props ====================

interface Props {
  /** 通知文本 */
  text?: string;
  /** 通知类型 */
  type?: NoticeBarType;
  /** 滚动速度 (px/s) */
  speed?: number;
  /** 是否滚动 */
  scrollable?: boolean;
  /** 是否单行显示 */
  single?: boolean;
  /** 是否显示左侧图标 */
  showIcon?: boolean;
  /** 是否显示关闭按钮 */
  showClose?: boolean;
  /** 是否显示查看更多 */
  showMore?: boolean;
  /** 查看更多文字颜色 */
  moreColor?: string;
}

const props = withDefaults(defineProps<Props>(), {
  text: '',
  type: 'default',
  speed: 100,
  scrollable: false,
  single: true,
  showIcon: true,
  showClose: false,
  showMore: false,
  moreColor: '',
});

// ==================== Emits ====================

const emit = defineEmits<{
  click: [];
  close: [];
  more: [];
}>();

// ==================== State ====================

const visible = ref(true);

// ==================== Computed ====================

/** 主题类名 */
const themeClass = computed(() => `u-notice-bar--${props.type}`);

/** 根据类型计算背景色 */
const backgroundColor = computed(() => {
  const colorMap: Record<NoticeBarType, string> = {
    default: 'var(--color-warning-bg)',
    info: 'var(--color-primary-bg)',
    success: 'var(--color-success-bg)',
    warning: 'var(--color-warning-bg)',
    error: 'var(--color-error-bg)',
  };
  return colorMap[props.type];
});

/** 根据类型计算文字颜色 */
const textColor = computed(() => {
  const colorMap: Record<NoticeBarType, string> = {
    default: 'var(--color-warning)',
    info: 'var(--color-primary)',
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    error: 'var(--color-error)',
  };
  return colorMap[props.type];
});

// ==================== Methods ====================

function handleClick() {
  emit('click');
}

function handleClose() {
  visible.value = false;
  emit('close');
}

function handleGetMore() {
  emit('more');
}

/** 重新显示通知栏 */
function show() {
  visible.value = true;
}

/** 隐藏通知栏 */
function hide() {
  visible.value = false;
}

// ==================== Expose ====================

defineExpose({
  show,
  hide,
});
</script>

<style scoped lang="scss">
.u-notice-bar {
  border-radius: var(--radius-base);

  // 覆盖 uni-notice-bar 默认样式
  :deep(.uni-noticebar) {
    border-radius: var(--radius-base);
  }

  :deep(.uni-noticebar-icon) {
    font-size: 32rpx;
  }

  :deep(.uni-noticebar__content-text) {
    font-size: 26rpx;
  }

  // 类型变体样式
  &--info {
    :deep(.uni-noticebar-icon) {
      color: var(--color-primary);
    }
  }

  &--success {
    :deep(.uni-noticebar-icon) {
      color: var(--color-success);
    }
  }

  &--warning {
    :deep(.uni-noticebar-icon) {
      color: var(--color-warning);
    }
  }

  &--error {
    :deep(.uni-noticebar-icon) {
      color: var(--color-error);
    }
  }
}
</style>
