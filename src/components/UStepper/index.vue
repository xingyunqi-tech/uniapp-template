<template>
  <!-- UStepper - 步进器，加减按钮与数字输入，在 UFormItem 内失焦时触发表单校验 -->
  <view class="u-stepper" :class="{ 'u-stepper--disabled': disabled }">
    <view
      class="u-stepper__button u-stepper__button--minus"
      :class="{ 'u-stepper__button--disabled': minusDisabled }"
      @click="handleStep('minus')"
    />
    <input
      class="u-stepper__input"
      :type="integer ? 'number' : 'digit'"
      :value="inputText"
      :disabled="disabled || inputDisabled"
      @input="handleInput"
      @blur="handleBlur"
    />
    <view
      class="u-stepper__button u-stepper__button--plus"
      :class="{ 'u-stepper__button--disabled': plusDisabled }"
      @click="handleStep('plus')"
    />
  </view>
</template>

<script setup lang="ts">
definePage({
  meta: {
    isComponent: true,
  },
});

import { computed, inject, ref, watch } from 'vue';
import { U_FORM_ITEM_KEY, type UFormItemContext } from '../UForm/context';

defineOptions({
  name: 'UStepper',
  options: {
    virtualHost: true,
  },
});

export type StepperAction = 'minus' | 'plus';

export interface UStepperProps {
  /** 当前值，支持 v-model，不传时取 min */
  modelValue?: number;
  /** 最小值 */
  min?: number;
  /** 最大值 */
  max?: number;
  /** 步长 */
  step?: number;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否禁止手动输入 */
  inputDisabled?: boolean;
  /** 是否只允许整数 */
  integer?: boolean;
}

const props = withDefaults(defineProps<UStepperProps>(), {
  modelValue: undefined,
  min: 1,
  max: Number.POSITIVE_INFINITY,
  step: 1,
  disabled: false,
  inputDisabled: false,
  integer: true,
});

const emit = defineEmits<{
  'update:modelValue': [value: number];
  change: [value: number];
  overlimit: [action: StepperAction];
}>();

const formItem = inject<UFormItemContext | null>(U_FORM_ITEM_KEY, null);

const current = computed(() => props.modelValue ?? props.min);
const inputText = ref(String(current.value));

const minusDisabled = computed(() => props.disabled || current.value <= props.min);
const plusDisabled = computed(() => props.disabled || current.value >= props.max);

watch(current, value => {
  if (Number(inputText.value) !== value) inputText.value = String(value);
});

const decimalLength = (value: number) => String(value).split('.')[1]?.length ?? 0;

function normalize(value: number) {
  const clamped = Math.min(Math.max(value, props.min), props.max);
  return props.integer ? Math.trunc(clamped) : clamped;
}

function update(value: number) {
  if (value === props.modelValue) return;
  emit('update:modelValue', value);
  emit('change', value);
}

function handleStep(action: StepperAction) {
  if (props.disabled) return;
  if (action === 'minus' ? minusDisabled.value : plusDisabled.value) {
    emit('overlimit', action);
    return;
  }
  const precision = Math.max(decimalLength(current.value), decimalLength(props.step));
  const delta = action === 'minus' ? -props.step : props.step;
  update(normalize(Number((current.value + delta).toFixed(precision))));
}

function handleInput(event: { detail: { value: string } }) {
  const text = event.detail.value;
  inputText.value = text;
  const value = Number(text);
  if (text === '' || Number.isNaN(value) || normalize(value) !== value) return;
  update(value);
}

function handleBlur() {
  const value = Number(inputText.value);
  const next = inputText.value === '' || Number.isNaN(value) ? current.value : normalize(value);
  update(next);
  inputText.value = String(next);
  formItem?.onBlur();
}
</script>

<style scoped lang="scss">
.u-stepper {
  display: inline-flex;
  align-items: center;
  height: 56rpx;

  &__button {
    position: relative;
    flex-shrink: 0;
    width: 56rpx;
    height: 56rpx;
    border-radius: var(--radius-base);
    background: var(--color-bg-input);
    color: var(--color-text);

    &::before,
    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: currentcolor;
    }

    &::before {
      width: 24rpx;
      height: 3rpx;
    }

    &--plus::after {
      width: 3rpx;
      height: 24rpx;
    }

    &:active {
      background: var(--color-bg-active);
    }

    &--disabled {
      color: var(--color-text-disabled);

      &:active {
        background: var(--color-bg-input);
      }
    }
  }

  &__input {
    box-sizing: border-box;
    width: 88rpx;
    height: 56rpx;
    margin: 0 var(--spacing-xs);
    padding: 0;
    border-radius: var(--radius-base);
    background: var(--color-bg-input);
    color: var(--color-text);
    font-size: var(--font-size-base);
    text-align: center;
  }

  &--disabled &__input {
    color: var(--color-text-disabled);
  }
}
</style>
