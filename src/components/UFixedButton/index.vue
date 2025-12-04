<template>
  <view class="u-fixed-button">
    <button :class="['u-fixed-btn', type]" :disabled="disabled || loading" @click="handleClick">
      <slot>
        {{ loading ? loadingText : text }}
      </slot>
    </button>
  </view>
</template>

<script setup lang="ts">
defineOptions({
  name: 'UFixedButton',
});

withDefaults(
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
  emit('click');
}
</script>

<style scoped lang="scss">
.u-fixed-button {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 24rpx;
  padding-bottom: calc(24rpx + $uni-safe-area-inset-bottom);
  background: $uni-bg-color;
  box-shadow: 0 -4rpx 16rpx rgb(0 0 0 / 0.05);

  .u-fixed-btn {
    width: 100%;
    height: 96rpx;
    border: none;
    border-radius: $uni-border-radius-lg;
    color: #fff;
    font-size: 32rpx;
    line-height: 96rpx;

    &::after {
      display: none;
    }

    &.primary {
      background: $uni-color-primary;
    }

    &.danger {
      background: $uni-color-error;
    }

    &.default {
      border: 1px solid $uni-border-color;
      background: $uni-bg-color;
      color: $uni-text-color;
    }

    &[disabled] {
      opacity: 0.6;
    }

    &:active:not([disabled]) {
      opacity: 0.8;
    }
  }
}
</style>
