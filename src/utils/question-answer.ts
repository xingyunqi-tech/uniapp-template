import { QuestionType, type TrialAnswerDtoAnswer } from '@/api';

export interface DraftAnswer {
  keys?: string[];
  blanks?: string[];
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
