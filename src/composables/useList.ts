import { computed, ref } from 'vue';
import { createPagedList, type PagedListOptions } from '@/store/helpers/paged-list';

export type UseListOptions<T> = PagedListOptions<T, object>;

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
export function useList<T>(options: UseListOptions<T>) {
  const pager = createPagedList<T>({ limit: DEFAULT_LIMIT, ...options });

  /** 是否正在刷新，刷新时列表底部不显示加载更多 */
  const refreshing = ref(false);
  /** 列表为空，对应 UList 的 empty */
  const isEmpty = computed(() => pager.list.value.length === 0);

  let refreshTask: Promise<void> | null = null;
  let lastFailed: 'refresh' | 'loadMore' | null = null;

  /** 从第 1 页重新加载；刷新进行中时复用同一次刷新 */
  function refresh(): Promise<void> {
    if (refreshTask) return refreshTask;
    refreshing.value = true;
    refreshTask = pager
      .loadPage(undefined, true)
      .then(({ stale }) => {
        if (!stale) lastFailed = null;
      })
      .catch(error => {
        lastFailed = 'refresh';
        throw error;
      })
      .finally(() => {
        refreshing.value = false;
        refreshTask = null;
      });
    return refreshTask;
  }

  /** 加载下一页，加载中或没有更多时直接返回 */
  async function loadMore(): Promise<void> {
    try {
      const { stale } = await pager.loadPage();
      if (!stale) lastFailed = null;
    } catch (error) {
      lastFailed = 'loadMore';
      throw error;
    }
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
    reset: pager.reset,
  };
}
