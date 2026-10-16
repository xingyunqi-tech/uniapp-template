<template>
  <!--
    UDivider - 分割线
    支持中间文字、文字位置与虚线
  -->
  <view class="u-divider" :class="dividerClasses">
    <template v-if="hasContent">
      <view class="u-divider__line u-divider__line--left" />
      <view class="u-divider__content">
        <slot>
          <text class="u-divider__text">{{ text }}</text>
        </slot>
      </view>
      <view class="u-divider__line u-divider__line--right" />
    </template>
    <view v-else class="u-divider__line" />
  </view>
</template>

<script setup lang="ts">
definePage({
  meta: {
    isComponent: true,
  },
});

import { computed, useSlots } from 'vue';

defineOptions({
  name: 'UDivider',
  options: {
    virtualHost: true,
  },
});

export type DividerAlign = 'left' | 'center' | 'right';

export interface UDividerProps {
  /** 中间文字，也可使用默认插槽 */
  text?: string;
  /** 文字位置 */
  align?: DividerAlign;
  /** 是否虚线 */
  dashed?: boolean;
  /** 是否保留上下外边距 */
  margin?: boolean;
}

const props = withDefaults(defineProps<UDividerProps>(), {
  text: '',
  align: 'center',
  dashed: false,
  margin: true,
});

const slots = useSlots();

const hasContent = computed(() => !!props.text || !!slots.default);

const dividerClasses = computed(() => [
  `u-divider--${props.align}`,
  {
    'u-divider--dashed': props.dashed,
    'u-divider--margin': props.margin,
  },
]);
</script>

<style scoped lang="scss">
.u-divider {
  display: flex;
  align-items: center;
  width: 100%;

  &--margin {
    margin: var(--spacing-base) 0;
  }

  &__line {
    flex: 1;
    height: 0;
    border-top: var(--border-width-base) solid var(--color-border);
  }

  &--dashed &__line {
    border-top-style: dashed;
  }

  &--left &__line--left,
  &--right &__line--right {
    flex: 0 0 var(--spacing-xl);
  }

  &__content {
    flex-shrink: 0;
    padding: 0 var(--spacing-sm);
  }

  &__text {
    color: var(--color-text-placeholder);
    font-size: var(--font-size-sm);
  }
}
</style>
