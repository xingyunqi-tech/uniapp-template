import { describe, expect, test } from 'vitest';
import { formatDateTime, str2Date } from '../../src/utils/datetime';

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
