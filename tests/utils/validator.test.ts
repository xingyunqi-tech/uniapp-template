import { afterEach, describe, expect, it, vi } from 'vitest';
import { isIdCard, required, validateValue } from '@/utils/validator';

describe('required', () => {
  it('空值与仅含空白的字符串不通过', () => {
    for (const value of [undefined, null, '', '   ', '\n\t', []]) {
      expect(validateValue(value, [required('必填')])).toEqual({ valid: false, message: '必填' });
    }
  });

  it('含非空白内容时通过', () => {
    expect(validateValue(' a ', [required()])).toEqual({ valid: true });
    expect(validateValue(0, [required()])).toEqual({ valid: true });
  });
});

describe('isIdCard', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('校验码正确时通过，末位 X 不区分大小写', () => {
    expect(isIdCard('110101199003071233')).toBe(true);
    expect(isIdCard('11010519491231002X')).toBe(true);
    expect(isIdCard('11010519491231002x')).toBe(true);
  });

  it('校验码错误时不通过', () => {
    expect(isIdCard('110101199003071234')).toBe(false);
    expect(isIdCard('110105194912310021')).toBe(false);
  });

  it('出生日期不存在时不通过', () => {
    expect(isIdCard('110101199002301235')).toBe(false);
    expect(isIdCard('110101199013011235')).toBe(false);
  });

  it('出生日期晚于今天时不通过', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(1999, 11, 30));
    expect(isIdCard('440306199912310018')).toBe(false);
    vi.setSystemTime(new Date(2000, 0, 1));
    expect(isIdCard('440306199912310018')).toBe(true);
  });

  it('位数或格式不符时不通过', () => {
    expect(isIdCard('11010119900307123')).toBe(false);
    expect(isIdCard('110101900307123')).toBe(false);
    expect(isIdCard('A10101199003071233')).toBe(false);
  });
});
