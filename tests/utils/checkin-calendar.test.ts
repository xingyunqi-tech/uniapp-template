import { describe, expect, it } from 'vitest';
import { addDays, formatMonthLabel, monthCalendar, shanghaiMonth, shiftMonth } from '@/utils/checkin-calendar';

describe('shanghaiMonth', () => {
  it('按东八区换算月份', () => {
    expect(shanghaiMonth(Date.parse('2026-10-31T15:59:59Z'))).toBe('2026-10');
    expect(shanghaiMonth(Date.parse('2026-10-31T16:00:00Z'))).toBe('2026-11');
  });

  it('跨年时取东八区的新年月份', () => {
    expect(shanghaiMonth(Date.parse('2026-12-31T16:30:00Z'))).toBe('2027-01');
  });
});

describe('shiftMonth', () => {
  it('前后切换月份并处理跨年', () => {
    expect(shiftMonth('2026-10', 1)).toBe('2026-11');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
  });

  it('月份格式无效时抛错', () => {
    expect(() => shiftMonth('2026-1', 1)).toThrow();
  });
});

describe('addDays', () => {
  it('跨月与闰年加减天数', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2028-03-01', -1)).toBe('2028-02-29');
  });
});

describe('formatMonthLabel', () => {
  it('显示年与不补零的月', () => {
    expect(formatMonthLabel('2026-03')).toBe('2026 年 3 月');
  });
});

describe('monthCalendar', () => {
  it('周一开始，首尾用相邻月份补齐整周', () => {
    const weeks = monthCalendar('2026-10', [], '2026-10-17');

    expect(weeks).toHaveLength(5);
    expect(weeks.every(week => week.length === 7)).toBe(true);
    expect(weeks[0][0]).toMatchObject({ date: '2026-09-28', inMonth: false });
    expect(weeks[0][3]).toMatchObject({ date: '2026-10-01', day: 1, inMonth: true });
    expect(weeks[4][6]).toMatchObject({ date: '2026-11-01', inMonth: false });
  });

  it('月初为周一时不补前置日期', () => {
    const weeks = monthCalendar('2026-06', [], '2026-06-10');

    expect(weeks[0][0].date).toBe('2026-06-01');
  });

  it('标记打卡日、今天与未来日期', () => {
    const cells = monthCalendar('2026-10', ['2026-10-15', '2026-10-16'], '2026-10-17').flat();
    const byDate = Object.fromEntries(cells.map(cell => [cell.date, cell]));

    expect(byDate['2026-10-15'].checked).toBe(true);
    expect(byDate['2026-10-17']).toMatchObject({ isToday: true, checked: false, isFuture: false });
    expect(byDate['2026-10-18'].isFuture).toBe(true);
    expect(byDate['2026-10-14'].isFuture).toBe(false);
  });
});
