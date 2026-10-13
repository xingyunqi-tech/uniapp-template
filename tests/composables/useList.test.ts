import { describe, expect, it } from 'vitest';
import { useList } from '@/composables/useList';

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
  const calls: { page: number; result: ReturnType<typeof deferred<number[]>> }[] = [];
  const list = useList<number>({
    pageSize: 2,
    fetchData: ({ page }) => {
      const result = deferred<number[]>();
      calls.push({ page, result });
      return result.promise;
    },
  });
  return { ...list, calls };
}

describe('useList', () => {
  it('按页追加数据并在不足一页时标记没有更多', async () => {
    const { list, noMore, loadData, calls } = setup();

    const first = loadData();
    calls[0].result.resolve([1, 2]);
    await first;
    const second = loadData();
    calls[1].result.resolve([3]);
    await second;

    expect(calls.map(c => c.page)).toEqual([1, 2]);
    expect(list.value).toEqual([1, 2, 3]);
    expect(noMore.value).toBe(true);
  });

  it('刷新进行中时触底不发起加载', async () => {
    const { loadData, refresh, calls } = setup();

    const refreshing = refresh();
    await loadData();
    calls[0].result.resolve([1, 2]);
    await refreshing;

    expect(calls).toHaveLength(1);
  });

  it('加载更多进行中刷新时丢弃加载结果，下一页从第 2 页开始', async () => {
    const { list, page, loading, loadData, refresh, calls } = setup();

    const first = loadData();
    calls[0].result.resolve([1, 2]);
    await first;

    const loadingMore = loadData();
    const refreshing = refresh();
    expect(loading.value).toBe(false);

    calls[2].result.resolve([10, 11]);
    await refreshing;
    calls[1].result.resolve([3, 4]);
    await loadingMore;

    expect(list.value).toEqual([10, 11]);
    expect(page.value).toBe(2);
  });

  it('刷新失败时保留原列表并抛出错误', async () => {
    const { list, page, refreshing, loadData, refresh, calls } = setup();

    const first = loadData();
    calls[0].result.resolve([1, 2]);
    await first;

    const pending = refresh();
    calls[1].result.reject(new Error('network'));

    await expect(pending).rejects.toThrow('network');
    expect(list.value).toEqual([1, 2]);
    expect(page.value).toBe(2);
    expect(refreshing.value).toBe(false);
  });

  it('重置后丢弃进行中请求的结果', async () => {
    const { list, loading, loadData, reset, calls } = setup();

    const pending = loadData();
    reset();
    calls[0].result.resolve([1, 2]);
    await pending;

    expect(list.value).toEqual([]);
    expect(loading.value).toBe(false);
  });

  it('作废请求失败时不抛出错误', async () => {
    const { loadData, reset, calls } = setup();

    const pending = loadData();
    reset();
    calls[0].result.reject(new Error('network'));

    await expect(pending).resolves.toBeUndefined();
  });
});
