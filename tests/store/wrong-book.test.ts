import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { nextTick } from 'vue';
import type { WrongBookSummaryDto, WrongQuestionDto } from '@/api';

const api = vi.hoisted(() => ({
  getWrongBook: vi.fn(),
  getWrongBookSummary: vi.fn(),
  masterWrongQuestion: vi.fn(),
  restoreWrongQuestion: vi.fn(),
}));

vi.mock('@/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@/api')>()),
  ...api,
}));

const { useWrongBookStore } = await import('@/store/modules/wrong-book');
const { useUserStore } = await import('@/store/modules/user');

function wrong(questionId: string, overrides: Partial<WrongQuestionDto> = {}): WrongQuestionDto {
  return {
    questionId,
    subjectId: 's1',
    wrongCount: 1,
    consecutiveCorrect: 0,
    lastCorrectDate: null,
    lastWrongAnswer: null,
    firstWrongAt: '2026-10-15T00:00:00.000Z',
    lastWrongAt: '2026-10-16T00:00:00.000Z',
    status: 'ACTIVE',
    masteredAt: null,
    question: null,
    isOffline: false,
    hiddenReason: null,
    ...overrides,
  };
}

function summary(activeCount: number): WrongBookSummaryDto {
  return {
    activeCount,
    weeklyAdded: 1,
    weeklyMastered: 0,
    weekStart: '2026-10-11T16:00:00.000Z',
    bySubject: [],
    byKnowledgePoint: [],
  };
}

function page(list: WrongQuestionDto[], total = list.length) {
  return { list, total, page: 1, limit: 20, totalPages: Math.max(1, Math.ceil(total / 20)) };
}

beforeEach(() => {
  setActivePinia(createPinia());
  Object.values(api).forEach(fn => fn.mockReset());
  useUserStore().token = 'token';
});

describe('wrong-book store', () => {
  it('按当前筛选条件请求列表', async () => {
    const store = useWrongBookStore();
    api.getWrongBook.mockResolvedValueOnce(page([wrong('q1')]));

    store.setFilter({ subjectId: 's1', count: 'many' });
    await store.fetchList(true);

    expect(api.getWrongBook).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'ACTIVE', subjectId: 's1', minWrongCount: 3, page: 1, limit: 20 }),
    );
    expect(store.list.map(item => item.questionId)).toEqual(['q1']);
  });

  it('切换科目时清空知识点，同时指定时保留', () => {
    const store = useWrongBookStore();

    store.setFilter({ subjectId: 's1', knowledgePointId: 'k1' });
    expect(store.filter.knowledgePointId).toBe('k1');
    store.setFilter({ count: 'once' });
    expect(store.filter.knowledgePointId).toBe('k1');
    store.setFilter({ subjectId: 's2' });
    expect(store.filter.knowledgePointId).toBe('');
  });

  it('汇总按当前科目请求，全部科目时不带参数', async () => {
    const store = useWrongBookStore();
    api.getWrongBookSummary.mockResolvedValue(summary(3));

    await store.fetchSummary();
    store.setFilter({ subjectId: 's1' });
    await store.fetchSummary();

    expect(api.getWrongBookSummary).toHaveBeenNthCalledWith(1, undefined);
    expect(api.getWrongBookSummary).toHaveBeenNthCalledWith(2, { subjectId: 's1' });
    expect(store.summary?.activeCount).toBe(3);
  });

  it('汇总请求乱序返回时只保留最后一次请求的结果', async () => {
    const store = useWrongBookStore();
    let resolveFirst: (value: WrongBookSummaryDto) => void = () => undefined;
    api.getWrongBookSummary
      .mockReturnValueOnce(new Promise(resolve => (resolveFirst = resolve)))
      .mockResolvedValueOnce(summary(5));

    const first = store.fetchSummary();
    store.setFilter({ subjectId: 's2' });
    await store.fetchSummary();
    resolveFirst(summary(9));
    await first;

    expect(store.summary?.activeCount).toBe(5);
  });

  it('移出、恢复与重做后标记列表需要刷新，刷新后清除', async () => {
    const store = useWrongBookStore();
    api.getWrongBook.mockResolvedValue(page([wrong('q1')]));
    api.masterWrongQuestion.mockResolvedValueOnce(wrong('q1', { status: 'MASTERED' }));
    api.getWrongBookSummary.mockResolvedValue(summary(0));
    await store.fetchList(true);
    expect(store.dirty).toBe(false);

    await store.master('q1');
    expect(store.dirty).toBe(true);
    await store.fetchList(true);
    expect(store.dirty).toBe(false);

    store.markDirty();
    expect(store.dirty).toBe(true);
  });

  it('移出后从待复习列表删除并刷新汇总', async () => {
    const store = useWrongBookStore();
    api.getWrongBook.mockResolvedValueOnce(page([wrong('q1'), wrong('q2')]));
    api.masterWrongQuestion.mockResolvedValueOnce({ ...wrong('q1', { status: 'MASTERED' }) });
    api.getWrongBookSummary.mockResolvedValueOnce(summary(1));
    await store.fetchList(true);

    await store.master('q1');
    await nextTick();

    expect(api.masterWrongQuestion).toHaveBeenCalledWith('q1');
    expect(store.list.map(item => item.questionId)).toEqual(['q2']);
    expect(store.total).toBe(1);
    expect(api.getWrongBookSummary).toHaveBeenCalledTimes(1);
  });

  it('恢复后从已移出列表删除', async () => {
    const store = useWrongBookStore();
    store.setFilter({ status: 'MASTERED' });
    api.getWrongBook.mockResolvedValueOnce(page([wrong('q1', { status: 'MASTERED' })]));
    api.restoreWrongQuestion.mockResolvedValueOnce(wrong('q1', { status: 'ACTIVE', consecutiveCorrect: 0 }));
    api.getWrongBookSummary.mockResolvedValueOnce(summary(1));
    await store.fetchList(true);

    await store.restore('q1');

    expect(store.list).toHaveLength(0);
  });

  it('状态与当前筛选一致时原位更新', async () => {
    const store = useWrongBookStore();
    api.getWrongBook.mockResolvedValueOnce(page([wrong('q1', { consecutiveCorrect: 2 })]));
    api.restoreWrongQuestion.mockResolvedValueOnce(wrong('q1', { consecutiveCorrect: 0 }));
    api.getWrongBookSummary.mockResolvedValueOnce(summary(1));
    await store.fetchList(true);

    await store.restore('q1');

    expect(store.list[0].consecutiveCorrect).toBe(0);
  });

  it('移出失败时列表不变并抛出错误', async () => {
    const store = useWrongBookStore();
    api.getWrongBook.mockResolvedValueOnce(page([wrong('q1')]));
    api.masterWrongQuestion.mockRejectedValueOnce(new Error('fail'));
    await store.fetchList(true);

    await expect(store.master('q1')).rejects.toThrow('fail');
    expect(store.list).toHaveLength(1);
  });

  it('退出登录后清空列表、汇总与筛选', async () => {
    const store = useWrongBookStore();
    api.getWrongBook.mockResolvedValueOnce(page([wrong('q1')]));
    api.getWrongBookSummary.mockResolvedValueOnce(summary(1));
    store.setFilter({ subjectId: 's1' });
    await Promise.all([store.fetchList(true), store.fetchSummary()]);

    useUserStore().token = '';
    await nextTick();

    expect(store.list).toHaveLength(0);
    expect(store.summary).toBeNull();
    expect(store.filter.subjectId).toBe('');
  });
});
