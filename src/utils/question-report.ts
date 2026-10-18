import {
  QuestionReportItemDtoStatus,
  QuestionReportReason,
  QuestionType,
  type CreateQuestionReportDto,
  type QuestionReportItemDto,
} from '@/api';
import type { TagType } from '@/components';
import type { QuestionView } from './question-content';

export const REPORT_CONTENT_MAX_LENGTH = 1000;

export const REPORT_REASON_LABELS: Record<QuestionReportReason, string> = {
  [QuestionReportReason.answer_wrong]: '答案错误',
  [QuestionReportReason.analysis_wrong]: '解析错误',
  [QuestionReportReason.stem_typo]: '题干错别字',
  [QuestionReportReason.other]: '其他',
};

export const REPORT_REASON_OPTIONS = Object.values(QuestionReportReason).map(value => ({
  value,
  label: REPORT_REASON_LABELS[value],
}));

export type ReportStatus = QuestionReportItemDtoStatus;

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  [QuestionReportItemDtoStatus.pending]: '待处理',
  [QuestionReportItemDtoStatus.processing]: '处理中',
  [QuestionReportItemDtoStatus.resolved]: '已解决',
  [QuestionReportItemDtoStatus.closed]: '已关闭',
};

export const REPORT_STATUS_TAG_TYPES: Record<ReportStatus, TagType> = {
  [QuestionReportItemDtoStatus.pending]: 'warning',
  [QuestionReportItemDtoStatus.processing]: 'primary',
  [QuestionReportItemDtoStatus.resolved]: 'success',
  [QuestionReportItemDtoStatus.closed]: 'default',
};

export interface ReportForm {
  reason: QuestionReportReason | '';
  content: string;
}

/** 校验纠错表单，通过时返回空字符串 */
export function validateReportForm(form: ReportForm): string {
  if (!form.reason) return '请选择纠错原因';
  const content = form.content.trim();
  if (form.reason === QuestionReportReason.other && !content) return '请填写问题说明';
  if (content.length > REPORT_CONTENT_MAX_LENGTH) return `说明不能超过 ${REPORT_CONTENT_MAX_LENGTH} 字`;
  return '';
}

/** 表单转提交参数，说明为空时不传 */
export function toReportDto(form: ReportForm): CreateQuestionReportDto {
  const content = form.content.trim();
  return { reason: form.reason as QuestionReportReason, ...(content ? { content } : {}) };
}

/** 纠错对应的可作答题目：材料小题取小题本身 */
export function reportTargetOf(item: QuestionReportItemDto) {
  const question = item.question;
  if (!question || !question.children?.length) return question;
  return question.children.find(child => child.id === item.questionId) ?? question;
}

/** 材料题按父题打开时，纠错入口放在每道小题处 */
export function reportsPerChild(view: Pick<QuestionView, 'type' | 'children'>, questionId: string): boolean {
  return view.type === QuestionType.MATERIAL && !view.children.some(child => child.id === questionId);
}
