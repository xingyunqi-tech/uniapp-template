import { computed, type Ref, type ComputedRef } from 'vue';
import { PASSWORD_RULES } from '@/constants/form';

export interface PasswordRules {
  /** 最小长度 */
  minLength: number;
  /** 最大长度 */
  maxLength: number;
  /** 是否需要字母 */
  requireLetter: boolean;
  /** 是否需要数字 */
  requireNumber: boolean;
  /** 是否需要特殊字符 */
  requireSpecialChar: boolean;
}

export interface PasswordValidation {
  /** 长度是否有效 */
  isLengthValid: boolean;
  /** 是否包含字母 */
  hasLetter: boolean;
  /** 是否包含数字 */
  hasNumber: boolean;
  /** 是否包含特殊字符 */
  hasSpecialChar: boolean;
  /** 所有规则是否都满足 */
  isValid: boolean;
}

export interface UsePasswordStrengthReturn {
  /** 密码强度等级 (0-3) */
  strength: ComputedRef<number>;
  /** 强度文本 */
  strengthText: ComputedRef<string>;
  /** 强度 CSS 类名 */
  strengthClass: ComputedRef<string>;
  /** 是否包含字母 */
  hasLetter: ComputedRef<boolean>;
  /** 是否包含数字 */
  hasNumber: ComputedRef<boolean>;
  /** 是否包含特殊字符 */
  hasSpecialChar: ComputedRef<boolean>;
  /** 长度是否有效 */
  isLengthValid: ComputedRef<boolean>;
  /** 所有必要规则是否都满足 */
  isValid: ComputedRef<boolean>;
  /** 完整的验证结果 */
  validation: ComputedRef<PasswordValidation>;
}

/** 默认密码规则 - 从 constants/form.ts 导入 */
export const DEFAULT_PASSWORD_RULES: PasswordRules = { ...PASSWORD_RULES };

/** 特殊字符正则 */
const SPECIAL_CHAR_REGEX = /[!@#$%^&*(),.?":{}|<>]/;

/**
 * 密码强度验证 Composable
 * @description 用于密码强度检测和规则验证
 * @example
 * ```ts
 * const password = ref('');
 * const { strength, strengthText, strengthClass, hasLetter, hasNumber, isValid } = usePasswordStrength(password);
 *
 * // 模板中使用
 * // <view class="strength-bar" :class="{ active: strength >= 1 }" />
 * // <text :class="strengthClass">{{ strengthText }}</text>
 * ```
 */
export function usePasswordStrength(
  password: Ref<string>,
  rules: Partial<PasswordRules> = {},
): UsePasswordStrengthReturn {
  const mergedRules = { ...DEFAULT_PASSWORD_RULES, ...rules };

  // 是否包含字母
  const hasLetter = computed(() => /[a-zA-Z]/.test(password.value));

  // 是否包含数字
  const hasNumber = computed(() => /\d/.test(password.value));

  // 是否包含特殊字符
  const hasSpecialChar = computed(() => SPECIAL_CHAR_REGEX.test(password.value));

  // 长度是否有效
  const isLengthValid = computed(() => {
    const len = password.value.length;
    return len >= mergedRules.minLength && len <= mergedRules.maxLength;
  });

  // 所有必要规则是否都满足
  const isValid = computed(() => {
    if (!isLengthValid.value) return false;
    if (mergedRules.requireLetter && !hasLetter.value) return false;
    if (mergedRules.requireNumber && !hasNumber.value) return false;
    if (mergedRules.requireSpecialChar && !hasSpecialChar.value) return false;
    return true;
  });

  // 密码强度等级 (0-3)
  const strength = computed(() => {
    const pwd = password.value;
    if (!pwd) return 0;

    let level = 0;

    // 长度达到最小要求
    if (pwd.length >= mergedRules.minLength) level++;

    // 包含字母和数字
    if (hasLetter.value && hasNumber.value) level++;

    // 长度较长且包含特殊字符
    if (pwd.length >= 10 && hasSpecialChar.value) level++;

    return level;
  });

  // 强度文本
  const strengthText = computed(() => {
    const texts = ['', '弱', '中', '强'];
    return texts[strength.value];
  });

  // 强度 CSS 类名
  const strengthClass = computed(() => {
    const classes = ['', 'weak', 'medium', 'strong'];
    return classes[strength.value];
  });

  // 完整的验证结果
  const validation = computed<PasswordValidation>(() => ({
    isLengthValid: isLengthValid.value,
    hasLetter: hasLetter.value,
    hasNumber: hasNumber.value,
    hasSpecialChar: hasSpecialChar.value,
    isValid: isValid.value,
  }));

  return {
    strength,
    strengthText,
    strengthClass,
    hasLetter,
    hasNumber,
    hasSpecialChar,
    isLengthValid,
    isValid,
    validation,
  };
}
