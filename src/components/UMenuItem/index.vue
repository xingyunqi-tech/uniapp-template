<route lang="json5">
{
  meta: {
    isComponent: true,
  },
}
</route>

<template>
  <component
    :is="isLink ? 'view' : 'button'"
    class="u-menu-item"
    :class="{
      'u-menu-item--clickable': clickable || isLink,
      'u-menu-item--border': border,
      'u-menu-item--danger': danger,
      'u-menu-item--contact': isContact,
    }"
    :open-type="isContact ? 'contact' : undefined"
    @click="handleClick"
  >
    <!-- 左侧图标 -->
    <text v-if="icon" class="u-menu-item__icon" :class="icon" />
    <slot v-else name="icon" />

    <!-- 标题区域 -->
    <view class="u-menu-item__content">
      <text class="u-menu-item__title">{{ title }}</text>
      <text v-if="label" class="u-menu-item__label">{{ label }}</text>
    </view>

    <!-- 右侧内容 -->
    <view class="u-menu-item__value">
      <slot name="value">
        <text v-if="value" class="u-menu-item__value-text">{{ value }}</text>
      </slot>
    </view>

    <!-- 右侧箭头 -->
    <text v-if="isLink || showArrow" class="i-carbon-chevron-right u-menu-item__arrow" />
    <slot name="right-icon" />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  /** 左侧图标类名 */
  icon?: string;
  /** 标题 */
  title: string;
  /** 标题下方描述 */
  label?: string;
  /** 右侧值 */
  value?: string | number;
  /** 是否显示下边框 */
  border?: boolean;
  /** 是否可点击 */
  clickable?: boolean;
  /** 是否显示右侧箭头 */
  showArrow?: boolean;
  /** 点击跳转链接 */
  to?: string;
  /** 是否为危险操作（红色） */
  danger?: boolean;
  /** 是否为微信客服按钮 */
  isContact?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  border: true,
  clickable: false,
  showArrow: false,
  danger: false,
  isContact: false,
});

const emit = defineEmits<{
  click: [event: Event];
}>();

// 是否为链接
const isLink = computed(() => !!props.to);

// 点击处理
function handleClick(event: Event) {
  if (props.to) {
    uni.navigateTo({ url: props.to });
  }
  emit('click', event);
}
</script>

<style scoped lang="scss">
.u-menu-item {
  display: flex;
  position: relative;
  box-sizing: border-box;
  align-items: center;
  width: 100%;

  // 重置 button 样式
  margin: 0;
  padding: 32rpx;
  border: none;
  border-radius: 0;
  background: transparent;
  font-size: inherit;
  line-height: inherit;
  text-align: left;
  gap: 24rpx;

  &::after {
    display: none;
  }

  &--border:not(:last-child)::before {
    content: '';
    position: absolute;
    right: 0;
    bottom: 0;
    left: 32rpx;
    height: 1px;
    background: $uni-border-color-light;
  }

  &--clickable {
    transition: background $uni-duration-fast;

    &:active {
      background: $uni-bg-color-hover;
    }
  }

  &--danger {
    .u-menu-item__icon,
    .u-menu-item__title {
      color: $uni-color-error;
    }
  }

  &--contact {
    // 微信客服按钮特殊样式
  }

  &__icon {
    flex-shrink: 0;
    color: $uni-color-primary;
    font-size: 40rpx;
  }

  &__content {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 4rpx;
    min-width: 0;
  }

  &__title {
    color: $uni-text-color;
    font-size: 30rpx;
    line-height: 1.4;
  }

  &__label {
    color: $uni-text-color-secondary;
    font-size: 24rpx;
    line-height: 1.4;
  }

  &__value {
    display: flex;
    flex-shrink: 0;
    gap: 8rpx;
    align-items: center;
  }

  &__value-text {
    color: $uni-text-color-secondary;
    font-size: 26rpx;
  }

  &__arrow {
    flex-shrink: 0;
    color: $uni-text-color-secondary;
    font-size: 28rpx;
  }
}
</style>
