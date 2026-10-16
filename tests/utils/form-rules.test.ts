import { describe, expect, it } from 'vitest';
import {
  collectDeps,
  isBlurOnlyRule,
  matchTrigger,
  phoneRules,
  smsCodeRules,
  validateRules,
  validateRulesSync,
} from '@/utils/form-rules';

describe('validateRules', () => {
  it('按顺序返回第一条错误，全部通过返回空字符串', () => {
    const rules = [
      { required: true, message: '必填' },
      { min: 3, message: '至少 3 位' },
    ];

    expect(validateRules('', rules, {})).toBe('必填');
    expect(validateRules('ab', rules, {})).toBe('至少 3 位');
    expect(validateRules('abc', rules, {})).toBe('');
  });

  it('validator 可访问 model，返回字符串作为错误信息', () => {
    const rules = [
      { validator: (value: unknown, model: { password: string }) => value === model.password, message: '不一致' },
      { validator: () => '自定义错误' },
    ];

    expect(validateRules('a', rules, { password: 'b' })).toBe('不一致');
    expect(validateRules('a', rules, { password: 'a' })).toBe('自定义错误');
  });

  it('值为空且非必填时跳过 pattern 与 validator', () => {
    expect(validateRules('', [{ pattern: /^\d+$/, validator: () => false }], {})).toBe('');
  });

  it('异步 validator 返回 Promise，并继续校验后续规则', async () => {
    const rules = [{ validator: () => Promise.resolve(true) }, { max: 2, message: '最多 2 位' }];

    const result = validateRules('abc', rules, {});
    expect(result).toBeInstanceOf(Promise);
    await expect(result).resolves.toBe('最多 2 位');
    await expect(
      validateRules('a', [{ validator: () => Promise.reject(new Error('x')), message: '失败' }], {}),
    ).resolves.toBe('失败');
  });

  it('手机号与验证码预置规则', () => {
    expect(validateRules('', phoneRules(), {})).toBe('请输入手机号');
    expect(validateRules('123', phoneRules(), {})).toBe('请输入正确的手机号');
    expect(validateRules('13800000000', phoneRules(), {})).toBe('');
    expect(validateRules('12a456', smsCodeRules(), {})).toBe('验证码为6位数字');
    expect(validateRules('123456', smsCodeRules(), {})).toBe('');
  });
});

describe('matchTrigger', () => {
  it('规则未设置 trigger 时使用默认时机', () => {
    expect(matchTrigger({}, 'blur', 'blur')).toBe(true);
    expect(matchTrigger({}, 'change', 'blur')).toBe(false);
    expect(matchTrigger({}, 'blur', 'submit')).toBe(false);
    expect(matchTrigger({ trigger: ['blur', 'change'] }, 'change', 'submit')).toBe(true);
  });
});

describe('validateRulesSync', () => {
  it('同步返回第一条错误，规则含异步 validator 时抛出错误', () => {
    expect(validateRulesSync('123', phoneRules(), {})).toBe('请输入正确的手机号');
    expect(() => validateRulesSync('a', [{ validator: () => Promise.resolve(true) }], {})).toThrow();
  });
});

describe('isBlurOnlyRule / collectDeps', () => {
  it('trigger 显式只含 blur 时为失焦规则', () => {
    expect(isBlurOnlyRule({ trigger: 'blur' })).toBe(true);
    expect(isBlurOnlyRule({ trigger: ['blur'] })).toBe(true);
    expect(isBlurOnlyRule({ trigger: ['blur', 'change'] })).toBe(false);
    expect(isBlurOnlyRule({})).toBe(false);
  });

  it('汇总规则声明的依赖字段并去重', () => {
    expect(collectDeps([{ deps: ['a'] }, { deps: ['a', 'b'] }, {}])).toEqual(['a', 'b']);
    expect(collectDeps(undefined)).toEqual([]);
  });
});
