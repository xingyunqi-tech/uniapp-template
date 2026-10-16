<template>
  <!--
    UTag - 标签组件
    用于标记、分类、状态展示
  -->
  <view
    class="u-tag"
    :class="[
      `u-tag--${type}`,
      `u-tag--${size}`,
      {
        'u-tag--plain': plain,
        'u-tag--round': round,
        'u-tag--closeable': closeable,
      },
    ]"
    :style="customStyle"
    @click="handleClick"
  >
    <!-- 左侧图标 -->
    <view v-if="icon" class="u-tag__icon">
      <UIcon :name="icon" />
    </view>

    <!-- 文本内容 -->
    <view class="u-tag__text">
      <slot>{{ text }}</slot>
    </view>

    <!-- 关闭按钮 -->
    <view v-if="closeable" class="u-tag__close" @click.stop="handleClose">
      <UIcon name="closeempty" />
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
import type { IconName } from '../UIcon/index.vue';

defineOptions({
  name: 'UTag',
});

// ==================== Types ====================

export type TagType = 'primary' | 'success' | 'warning' | 'error' | 'default' | 'info';
export type TagSize = 'small' | 'medium' | 'large';

// ==================== Props ====================

interface Props {
  /** 标签文本 */
  text?: string;
  /** 标签类型 */
  type?: TagType;
  /** 标签大小 */
  size?: TagSize;
  /** 是否镂空样式 */
  plain?: boolean;
  /** 是否圆角样式 */
  round?: boolean;
  /** 是否可关闭 */
  closeable?: boolean;
  /** 左侧图标 (uni-icons 的 type) */
  icon?: IconName;
  /** 自定义颜色 */
  color?: string;
  /** 自定义背景色 */
  bgColor?: string;
}

const props = withDefaults(defineProps<Props>(), {
  text: '',
  type: 'default',
  size: 'medium',
  plain: false,
  round: false,
  closeable: false,
  icon: undefined,
  color: '',
  bgColor: '',
});

// ==================== Emits ====================

const emit = defineEmits<{
  click: [];
  close: [];
}>();

// ==================== Computed ====================

const customStyle = computed(() => {
  const style: Record<string, string> = {};
  if (props.color) {
    style.color = props.color;
    if (props.plain) {
      style.borderColor = props.color;
    }
  }
  if (props.bgColor && !props.plain) {
    style.backgroundColor = props.bgColor;
  }
  return style;
});

// ==================== Methods ====================

function handleClick() {
  emit('click');
}

function handleClose() {
  emit('close');
}
</script>

<style scoped lang="scss">
.u-tag {
  display: inline-flex;
  gap: var(--spacing-xs);
  align-items: center;
  border-radius: var(--radius-sm);

  // ==================== 尺寸 ====================

  &--small {
    padding: 2rpx var(--spacing-xs);

    .u-tag__text {
      font-size: var(--font-size-xs);
    }

    .u-tag__icon,
    .u-tag__close {
      font-size: var(--font-size-xs);
    }
  }

  &--medium {
    padding: 4rpx var(--spacing-sm);

    .u-tag__text {
      font-size: var(--font-size-sm);
    }

    .u-tag__icon,
    .u-tag__close {
      font-size: var(--font-size-sm);
    }
  }

  &--large {
    padding: var(--spacing-xs) var(--spacing-sm);

    .u-tag__text {
      font-size: var(--font-size-base);
    }

    .u-tag__icon,
    .u-tag__close {
      font-size: var(--font-size-base);
    }
  }

  // ==================== 类型 ====================

  &--default {
    background: var(--color-bg-grey);
    color: var(--color-text-secondary);

    &.u-tag--plain {
      border: var(--border-width-base) solid var(--color-border);
      background: transparent;
    }
  }

  &--primary {
    background: var(--color-primary);
    color: var(--color-text-inverse);

    &.u-tag--plain {
      border: var(--border-width-base) solid var(--color-primary);
      background: var(--color-primary-bg);
      color: var(--color-primary);
    }
  }

  &--success {
    background: var(--color-success);
    color: var(--color-text-inverse);

    &.u-tag--plain {
      border: var(--border-width-base) solid var(--color-success);
      background: var(--color-success-bg);
      color: var(--color-success);
    }
  }

  &--warning {
    background: var(--color-warning);
    color: var(--color-text-inverse);

    &.u-tag--plain {
      border: var(--border-width-base) solid var(--color-warning);
      background: var(--color-warning-bg);
      color: var(--color-warning);
    }
  }

  &--error {
    background: var(--color-error);
    color: var(--color-text-inverse);

    &.u-tag--plain {
      border: var(--border-width-base) solid var(--color-error);
      background: var(--color-error-bg);
      color: var(--color-error);
    }
  }

  &--info {
    background: var(--color-info);
    color: var(--color-text-inverse);

    &.u-tag--plain {
      border: var(--border-width-base) solid var(--color-info);
      background: var(--color-info-bg);
      color: var(--color-info);
    }
  }

  // ==================== 变体 ====================

  &--round {
    border-radius: var(--radius-full);
  }

  &--closeable {
    .u-tag__close {
      margin-left: var(--spacing-xs);
      cursor: pointer;

      &:active {
        opacity: var(--opacity-hover);
      }
    }
  }

  // ==================== 子元素 ====================

  &__text {
    display: flex;
    align-items: center;
    line-height: 1.2;
    white-space: nowrap;
  }

  &__icon {
    flex-shrink: 0;
  }

  &__close {
    flex-shrink: 0;
  }
}
</style>
