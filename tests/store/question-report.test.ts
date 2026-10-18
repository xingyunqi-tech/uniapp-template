import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { nextTick } from 'vue';
import type { QuestionReportItemDto } from '@/api';

const api = vi.hoisted(() => ({
  createQuestionReport: vi.fn(),
  getMyQuestionReports: vi.fn(),
}));

vi.mock('@/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@/api')>()),
  ...api,
}));

const { useQuestionReportStore } = await import('@/store/modules/question-report');
const { useUserStore } = await import('@/store/modules/user');

function item(id: number, status: QuestionReportItemDto['status'] = 'pending'): QuestionReportItemDto {
  return {
    id,
    userId: 1,
    type: 'question_error',
    content: '',
    status,
    reason: 'answer_wrong',
    questionId: `q${id}`,
    createdAt: '2026-10-18T00:00:00.000Z',
    question: null,
  };
}

function page(list: QuestionReportItemDto[], totalPages = 1) {
  return { list, total: list.length, page: 1, limit: 20, totalPages };
}

beforeEach(() => {
  setActivePinia(createPinia());
  Object.values(api).forEach(fn => fn.mockReset());
  useUserStore().token = 'token';
});

describe('question-report store', () => {
  it('提交纠错时去除说明首尾空白并标记列表待刷新', async () => {
    const store = useQuestionReportStore();
    api.createQuestionReport.mockResolvedValueOnce({});

    await store.submit('q1', { reason: 'other', content: ' 选项重复 ' });

    expect(api.createQuestionReport).toHaveBeenCalledWith('q1', { reason: 'other', content: '选项重复' });
    expect(store.dirty).toBe(true);
    expect(store.submitting).toBe(false);
  });

  it('表单校验不通过时不发请求', async () => {
    const store = useQuestionReportStore();

    await expect(store.submit('q1', { reason: 'other', content: '' })).rejects.toThrow('请填写问题说明');
    await expect(store.submit('q1', { reason: '', content: '' })).rejects.toThrow('请选择纠错原因');
    expect(api.createQuestionReport).not.toHaveBeenCalled();
  });

  it('提交失败时恢复提交状态且不标记待刷新', async () => {
    const store = useQuestionReportStore();
    api.createQuestionReport.mockRejectedValueOnce(new Error('network'));

    await expect(store.submit('q1', { reason: 'stem_typo', content: '' })).rejects.toThrow('network');
    expect(store.submitting).toBe(false);
    expect(store.dirty).toBe(false);
  });

  it('按状态筛选加载列表，全部状态时不传 status', async () => {
    const store = useQuestionReportStore();
    api.getMyQuestionReports.mockResolvedValueOnce(page([item(1), item(2, 'resolved')]));
    api.getMyQuestionReports.mockResolvedValueOnce(page([item(2, 'resolved')]));

    await store.fetchReports(true);
    await store.setStatus('resolved');

    expect(api.getMyQuestionReports).toHaveBeenNthCalledWith(1, { page: 1, limit: 20 });
    expect(api.getMyQuestionReports).toHaveBeenNthCalledWith(2, { status: 'resolved', page: 1, limit: 20 });
    expect(store.reports.map(report => report.id)).toEqual([2]);
  });

  it('切换状态后请求返回前清空旧列表', async () => {
    const store = useQuestionReportStore();
    api.getMyQuestionReports.mockResolvedValueOnce(page([item(1)]));
    await store.fetchReports(true);
    let resolve: (value: unknown) => void = () => undefined;
    api.getMyQuestionReports.mockReturnValueOnce(new Promise(r => (resolve = r)));

    const pending = store.setStatus('closed');

    expect(store.reports).toEqual([]);
    expect(store.loading).toBe(true);
    resolve(page([item(2, 'closed')]));
    await pending;
    expect(store.reports.map(report => report.id)).toEqual([2]);
  });

  it('加载下一页时追加列表', async () => {
    const store = useQuestionReportStore();
    api.getMyQuestionReports.mockResolvedValueOnce(page([item(1)], 2));
    api.getMyQuestionReports.mockResolvedValueOnce({ ...page([item(2)], 2), page: 2 });

    await store.fetchReports(true);
    expect(store.hasMore).toBe(true);
    await store.fetchReports();

    expect(api.getMyQuestionReports).toHaveBeenLastCalledWith({ page: 2, limit: 20 });
    expect(store.reports.map(report => report.id)).toEqual([1, 2]);
    expect(store.hasMore).toBe(false);
  });

  it('刷新列表后清除待刷新标记', async () => {
    const store = useQuestionReportStore();
    store.dirty = true;
    api.getMyQuestionReports.mockResolvedValueOnce(page([]));

    await store.fetchReports(true);

    expect(store.dirty).toBe(false);
  });

  it('退出登录时清空列表与筛选', async () => {
    const store = useQuestionReportStore();
    api.getMyQuestionReports.mockResolvedValueOnce(page([item(1)]));
    await store.setStatus('pending');

    useUserStore().token = '';
    await nextTick();

    expect(store.reports).toEqual([]);
    expect(store.status).toBe('');
  });
});
