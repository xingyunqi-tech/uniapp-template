<template>
  <!-- UCheckboxGroup - 多选框组，v-model 绑定选中值数组 -->
  <view class="u-checkbox-group" :class="`u-checkbox-group--${direction}`">
    <view
      v-for="option in options"
      :key="option.value"
      class="u-checkbox-group__item"
      :class="{
        'u-checkbox-group__item--checked': isChecked(option.value),
        'u-checkbox-group__item--disabled': isOptionDisabled(option),
      }"
      @click="toggle(option)"
    >
      <view class="u-checkbox-group__icon" :class="`u-checkbox-group__icon--${shape}`">
        <UIcon v-if="isChecked(option.value)" name="checkmarkempty" size="28rpx" color="var(--color-text-inverse)" />
      </view>
      <text class="u-checkbox-group__label">{{ option.label }}</text>
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
  name: 'UCheckboxGroup',
  options: {
    virtualHost: true,
  },
});

export type CheckboxValue = string | number;

export interface CheckboxOption {
  /** 显示文字 */
  label: string;
  /** 选项值 */
  value: CheckboxValue;
  /** 是否禁用 */
  disabled?: boolean;
}

export interface UCheckboxGroupProps {
  /** 选中值数组，支持 v-model */
  modelValue?: CheckboxValue[];
  /** 选项列表 */
  options: CheckboxOption[];
  /** 是否整体禁用 */
  disabled?: boolean;
  /** 排列方向 */
  direction?: 'horizontal' | 'vertical';
  /** 最多可选数量，0 不限制 */
  max?: number;
  /** 勾选框形状 */
  shape?: 'circle' | 'square';
}

const props = withDefaults(defineProps<UCheckboxGroupProps>(), {
  modelValue: () => [],
  disabled: false,
  direction: 'horizontal',
  max: 0,
  shape: 'square',
});

const emit = defineEmits<{
  'update:modelValue': [value: CheckboxValue[]];
  change: [value: CheckboxValue[]];
}>();

const reachedMax = computed(() => props.max > 0 && props.modelValue.length >= props.max);

function isChecked(value: CheckboxValue) {
  return props.modelValue.includes(value);
}

function isOptionDisabled(option: CheckboxOption) {
  return props.disabled || !!option.disabled || (reachedMax.value && !isChecked(option.value));
}

function toggle(option: CheckboxOption) {
  if (isOptionDisabled(option)) return;
  const value = isChecked(option.value)
    ? props.modelValue.filter(item => item !== option.value)
    : [...props.modelValue, option.value];
  emit('update:modelValue', value);
  emit('change', value);
}
</script>

<style scoped lang="scss">
.u-checkbox-group {
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
    background-color: var(--color-primary);
  }

  &__label {
    color: var(--color-text);
    font-size: var(--font-size-base);
    line-height: 1.5;
  }
}
</style>
