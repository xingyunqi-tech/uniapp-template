<template>
  <!--
    UCard - 卡片容器
    统一卡片背景、圆角、阴影与内边距，可选标题栏
  -->
  <view
    class="u-card"
    :class="{ 'u-card--flush': !padding, 'u-card--flat': !shadow }"
    :hover-class="clickable ? 'u-card--hover' : 'none'"
    @click="emit('click', $event)"
  >
    <view v-if="title || extra || $slots.extra" class="u-card__header">
      <text class="u-card__title">{{ title }}</text>
      <view v-if="$slots.extra" class="u-card__extra">
        <slot name="extra" />
      </view>
      <text v-else-if="extra" class="u-card__extra">{{ extra }}</text>
    </view>
    <slot />
  </view>
</template>

<script setup lang="ts">
definePage({
  meta: {
    isComponent: true,
  },
});

defineOptions({
  name: 'UCard',
  options: {
    virtualHost: true,
  },
});

export interface UCardProps {
  /** 标题 */
  title?: string;
  /** 标题栏右侧文字，传入 extra 插槽时忽略 */
  extra?: string;
  /** 是否有内边距，列表类内容自带内边距时关闭 */
  padding?: boolean;
  /** 是否显示阴影 */
  shadow?: boolean;
  /** 点击时显示按下态 */
  clickable?: boolean;
}

withDefaults(defineProps<UCardProps>(), {
  title: '',
  extra: '',
  padding: true,
  shadow: true,
  clickable: false,
});

const emit = defineEmits<{
  click: [event: unknown];
}>();
</script>

<style scoped lang="scss">
.u-card {
  box-sizing: border-box;
  padding: var(--spacing-base);
  overflow: hidden;
  border-radius: var(--radius-lg);
  background: var(--color-bg-card);
  box-shadow: var(--shadow-sm);

  &--flush {
    padding: 0;
  }

  &--flat {
    box-shadow: none;
  }

  &--hover {
    opacity: var(--opacity-hover);
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-base);
  }

  &--flush &__header {
    padding: var(--spacing-base) var(--spacing-base) 0;
  }

  &__title {
    color: var(--color-text);
    font-size: var(--font-size-base);
    font-weight: 600;
  }

  &__extra {
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }
}
</style>
