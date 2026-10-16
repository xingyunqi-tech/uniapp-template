import { describe, expect, it } from 'vitest';
import { formatFileSize, formatIdCard, formatMoney, formatNumber } from '@/utils/formatters';

describe('formatNumber', () => {
  it('整数部分插入千分位', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
    expect(formatNumber(-1234)).toBe('-1,234');
    expect(formatNumber(123)).toBe('123');
  });

  it('小数部分不插入千分位', () => {
    expect(formatNumber(1234.5678)).toBe('1,234.5678');
  });
});

describe('formatFileSize', () => {
  it('按 1024 进位换算单位', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(1024 ** 3)).toBe('1 GB');
  });

  it('小于 1 字节时以 B 为单位', () => {
    expect(formatFileSize(0.5)).toBe('0.5 B');
  });

  it('超过 TB 时仍以 TB 为单位', () => {
    expect(formatFileSize(1024 ** 5)).toBe('1024 TB');
  });

  it('负数或非有限数返回 0 B', () => {
    expect(formatFileSize(-1)).toBe('0 B');
    expect(formatFileSize(Number.NaN)).toBe('0 B');
  });
});

describe('formatMoney', () => {
  it('分转元保留两位小数', () => {
    expect(formatMoney(12345)).toBe('123.45');
    expect(formatMoney(5)).toBe('0.05');
    expect(formatMoney(0)).toBe('0.00');
  });

  it('按整数运算四舍五入，不受浮点误差影响', () => {
    expect(formatMoney(115, 1)).toBe('1.2');
    expect(formatMoney(105, 1)).toBe('1.1');
    expect(formatMoney(150, 0)).toBe('2');
    expect(formatMoney(1005, 1)).toBe('10.1');
  });

  it('小数位超过 2 位时补零', () => {
    expect(formatMoney(115, 3)).toBe('1.150');
  });

  it('负数保留符号，舍入后为 0 时不带符号', () => {
    expect(formatMoney(-115, 1)).toBe('-1.2');
    expect(formatMoney(-4, 1)).toBe('0.0');
  });

  it('null、undefined 与 NaN 按 0 处理', () => {
    expect(formatMoney(undefined)).toBe('0.00');
    expect(formatMoney(null)).toBe('0.00');
    expect(formatMoney(Number.NaN)).toBe('0.00');
    expect(formatMoney(undefined, 0)).toBe('0');
  });
});

describe('formatIdCard', () => {
  it('隐藏中间部分，保留前 4 位与后 4 位', () => {
    expect(formatIdCard('110101199003071234')).toBe('1101**********1234');
  });

  it('支持尾号 X', () => {
    expect(formatIdCard('11010119900307123X')).toBe('1101**********123X');
    expect(formatIdCard('11010119900307123x')).toBe('1101**********123x');
  });

  it('长度不足 15 位时原样返回', () => {
    expect(formatIdCard('1234')).toBe('1234');
  });
});
