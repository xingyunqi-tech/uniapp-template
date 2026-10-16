import { describe, expect, it, vi } from 'vitest';
import { createPagedList, type PageResult } from '@/store/helpers/paged-list';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function setup(options: { limit?: number; onPageLoaded?: (items: number[], page: number) => void } = {}) {
  const calls: { params: Record<string, unknown>; result: ReturnType<typeof deferred<PageResult<number>>> }[] = [];
  const pager = createPagedList<number, { status?: string }>({
    ...options,
    fetchPage: params => {
      const result = deferred<PageResult<number>>();
      calls.push({ params, result });
      return result.promise;
    },
  });
  return { ...pager, calls };
}

describe('createPagedList', () => {
  it('按页追加，带上查询参数与每页条数，最后一页后标记没有更多', async () => {
    const { list, hasMore, page, load, calls } = setup({ limit: 2 });

    const first = load({ status: 'PAID' }, true);
    calls[0].result.resolve({ list: [1, 2], totalPages: 2 });
    await first;
    const second = load({ status: 'PAID' });
    calls[1].result.resolve({ list: [3], totalPages: 2 });
    await second;

    expect(calls.map(c => c.params)).toEqual([
      { status: 'PAID', page: 1, limit: 2 },
      { status: 'PAID', page: 2, limit: 2 },
    ]);
    expect(list.value).toEqual([1, 2, 3]);
    expect(page.value).toBe(2);
    expect(hasMore.value).toBe(false);
    await load();
    expect(calls).toHaveLength(2);
  });

  it('没有 totalPages 时按 total 判断是否还有更多', async () => {
    const { hasMore, load, calls } = setup();

    const pending = load(undefined, true);
    calls[0].result.resolve({ list: [1, 2], total: 3 });
    await pending;

    expect(hasMore.value).toBe(true);
  });

  it('加载中时再次加载下一页直接返回', async () => {
    const { load, calls } = setup();

    void load(undefined, true);
    await load();

    expect(calls).toHaveLength(1);
  });

  it('刷新时丢弃进行中请求的结果', async () => {
    const { list, loading, load, calls } = setup();

    const stale = load(undefined, true);
    const fresh = load(undefined, true);
    calls[1].result.resolve({ list: [9], totalPages: 1 });
    await fresh;
    calls[0].result.resolve({ list: [1], totalPages: 1 });
    await stale;

    expect(list.value).toEqual([9]);
    expect(loading.value).toBe(false);
  });

  it('失败时标记 error 并抛出，再次加载时清除', async () => {
    const { error, load, calls } = setup();

    const failed = load(undefined, true);
    calls[0].result.reject(new Error('500'));
    await expect(failed).rejects.toThrow('500');
    expect(error.value).toBe(true);

    const retry = load(undefined, true);
    expect(error.value).toBe(false);
    calls[1].result.resolve({ list: [], totalPages: 0 });
    await retry;
  });

  it('刷新失败时保留已有列表、页码与是否还有更多，下一次加载接着往后请求', async () => {
    const { list, page, hasMore, load, calls } = setup();

    const first = load(undefined, true);
    calls[0].result.resolve({ list: [1, 2], totalPages: 2 });
    await first;
    const failed = load(undefined, true);
    calls[1].result.reject(new Error('500'));
    await expect(failed).rejects.toThrow('500');

    expect(list.value).toEqual([1, 2]);
    expect(page.value).toBe(1);
    expect(hasMore.value).toBe(true);
    void load();
    expect(calls[2].params).toMatchObject({ page: 2 });
  });

  it('被作废的请求失败时不抛出也不标记 error', async () => {
    const { error, load, reset, calls } = setup();

    const stale = load(undefined, true);
    reset();
    calls[0].result.reject(new Error('500'));

    await expect(stale).resolves.toEqual([]);
    expect(error.value).toBe(false);
  });

  it('每页写入后调用 onPageLoaded', async () => {
    const onPageLoaded = vi.fn();
    const { load, calls } = setup({ onPageLoaded });

    const pending = load(undefined, true);
    calls[0].result.resolve({ list: [1, 2], totalPages: 1 });
    await pending;

    expect(onPageLoaded).toHaveBeenCalledWith([1, 2], 1);
  });
});

describe('createPagedList loadPage', () => {
  it('被作废的请求返回 stale，生效的请求返回 stale 为 false', async () => {
    const { loadPage, calls } = setup();

    const stale = loadPage(undefined, true);
    const fresh = loadPage(undefined, true);
    calls[1].result.resolve({ list: [9], totalPages: 1 });
    calls[0].result.resolve({ list: [1], totalPages: 1 });

    await expect(fresh).resolves.toEqual({ list: [9], stale: false });
    await expect(stale).resolves.toEqual({ list: [9], stale: true });
  });

  it('被作废的请求失败时返回 stale', async () => {
    const { loadPage, reset, calls } = setup();

    const stale = loadPage(undefined, true);
    reset();
    calls[0].result.reject(new Error('500'));

    await expect(stale).resolves.toEqual({ list: [], stale: true });
  });
});
