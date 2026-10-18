import { AnswerCardStatus, type AnswerCardItemDto, type HiddenReason, type ReportCardItemDto } from '@/api';
import { isSubjectiveType } from './question-answer';

export type CardStatus = 'correct' | 'wrong' | 'partial' | 'unanswered' | 'answered' | 'pendingSelf' | 'hidden';

export const CARD_STATUS_TEXT: Record<CardStatus, string> = {
  correct: '正确',
  wrong: '错误',
  partial: '部分正确',
  unanswered: '未答',
  answered: '已答',
  pendingSelf: '待自评',
  hidden: '暂不可见',
};

export const HIDDEN_REASON_TEXT: Record<HiddenReason, string> = {
  mockInProgress: '该题在进行中的模拟考试里，交卷后才能查看答案',
};

export type CardItemState = Pick<
  AnswerCardItemDto,
  'type' | 'answered' | 'isCorrect' | 'isPartial' | 'selfAssessment' | 'hiddenReason'
>;

/** 答题卡状态；revealed 为会话允许展示判分（非进行中的模考） */
export function answerCardStatus(item: CardItemState, revealed: boolean): CardStatus {
  if (!item.answered) return 'unanswered';
  if (item.isCorrect === true) return 'correct';
  if (item.isPartial) return 'partial';
  if (item.isCorrect === false) return 'wrong';
  if (revealed && !item.hiddenReason && isSubjectiveType(item.type) && item.selfAssessment === null) {
    return 'pendingSelf';
  }
  return 'answered';
}

const REPORT_STATUS: Record<AnswerCardStatus, CardStatus> = {
  [AnswerCardStatus.CORRECT]: 'correct',
  [AnswerCardStatus.WRONG]: 'wrong',
  [AnswerCardStatus.PARTIAL]: 'partial',
  [AnswerCardStatus.UNANSWERED]: 'unanswered',
  [AnswerCardStatus.PENDING_SELF_ASSESSMENT]: 'pendingSelf',
};

export function reportCardStatus(item: Pick<ReportCardItemDto, 'status'>): CardStatus {
  return item.status ? REPORT_STATUS[item.status] : 'hidden';
}
