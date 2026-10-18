import { describe, expect, it } from 'vitest';
import {
  QuestionReportItemDtoStatus,
  QuestionReportItemDtoType,
  QuestionType,
  type QuestionReportItemDto,
} from '@/api';
import {
  REPORT_CONTENT_MAX_LENGTH,
  REPORT_REASON_OPTIONS,
  reportTargetOf,
  reportsPerChild,
  toReportDto,
  validateReportForm,
} from '@/utils/question-report';

function unit(id: string, stem: string, children?: object[]) {
  return {
    id,
    subjectId: 's1',
    parentId: null,
    type: children ? QuestionType.MATERIAL : QuestionType.SINGLE,
    version: 1,
    stem,
    options: null,
    material: children ? '材料' : null,
    audioFileId: null,
    audioUrl: null,
    blankCount: null,
    difficulty: 1,
    knowledgePointIds: [],
    isFree: true,
    sort: 0,
    ...(children ? { children } : {}),
  } as NonNullable<QuestionReportItemDto['question']>;
}

function report(questionId: string, question: QuestionReportItemDto['question']): QuestionReportItemDto {
  return {
    id: 1,
    userId: 1,
    type: QuestionReportItemDtoType.question_error,
    content: '',
    status: QuestionReportItemDtoStatus.pending,
    questionId,
    createdAt: '2026-10-18T00:00:00.000Z',
    question,
  };
}

describe('validateReportForm', () => {
  it('未选择原因时提示选择原因', () => {
    expect(validateReportForm({ reason: '', content: '说明' })).toBe('请选择纠错原因');
  });

  it('原因为其他时说明必填', () => {
    expect(validateReportForm({ reason: 'other', content: '  ' })).toBe('请填写问题说明');
    expect(validateReportForm({ reason: 'other', content: '选项重复' })).toBe('');
  });

  it('原因不是『其他』时说明可以为空', () => {
    expect(validateReportForm({ reason: 'answer_wrong', content: '' })).toBe('');
  });

  it('说明超过长度上限时提示', () => {
    const content = 'a'.repeat(REPORT_CONTENT_MAX_LENGTH + 1);
    expect(validateReportForm({ reason: 'stem_typo', content })).toContain(`${REPORT_CONTENT_MAX_LENGTH}`);
  });
});

describe('toReportDto', () => {
  it('去除首尾空白，说明为空时不传', () => {
    expect(toReportDto({ reason: 'analysis_wrong', content: '  ' })).toEqual({ reason: 'analysis_wrong' });
    expect(toReportDto({ reason: 'other', content: ' 说明 ' })).toEqual({ reason: 'other', content: '说明' });
  });
});

describe('REPORT_REASON_OPTIONS', () => {
  it('包含四种原因', () => {
    expect(REPORT_REASON_OPTIONS.map(option => option.value)).toEqual([
      'answer_wrong',
      'analysis_wrong',
      'stem_typo',
      'other',
    ]);
  });
});

describe('reportTargetOf', () => {
  it('材料题返回对应小题', () => {
    const child = unit('c2', '小题二');
    const item = report('c2', unit('m1', '', [unit('c1', '小题一'), child]));
    expect(reportTargetOf(item)?.stem).toBe('小题二');
  });

  it('普通题返回题目本身，题目缺失时返回 null', () => {
    expect(reportTargetOf(report('q1', unit('q1', '题干')))?.id).toBe('q1');
    expect(reportTargetOf(report('q1', null))).toBeNull();
  });
});

describe('reportsPerChild', () => {
  const material = {
    type: QuestionType.MATERIAL,
    children: [
      {
        id: 'c1',
        type: QuestionType.SINGLE,
        stem: '',
        options: [],
        material: null,
        audioUrl: null,
        blankCount: null,
        children: [],
      },
    ],
  };

  it('材料题按父题打开时按小题提供入口', () => {
    expect(reportsPerChild(material, 'm1')).toBe(true);
  });

  it('材料题按小题打开时使用顶部入口', () => {
    expect(reportsPerChild(material, 'c1')).toBe(false);
  });

  it('非材料题使用顶部入口', () => {
    expect(reportsPerChild({ type: QuestionType.SINGLE, children: [] }, 'q1')).toBe(false);
  });
});
