<template>
  <!--
    UFormItem - 基于 uni-forms-item 的表单项组件
    封装 uni-forms-item，提供统一样式和简化 API
    在 UForm 内设置 prop 后按 UForm 的规则校验并显示错误信息
  -->
  <!-- 覆盖 uni-forms-item 的样式挂在外层 view 上（支付宝中组件标签不是真实节点） -->
  <view
    class="u-form-item"
    :class="{
      'u-form-item--arrow': showArrow,
      'u-form-item--top': alignTop,
      'u-form-item--label-top': labelPositionValue === 'top',
    }"
  >
    <uni-forms-item
      :name="name"
      :label="label"
      :required="required || ruleRequired"
      :label-width="labelWidthValue"
      :label-align="labelAlignValue"
      :error-message="errorMessage"
      :rules="rules"
    >
      <view class="u-form-item__body">
        <!-- 表单内容 -->
        <view class="u-form-item__content" @click="handleClick">
          <slot>
            <!-- 默认显示占位符或值 -->
            <text v-if="isEmptyValue && placeholder" class="u-form-item__placeholder">
              {{ placeholder }}
            </text>
            <text v-else class="u-form-item__value">{{ value }}</text>
          </slot>
          <view v-if="showArrow" class="u-form-item__arrow">
            <uni-icons type="arrow-right" size="16" color="var(--color-text-placeholder)" />
          </view>
        </view>
        <text v-if="fieldError" class="u-form-item__error">{{ fieldError }}</text>
      </view>
    </uni-forms-item>
  </view>
</template>

<script setup lang="ts">
definePage({
  meta: {
    isComponent: true,
  },
});

import { computed, inject, provide, watch } from 'vue';
import { U_FORM_ITEM_KEY, U_FORM_KEY, type FormLabelPosition, type UFormContext } from '../UForm/context';

defineOptions({
  name: 'UFormItem',
  options: {
    styleIsolation: 'shared',
  },
});

/** uni-forms 校验规则：提示文案字段为 errorMessage，validateFunction 签名为 (rule, value, data, callback) */
export type FormItemRule = UniHelper.UniFormsItemRules[number];

interface Props {
  /** UForm 中的字段名，按 UForm 的 rules 校验并显示错误 */
  prop?: string;
  /** uni-forms 表单域的属性名 */
  name?: string;
  /** 表单项标签 */
  label: string;
  /** 是否必填 */
  required?: boolean;
  /** label 宽度，数字单位为 rpx，字符串需自带单位，默认取 UForm 的设置，否则 160 */
  labelWidth?: number | string;
  /** label 对齐方式，默认取 UForm 的设置，否则 left */
  labelAlign?: 'left' | 'center' | 'right';
  /** label 位置，默认取 UForm 的设置，否则 left */
  labelPosition?: FormLabelPosition;
  /** 错误提示信息（uni-forms-item 样式） */
  errorMessage?: string;
  /** uni-forms 验证规则 */
  rules?: FormItemRule[];
  /** 是否显示右侧箭头 */
  showArrow?: boolean;
  /** 当前值（用于显示） */
  value?: string | number;
  /** 占位符文本 */
  placeholder?: string;
  /** 标签与内容顶部对齐，用于多行输入 */
  alignTop?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  prop: '',
  name: '',
  required: false,
  labelWidth: undefined,
  labelAlign: undefined,
  labelPosition: undefined,
  errorMessage: '',
  rules: undefined,
  showArrow: false,
  value: '',
  placeholder: '',
  alignTop: false,
});

const emit = defineEmits<{
  click: [];
}>();

const form = inject<UFormContext | null>(U_FORM_KEY, null);

const isEmptyValue = computed(() => props.value === '' || props.value === undefined || props.value === null);

// uni-forms-item 运行时接受带单位的字符串，类型声明只有 number
const labelWidthValue = computed(() => {
  const width = props.labelWidth ?? form?.labelWidth() ?? 160;
  return (typeof width === 'number' ? `${width}rpx` : width) as unknown as number;
});
const labelAlignValue = computed(() => props.labelAlign ?? form?.labelAlign() ?? 'left');
const labelPositionValue = computed(() => props.labelPosition ?? form?.labelPosition() ?? 'left');

const ruleRequired = computed(() => !!(form && props.prop && form.isRequired(props.prop)));
const fieldError = computed(() => (form && props.prop && form.showMessage() ? form.getError(props.prop) : ''));

if (form) {
  watch(
    () => (props.prop ? form.getValue(props.prop) : undefined),
    () => form.triggerValidate(props.prop, 'change'),
    { deep: true },
  );
}

provide(U_FORM_ITEM_KEY, {
  onBlur: () => form?.triggerValidate(props.prop, 'blur'),
});

function handleClick() {
  emit('click');
}
</script>

<style scoped lang="scss">
.u-form-item {
  &__body {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
  }

  &__content {
    display: flex;
    flex: 1;
    align-items: center;
    min-height: var(--spacing-xl);
  }

  &__error {
    margin-top: var(--spacing-xs);
    color: var(--color-error);
    font-size: var(--font-size-sm);
    line-height: 1.5;
  }

  &__placeholder {
    color: var(--color-text-placeholder);
    font-size: var(--font-size-base);
  }

  &__value {
    color: var(--color-text);
    font-size: var(--font-size-base);
  }

  &__arrow {
    flex-shrink: 0;
    margin-left: auto;
    padding-left: var(--spacing-xs);
  }

  &--arrow {
    .u-form-item__content {
      cursor: pointer;
    }
  }
}

// 覆盖 uni-forms-item 默认样式：去掉为校验提示预留的下边距，左右留白与 UMenuItem 一致，标签与内容垂直居中
.u-form-item :deep(.uni-forms-item) {
  align-items: center;
  margin-bottom: 0;
  padding: var(--spacing-base) var(--spacing-lg);
}

.u-form-item--top :deep(.uni-forms-item) {
  align-items: flex-start;
}

.u-form-item--label-top :deep(.uni-forms-item) {
  flex-direction: column;
  align-items: stretch;
}

.u-form-item--label-top :deep(.uni-forms-item__label) {
  width: auto !important;
  padding-bottom: var(--spacing-xs);
}

.u-form-item :deep(.uni-forms-item__label) {
  height: auto;
  color: var(--color-text);
  font-size: var(--font-size-base);
  line-height: 1.5;
}

.u-form-item :deep(.uni-forms-item__content) {
  display: flex;
  align-items: center;
}

.u-form-item :deep(.is-required) {
  color: var(--color-error);
}

.u-form-item :deep(.uni-forms-item__error) {
  color: var(--color-error);
  font-size: var(--font-size-sm);
}

// 输入框样式统一
.u-form-item :deep(.uni-easyinput) {
  .uni-easyinput__content {
    border: none !important;
    background: transparent !important;
  }

  .uni-easyinput__content-input {
    height: 48rpx;
    padding-left: 0 !important;
    font-size: var(--font-size-base);
    line-height: 48rpx;
  }
}

.u-form-item :deep(.u-textarea) {
  padding: 0;
  border: none;
  background: transparent;
}
</style>
