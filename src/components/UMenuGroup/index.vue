<route lang="json5">
{
  meta: {
    isComponent: true,
  },
}
</route>

<template>
  <!--
    UMenuGroup - 基于 uni-list 的菜单分组组件
    封装 uni-list，提供分组标题和统一样式
  -->
  <view class="u-menu-group">
    <view v-if="title" class="u-menu-group__title">{{ title }}</view>
    <uni-list :border="border" class="u-menu-group__list">
      <slot />
    </uni-list>
  </view>
</template>

<script setup lang="ts">
defineOptions({
  name: 'UMenuGroup',
});

interface Props {
  /** 分组标题 */
  title?: string;
  /** 是否显示边框 */
  border?: boolean;
}

withDefaults(defineProps<Props>(), {
  title: '',
  border: true,
});
</script>

<style scoped lang="scss">
.u-menu-group {
  &__title {
    margin-bottom: 16rpx;
    padding-left: 8rpx;
    color: var(--color-text-secondary);
    font-size: 26rpx;
  }

  &__list {
    overflow: hidden;
    border-radius: $uni-border-radius-lg;
    background: var(--color-bg);
    box-shadow: var(--shadow-sm);
  }
}
</style>
