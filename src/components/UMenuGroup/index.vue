<template>
  <!--
    UMenuGroup - 菜单分组组件
    提供分组标题和统一样式容器
  -->
  <view class="u-menu-group">
    <view v-if="title" class="u-menu-group__title">{{ title }}</view>
    <view class="u-menu-group__list">
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

defineOptions({
  name: 'UMenuGroup',
});

interface Props {
  /** 分组标题 */
  title?: string;
}

withDefaults(defineProps<Props>(), {
  title: '',
});
</script>

<style scoped lang="scss">
.u-menu-group {
  &__title {
    margin-bottom: var(--spacing-sm);
    padding-left: var(--spacing-xs);
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }

  &__list {
    padding: 0 var(--spacing-base);
    overflow: hidden;
    border-radius: var(--radius-lg);
    background: var(--color-bg-card);
    box-shadow: var(--shadow-sm);
  }
}
</style>
