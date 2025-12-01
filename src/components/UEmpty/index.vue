<template>
  <view class="u-empty">
    <view class="u-empty__icon">
      <slot name="icon">
        <text :class="iconClass" />
      </slot>
    </view>

    <text class="u-empty__text">{{ text }}</text>

    <view v-if="$slots.default" class="u-empty__action">
      <slot />
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export interface Props {
  /** 类型 */
  type?: 'default' | 'search' | 'network' | 'error' | 'cart' | 'message';
  /** 描述文字 */
  text?: string;
  /** 自定义图标类名 */
  icon?: string;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'default',
  text: '暂无数据',
  icon: '',
});

const iconMap: Record<string, string> = {
  default: 'i-carbon-no-image',
  search: 'i-carbon-search',
  network: 'i-carbon-wifi-off',
  error: 'i-carbon-warning-alt',
  cart: 'i-carbon-shopping-cart',
  message: 'i-carbon-email',
};

const iconClass = computed(() => {
  return props.icon || iconMap[props.type] || iconMap.default;
});
</script>

<style scoped lang="scss">
.u-empty {
  display: flex;
  box-sizing: border-box;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64rpx 32rpx;

  &__icon {
    margin-bottom: 24rpx;
    color: $uni-text-color-placeholder;
    font-size: 128rpx;
  }

  &__text {
    color: $uni-text-color-secondary;
    font-size: 28rpx;
    line-height: 1.5;
    text-align: center;
  }

  &__action {
    margin-top: 32rpx;
  }
}
</style>
