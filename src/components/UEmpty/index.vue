<template>
  <!--
    UEmpty - 空状态组件
    用于列表、搜索无结果等场景的空状态展示
  -->
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
definePage({
  meta: {
    isComponent: true,
  },
});

import { computed } from 'vue';

defineOptions({
  name: 'UEmpty',
});

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
  padding: var(--spacing-xxl) var(--spacing-lg);

  &__icon {
    margin-bottom: var(--spacing-base);
    color: var(--color-text-placeholder);
    font-size: 128rpx;
  }

  &__text {
    color: var(--color-text-secondary);
    font-size: var(--font-size-base);
    line-height: 1.5;
    text-align: center;
  }

  &__action {
    margin-top: var(--spacing-lg);
  }
}
</style>
