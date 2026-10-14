import { ref, shallowRef, computed, type Ref, type ShallowRef, type ComputedRef } from 'vue';

export interface UseListOptions<T> {
  /** 获取数据的函数，返回数据列表 */
  fetchData: (params: { page: number; pageSize: number }) => Promise<T[]>;
  /** 每页数量，默认 10 */
  pageSize?: number;
  /** 是否立即加载，默认 false */
  immediate?: boolean;
  /** 判断是否还有更多数据，默认根据返回数量判断 */
  hasMore?: (data: T[], page: number, pageSize: number) => boolean;
}

export interface UseListReturn<T> {
  /** 数据列表 (shallowRef：原地修改不会触发更新，用 updateItem / removeItem 修改) */
  list: ShallowRef<T[]>;
  /** 是否正在加载 */
  loading: Ref<boolean>;
  /** 是否正在刷新 */
  refreshing: Ref<boolean>;
  /** 是否没有更多数据 */
  noMore: Ref<boolean>;
  /** 当前页码 */
  page: Ref<number>;
  /** 是否为空 */
  isEmpty: ComputedRef<boolean>;
  /** 加载数据 */
  loadData: () => Promise<void>;
  /** 刷新数据 */
  refresh: () => Promise<void>;
  /** 重置列表 */
  reset: () => void;
  /** 更新匹配的列表项 */
  updateItem: (predicate: (item: T) => boolean, updater: (item: T) => T) => void;
  /** 移除匹配的列表项 */
  removeItem: (predicate: (item: T) => boolean) => void;
}

/**
 * 列表分页 Composable
 * 封装分页加载、下拉刷新、上拉加载更多逻辑
 *
 * @example
 * ```typescript
 * // 基本用法
 * const { list, loading, noMore, loadData, refresh } = useList({
 *   fetchData: async ({ page, pageSize }) => {
 *     const res = await api.getList({ page, pageSize });
 *     return res.data;
 *   },
 * });
 *
 * // 修改列表项
 * updateItem(item => item.id === id, item => ({ ...item, liked: true }));
 * removeItem(item => item.id === id);
 * ```
 */
export function useList<T>(options: UseListOptions<T>): UseListReturn<T> {
  const { fetchData, pageSize = 10, immediate = false, hasMore: customHasMore } = options;

  // 状态
  const list = shallowRef<T[]>([]);
  const loading = ref(false);
  const refreshing = ref(false);
  const noMore = ref(false);
  const page = ref(1);

  // 是否为空
  const isEmpty = computed(() => !loading.value && !refreshing.value && list.value.length === 0);

  // 默认判断是否还有更多
  const defaultHasMore = (data: T[], _page: number, _pageSize: number) => {
    return data.length >= _pageSize;
  };

  const checkHasMore = customHasMore || defaultHasMore;

  /** 最近一次请求的序号，refresh/reset 时递增使进行中的请求作废 */
  let requestId = 0;

  // 加载数据
  async function loadData() {
    if (loading.value || refreshing.value || noMore.value) return;

    const id = ++requestId;
    const currentPage = page.value;
    loading.value = true;

    let data: T[];
    try {
      data = await fetchData({ page: currentPage, pageSize });
    } catch (error) {
      if (id !== requestId) return;
      throw error;
    } finally {
      if (id === requestId) loading.value = false;
    }
    if (id !== requestId) return;

    list.value = currentPage === 1 ? data : [...list.value, ...data];

    // 检查是否还有更多
    if (checkHasMore(data, currentPage, pageSize)) {
      page.value = currentPage + 1;
    } else {
      noMore.value = true;
    }
  }

  // 刷新数据
  async function refresh() {
    if (refreshing.value) return;

    const id = ++requestId;
    loading.value = false;
    refreshing.value = true;

    let data: T[];
    try {
      data = await fetchData({ page: 1, pageSize });
    } catch (error) {
      if (id !== requestId) return;
      throw error;
    } finally {
      if (id === requestId) refreshing.value = false;
    }
    if (id !== requestId) return;

    list.value = data;

    if (checkHasMore(data, 1, pageSize)) {
      page.value = 2;
      noMore.value = false;
    } else {
      noMore.value = true;
    }
  }

  // 重置列表
  function reset() {
    requestId++;
    list.value = [];
    page.value = 1;
    noMore.value = false;
    loading.value = false;
    refreshing.value = false;
  }

  function updateItem(predicate: (item: T) => boolean, updater: (item: T) => T) {
    list.value = list.value.map(item => (predicate(item) ? updater(item) : item));
  }

  function removeItem(predicate: (item: T) => boolean) {
    list.value = list.value.filter(item => !predicate(item));
  }

  // 立即加载
  if (immediate) {
    loadData();
  }

  return {
    list,
    loading,
    refreshing,
    noMore,
    page,
    isEmpty,
    loadData,
    refresh,
    reset,
    updateItem,
    removeItem,
  };
}
