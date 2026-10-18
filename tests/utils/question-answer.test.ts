import { describe, expect, it } from 'vitest';
import { QuestionType } from '@/api';
import { buildTrialAnswer, isObjectiveType, toggleOptionKey, trialResultOf } from '@/utils/question-answer';

describe('toggleOptionKey', () => {
  it('单选与判断只保留一个选项，再次点击取消', () => {
    expect(toggleOptionKey(QuestionType.SINGLE, ['A'], 'B')).toEqual(['B']);
    expect(toggleOptionKey(QuestionType.JUDGE, ['true'], 'true')).toEqual([]);
  });

  it('多选切换选项并按字母排序', () => {
    expect(toggleOptionKey(QuestionType.MULTIPLE, ['C'], 'A')).toEqual(['A', 'C']);
    expect(toggleOptionKey(QuestionType.MULTIPLE, ['A', 'C'], 'C')).toEqual(['A']);
  });
});

describe('buildTrialAnswer', () => {
  it('选择题提交选项', () => {
    expect(buildTrialAnswer(QuestionType.SINGLE, { keys: ['B'] })).toEqual({ keys: ['B'] });
    expect(buildTrialAnswer(QuestionType.MULTIPLE, { keys: ['A', 'C'] })).toEqual({ keys: ['A', 'C'] });
  });

  it('判断题提交布尔值', () => {
    expect(buildTrialAnswer(QuestionType.JUDGE, { keys: ['false'] })).toEqual({ value: false });
  });

  it('填空题按空数提交，未填的空为空字符串', () => {
    expect(buildTrialAnswer(QuestionType.FILL, { blanks: ['a', '', 'c'] })).toEqual({ blanks: ['a', '', 'c'] });
  });

  it('填空题去除首尾空白，全部为空时视为未作答', () => {
    expect(buildTrialAnswer(QuestionType.FILL, { blanks: [' 1 ', ''] })).toEqual({ blanks: ['1', ''] });
    expect(buildTrialAnswer(QuestionType.FILL, { blanks: [' '] })).toBeNull();
  });

  it('未作答与主观题返回 null', () => {
    expect(buildTrialAnswer(QuestionType.SINGLE, undefined)).toBeNull();
    expect(buildTrialAnswer(QuestionType.JUDGE, { keys: [] })).toBeNull();
    expect(buildTrialAnswer(QuestionType.ESSAY, { keys: ['A'] })).toBeNull();
  });
});

describe('isObjectiveType', () => {
  it('区分客观题与主观题', () => {
    expect(isObjectiveType(QuestionType.FILL)).toBe(true);
    expect(isObjectiveType(QuestionType.SHORT_ANSWER)).toBe(false);
    expect(isObjectiveType(QuestionType.MATERIAL)).toBe(false);
  });
});

describe('trialResultOf', () => {
  it('客观题按判分结果显示对错，未提交的为未作答', () => {
    expect(trialResultOf(QuestionType.SINGLE, true)).toBe('correct');
    expect(trialResultOf(QuestionType.FILL, false)).toBe('wrong');
    expect(trialResultOf(QuestionType.JUDGE, undefined)).toBe('skipped');
  });

  it('主观题无论是否作答都显示不判分', () => {
    expect(trialResultOf(QuestionType.ESSAY, undefined)).toBe('ungraded');
    expect(trialResultOf(QuestionType.SHORT_ANSWER, null)).toBe('ungraded');
  });
});
