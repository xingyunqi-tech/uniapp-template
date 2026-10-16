<template>
  <!--
    UInput - 单行输入框
    基于 uni-easyinput，内置主题样式，在 UFormItem 内失焦时触发表单校验
  -->
  <view class="u-input" :class="{ 'u-input--disabled': disabled }">
    <uni-easyinput
      :model-value="modelValue"
      :type="type"
      :placeholder="placeholder"
      :placeholder-style="EASYINPUT_PLACEHOLDER_STYLE"
      :styles="EASYINPUT_STYLES"
      :primary-color="globalStore.primaryColor"
      :maxlength="maxlength"
      :clearable="clearable"
      :disabled="disabled"
      :focus="focus"
      :confirm-type="confirmType"
      :prefix-icon="prefixIcon"
      :suffix-icon="suffixIcon"
      :password-icon="passwordIcon"
      @update:model-value="handleUpdate"
      @input="emit('input', $event)"
      @focus="emit('focus', $event)"
      @blur="handleBlur"
      @confirm="emit('confirm', $event)"
      @clear="emit('clear')"
      @icon-click="emit('iconClick', $event)"
    >
      <template #left>
        <slot name="prefix" />
      </template>
      <template #right>
        <text v-if="countVisible" class="u-input__count">{{ valueLength }}/{{ maxlength }}</text>
        <slot name="suffix" />
      </template>
    </uni-easyinput>
  </view>
</template>

<script setup lang="ts">
definePage({
  meta: {
    isComponent: true,
  },
});

import { computed, inject } from 'vue';
import { useGlobalStore } from '@/store/modules/global';
import { U_FORM_ITEM_KEY, type UFormItemContext } from '../UForm/context';

defineOptions({
  name: 'UInput',
  options: {
    virtualHost: true,
    styleIsolation: 'shared',
  },
});

export type InputType = 'text' | 'number' | 'digit' | 'idcard' | 'password';

export interface UInputProps {
  /** 输入值，支持 v-model */
  modelValue?: string | number;
  /** 输入类型，password 时右侧显示密码可见切换 */
  type?: InputType;
  /** 占位文字 */
  placeholder?: string;
  /** 最大长度，-1 不限制 */
  maxlength?: number;
  /** 有内容时是否显示清除图标（设置 suffixIcon 时不显示） */
  clearable?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否自动聚焦 */
  focus?: boolean;
  /** 键盘右下角按钮文字 */
  confirmType?: 'send' | 'search' | 'next' | 'go' | 'done';
  /** 前缀图标（uni-icons 的 type） */
  prefixIcon?: UniIconsType | '';
  /** 后缀图标（uni-icons 的 type） */
  suffixIcon?: UniIconsType | '';
  /** type 为 password 时是否显示密码可见切换 */
  passwordIcon?: boolean;
  /** 是否显示字数统计，maxlength 大于 0 时生效 */
  showCount?: boolean;
}

const props = withDefaults(defineProps<UInputProps>(), {
  modelValue: '',
  type: 'text',
  placeholder: '',
  maxlength: 140,
  clearable: true,
  disabled: false,
  focus: false,
  confirmType: 'done',
  prefixIcon: '',
  suffixIcon: '',
  passwordIcon: true,
  showCount: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string | number];
  input: [value: string | number];
  focus: [event: unknown];
  blur: [event: unknown];
  confirm: [value: string | number];
  clear: [];
  iconClick: [position: 'prefix' | 'suffix'];
}>();

const EASYINPUT_STYLES = {
  color: 'var(--color-text)',
  backgroundColor: 'var(--color-bg)',
  disableColor: 'var(--color-bg-grey)',
  borderColor: 'var(--color-border)',
};

const EASYINPUT_PLACEHOLDER_STYLE = 'color: var(--color-text-placeholder)';

const globalStore = useGlobalStore();
const formItem = inject<UFormItemContext | null>(U_FORM_ITEM_KEY, null);

const valueLength = computed(() => String(props.modelValue ?? '').length);
const countVisible = computed(() => props.showCount && props.maxlength > 0);

function handleUpdate(value: string | number) {
  emit('update:modelValue', value);
}

function handleBlur(event: unknown) {
  emit('blur', event);
  formItem?.onBlur();
}
</script>

<style scoped lang="scss">
.u-input {
  flex: 1;
  min-width: 0;

  &__count {
    flex-shrink: 0;
    padding: 0 var(--spacing-sm);
    color: var(--color-text-placeholder);
    font-size: var(--font-size-sm);
  }

  &--disabled :deep(.uni-easyinput__content-input) {
    color: var(--color-text-disabled);
  }
}
</style>
