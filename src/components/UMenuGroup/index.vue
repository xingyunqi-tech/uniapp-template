<route lang="json5">
{
  meta: {
    isComponent: true,
  },
}
</route>

<template>
  <view class="u-menu-group">
    <view v-if="title" class="u-menu-group__title">{{ title }}</view>
    <view class="u-menu-group__content">
      <slot />
    </view>
  </view>
</template>

<script setup lang="ts">
interface Props {
  /** 分组标题 */
  title?: string;
}

defineProps<Props>();
</script>

<style scoped lang="scss">
.u-menu-group {
  &__title {
    margin-bottom: 16rpx;
    padding-left: 8rpx;
    color: $uni-text-color-secondary;
    font-size: 26rpx;
  }

  &__content {
    overflow: hidden;
    border-radius: $uni-border-radius-lg;
    background: $uni-bg-color;
    box-shadow: $uni-shadow-sm;
  }
}
</style>
