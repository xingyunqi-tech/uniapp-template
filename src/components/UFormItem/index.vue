<route lang="json5">
{
  meta: {
    isComponent: true,
  },
}
</route>

<template>
  <view class="u-form-item" :class="{ 'u-form-item--border': border, 'u-form-item--required': required }">
    <text class="u-form-item__label">{{ label }}</text>
    <view class="u-form-item__content">
      <slot>
        <!-- 默认插槽用于自定义内容 -->
      </slot>
    </view>
    <!-- 右侧箭头（用于 picker 等场景） -->
    <text v-if="showArrow" class="i-carbon-chevron-right u-form-item__arrow" />
  </view>
</template>

<script setup lang="ts">
interface Props {
  /** 表单项标签 */
  label: string;
  /** 是否显示下边框 */
  border?: boolean;
  /** 是否必填 */
  required?: boolean;
  /** 是否显示右侧箭头 */
  showArrow?: boolean;
}

withDefaults(defineProps<Props>(), {
  border: true,
  required: false,
  showArrow: false,
});
</script>

<style scoped lang="scss">
.u-form-item {
  display: flex;
  position: relative;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;

  &--border:not(:last-child)::after {
    content: '';
    position: absolute;
    right: 0;
    bottom: 0;
    left: 32rpx;
    height: 1px;
    background: var(--color-border-light);
  }

  &--required {
    .u-form-item__label::before {
      content: '*';
      margin-right: 8rpx;
      color: var(--color-error);
    }
  }

  &__label {
    flex-shrink: 0;
    width: 160rpx;
    color: var(--color-text);
    font-size: 30rpx;
  }

  &__content {
    display: flex;
    flex: 1;
    gap: 8rpx;
    align-items: center;
    justify-content: flex-end;
    min-width: 0;
    color: var(--color-text);
    font-size: 30rpx;
    text-align: right;

    // 输入框样式
    :deep(input),
    :deep(textarea) {
      flex: 1;
      color: var(--color-text);
      font-size: 30rpx;
      text-align: right;
    }

    // 占位符样式
    :deep(.input-placeholder),
    :deep(.textarea-placeholder) {
      color: var(--color-text-placeholder);
    }

    // 禁用状态
    &.disabled {
      color: var(--color-text-secondary);
    }
  }

  &__arrow {
    flex-shrink: 0;
    margin-left: 8rpx;
    color: var(--color-text-secondary);
    font-size: 28rpx;
  }
}
</style>
