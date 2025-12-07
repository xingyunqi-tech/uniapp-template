<route lang="json5">
{
  meta: {
    isComponent: true,
  },
}
</route>

<template>
  <!--
    UFormItem - 基于 uni-forms-item 的表单项组件
    封装 uni-forms-item，提供统一样式和简化 API
    支持表单验证功能（需配合 uni-forms 使用）
  -->
  <uni-forms-item
    :name="name"
    :label="label"
    :required="required"
    :label-width="labelWidth"
    :label-align="labelAlign"
    :error-message="errorMessage"
    :rules="rules"
    class="u-form-item"
    :class="{ 'u-form-item--arrow': showArrow }"
  >
    <!-- 自定义 label -->
    <template v-if="$slots.label" #label>
      <slot name="label" />
    </template>

    <!-- 表单内容 -->
    <view class="u-form-item__content" @click="handleClick">
      <slot>
        <!-- 默认显示占位符或值 -->
        <text v-if="!value && placeholder" class="u-form-item__placeholder">
          {{ placeholder }}
        </text>
        <text v-else class="u-form-item__value">{{ value }}</text>
      </slot>
    </view>

    <!-- 右侧箭头 -->
    <template v-if="showArrow" #right>
      <uni-icons type="arrow-right" size="16" color="#bbb" />
    </template>
  </uni-forms-item>
</template>

<script setup lang="ts">
defineOptions({
  name: 'UFormItem',
});

interface FormRule {
  required?: boolean;
  message?: string;
  pattern?: RegExp;
  minLength?: number;
  maxLength?: number;
  validateFunction?: (rule: any, value: any, callback: (error?: string) => void) => void;
}

interface Props {
  /** 表单域的属性名，用于表单验证 */
  name?: string;
  /** 表单项标签 */
  label: string;
  /** 是否必填 */
  required?: boolean;
  /** label 宽度，默认 80 */
  labelWidth?: number;
  /** label 对齐方式 */
  labelAlign?: 'left' | 'center' | 'right';
  /** 错误提示信息 */
  errorMessage?: string;
  /** 验证规则 */
  rules?: FormRule[];
  /** 是否显示右侧箭头 */
  showArrow?: boolean;
  /** 当前值（用于显示） */
  value?: string | number;
  /** 占位符文本 */
  placeholder?: string;
}

const props = withDefaults(defineProps<Props>(), {
  name: '',
  required: false,
  labelWidth: 80,
  labelAlign: 'left',
  errorMessage: '',
  rules: undefined,
  showArrow: false,
  value: '',
  placeholder: '',
});

const emit = defineEmits<{
  click: [];
}>();

function handleClick() {
  if (props.showArrow) {
    emit('click');
  }
}
</script>

<style scoped lang="scss">
.u-form-item {
  &__content {
    display: flex;
    flex: 1;
    align-items: center;
    min-height: var(--spacing-xl);
  }

  &__placeholder {
    color: var(--color-text-placeholder);
    font-size: var(--font-size-base);
  }

  &__value {
    color: var(--color-text);
    font-size: var(--font-size-base);
  }

  &--arrow {
    .u-form-item__content {
      cursor: pointer;
    }
  }
}

// 覆盖 uni-forms-item 默认样式
:deep(.uni-forms-item__label) {
  color: var(--color-text);
  font-size: var(--font-size-base);
}

:deep(.uni-forms-item__content) {
  display: flex;
  align-items: center;
}

:deep(.is-required) {
  color: var(--color-error);
}

:deep(.uni-forms-item__error) {
  color: var(--color-error);
  font-size: var(--font-size-sm);
}

// 输入框样式统一
:deep(.uni-easyinput) {
  .uni-easyinput__content {
    border: none !important;
    background: transparent !important;
  }

  .uni-easyinput__content-input {
    font-size: var(--font-size-base);
  }
}
</style>
