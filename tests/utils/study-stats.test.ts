import { describe, expect, it } from 'vitest';
import { dailyProgressPercent, formatMastery, masteryLevel } from '@/utils/study-stats';

describe('formatMastery', () => {
  it('百分制掌握度四舍五入为整数百分比', () => {
    expect(formatMastery(45.49)).toBe('45%');
    expect(formatMastery(45.5)).toBe('46%');
    expect(formatMastery(0)).toBe('0%');
    expect(formatMastery(100)).toBe('100%');
  });

  it('null 或缺失时显示数据不足', () => {
    expect(formatMastery(null)).toBe('数据不足');
    expect(formatMastery(undefined)).toBe('数据不足');
  });
});

describe('masteryLevel', () => {
  it('按 60 与 80 划分薄弱、一般、良好', () => {
    expect(masteryLevel(59.99)).toBe('weak');
    expect(masteryLevel(60)).toBe('fair');
    expect(masteryLevel(79.99)).toBe('fair');
    expect(masteryLevel(80)).toBe('good');
  });

  it('数据不足时为 none', () => {
    expect(masteryLevel(null)).toBe('none');
  });
});

describe('dailyProgressPercent', () => {
  it('按每日目标计算百分比，超过目标时为 100', () => {
    expect(dailyProgressPercent(10, 30)).toBe(33);
    expect(dailyProgressPercent(45, 30)).toBe(100);
  });

  it('没有每日目标时为 null', () => {
    expect(dailyProgressPercent(10, null)).toBeNull();
    expect(dailyProgressPercent(10, 0)).toBeNull();
  });
});
