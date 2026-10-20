import { computed, ref } from 'vue';
import { createPagedList, type PagedListOptions } from '@/store/helpers/paged-list';

export type UseListOptions<T, P extends object = object> = PagedListOptions<T, P>;

/** 每页条数默认值 */
const DEFAULT_LIMIT = 10;

/**
 * 页面级分页列表，基于 createPagedList，供不需要 store 的页面使用
 * 默认每页 10 条；page 为已加载到的页码，0 表示尚未加载；refresh 与 loadMore 失败时抛出错误
 *
 * @example
 * ```ts
 * const { list, loading, refreshing, error, hasMore, isEmpty, refresh, loadMore, retry } = useList({
 *   fetchPage: ({ page, limit }) => getArticles({ page, limit }),
 * });
 * ```
 */
export function useList<T, P extends object = object>(options: UseListOptions<T, P>) {
  const pager = createPagedList<T, P>({ limit: DEFAULT_LIMIT, ...options });

  /** 是否正在刷新，刷新时列表底部不显示加载更多 */
  const refreshing = ref(false);
  /** 列表为空，对应 UList 的 empty */
  const isEmpty = computed(() => pager.list.value.length === 0);

  let refreshTask: Promise<void> | null = null;
  let refreshKey = '';
  let lastFailed: 'refresh' | 'loadMore' | null = null;
  let params: P | undefined;

  /** 从第 1 页重新加载并记住查询参数；参数相同的刷新进行中时复用，参数不同时作废进行中的请求 */
  function refresh(nextParams?: P): Promise<void> {
    if (nextParams !== undefined) params = nextParams;
    const key = JSON.stringify(params ?? {});
    if (refreshTask && refreshKey === key) return refreshTask;
    refreshing.value = true;
    refreshKey = key;
    const task: Promise<void> = pager
      .loadPage(params, true)
      .then(({ stale }) => {
        if (!stale) lastFailed = null;
      })
      .catch(error => {
        lastFailed = 'refresh';
        throw error;
      })
      .finally(() => {
        if (refreshTask !== task) return;
        refreshing.value = false;
        refreshTask = null;
      });
    refreshTask = task;
    return task;
  }

  /** 加载下一页，加载中或没有更多时直接返回 */
  async function loadMore(): Promise<void> {
    try {
      const { stale } = await pager.loadPage(params);
      if (!stale) lastFailed = null;
    } catch (error) {
      lastFailed = 'loadMore';
      throw error;
    }
  }

  /** 清空列表并作废进行中的请求 */
  function reset() {
    pager.reset();
    refreshTask = null;
    refreshing.value = false;
    lastFailed = null;
  }

  /** 重新执行上一次失败的刷新或加载更多 */
  function retry(): Promise<void> {
    return lastFailed === 'loadMore' ? loadMore() : refresh();
  }

  return {
    list: pager.list,
    loading: pager.loading,
    refreshing,
    error: pager.error,
    hasMore: pager.hasMore,
    page: pager.page,
    total: pager.total,
    isEmpty,
    refresh,
    loadMore,
    retry,
    remove: pager.remove,
    reset,
  };
}
