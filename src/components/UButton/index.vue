<template>
  <!--
    UButton - 按钮组件
    统一按钮类型、尺寸、加载与禁用状态，支持小程序 open-type 能力
  -->
  <button
    class="u-button"
    :class="[
      `u-button--${type}`,
      `u-button--${size}`,
      { 'u-button--plain': plain, 'u-button--block': block, 'u-button--disabled': disabled || loading },
    ]"
    :loading="loading"
    :disabled="disabled || loading"
    :open-type="openType"
    hover-class="u-button--hover"
    @click="handleClick"
    @getphonenumber="emit('getphonenumber', $event)"
    @chooseavatar="emit('chooseavatar', $event)"
    @contact="emit('contact', $event)"
  >
    <slot>{{ text }}</slot>
  </button>
</template>

<script setup lang="ts">
definePage({
  meta: {
    isComponent: true,
  },
});

defineOptions({
  name: 'UButton',
  options: {
    virtualHost: true,
  },
});

export type ButtonType = 'primary' | 'default' | 'danger' | 'text';
export type ButtonSize = 'large' | 'medium' | 'small';

export interface UButtonProps {
  /** 按钮文字，传入默认插槽时忽略 */
  text?: string;
  /** 类型：primary 主色 | default 默认 | danger 危险 | text 文字 */
  type?: ButtonType;
  /** 尺寸：large 96rpx | medium 80rpx | small 60rpx */
  size?: ButtonSize;
  /** 镂空样式：白底、彩色文字与边框 */
  plain?: boolean;
  /** 宽度撑满父容器 */
  block?: boolean;
  /** 加载中，显示加载图标并禁止点击 */
  loading?: boolean;
  /** 禁用 */
  disabled?: boolean;
  /** 小程序开放能力，如 getPhoneNumber、chooseAvatar、contact */
  openType?: UniHelper.ButtonOpenType;
}

const props = withDefaults(defineProps<UButtonProps>(), {
  text: '',
  type: 'default',
  size: 'large',
  plain: false,
  block: false,
  loading: false,
  disabled: false,
  openType: undefined,
});

const emit = defineEmits<{
  click: [event: unknown];
  getphonenumber: [event: unknown];
  chooseavatar: [event: unknown];
  contact: [event: unknown];
}>();

function handleClick(event: unknown) {
  if (props.disabled || props.loading) return;
  emit('click', event);
}
</script>

<style scoped lang="scss">
.u-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0 var(--spacing-lg);
  border: var(--border-width-base) solid transparent;
  border-radius: var(--radius-lg);
  font-weight: 500;
  white-space: nowrap;

  &::after {
    display: none;
  }

  // 尺寸
  &--large {
    height: 96rpx;
    font-size: var(--font-size-lg);
    line-height: 96rpx;
  }

  &--medium {
    height: 80rpx;
    font-size: var(--font-size-base);
    line-height: 80rpx;
  }

  &--small {
    height: 60rpx;
    padding: 0 var(--spacing-base);
    border-radius: var(--radius-base);
    font-size: var(--font-size-sm);
    line-height: 60rpx;
  }

  &--block {
    display: flex;
    width: 100%;
  }

  // 类型，同时作用于 [disabled]，避免被小程序原生禁用样式覆盖为灰色
  &--primary,
  &--primary[disabled] {
    background: var(--color-primary);
    color: var(--color-text-inverse);
  }

  &--default,
  &--default[disabled] {
    border-color: var(--color-border);
    background: var(--color-bg);
    color: var(--color-text);
  }

  &--danger,
  &--danger[disabled] {
    background: var(--color-error);
    color: var(--color-text-inverse);
  }

  &--text,
  &--text[disabled] {
    background: transparent;
    color: var(--color-primary);
  }

  // 镂空
  &--plain,
  &--plain[disabled] {
    background: var(--color-bg);

    &.u-button--primary {
      border-color: var(--color-primary);
      color: var(--color-primary);
    }

    &.u-button--danger {
      border-color: var(--color-error);
      color: var(--color-error);
    }
  }

  &--hover {
    opacity: var(--opacity-hover);
  }

  &--disabled,
  &[disabled] {
    opacity: var(--opacity-disabled);
  }
}
</style>
