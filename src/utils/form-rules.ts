/**
 * 表单字段校验规则，UForm 与 useForm 共用
 */
import { SMS_CODE_LENGTH } from '@/constants/form';
import { PHONE_PATTERN, validateValue, type ValidationRule } from './validator';

export type FormRuleTrigger = 'blur' | 'change';

export type FormModel = Record<string, unknown>;

export type FormValidatorResult = boolean | string;

export interface FormRule<M = FormModel> {
  /** 是否必填，空字符串（含纯空白）、null、undefined、空数组视为未填 */
  required?: boolean;
  /** 校验失败提示 */
  message?: string;
  /** 正则校验 */
  pattern?: RegExp;
  /** 最小长度 */
  min?: number;
  /** 最大长度 */
  max?: number;
  /** 自定义校验，返回 true 通过，返回字符串作为错误提示，返回 false 使用 message */
  validator?(value: unknown, model: M): FormValidatorResult | Promise<FormValidatorResult>;
  /** 自动校验时机，不传时使用表单的 validateTrigger */
  trigger?: FormRuleTrigger | FormRuleTrigger[];
  /** 依赖的字段名，依赖字段值变化时，本字段已有错误或已校验过则重新校验 */
  deps?: string[];
}

export type FormRules<M = FormModel> = Partial<Record<string, FormRule<M> | FormRule<M>[]>>;

const DEFAULT_MESSAGE = '验证失败';

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || value === '';
}

function isPromiseLike<T>(value: unknown): value is PromiseLike<T> {
  return !!value && typeof (value as PromiseLike<T>).then === 'function';
}

function toValidationRule<M>(rule: FormRule<M>): ValidationRule {
  return {
    required: rule.required,
    message: rule.message,
    minLength: rule.min,
    maxLength: rule.max,
    pattern: rule.pattern,
  };
}

function resolveResult<M>(result: FormValidatorResult, rule: FormRule<M>): string {
  if (result === true) return '';
  return typeof result === 'string' && result ? result : rule.message || DEFAULT_MESSAGE;
}

/** 统一为规则数组 */
export function toRuleArray<M>(rules: FormRule<M> | FormRule<M>[] | undefined): FormRule<M>[] {
  if (!rules) return [];
  return Array.isArray(rules) ? rules : [rules];
}

/** 规则是否在指定时机触发，规则未设置 trigger 时取 defaultTrigger */
export function matchTrigger<M>(
  rule: FormRule<M>,
  trigger: FormRuleTrigger,
  defaultTrigger?: FormRuleTrigger | 'submit',
): boolean {
  const ruleTrigger = rule.trigger ?? defaultTrigger;
  return Array.isArray(ruleTrigger) ? ruleTrigger.includes(trigger) : ruleTrigger === trigger;
}

/** 规则是否只在失焦时触发（trigger 显式为 blur） */
export function isBlurOnlyRule<M>(rule: FormRule<M>): boolean {
  const { trigger } = rule;
  return Array.isArray(trigger) ? trigger.length > 0 && trigger.every(item => item === 'blur') : trigger === 'blur';
}

/** 规则声明的全部依赖字段 */
export function collectDeps<M>(rules: FormRule<M> | FormRule<M>[] | undefined): string[] {
  return [...new Set(toRuleArray(rules).flatMap(rule => rule.deps ?? []))];
}

/** 规则中是否包含必填 */
export function hasRequiredRule<M>(rules: FormRule<M> | FormRule<M>[] | undefined): boolean {
  return toRuleArray(rules).some(rule => rule.required);
}

/**
 * 按顺序校验字段值，返回第一条错误提示，通过时返回空字符串
 * 自定义校验全部同步时同步返回，存在异步校验时返回 Promise
 * 值为空且非必填时跳过 validator
 */
export function validateRules<M>(value: unknown, rules: FormRule<M>[], model: M): string | Promise<string> {
  for (let index = 0; index < rules.length; index++) {
    const rule = rules[index];
    const base = validateValue(value, [toValidationRule(rule)]);
    if (!base.valid) return base.message || DEFAULT_MESSAGE;
    if (!rule.validator || isBlank(value)) continue;

    let result: FormValidatorResult | Promise<FormValidatorResult>;
    try {
      result = rule.validator(value, model);
    } catch {
      return rule.message || DEFAULT_MESSAGE;
    }

    if (isPromiseLike<FormValidatorResult>(result)) {
      const rest = rules.slice(index + 1);
      return Promise.resolve(result).then(
        resolved => {
          const message = resolveResult(resolved, rule);
          return message || validateRules(value, rest, model);
        },
        () => rule.message || DEFAULT_MESSAGE,
      );
    }

    const message = resolveResult(result, rule);
    if (message) return message;
  }
  return '';
}

/** 同步校验，规则中存在异步 validator 时抛出错误 */
export function validateRulesSync<M>(value: unknown, rules: FormRule<M>[], model: M): string {
  const result = validateRules(value, rules, model);
  if (typeof result !== 'string') throw new Error('validateRulesSync 不支持异步校验规则');
  return result;
}

/** 手机号：必填 + 格式 */
export function phoneRules<M = FormModel>(): FormRule<M>[] {
  return [
    { required: true, message: '请输入手机号' },
    { pattern: PHONE_PATTERN, message: '请输入正确的手机号' },
  ];
}

/** 短信验证码：必填 + 位数 */
export function smsCodeRules<M = FormModel>(): FormRule<M>[] {
  return [
    { required: true, message: '请输入验证码' },
    { pattern: new RegExp(`^\\d{${SMS_CODE_LENGTH}}$`), message: `验证码为${SMS_CODE_LENGTH}位数字` },
  ];
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/** 深拷贝数组与普通对象，其他值原样返回 */
export function cloneFormValue<V>(value: V): V {
  if (Array.isArray(value)) {
    return value.map(item => cloneFormValue(item)) as V;
  }
  if (isPlainObject(value)) {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(value)) {
      result[key] = cloneFormValue(value[key]);
    }
    return result as V;
  }
  return value;
}
