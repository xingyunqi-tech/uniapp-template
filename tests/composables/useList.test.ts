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

  it('加载失败时标记 error，再次加载时清除', async () => {
    const { error, loadData, calls } = setup();

    const failed = loadData();
    calls[0].result.reject(new Error('500'));
    await expect(failed).rejects.toThrow('500');
    expect(error.value).toBe(true);

    const retry = loadData();
    expect(error.value).toBe(false);
    calls[1].result.resolve([1, 2]);
    await retry;
    expect(error.value).toBe(false);
  });

  it('刷新失败后已无更多数据时，再次加载清除 error', async () => {
    const { error, noMore, loadData, refresh, calls } = setup();

    const first = loadData();
    calls[0].result.resolve([1]);
    await first;
    expect(noMore.value).toBe(true);

    const failed = refresh();
    calls[1].result.reject(new Error('500'));
    await expect(failed).rejects.toThrow('500');
    expect(error.value).toBe(true);

    await loadData();
    expect(error.value).toBe(false);
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

  it('加载更多时替换数组引用，不修改原数组', async () => {
    const { list, loadData, calls } = setup();

    const first = loadData();
    calls[0].result.resolve([1, 2]);
    await first;
    const firstPage = list.value;

    const second = loadData();
    calls[1].result.resolve([3, 4]);
    await second;

    expect(list.value).not.toBe(firstPage);
    expect(firstPage).toEqual([1, 2]);
    expect(list.value).toEqual([1, 2, 3, 4]);
  });

  it('updateItem 替换匹配项并生成新数组', async () => {
    const { list, loadData, updateItem, calls } = setup();

    const first = loadData();
    calls[0].result.resolve([1, 2]);
    await first;
    const before = list.value;

    updateItem(
      item => item === 2,
      item => item * 10,
    );

    expect(list.value).toEqual([1, 20]);
    expect(list.value).not.toBe(before);
  });

  it('removeItem 移除匹配项', async () => {
    const { list, loadData, removeItem, calls } = setup();

    const first = loadData();
    calls[0].result.resolve([1, 2]);
    await first;

    removeItem(item => item === 1);

    expect(list.value).toEqual([2]);
  });
});
