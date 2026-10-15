import { describe, expect, it } from 'vitest';
import { formatFileSize, formatNumber } from '@/utils/formatters';

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
