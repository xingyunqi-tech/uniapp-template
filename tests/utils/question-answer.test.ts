import { describe, expect, it } from 'vitest';
import { QuestionType } from '@/api';
import {
  buildPracticeAnswer,
  buildTrialAnswer,
  correctOptionKeys,
  draftFromAnswer,
  isObjectiveType,
  optionStatesOf,
  solutionViewOf,
  toggleOptionKey,
  trialResultOf,
} from '@/utils/question-answer';

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

describe('buildPracticeAnswer', () => {
  it('主观题提交文字，空白视为未作答', () => {
    expect(buildPracticeAnswer(QuestionType.SHORT_ANSWER, { text: ' 答案 ' })).toEqual({ text: ' 答案 ' });
    expect(buildPracticeAnswer(QuestionType.ESSAY, { text: '  ' })).toBeNull();
  });

  it('客观题与试做一致', () => {
    expect(buildPracticeAnswer(QuestionType.JUDGE, { keys: ['true'] })).toEqual({ value: true });
    expect(buildPracticeAnswer(QuestionType.MULTIPLE, {})).toBeNull();
  });
});

describe('draftFromAnswer', () => {
  it('按题型还原草稿', () => {
    expect(draftFromAnswer(QuestionType.MULTIPLE, { keys: ['A', 'C'] })).toEqual({ keys: ['A', 'C'] });
    expect(draftFromAnswer(QuestionType.JUDGE, { value: false })).toEqual({ keys: ['false'] });
    expect(draftFromAnswer(QuestionType.FILL, { blanks: ['x', ''] })).toEqual({ blanks: ['x', ''] });
    expect(draftFromAnswer(QuestionType.SHORT_ANSWER, { text: '文字' })).toEqual({ text: '文字' });
  });

  it('答案为空或结构不符时返回空草稿', () => {
    expect(draftFromAnswer(QuestionType.SINGLE, null)).toEqual({});
    expect(draftFromAnswer(QuestionType.JUDGE, { value: 'yes' })).toEqual({});
  });
});

describe('correctOptionKeys 与 optionStatesOf', () => {
  it('选择题取 keys，判断题取布尔值字符串，其他题型为空', () => {
    expect(correctOptionKeys(QuestionType.MULTIPLE, { keys: ['A', 'D'] })).toEqual(['A', 'D']);
    expect(correctOptionKeys(QuestionType.JUDGE, { value: true })).toEqual(['true']);
    expect(correctOptionKeys(QuestionType.FILL, { blanks: [['a']] })).toEqual([]);
  });

  it('选对、选错与漏选分别标记', () => {
    expect(optionStatesOf(['A', 'B'], ['A', 'C'])).toEqual({ A: 'correct', B: 'wrong', C: 'missed' });
  });
});

describe('solutionViewOf', () => {
  it('客观题答案转为文字', () => {
    expect(solutionViewOf(QuestionType.MULTIPLE, { keys: ['A', 'C'] }).answer).toBe('A、C');
    expect(solutionViewOf(QuestionType.JUDGE, { value: false }).answer).toBe('错误');
    expect(solutionViewOf(QuestionType.FILL, { blanks: [['a', 'b'], ['c']] }).answer).toBe(
      '第 1 空：a / b；第 2 空：c',
    );
  });

  it('主观题返回参考答案与要点', () => {
    expect(solutionViewOf(QuestionType.SHORT_ANSWER, { reference: '参考', points: ['一', '二'] })).toEqual({
      answer: '参考',
      points: ['一', '二'],
    });
    expect(solutionViewOf(QuestionType.ESSAY, null)).toEqual({ answer: '', points: [] });
  });
});
