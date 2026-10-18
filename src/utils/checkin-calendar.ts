import { shanghaiDate } from './exam-date';

const DAY_MS = 24 * 60 * 60 * 1000;
const MONTH_PATTERN = /^(\d{4})-(\d{2})$/;

export const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'] as const;

export interface CalendarCell {
  /** YYYY-MM-DD */
  date: string;
  day: number;
  inMonth: boolean;
  checked: boolean;
  isToday: boolean;
  isFuture: boolean;
}

function toDateString(time: number): string {
  return new Date(time).toISOString().slice(0, 10);
}

function parseMonth(month: string): { year: number; month: number } {
  const match = MONTH_PATTERN.exec(month);
  if (!match) throw new Error(`无效的月份：${month}`);
  return { year: Number(match[1]), month: Number(match[2]) };
}

/** YYYY-MM-DD */
export function addDays(date: string, days: number): string {
  return toDateString(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS);
}

/** Asia/Shanghai 时区的月份，格式 YYYY-MM */
export function shanghaiMonth(now: Date | number = Date.now()): string {
  return shanghaiDate(now).slice(0, 7);
}

/** YYYY-MM */
export function shiftMonth(month: string, delta: number): string {
  const parsed = parseMonth(month);
  return toDateString(Date.UTC(parsed.year, parsed.month - 1 + delta, 1)).slice(0, 7);
}

export function formatMonthLabel(month: string): string {
  const parsed = parseMonth(month);
  return `${parsed.year} 年 ${parsed.month} 月`;
}

/** 月视图按周排列，周一为每周第一天，首尾以相邻月份的日期补齐 */
export function monthCalendar(month: string, checkedDates: Iterable<string>, today: string): CalendarCell[][] {
  const parsed = parseMonth(month);
  const first = Date.UTC(parsed.year, parsed.month - 1, 1);
  const last = Date.UTC(parsed.year, parsed.month, 0);
  const leading = (new Date(first).getUTCDay() + 6) % 7;
  const trailing = 6 - ((new Date(last).getUTCDay() + 6) % 7);
  const checked = new Set(checkedDates);
  const weeks: CalendarCell[][] = [];
  for (let time = first - leading * DAY_MS; time <= last + trailing * DAY_MS; time += DAY_MS) {
    const date = toDateString(time);
    if (weeks.length === 0 || weeks[weeks.length - 1].length === 7) weeks.push([]);
    weeks[weeks.length - 1].push({
      date,
      day: new Date(time).getUTCDate(),
      inMonth: date.slice(0, 7) === month,
      checked: checked.has(date),
      isToday: date === today,
      isFuture: date > today,
    });
  }
  return weeks;
}
