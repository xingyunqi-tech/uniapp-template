<template>
  <!--
    UTextarea - 多行输入框
    基于原生 textarea，内置主题样式与字数统计，在 UFormItem 内失焦时触发表单校验
  -->
  <view class="u-textarea" :class="{ 'u-textarea--disabled': disabled }">
    <textarea
      class="u-textarea__inner"
      :style="innerStyle"
      :value="modelValue"
      :placeholder="placeholder"
      placeholder-style="color: var(--color-text-placeholder)"
      :maxlength="maxlength"
      :disabled="disabled"
      :focus="focus"
      :auto-height="autoHeight"
      @input="handleInput"
      @focus="emit('focus', $event)"
      @blur="handleBlur"
      @confirm="emit('confirm', $event)"
    />
    <text v-if="countVisible" class="u-textarea__count">{{ valueLength }}/{{ maxlength }}</text>
  </view>
</template>

<script setup lang="ts">
definePage({
  meta: {
    isComponent: true,
  },
});

import { computed, inject } from 'vue';
import { U_FORM_ITEM_KEY, type UFormItemContext } from '../UForm/context';

defineOptions({
  name: 'UTextarea',
  options: {
    virtualHost: true,
  },
});

export interface UTextareaProps {
  /** 输入值，支持 v-model */
  modelValue?: string;
  /** 占位文字 */
  placeholder?: string;
  /** 最大长度，-1 不限制 */
  maxlength?: number;
  /** 是否显示字数统计，不传时 maxlength 大于 0 即显示 */
  showCount?: boolean;
  /** 是否随内容自动增高 */
  autoHeight?: boolean;
  /** 输入区高度（rpx），autoHeight 时作为最小高度 */
  height?: number;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否自动聚焦 */
  focus?: boolean;
}

const props = withDefaults(defineProps<UTextareaProps>(), {
  modelValue: '',
  placeholder: '',
  maxlength: 140,
  showCount: undefined,
  autoHeight: false,
  height: 200,
  disabled: false,
  focus: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  input: [value: string];
  focus: [event: unknown];
  blur: [event: unknown];
  confirm: [event: unknown];
}>();

const formItem = inject<UFormItemContext | null>(U_FORM_ITEM_KEY, null);

const valueLength = computed(() => (props.modelValue ?? '').length);
const countVisible = computed(() => (props.showCount ?? true) && props.maxlength > 0);
const innerStyle = computed(() =>
  props.autoHeight ? { minHeight: `${props.height}rpx` } : { height: `${props.height}rpx` },
);

function handleInput(event: { detail: { value: string } }) {
  const value = event.detail.value;
  emit('update:modelValue', value);
  emit('input', value);
}

function handleBlur(event: unknown) {
  emit('blur', event);
  formItem?.onBlur();
}
</script>

<style scoped lang="scss">
.u-textarea {
  display: flex;
  box-sizing: border-box;
  flex: 1;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  padding: var(--spacing-base);
  border: var(--border-width-base) solid var(--color-border);
  border-radius: var(--radius-base);
  background: var(--color-bg-input);

  &__inner {
    box-sizing: border-box;
    width: 100%;
    padding: 0;
    color: var(--color-text);
    font-size: var(--font-size-base);
    line-height: 1.5;
  }

  &__count {
    align-self: flex-end;
    margin-top: var(--spacing-xs);
    color: var(--color-text-placeholder);
    font-size: var(--font-size-sm);
  }

  &--disabled {
    background: var(--color-bg-grey);

    .u-textarea__inner {
      color: var(--color-text-disabled);
    }
  }
}
</style>
