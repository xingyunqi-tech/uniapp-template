import { describe, expect, it } from 'vitest';
import { ref } from 'vue';
import { usePasswordStrength, DEFAULT_PASSWORD_RULES } from '@/composables/usePasswordStrength';

describe('usePasswordStrength', () => {
  it('根据 ref 密码计算强度与校验结果', () => {
    const password = ref('');
    const result = usePasswordStrength(password);

    expect(result.strength.value).toBe(0);
    expect(result.isValid.value).toBe(false);

    password.value = 'abc12345';

    expect(result.strength.value).toBe(2);
    expect(result.strengthText.value).toBe('中');
    expect(result.strengthClass.value).toBe('medium');
    expect(result.isValid.value).toBe(true);
  });

  it('密码与规则可传 getter，规则变化时重新校验', () => {
    const minLength = ref(6);
    const result = usePasswordStrength(
      () => 'abc123',
      () => ({ minLength: minLength.value }),
    );

    expect(result.rules.value).toEqual({ ...DEFAULT_PASSWORD_RULES, minLength: 6 });
    expect(result.isLengthValid.value).toBe(true);

    minLength.value = 8;

    expect(result.isLengthValid.value).toBe(false);
    expect(result.isValid.value).toBe(false);
  });

  it('requireSpecialChar 时缺少特殊字符视为不合法', () => {
    const result = usePasswordStrength(ref('abc12345'), { requireSpecialChar: true });

    expect(result.hasSpecialChar.value).toBe(false);
    expect(result.isValid.value).toBe(false);
  });
});
