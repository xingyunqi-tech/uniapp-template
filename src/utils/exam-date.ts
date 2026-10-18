const SHANGHAI_OFFSET_MS = 8 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Asia/Shanghai 时区的日期，格式 YYYY-MM-DD */
export function shanghaiDate(now: Date | number = Date.now()): string {
  return new Date(new Date(now).getTime() + SHANGHAI_OFFSET_MS).toISOString().slice(0, 10);
}

function parseDate(value: string): number | null {
  if (!DATE_PATTERN.test(value)) return null;
  const time = Date.parse(`${value}T00:00:00Z`);
  if (Number.isNaN(time) || new Date(time).toISOString().slice(0, 10) !== value) return null;
  return time;
}

/** 按 Asia/Shanghai 日期计算距考试的天数：考试当天为 0，已过为负数，日期无效时为 null */
export function daysUntilExam(examDate: string | null | undefined, now: Date | number = Date.now()): number | null {
  const target = examDate ? parseDate(examDate) : null;
  if (target === null) return null;
  const today = parseDate(shanghaiDate(now)) as number;
  return Math.round((target - today) / DAY_MS);
}
