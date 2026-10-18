import { describe, expect, it } from 'vitest';
import { useList } from '@/composables/useList';
import type { PageResult } from '@/store/helpers/paged-list';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function setup() {
  const calls: { page: number; limit: number; result: ReturnType<typeof deferred<PageResult<number>>> }[] = [];
  const list = useList<number>({
    limit: 2,
    fetchPage: ({ page, limit }) => {
      const result = deferred<PageResult<number>>();
      calls.push({ page, limit, result });
      return result.promise;
    },
  });
  return { ...list, calls };
}

describe('useList', () => {
  it('loadMore 按页追加，最后一页后标记没有更多且不再请求', async () => {
    const { list, page, hasMore, total, loadMore, calls } = setup();

    const first = loadMore();
    calls[0].result.resolve({ list: [1, 2], total: 3, totalPages: 2 });
    await first;
    const second = loadMore();
    calls[1].result.resolve({ list: [3], total: 3, totalPages: 2 });
    await second;
    await loadMore();

    expect(calls.map(c => [c.page, c.limit])).toEqual([
      [1, 2],
      [2, 2],
    ]);
    expect(list.value).toEqual([1, 2, 3]);
    expect(page.value).toBe(2);
    expect(total.value).toBe(3);
    expect(hasMore.value).toBe(false);
  });

  it('refresh 从第 1 页重新加载并替换列表', async () => {
    const { list, page, hasMore, loadMore, refresh, calls } = setup();

    const first = loadMore();
    calls[0].result.resolve({ list: [1, 2], totalPages: 1 });
    await first;
    const refreshing = refresh();
    calls[1].result.resolve({ list: [9, 8], totalPages: 2 });
    await refreshing;

    expect(calls[1].page).toBe(1);
    expect(list.value).toEqual([9, 8]);
    expect(page.value).toBe(1);
    expect(hasMore.value).toBe(true);
  });

  it('isEmpty 随列表是否为空变化', async () => {
    const { isEmpty, loadMore, calls } = setup();

    expect(isEmpty.value).toBe(true);
    const first = loadMore();
    calls[0].result.resolve({ list: [1], totalPages: 1 });
    await first;

    expect(isEmpty.value).toBe(false);
  });

  it('加载中时 loadMore 不发起请求', async () => {
    const { loadMore, refresh, calls } = setup();

    void refresh();
    await loadMore();

    expect(calls).toHaveLength(1);
  });

  it('加载失败时标记 error 并抛出，重试时清除', async () => {
    const { error, loadMore, calls } = setup();

    const failed = loadMore();
    calls[0].result.reject(new Error('500'));
    await expect(failed).rejects.toThrow('500');
    expect(error.value).toBe(true);

    const retry = loadMore();
    expect(error.value).toBe(false);
    calls[1].result.resolve({ list: [1], totalPages: 1 });
    await retry;
    expect(calls[1].page).toBe(1);
  });

  it('刷新失败时保留已有列表、页码与是否还有更多，继续上拉从原页码往后加载', async () => {
    const { list, total, error, hasMore, loadMore, refresh, calls } = setup();

    const first = loadMore();
    calls[0].result.resolve({ list: [1, 2], total: 4, totalPages: 2 });
    await first;
    const failed = refresh();
    calls[1].result.reject(new Error('network'));
    await expect(failed).rejects.toThrow('network');

    expect(list.value).toEqual([1, 2]);
    expect(total.value).toBe(4);
    expect(error.value).toBe(true);
    expect(hasMore.value).toBe(true);

    const next = loadMore();
    calls[2].result.resolve({ list: [3, 4], total: 4, totalPages: 2 });
    await next;
    expect(calls[2].page).toBe(2);
    expect(list.value).toEqual([1, 2, 3, 4]);
  });

  it('加载更多进行中刷新时丢弃加载更多的结果', async () => {
    const { list, page, loading, loadMore, refresh, calls } = setup();

    const first = loadMore();
    calls[0].result.resolve({ list: [1, 2], totalPages: 3 });
    await first;

    const loadingMore = loadMore();
    const refreshing = refresh();
    calls[2].result.resolve({ list: [10, 11], totalPages: 3 });
    await refreshing;
    calls[1].result.resolve({ list: [3, 4], totalPages: 3 });
    await loadingMore;

    expect(list.value).toEqual([10, 11]);
    expect(page.value).toBe(1);
    expect(loading.value).toBe(false);
  });

  it('重置后丢弃进行中请求的结果，作废请求失败时不抛出', async () => {
    const { list, loading, error, loadMore, reset, calls } = setup();

    const pending = loadMore();
    reset();
    calls[0].result.reject(new Error('network'));

    await expect(pending).resolves.toBeUndefined();
    expect(list.value).toEqual([]);
    expect(loading.value).toBe(false);
    expect(error.value).toBe(false);
  });

  it('默认每页 10 条', async () => {
    const limits: number[] = [];
    const { loadMore } = useList<number>({
      fetchPage: async ({ limit }) => {
        limits.push(limit);
        return { list: [], totalPages: 1 };
      },
    });
    await loadMore();
    expect(limits).toEqual([10]);
  });

  it('刷新期间 refreshing 为 true，并发刷新复用同一次请求', async () => {
    const { refreshing, refresh, calls } = setup();

    const a = refresh();
    const b = refresh();
    expect(a).toBe(b);
    expect(refreshing.value).toBe(true);
    expect(calls).toHaveLength(1);

    calls[0].result.resolve({ list: [1, 2], totalPages: 1 });
    await a;
    expect(refreshing.value).toBe(false);
  });

  it('全部加载完后刷新失败，retry 重新刷新并清除错误', async () => {
    const { list, error, hasMore, refresh, retry, calls } = setup();

    const first = refresh();
    calls[0].result.resolve({ list: [1, 2], totalPages: 1 });
    await first;
    expect(hasMore.value).toBe(false);

    const failed = refresh();
    calls[1].result.reject(new Error('network'));
    await expect(failed).rejects.toThrow('network');
    expect(error.value).toBe(true);

    const again = retry();
    expect(calls[2].page).toBe(1);
    calls[2].result.resolve({ list: [3, 4], totalPages: 1 });
    await again;
    expect(error.value).toBe(false);
    expect(list.value).toEqual([3, 4]);
  });

  it('加载更多失败后 retry 重新加载同一页', async () => {
    const { list, loadMore, retry, calls } = setup();

    const first = loadMore();
    calls[0].result.resolve({ list: [1, 2], totalPages: 3 });
    await first;
    const failed = loadMore();
    calls[1].result.reject(new Error('network'));
    await expect(failed).rejects.toThrow('network');

    const again = retry();
    expect(calls[2].page).toBe(2);
    calls[2].result.resolve({ list: [3, 4], totalPages: 3 });
    await again;
    expect(list.value).toEqual([1, 2, 3, 4]);
  });
});

describe('useList 查询参数', () => {
  interface Query {
    subjectId: string;
    type: string;
  }

  function setupWithParams() {
    const calls: { params: Query & { page: number }; result: ReturnType<typeof deferred<PageResult<string>>> }[] = [];
    const list = useList<string, Query>({
      limit: 2,
      fetchPage: ({ subjectId, type, page }) => {
        const result = deferred<PageResult<string>>();
        calls.push({ params: { subjectId, type, page }, result });
        return result.promise;
      },
    });
    return { ...list, calls };
  }

  it('加载中切换类型时重新请求，丢弃旧类型的结果', async () => {
    const { list, refreshing, refresh, calls } = setupWithParams();

    const all = refresh({ subjectId: 's1', type: 'ALL' });
    const real = refresh({ subjectId: 's1', type: 'REAL' });
    expect(calls.map(call => call.params.type)).toEqual(['ALL', 'REAL']);

    calls[1].result.resolve({ list: ['real'], totalPages: 1 });
    await real;
    calls[0].result.resolve({ list: ['all'], totalPages: 1 });
    await all;

    expect(list.value).toEqual(['real']);
    expect(refreshing.value).toBe(false);
  });

  it('加载中切换科目时重置后加载新科目，旧科目的结果不写入', async () => {
    const { list, isEmpty, loading, refresh, reset, calls } = setupWithParams();

    const first = refresh({ subjectId: 's1', type: 'ALL' });
    reset();
    expect(isEmpty.value).toBe(true);
    const second = refresh({ subjectId: 's2', type: 'ALL' });

    calls[0].result.resolve({ list: ['s1'], totalPages: 1 });
    await first;
    expect(list.value).toEqual([]);
    expect(loading.value).toBe(true);

    calls[1].result.resolve({ list: ['s2'], totalPages: 1 });
    await second;
    expect(list.value).toEqual(['s2']);
  });

  it('重置后以相同参数刷新时重新请求', async () => {
    const { list, refresh, reset, calls } = setupWithParams();

    const first = refresh({ subjectId: 's1', type: 'ALL' });
    reset();
    const second = refresh({ subjectId: 's1', type: 'ALL' });

    expect(calls).toHaveLength(2);
    calls[1].result.resolve({ list: ['a'], totalPages: 1 });
    await second;
    calls[0].result.resolve({ list: ['stale'], totalPages: 1 });
    await first;
    expect(list.value).toEqual(['a']);
  });

  it('相同参数的刷新复用进行中的请求，加载更多沿用上次的参数', async () => {
    const { list, refresh, loadMore, calls } = setupWithParams();

    const first = refresh({ subjectId: 's1', type: 'MOCK' });
    expect(refresh({ subjectId: 's1', type: 'MOCK' })).toBe(first);
    calls[0].result.resolve({ list: ['a', 'b'], totalPages: 2 });
    await first;

    const more = loadMore();
    expect(calls[1].params).toEqual({ subjectId: 's1', type: 'MOCK', page: 2 });
    calls[1].result.resolve({ list: ['c'], totalPages: 2 });
    await more;
    expect(list.value).toEqual(['a', 'b', 'c']);
  });
});
