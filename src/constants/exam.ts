import type { ExamCategory, PaperType, PracticeMode, PracticeSessionStatus, QuestionType } from '@/api';

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

export const PRACTICE_MODE_LABELS: Record<PracticeMode, string> = {
  CHAPTER: '章节练习',
  RANDOM: '随机练习',
  TYPE: '题型专项',
  SMART: '智能练习',
  DAILY: '每日一练',
  WRONG: '错题重做',
  FAVORITE: '收藏练习',
  MOCK: '模拟考试',
  MEMORIZE: '背题模式',
};

export const PRACTICE_STATUS_LABELS: Record<PracticeSessionStatus, string> = {
  IN_PROGRESS: '进行中',
  SUBMITTED: '已完成',
  ABANDONED: '已放弃',
};

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  SINGLE: '单选题',
  MULTIPLE: '多选题',
  JUDGE: '判断题',
  FILL: '填空题',
  SHORT_ANSWER: '简答题',
  ESSAY: '作文',
  MATERIAL: '材料题',
};

/** 题型专项可选的题型 */
export const PRACTICE_QUESTION_TYPES: QuestionType[] = ['SINGLE', 'MULTIPLE', 'JUDGE', 'FILL', 'SHORT_ANSWER', 'ESSAY'];

export const DEFAULT_DAILY_GOAL = 30;
export const DAILY_GOAL_MIN = 1;
export const DAILY_GOAL_MAX = 500;
