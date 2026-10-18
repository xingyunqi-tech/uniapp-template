import type { ExamCategory, PaperType } from '@/api';

export const EXAM_CATEGORY_LABELS: Record<ExamCategory, string> = {
  CIVIL_SERVICE: '公务员',
  PUBLIC_INSTITUTION: '事业单位',
  TEACHER: '教师资格',
  COLLEGE_ENGLISH: '大学英语',
  POSTGRADUATE: '考研',
  COMPUTER: '计算机',
  OTHER: '其他',
};

export const PAPER_TYPE_LABELS: Record<PaperType, string> = {
  REAL: '真题',
  MOCK: '模拟卷',
  SPECIAL: '专项卷',
  GENERATED: '组卷',
};

export const DEFAULT_DAILY_GOAL = 30;
export const DAILY_GOAL_MIN = 1;
export const DAILY_GOAL_MAX = 500;
