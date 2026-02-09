<template>
  <!--
    UFixedButton - 固定底部按钮组件
    用于表单提交、确认操作等场景
  -->
  <view class="u-fixed-button">
    <button
      :class="['u-fixed-btn', type, { 'button-disabled': disabled || loading }]"
      :disabled="disabled || loading"
      @click="handleClick"
    >
      <slot>
        {{ loading ? loadingText : text }}
      </slot>
    </button>
  </view>
</template>

<script setup lang="ts">
definePage({
  meta: {
    isComponent: true,
  },
});

defineOptions({
  name: 'UFixedButton',
});

const props = withDefaults(
  defineProps<{
    /** 按钮文字 */
    text?: string;
    /** 加载中文字 */
    loadingText?: string;
    /** 是否加载中 */
    loading?: boolean;
    /** 是否禁用 */
    disabled?: boolean;
    /** 按钮类型 */
    type?: 'primary' | 'danger' | 'default';
  }>(),
  {
    text: '确定',
    loadingText: '提交中...',
    loading: false,
    disabled: false,
    type: 'primary',
  },
);

const emit = defineEmits<{
  click: [];
}>();

function handleClick() {
  if (props.disabled || props.loading) return;
  emit('click');
}
</script>

<style scoped lang="scss">
.u-fixed-button {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  padding: var(--spacing-base);
  padding-bottom: calc(var(--spacing-base) + var(--safe-area-inset-bottom));
  background: var(--color-bg);
  box-shadow: var(--shadow-light);

  .u-fixed-btn {
    width: 100%;
    height: 96rpx;
    border: none;
    border-radius: var(--radius-lg);
    color: var(--color-text-inverse);
    font-size: var(--font-size-lg);
    line-height: 96rpx;

    &::after {
      display: none;
    }

    &.primary {
      background: var(--color-primary);
    }

    &.danger {
      background: var(--color-error);
    }

    &.default {
      border: var(--border-width-base) solid var(--color-border);
      background: var(--color-bg);
      color: var(--color-text);
    }
  }

  .u-fixed-btn.button-disabled {
    opacity: var(--opacity-disabled);
  }

  .u-fixed-btn:active {
    opacity: var(--opacity-hover);
  }

  .u-fixed-btn.button-disabled:active {
    opacity: var(--opacity-disabled);
  }
}
</style>
