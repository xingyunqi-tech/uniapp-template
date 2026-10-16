<template>
  <!--
    UFormItem - 基于 uni-forms-item 的表单项组件
    封装 uni-forms-item，提供统一样式和简化 API
    支持表单验证功能（需配合 uni-forms 使用）
  -->
  <!-- 覆盖 uni-forms-item 的样式挂在外层 view 上（支付宝中组件标签不是真实节点） -->
  <view class="u-form-item" :class="{ 'u-form-item--arrow': showArrow, 'u-form-item--top': alignTop }">
    <uni-forms-item
      :name="name"
      :label="label"
      :required="required"
      :label-width="labelWidthValue"
      :label-align="labelAlign"
      :error-message="errorMessage"
      :rules="rules"
    >
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
    </uni-forms-item>
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
  name: 'UFormItem',
  options: {
    styleIsolation: 'shared',
  },
});

/** uni-forms 校验规则：提示文案字段为 errorMessage，validateFunction 签名为 (rule, value, data, callback) */
export type FormItemRule = UniHelper.UniFormsItemRules[number];

interface Props {
  /** 表单域的属性名，用于表单验证 */
  name?: string;
  /** 表单项标签 */
  label: string;
  /** 是否必填 */
  required?: boolean;
  /** label 宽度，数字单位为 rpx，字符串需自带单位 */
  labelWidth?: number | string;
  /** label 对齐方式 */
  labelAlign?: 'left' | 'center' | 'right';
  /** 错误提示信息 */
  errorMessage?: string;
  /** 验证规则 */
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
  name: '',
  required: false,
  labelWidth: 160,
  labelAlign: 'left',
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

const isEmptyValue = computed(() => props.value === '' || props.value === undefined || props.value === null);

// uni-forms-item 运行时接受带单位的字符串，类型声明只有 number
const labelWidthValue = computed(
  () => (typeof props.labelWidth === 'number' ? `${props.labelWidth}rpx` : props.labelWidth) as unknown as number,
);

function handleClick() {
  emit('click');
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
    font-size: var(--font-size-base);
  }
}
</style>
