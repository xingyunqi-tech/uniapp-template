<template>
  <!-- URadioGroup - 单选框组，v-model 绑定选中值 -->
  <view class="u-radio-group" :class="`u-radio-group--${direction}`">
    <view
      v-for="option in options"
      :key="option.value"
      class="u-radio-group__item"
      :class="{
        'u-radio-group__item--checked': option.value === modelValue,
        'u-radio-group__item--disabled': disabled || option.disabled,
      }"
      @click="select(option)"
    >
      <view class="u-radio-group__icon" :class="`u-radio-group__icon--${shape}`">
        <view v-if="option.value === modelValue" class="u-radio-group__dot" />
      </view>
      <text class="u-radio-group__label">{{ option.label }}</text>
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
  name: 'URadioGroup',
  options: {
    virtualHost: true,
  },
});

export type RadioValue = string | number;

export interface RadioOption {
  /** 显示文字 */
  label: string;
  /** 选项值 */
  value: RadioValue;
  /** 是否禁用 */
  disabled?: boolean;
}

export interface URadioGroupProps {
  /** 选中值，支持 v-model */
  modelValue?: RadioValue;
  /** 选项列表 */
  options: RadioOption[];
  /** 是否整体禁用 */
  disabled?: boolean;
  /** 排列方向 */
  direction?: 'horizontal' | 'vertical';
  /** 选择框形状 */
  shape?: 'circle' | 'square';
}

const props = withDefaults(defineProps<URadioGroupProps>(), {
  modelValue: undefined,
  disabled: false,
  direction: 'horizontal',
  shape: 'circle',
});

const emit = defineEmits<{
  'update:modelValue': [value: RadioValue];
  change: [value: RadioValue];
}>();

function select(option: RadioOption) {
  if (props.disabled || option.disabled || option.value === props.modelValue) return;
  emit('update:modelValue', option.value);
  emit('change', option.value);
}
</script>

<style scoped lang="scss">
.u-radio-group {
  display: flex;
  flex: 1;
  min-width: 0;

  &--horizontal {
    flex-flow: row wrap;
    gap: var(--spacing-sm) var(--spacing-lg);
  }

  &--vertical {
    flex-direction: column;
    gap: var(--spacing-base);
  }

  &__item {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);

    &--disabled {
      opacity: var(--opacity-disabled);
    }
  }

  &__icon {
    display: flex;
    box-sizing: border-box;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 36rpx;
    height: 36rpx;
    border: var(--border-width-bold) solid var(--color-border-dark);
    background-color: var(--color-bg);

    &--square {
      border-radius: var(--radius-base);
    }

    &--circle {
      border-radius: var(--radius-circle);
    }
  }

  &__item--checked &__icon {
    border-color: var(--color-primary);
  }

  &__dot {
    width: 18rpx;
    height: 18rpx;
    background-color: var(--color-primary);
  }

  &__icon--square &__dot {
    border-radius: var(--radius-sm);
  }

  &__icon--circle &__dot {
    border-radius: var(--radius-circle);
  }

  &__label {
    color: var(--color-text);
    font-size: var(--font-size-base);
    line-height: 1.5;
  }
}
</style>
