<template>
  <!--
    UEmpty - 空状态组件
    用于列表、搜索无结果等场景的空状态展示
  -->
  <view class="u-empty">
    <view class="u-empty__icon">
      <slot name="icon">
        <uni-icons :type="iconType" size="128rpx" color="var(--color-text-placeholder)" />
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
  /** 自定义图标 (uni-icons 的 type) */
  icon?: UniIconsType;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'default',
  text: '暂无数据',
  icon: undefined,
});

const iconMap: Record<NonNullable<Props['type']>, UniIconsType> = {
  default: 'image',
  search: 'search',
  network: 'refresh',
  error: 'info',
  cart: 'cart',
  message: 'email',
};

const iconType = computed(() => {
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
  width: 100%;
  padding: var(--spacing-xxl) var(--spacing-lg);

  &__icon {
    margin-bottom: var(--spacing-base);
  }

  &__text {
    color: var(--color-text-secondary);
    font-size: var(--font-size-base);
    line-height: 1.5;
    text-align: center;
  }

  // 操作区占满宽度并居中内容，撑满的按钮可以铺满，小按钮保持居中
  &__action {
    display: flex;
    align-self: stretch;
    justify-content: center;
    margin-top: var(--spacing-lg);
  }
}
</style>
