<template>
  <!--
    UForm - 表单容器
    统一管理字段校验规则与错误信息，配合 UFormItem（prop）与 UInput / UTextarea 使用
  -->
  <view class="u-form">
    <slot />
  </view>
</template>

<script setup lang="ts">
definePage({
  meta: {
    isComponent: true,
  },
});

import { nextTick, provide, reactive } from 'vue';
import {
  cloneFormValue,
  collectDeps,
  hasRequiredRule,
  isBlurOnlyRule,
  matchTrigger,
  toRuleArray,
  validateRules,
  type FormModel,
  type FormRuleTrigger,
  type FormRules,
} from '@/utils/form-rules';
import { U_FORM_KEY, type FormLabelAlign, type FormLabelPosition, type UFormContext } from './context';

defineOptions({
  name: 'UForm',
  options: {
    virtualHost: true,
  },
});

export type { FormRule, FormRules, FormRuleTrigger } from '@/utils/form-rules';

export interface UFormProps {
  /** 表单数据对象（reactive） */
  model: FormModel;
  /** 校验规则，键为字段名；字段已有错误时值变化运行除 trigger 为 blur 外的全部规则 */
  rules?: FormRules;
  /** 规则未设置 trigger 时的自动校验时机，submit 表示只在调用 validate 时校验 */
  validateTrigger?: FormRuleTrigger | 'submit';
  /** UFormItem 的默认 label 宽度，数字单位为 rpx */
  labelWidth?: number | string;
  /** UFormItem 的默认 label 对齐方式 */
  labelAlign?: FormLabelAlign;
  /** UFormItem 的默认 label 位置 */
  labelPosition?: FormLabelPosition;
  /** UFormItem 是否显示字段错误信息 */
  showMessage?: boolean;
  /** validate 失败时是否 Toast 提示第一条错误 */
  errorToast?: boolean;
}

const props = withDefaults(defineProps<UFormProps>(), {
  rules: () => ({}),
  validateTrigger: 'blur',
  labelWidth: undefined,
  labelAlign: undefined,
  labelPosition: 'left',
  showMessage: true,
  errorToast: true,
});

const errors = reactive<Record<string, string>>({});
const versions: Record<string, number> = {};
const validated = new Set<string>();
let initialValues = cloneFormValue({ ...props.model });
let resetting = false;

function rulesOf(prop: string) {
  return toRuleArray(props.rules[prop]);
}

function setError(prop: string, message: string) {
  if (message) {
    errors[prop] = message;
  } else {
    delete errors[prop];
  }
}

function nextVersion(prop: string) {
  return (versions[prop] = (versions[prop] ?? 0) + 1);
}

function rulesForTrigger(prop: string, trigger: FormRuleTrigger) {
  const rules = rulesOf(prop);
  if (!errors[prop]) return rules.filter(rule => matchTrigger(rule, trigger, props.validateTrigger));
  return trigger === 'change' ? rules.filter(rule => !isBlurOnlyRule(rule)) : rules;
}

/** 校验字段并写入错误信息，返回错误信息；被更新的校验覆盖时结果不写入 */
async function runValidate(prop: string, rules = rulesOf(prop)): Promise<string> {
  const version = nextVersion(prop);
  validated.add(prop);
  const message = await validateRules(props.model[prop], rules, props.model);
  if (versions[prop] === version) setError(prop, message);
  return message;
}

function revalidateDependents(prop: string) {
  for (const field of Object.keys(props.rules)) {
    if (field === prop || !collectDeps(props.rules[field]).includes(prop)) continue;
    if (!errors[field] && !validated.has(field)) continue;
    const rules = rulesOf(field).filter(rule => !isBlurOnlyRule(rule));
    if (rules.length > 0) void runValidate(field, rules);
  }
}

function triggerValidate(prop: string, trigger: FormRuleTrigger) {
  if (!prop || resetting) return;
  const rules = rulesForTrigger(prop, trigger);
  if (rules.length > 0) {
    void runValidate(prop, rules);
  } else if (trigger === 'change') {
    nextVersion(prop);
  }
  if (trigger === 'change') revalidateDependents(prop);
}

/** 校验字段（默认全部规则字段），失败时按 errorToast 提示第一条错误 */
async function validate(prop?: string | string[]): Promise<boolean> {
  const fields = prop === undefined ? Object.keys(props.rules) : Array.isArray(prop) ? prop : [prop];
  const messages = await Promise.all(fields.map(field => runValidate(field)));
  const firstError = messages.find(Boolean);
  if (firstError && props.errorToast) {
    uni.showToast({ title: firstError, icon: 'none' });
  }
  return !firstError;
}

/** 校验指定字段，不弹出提示 */
async function validateField(prop: string | string[]): Promise<boolean> {
  const list = Array.isArray(prop) ? prop : [prop];
  const messages = await Promise.all(list.map(item => runValidate(item)));
  return messages.every(message => !message);
}

/** 清除校验结果，不传时清除全部 */
function clearValidate(prop?: string | string[]) {
  const list =
    prop === undefined ? [...Object.keys(errors), ...Object.keys(versions)] : Array.isArray(prop) ? prop : [prop];
  for (const item of list) {
    nextVersion(item);
    validated.delete(item);
    delete errors[item];
  }
}

/** 更新 resetFields 恢复的初始值，不传时取当前表单数据 */
function setInitialValues(values?: FormModel) {
  initialValues = cloneFormValue({ ...(values ?? props.model) });
}

/** 恢复为初始值并清除校验结果 */
function resetFields() {
  resetting = true;
  const model = props.model;
  Object.assign(model, cloneFormValue(initialValues));
  clearValidate();
  nextTick(() => {
    resetting = false;
  });
}

const context: UFormContext = {
  getValue: prop => props.model[prop],
  labelWidth: () => props.labelWidth,
  labelAlign: () => props.labelAlign,
  labelPosition: () => props.labelPosition,
  showMessage: () => props.showMessage,
  getError: prop => errors[prop] ?? '',
  isRequired: prop => hasRequiredRule(props.rules[prop]),
  triggerValidate,
};

provide(U_FORM_KEY, context);

defineExpose({
  /** 校验字段（默认全部），通过时为 true */
  validate,
  /** 校验指定字段，通过时为 true */
  validateField,
  /** 恢复初始值并清除校验结果 */
  resetFields,
  /** 更新 resetFields 恢复的初始值 */
  setInitialValues,
  /** 清除校验结果 */
  clearValidate,
  /** 当前错误信息 */
  errors,
});
</script>
