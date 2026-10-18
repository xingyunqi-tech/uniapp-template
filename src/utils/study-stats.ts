export const MASTERY_INSUFFICIENT_TEXT = '数据不足';
export const WEAK_MASTERY_THRESHOLD = 60;

export type MasteryLevel = 'none' | 'weak' | 'fair' | 'good';

/** 掌握度为百分制，null 表示作答不足 */
export function formatMastery(mastery: number | null | undefined): string {
  if (mastery === null || mastery === undefined) return MASTERY_INSUFFICIENT_TEXT;
  return `${Math.round(mastery)}%`;
}

export function masteryLevel(mastery: number | null | undefined): MasteryLevel {
  if (mastery === null || mastery === undefined) return 'none';
  if (mastery < WEAK_MASTERY_THRESHOLD) return 'weak';
  return mastery < 80 ? 'fair' : 'good';
}

/** 今日进度百分比（0-100），没有每日目标时为 null */
export function dailyProgressPercent(answered: number, goal: number | null | undefined): number | null {
  if (!goal || goal <= 0) return null;
  return Math.min(100, Math.round((answered / goal) * 100));
}
