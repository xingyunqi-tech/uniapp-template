import { GetWrongBookOrder, WrongBookSortField, WrongQuestionStatus, type GetWrongBookParams } from '@/api';
import { addDays } from './checkin-calendar';
import { shanghaiDate } from './exam-date';

export type WrongCountFilter = 'all' | 'once' | 'twice' | 'many';
export type WrongTimeFilter = 'all' | 'today' | 'week' | 'month';
export type WrongSortKey = 'recent' | 'added' | 'count';

export interface WrongBookFilter {
  status: WrongQuestionStatus;
  /** 空字符串表示全部科目 */
  subjectId: string;
  /** 空字符串表示全部知识点 */
  knowledgePointId: string;
  count: WrongCountFilter;
  time: WrongTimeFilter;
  sort: WrongSortKey;
}

export type WrongBookQuery = Omit<GetWrongBookParams, 'page' | 'limit'>;

export interface FilterOption<T extends string> {
  value: T;
  label: string;
}

export const DEFAULT_WRONG_BOOK_FILTER: WrongBookFilter = {
  status: WrongQuestionStatus.ACTIVE,
  subjectId: '',
  knowledgePointId: '',
  count: 'all',
  time: 'all',
  sort: 'recent',
};

export const WRONG_COUNT_OPTIONS: FilterOption<WrongCountFilter>[] = [
  { value: 'all', label: '全部次数' },
  { value: 'once', label: '错 1 次' },
  { value: 'twice', label: '错 2 次' },
  { value: 'many', label: '错 3 次及以上' },
];

export const WRONG_TIME_OPTIONS: FilterOption<WrongTimeFilter>[] = [
  { value: 'all', label: '全部时间' },
  { value: 'today', label: '今天' },
  { value: 'week', label: '近 7 天' },
  { value: 'month', label: '近 30 天' },
];

export const WRONG_SORT_OPTIONS: FilterOption<WrongSortKey>[] = [
  { value: 'recent', label: '最近答错' },
  { value: 'added', label: '最近加入' },
  { value: 'count', label: '错误次数最多' },
];

const COUNT_RANGES: Record<WrongCountFilter, Pick<GetWrongBookParams, 'minWrongCount' | 'maxWrongCount'>> = {
  all: {},
  once: { minWrongCount: 1, maxWrongCount: 1 },
  twice: { minWrongCount: 2, maxWrongCount: 2 },
  many: { minWrongCount: 3 },
};

const TIME_DAYS: Record<Exclude<WrongTimeFilter, 'all'>, number> = { today: 1, week: 7, month: 30 };

const SORT_FIELDS: Record<WrongSortKey, WrongBookSortField> = {
  recent: WrongBookSortField.lastWrongAt,
  added: WrongBookSortField.firstWrongAt,
  count: WrongBookSortField.wrongCount,
};

/** Asia/Shanghai 当天零点，带时区的 ISO 8601 */
export function shanghaiDayStart(date: string): string {
  return `${date}T00:00:00+08:00`;
}

/** 时间按 Asia/Shanghai 自然日起算 */
export function buildWrongBookParams(filter: WrongBookFilter, now: Date | number = Date.now()): WrongBookQuery {
  const params: WrongBookQuery = {
    status: filter.status,
    sortBy: SORT_FIELDS[filter.sort],
    order: GetWrongBookOrder.DESC,
    ...COUNT_RANGES[filter.count],
  };
  if (filter.subjectId) params.subjectId = filter.subjectId;
  if (filter.knowledgePointId) params.knowledgePointId = filter.knowledgePointId;
  if (filter.time !== 'all') {
    params.lastWrongFrom = shanghaiDayStart(addDays(shanghaiDate(now), 1 - TIME_DAYS[filter.time]));
  }
  return params;
}

export function optionLabel<T extends string>(options: FilterOption<T>[], value: T): string {
  return options.find(option => option.value === value)?.label ?? '';
}

/** 题干摘要：去掉常见 Markdown 标记，图片显示为 [图片]，公式显示为 [公式]，合并空白并截断 */
export function previewText(text: string | null | undefined, max = 80): string {
  if (!text) return '';
  const plain = text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '[图片]')
    .replace(/\$\$[\s\S]+?\$\$/g, '[公式]')
    .replace(/(^|[^\\])\$([^\s$](?:[^$\n]*?[^\s$\\])?)\$/g, '$1[公式]')
    .replace(/\\\$/g, '$')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}(#{1,6}\s+|>\s?|[-*+]\s+|\d+\.\s+)/gm, '')
    .replace(/`{1,3}/g, '')
    .replace(/(\*\*|__|~~)(.+?)\1/g, '$2')
    .replace(/(^|[^*\w])[*_]([^*_\n]+)[*_](?=[^*\w]|$)/g, '$1$2')
    .replace(/\|/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > max ? `${plain.slice(0, max)}…` : plain;
}
