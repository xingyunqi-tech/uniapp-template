import { describe, expect, it } from 'vitest';
import { AnswerCardStatus, QuestionType } from '@/api';
import { answerCardStatus, reportCardStatus, type CardItemState } from '@/utils/practice-card';

function item(overrides: Partial<CardItemState> = {}): CardItemState {
  return {
    type: QuestionType.SINGLE,
    answered: true,
    isCorrect: null,
    isPartial: false,
    selfAssessment: null,
    hiddenReason: null,
    ...overrides,
  };
}

describe('answerCardStatus', () => {
  it('未作答为 unanswered', () => {
    expect(answerCardStatus(item({ answered: false }), true)).toBe('unanswered');
  });

  it('按判分结果映射对、错、部分正确', () => {
    expect(answerCardStatus(item({ isCorrect: true }), true)).toBe('correct');
    expect(answerCardStatus(item({ isCorrect: false }), true)).toBe('wrong');
    expect(answerCardStatus(item({ isCorrect: false, isPartial: true }), true)).toBe('partial');
  });

  it('已提交未自评的主观题为待自评', () => {
    expect(answerCardStatus(item({ type: QuestionType.SHORT_ANSWER }), true)).toBe('pendingSelf');
  });

  it('进行中的模考或答案隐藏时只显示已答', () => {
    expect(answerCardStatus(item({ type: QuestionType.ESSAY }), false)).toBe('answered');
    expect(answerCardStatus(item({ type: QuestionType.ESSAY, hiddenReason: 'mockInProgress' }), true)).toBe('answered');
    expect(answerCardStatus(item(), false)).toBe('answered');
  });
});

describe('reportCardStatus', () => {
  it('映射报告答题卡状态，答案不可见为 hidden', () => {
    expect(reportCardStatus({ status: AnswerCardStatus.CORRECT })).toBe('correct');
    expect(reportCardStatus({ status: AnswerCardStatus.PARTIAL })).toBe('partial');
    expect(reportCardStatus({ status: AnswerCardStatus.UNANSWERED })).toBe('unanswered');
    expect(reportCardStatus({ status: AnswerCardStatus.PENDING_SELF_ASSESSMENT })).toBe('pendingSelf');
    expect(reportCardStatus({ status: null })).toBe('hidden');
  });
});
