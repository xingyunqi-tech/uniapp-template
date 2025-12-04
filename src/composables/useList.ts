import { ref, computed, type Ref, type ComputedRef } from 'vue';

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
  /** 数据列表 */
  list: Ref<T[]>;
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
}

/**
 * 列表分页 Composable
 * 封装分页加载、下拉刷新、上拉加载更多逻辑
 */
export function useList<T>(options: UseListOptions<T>): UseListReturn<T> {
  const { fetchData, pageSize = 10, immediate = false, hasMore: customHasMore } = options;

  // 状态
  const list = ref<T[]>([]) as Ref<T[]>;
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

  // 加载数据
  async function loadData() {
    if (loading.value || noMore.value) return;

    loading.value = true;

    try {
      const data = await fetchData({ page: page.value, pageSize });

      if (page.value === 1) {
        list.value = data;
      } else {
        list.value.push(...data);
      }

      // 检查是否还有更多
      if (checkHasMore(data, page.value, pageSize)) {
        page.value++;
      } else {
        noMore.value = true;
      }
    } finally {
      loading.value = false;
    }
  }

  // 刷新数据
  async function refresh() {
    if (refreshing.value) return;

    refreshing.value = true;
    page.value = 1;
    noMore.value = false;

    try {
      const data = await fetchData({ page: 1, pageSize });
      list.value = data;

      if (checkHasMore(data, 1, pageSize)) {
        page.value = 2;
      } else {
        noMore.value = true;
      }
    } finally {
      refreshing.value = false;
    }
  }

  // 重置列表
  function reset() {
    list.value = [];
    page.value = 1;
    noMore.value = false;
    loading.value = false;
    refreshing.value = false;
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
  };
}
