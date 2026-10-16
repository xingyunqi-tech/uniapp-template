import { ref, reactive, shallowReactive, computed, type Ref, type ComputedRef } from 'vue';
import {
  cloneFormValue,
  hasRequiredRule,
  toRuleArray,
  validateRules,
  type FormModel,
  type FormRule,
} from '@/utils/form-rules';

/**
 * useForm 校验规则，与 UForm 的 FormRule 相同，validator 仅支持同步返回
 */
export interface UseFormRule<M = FormModel> extends Omit<FormRule<M>, 'validator' | 'trigger'> {
  validator?(value: unknown, model: M): boolean | string;
}

/**
 * 字段验证结果
 */
export interface FieldValidation {
  /** 是否有效 */
  valid: boolean;
  /** 错误消息 */
  message: string;
}

/**
 * 表单验证结果
 */
export interface FormValidation {
  /** 整体是否有效 */
  valid: boolean;
  /** 各字段验证结果 */
  fields: Record<string, FieldValidation>;
  /** 第一个错误消息 */
  firstError: string;
}

export interface UseFormOptions<T extends Record<string, unknown>> {
  /** 初始值 */
  initialValues: T;
  /** 验证规则 */
  rules?: Partial<Record<keyof T, UseFormRule<T> | UseFormRule<T>[]>>;
  /** 验证触发时机: 'change' | 'blur' | 'submit' */
  validateTrigger?: 'change' | 'blur' | 'submit';
}

export interface UseFormReturn<T extends Record<string, unknown>> {
  /** 表单数据 */
  formData: T;
  /** 是否正在提交 */
  submitting: Ref<boolean>;
  /** 各字段错误消息 */
  errors: Record<string, Ref<string>>;
  /** 整体是否有效 */
  isValid: ComputedRef<boolean>;
  /** 是否有改动 */
  isDirty: ComputedRef<boolean>;
  /** 验证单个字段 */
  validateField: (field: keyof T) => FieldValidation;
  /** 验证整个表单 */
  validate: () => FormValidation;
  /** 重置表单 */
  reset: () => void;
  /** 设置字段值 */
  setFieldValue: <K extends keyof T>(field: K, value: T[K]) => void;
  /** 设置字段错误 */
  setFieldError: (field: keyof T, message: string) => void;
  /** 清除字段错误 */
  clearFieldError: (field: keyof T) => void;
  /** 清除所有错误 */
  clearErrors: () => void;
  /** 字段失焦处理，validateTrigger 为 'blur' 时校验该字段 */
  handleBlur: (field: keyof T) => void;
  /** 提交表单 */
  handleSubmit: (onSubmit: (values: T) => Promise<void> | void) => Promise<void>;
}

/**
 * 表单管理 Composable
 * @description 统一表单状态管理、验证、提交，校验逻辑与 UForm 共用 utils/form-rules
 * @example
 * ```ts
 * const { formData, errors, isValid, validate, handleSubmit } = useForm({
 *   initialValues: { phone: '', password: '' },
 *   rules: {
 *     phone: { required: true, pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
 *     password: [{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少6位' }],
 *   }
 * });
 *
 * // validateTrigger: 'blur' 时绑定失焦校验
 * // <input v-model="formData.phone" @blur="handleBlur('phone')" />
 *
 * // 提交表单
 * await handleSubmit(async (values) => {
 *   await login(values);
 * });
 * ```
 */
export function useForm<T extends Record<string, unknown>>(options: UseFormOptions<T>): UseFormReturn<T> {
  const {
    initialValues,
    rules = {} as Partial<Record<keyof T, UseFormRule<T> | UseFormRule<T>[]>>,
    validateTrigger = 'submit',
  } = options;

  // 表单数据
  const formData = reactive<T>(cloneFormValue(initialValues)) as T;

  // 初始值快照 (用于判断是否有改动)
  const initialSnapshot = JSON.stringify(initialValues);

  // 提交状态
  const submitting = ref(false);

  // 错误消息，未在 initialValues 中声明的字段按需创建
  const errors = shallowReactive<Record<string, Ref<string>>>({});
  for (const key of Object.keys(initialValues)) {
    errors[key] = ref('');
  }

  function ensureError(field: string): Ref<string> {
    if (!errors[field]) {
      errors[field] = ref('');
    }
    return errors[field];
  }

  // 是否有改动
  const isDirty = computed(() => {
    return JSON.stringify(formData) !== initialSnapshot;
  });

  /**
   * 验证单个字段
   */
  function validateField(field: keyof T): FieldValidation {
    const fieldKey = field as string;
    const message = validateRules(formData[field], toRuleArray(rules[field]), formData) as string;

    if (message) {
      ensureError(fieldKey).value = message;
      return { valid: false, message };
    }

    if (errors[fieldKey]) errors[fieldKey].value = '';
    return { valid: true, message: '' };
  }

  /**
   * 验证整个表单
   */
  function validate(): FormValidation {
    const fields = {} as Record<string, FieldValidation>;
    let valid = true;
    let firstError = '';

    for (const key of Object.keys(initialValues) as Array<keyof T>) {
      const result = validateField(key);
      fields[key as string] = result;
      if (!result.valid) {
        valid = false;
        if (!firstError) {
          firstError = result.message;
        }
      }
    }

    return { valid, fields, firstError };
  }

  // 是否整体有效 (基于 errors 状态判断，避免重复验证)
  const isValid = computed(() => {
    // 检查是否有任何错误消息
    for (const key of Object.keys(errors)) {
      if (errors[key].value) {
        return false;
      }
    }
    // 同时检查是否所有必填字段都有值
    for (const key of Object.keys(rules) as Array<keyof T>) {
      if (hasRequiredRule(rules[key])) {
        const value = formData[key];
        const isEmpty =
          value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
        if (isEmpty) {
          return false;
        }
      }
    }
    return true;
  });

  /**
   * 重置表单
   */
  function reset() {
    Object.assign(formData, cloneFormValue(initialValues));
    clearErrors();
  }

  /**
   * 设置字段值
   */
  function setFieldValue<K extends keyof T>(field: K, value: T[K]) {
    (formData as Record<K, T[K]>)[field] = value;

    // 根据触发时机验证
    if (validateTrigger === 'change') {
      validateField(field);
    }
  }

  /**
   * 设置字段错误
   */
  function setFieldError(field: keyof T, message: string) {
    ensureError(field as string).value = message;
  }

  /**
   * 清除字段错误
   */
  function clearFieldError(field: keyof T) {
    const error = errors[field as string];
    if (error) error.value = '';
  }

  /**
   * 清除所有错误
   */
  function clearErrors() {
    for (const key of Object.keys(errors)) {
      errors[key].value = '';
    }
  }

  function handleBlur(field: keyof T) {
    if (validateTrigger === 'blur') {
      validateField(field);
    }
  }

  /**
   * 提交表单
   */
  async function handleSubmit(onSubmit: (values: T) => Promise<void> | void): Promise<void> {
    // 验证表单
    const result = validate();
    if (!result.valid) {
      uni.showToast({
        title: result.firstError,
        icon: 'none',
      });
      return;
    }

    // 防止重复提交
    if (submitting.value) return;

    submitting.value = true;
    try {
      await onSubmit({ ...formData } as T);
    } finally {
      submitting.value = false;
    }
  }

  return {
    formData,
    submitting,
    errors,
    isValid,
    isDirty,
    validateField,
    validate,
    reset,
    setFieldValue,
    setFieldError,
    clearFieldError,
    clearErrors,
    handleBlur,
    handleSubmit,
  };
}
