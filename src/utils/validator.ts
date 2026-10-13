/**
 * 表单验证工具
 */

/** 验证规则 */
export interface ValidationRule {
  /** 是否必填 */
  required?: boolean;
  /** 必填提示信息 */
  message?: string;
  /** 最小长度 */
  minLength?: number;
  /** 最大长度 */
  maxLength?: number;
  /** 正则表达式 */
  pattern?: RegExp;
  /** 自定义验证函数 */
  validator?: (value: unknown) => boolean | string;
}

/** 验证结果 */
export interface ValidationResult {
  /** 是否通过验证 */
  valid: boolean;
  /** 错误信息 */
  message?: string;
}

/** 字段验证规则映射 */
export type ValidationRules = Record<string, ValidationRule[]>;

/**
 * 验证单个值
 * @param value 要验证的值
 * @param rules 验证规则数组
 * @returns 验证结果
 */
export function validateValue(value: unknown, rules: ValidationRule[]): ValidationResult {
  for (const rule of rules) {
    // 必填验证
    if (rule.required) {
      const isEmpty =
        value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);

      if (isEmpty) {
        return {
          valid: false,
          message: rule.message || '此字段为必填项',
        };
      }
    }

    // 如果值为空且非必填，跳过后续验证
    if (value === undefined || value === null || value === '') {
      continue;
    }

    const strValue = String(value);

    // 最小长度验证
    if (rule.minLength !== undefined && strValue.length < rule.minLength) {
      return {
        valid: false,
        message: rule.message || `长度不能少于 ${rule.minLength} 个字符`,
      };
    }

    // 最大长度验证
    if (rule.maxLength !== undefined && strValue.length > rule.maxLength) {
      return {
        valid: false,
        message: rule.message || `长度不能超过 ${rule.maxLength} 个字符`,
      };
    }

    // 正则验证
    if (rule.pattern && !rule.pattern.test(strValue)) {
      return {
        valid: false,
        message: rule.message || '格式不正确',
      };
    }

    // 自定义验证
    if (rule.validator) {
      const result = rule.validator(value);
      if (result !== true) {
        return {
          valid: false,
          message: typeof result === 'string' ? result : rule.message || '验证失败',
        };
      }
    }
  }

  return { valid: true };
}

/**
 * 验证表单数据
 * @param data 表单数据
 * @param rules 验证规则
 * @returns 验证结果，返回第一个错误
 */
export function validateForm(
  data: Record<string, unknown>,
  rules: ValidationRules,
): ValidationResult & { field?: string } {
  for (const [field, fieldRules] of Object.entries(rules)) {
    const result = validateValue(data[field], fieldRules);
    if (!result.valid) {
      return { ...result, field };
    }
  }

  return { valid: true };
}

/**
 * 验证表单数据（返回所有错误）
 * @param data 表单数据
 * @param rules 验证规则
 * @returns 所有字段的验证错误
 */
export function validateFormAll(data: Record<string, unknown>, rules: ValidationRules): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const [field, fieldRules] of Object.entries(rules)) {
    const result = validateValue(data[field], fieldRules);
    if (!result.valid && result.message) {
      errors[field] = result.message;
    }
  }

  return errors;
}

// ==================== 常用验证规则 ====================

/** 手机号正则 */
export const PHONE_PATTERN = /^1[3-9]\d{9}$/;

/** 邮箱正则 */
export const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/** 身份证号正则 */
export const ID_CARD_PATTERN = /^[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/;

/** URL 正则 */
export const URL_PATTERN = /^https?:\/\/.+/;

/**
 * URL 的域名是否在列表中（含子域名），仅匹配 http/https
 * @example isUrlInHosts('https://m.example.com/a', ['example.com']) // true
 */
export function isUrlInHosts(url: string, hosts: readonly string[]): boolean {
  const hostname = /^https?:\/\/(?:[^/\\?#@]*@)?([a-z0-9.-]+)(?=[:/?#]|$)/i.exec(url)?.[1]?.toLowerCase();
  if (!hostname) return false;
  return hosts.some(host => hostname === host || hostname.endsWith(`.${host}`));
}

/** 验证手机号 */
export function isPhone(value: string): boolean {
  return PHONE_PATTERN.test(value);
}

/** 验证邮箱 */
export function isEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value);
}

/** 验证身份证号 */
export function isIdCard(value: string): boolean {
  return ID_CARD_PATTERN.test(value);
}

/** 验证 URL */
export function isUrl(value: string): boolean {
  return URL_PATTERN.test(value);
}

/** 验证是否为数字 */
export function isNumeric(value: string): boolean {
  return /^\d+$/.test(value);
}

/** 验证是否为整数 */
export function isInteger(value: string | number): boolean {
  return Number.isInteger(Number(value));
}

/** 验证是否为正整数 */
export function isPositiveInteger(value: string | number): boolean {
  const num = Number(value);
  return Number.isInteger(num) && num > 0;
}

// ==================== 预置规则工厂 ====================

/**
 * 创建必填规则
 */
export function required(message = '此字段为必填项'): ValidationRule {
  return { required: true, message };
}

/**
 * 创建手机号验证规则
 */
export function phone(message = '请输入正确的手机号'): ValidationRule {
  return { pattern: PHONE_PATTERN, message };
}

/**
 * 创建邮箱验证规则
 */
export function email(message = '请输入正确的邮箱地址'): ValidationRule {
  return { pattern: EMAIL_PATTERN, message };
}

/**
 * 创建长度范围验证规则
 */
export function length(min: number, max: number, message?: string): ValidationRule {
  return {
    minLength: min,
    maxLength: max,
    message: message || `长度应在 ${min}-${max} 个字符之间`,
  };
}
