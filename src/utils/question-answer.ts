import { QuestionType, type TrialAnswerDtoAnswer } from '@/api';

export interface DraftAnswer {
  keys?: string[];
  blanks?: string[];
  text?: string;
}

export function toggleOptionKey(type: QuestionType, keys: string[] = [], key: string): string[] {
  if (type !== QuestionType.MULTIPLE) return keys.length === 1 && keys[0] === key ? [] : [key];
  return keys.includes(key) ? keys.filter(item => item !== key) : [...keys, key].sort();
}

/** 未作答或题型不判分时返回 null */
export function buildTrialAnswer(type: QuestionType, draft: DraftAnswer | undefined): TrialAnswerDtoAnswer | null {
  const keys = draft?.keys ?? [];
  switch (type) {
    case QuestionType.SINGLE:
    case QuestionType.MULTIPLE:
      return keys.length > 0 ? { keys } : null;
    case QuestionType.JUDGE:
      return keys[0] === 'true' || keys[0] === 'false' ? { value: keys[0] === 'true' } : null;
    case QuestionType.FILL: {
      const blanks = (draft?.blanks ?? []).map(blank => blank.trim());
      return blanks.some(Boolean) ? { blanks } : null;
    }
    default:
      return null;
  }
}

export function isObjectiveType(type: QuestionType): boolean {
  return (
    type === QuestionType.SINGLE ||
    type === QuestionType.MULTIPLE ||
    type === QuestionType.JUDGE ||
    type === QuestionType.FILL
  );
}

export type TrialResult = 'correct' | 'wrong' | 'skipped' | 'ungraded';

export function trialResultOf(type: QuestionType, result: boolean | null | undefined): TrialResult {
  if (!isObjectiveType(type) || result === null) return 'ungraded';
  if (result === undefined) return 'skipped';
  return result ? 'correct' : 'wrong';
}

export function isSubjectiveType(type: QuestionType): boolean {
  return type === QuestionType.SHORT_ANSWER || type === QuestionType.ESSAY;
}

/** 练习作答：客观题同试做，主观题提交文字；未作答返回 null */
export function buildPracticeAnswer(
  type: QuestionType,
  draft: DraftAnswer | undefined,
): Record<string, unknown> | null {
  if (isSubjectiveType(type)) {
    const text = draft?.text ?? '';
    return text.trim() ? { text } : null;
  }
  return buildTrialAnswer(type, draft);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

/** 服务端保存的答案转为本地草稿 */
export function draftFromAnswer(type: QuestionType, answer: unknown): DraftAnswer {
  const record = asRecord(answer);
  if (!record) return {};
  switch (type) {
    case QuestionType.SINGLE:
    case QuestionType.MULTIPLE:
      return { keys: stringList(record.keys) };
    case QuestionType.JUDGE:
      return typeof record.value === 'boolean' ? { keys: [String(record.value)] } : {};
    case QuestionType.FILL:
      return { blanks: stringList(record.blanks) };
    case QuestionType.SHORT_ANSWER:
    case QuestionType.ESSAY:
      return typeof record.text === 'string' ? { text: record.text } : {};
    default:
      return {};
  }
}

/** 客观选择题的正确选项，判断题为 true / false */
export function correctOptionKeys(type: QuestionType, answer: unknown): string[] {
  const record = asRecord(answer);
  if (!record) return [];
  if (type === QuestionType.JUDGE) return typeof record.value === 'boolean' ? [String(record.value)] : [];
  if (type === QuestionType.SINGLE || type === QuestionType.MULTIPLE) return stringList(record.keys);
  return [];
}

export type OptionState = 'correct' | 'wrong' | 'missed';

/** 选项判分样式：选对 correct，选错 wrong，漏选的正确项 missed */
export function optionStatesOf(selected: string[], correct: string[]): Record<string, OptionState> {
  const states: Record<string, OptionState> = {};
  correct.forEach(key => (states[key] = selected.includes(key) ? 'correct' : 'missed'));
  selected.forEach(key => {
    if (!correct.includes(key)) states[key] = 'wrong';
  });
  return states;
}

export interface SolutionView {
  /** 正确答案文字，主观题为参考答案 */
  answer: string;
  /** 主观题要点 */
  points: string[];
}

/** 题目答案转为展示文字 */
export function solutionViewOf(type: QuestionType, answer: unknown): SolutionView {
  const record = asRecord(answer);
  if (!record) return { answer: '', points: [] };
  switch (type) {
    case QuestionType.SINGLE:
    case QuestionType.MULTIPLE:
      return { answer: stringList(record.keys).join('、'), points: [] };
    case QuestionType.JUDGE:
      return { answer: record.value === true ? '正确' : record.value === false ? '错误' : '', points: [] };
    case QuestionType.FILL: {
      const blanks = Array.isArray(record.blanks) ? record.blanks : [];
      const text = blanks.map((candidates, index) => `第 ${index + 1} 空：${stringList(candidates).join(' / ')}`);
      return { answer: text.join('；'), points: [] };
    }
    case QuestionType.SHORT_ANSWER:
    case QuestionType.ESSAY:
      return {
        answer: typeof record.reference === 'string' ? record.reference : '',
        points: stringList(record.points),
      };
    default:
      return { answer: '', points: [] };
  }
}
