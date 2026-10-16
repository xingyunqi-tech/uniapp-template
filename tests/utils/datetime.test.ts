import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { formatDateTime, formatRelativeTime, str2Date } from '../../src/utils/datetime';

test('formatDateTime', () => {
  expect(formatDateTime(new Date('2025-08-21 10:00:00'), 'YYYY-MM-DD')).toBe('2025-08-21');
});

describe('str2Date', () => {
  test('横杠、斜杠与中文日期都解析为本地时间', () => {
    const expected = new Date(2024, 0, 2, 10, 30).getTime();
    expect(str2Date('2024-01-02 10:30')?.getTime()).toBe(expected);
    expect(str2Date('2024/01/02 10:30')?.getTime()).toBe(expected);
    expect(str2Date('2024年1月2日 10:30')?.getTime()).toBe(expected);
  });

  test('纯日期解析为本地零点', () => {
    expect(str2Date('2024-01-02')?.getTime()).toBe(new Date(2024, 0, 2).getTime());
  });

  test('ISO 格式按原样解析', () => {
    expect(str2Date('2024-01-02T10:30:00Z')?.getTime()).toBe(Date.UTC(2024, 0, 2, 10, 30));
  });

  test('空字符串或无法解析时返回 null', () => {
    expect(str2Date('')).toBeNull();
    expect(str2Date('not a date')).toBeNull();
  });
});

describe('字符串入参按本地时间解析', () => {
  test('formatDateTime 解析 YYYY-MM-DD HH:mm', () => {
    expect(formatDateTime('2024-01-02 10:30', 'YYYY/MM/DD HH:mm')).toBe('2024/01/02 10:30');
  });

  test('formatDateTime 无法解析时返回空字符串', () => {
    expect(formatDateTime('not a date')).toBe('');
  });
});

describe('formatRelativeTime', () => {
  const now = new Date(2024, 5, 15, 12, 0, 0);

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('过去时间按相对时间显示', () => {
    expect(formatRelativeTime('2024-06-15 11:55:00')).toBe('5分钟前');
    expect(formatRelativeTime(new Date(2024, 5, 13, 12, 0, 0))).toBe('2天前');
  });

  test('时钟偏差范围内的未来时间显示刚刚', () => {
    expect(formatRelativeTime(now.getTime() + 2 * 60 * 1000)).toBe('刚刚');
  });

  test('明显的未来时间显示具体日期', () => {
    expect(formatRelativeTime('2024-06-16 09:30')).toBe('2024-06-16 09:30');
  });
});
