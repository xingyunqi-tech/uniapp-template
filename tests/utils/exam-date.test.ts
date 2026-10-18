import { describe, expect, it } from 'vitest';
import { daysUntilExam, shanghaiDate } from '@/utils/exam-date';

describe('shanghaiDate', () => {
  it('按东八区换算日期', () => {
    expect(shanghaiDate(Date.parse('2026-10-17T15:59:59Z'))).toBe('2026-10-17');
    expect(shanghaiDate(Date.parse('2026-10-17T16:00:00Z'))).toBe('2026-10-18');
  });
});

describe('daysUntilExam', () => {
  const now = Date.parse('2026-10-17T02:00:00Z');

  it('返回距考试日期的天数', () => {
    expect(daysUntilExam('2026-11-29', now)).toBe(43);
  });

  it('考试当天为 0，已过为负数', () => {
    expect(daysUntilExam('2026-10-17', now)).toBe(0);
    expect(daysUntilExam('2026-10-16', now)).toBe(-1);
  });

  it('UTC 日期尚未跨天时按上海日期计算', () => {
    expect(daysUntilExam('2026-10-18', Date.parse('2026-10-17T16:30:00Z'))).toBe(0);
  });

  it('跨越月份与闰年', () => {
    expect(daysUntilExam('2028-03-01', Date.parse('2028-02-27T04:00:00Z'))).toBe(3);
  });

  it('日期为空或无效时返回 null', () => {
    expect(daysUntilExam(null, now)).toBeNull();
    expect(daysUntilExam('', now)).toBeNull();
    expect(daysUntilExam('2026-02-30', now)).toBeNull();
    expect(daysUntilExam('2026/11/29', now)).toBeNull();
  });
});
