import { ref, type Ref } from 'vue';

/** 分页接口返回的数据 */
export interface PageResult<T> {
  list?: T[];
  total?: number;
  totalPages?: number;
}

/** 一次加载的结果；stale 为 true 表示请求已被更新的请求或 reset 作废，结果未写入列表 */
export interface PagedLoadResult<T> {
  list: T[];
  stale: boolean;
}

export interface PagedListOptions<T, P> {
  /** 请求一页数据，page 从 1 开始 */
  fetchPage: (params: P & { page: number; limit: number }) => Promise<PageResult<T>>;
  /** 每页条数，默认 20 */
  limit?: number;
  /** 一页数据写入列表后调用，可用于同步缓存 */
  onPageLoaded?: (items: T[], page: number) => void;
}

/**
 * 分页列表状态：页码、加载、错误与是否还有更多；新请求发出后丢弃旧请求的结果，第 1 页替换列表，其余页追加
 *
 * @example
 * ```ts
 * const pager = createPagedList({ fetchPage: params => getAddresses(params) });
 * await pager.load({}, true); // 刷新
 * await pager.load(); // 加载下一页
 * ```
 */
export function createPagedList<T, P extends object = object>(options: PagedListOptions<T, P>) {
  const { fetchPage, limit = 20, onPageLoaded } = options;

  const list = ref<T[]>([]) as Ref<T[]>;
  const loading = ref(false);
  const error = ref(false);
  const hasMore = ref(true);
  /** 已加载到的页码，0 表示尚未加载 */
  const page = ref(0);
  const total = ref(0);

  let requestId = 0;
  /** 上次加载后经 remove 移除的条数 */
  let removed = 0;
  /** 进行中的追加请求 id，0 表示没有 */
  let appendingId = 0;
  /** 当前列表数据对应的查询参数 */
  let loadedKey = '';

  function paramsKey(params?: P): string {
    return JSON.stringify(params ?? {});
  }

  /**
   * 加载下一页；refresh 为 true 时从第 1 页重新加载并作废进行中的请求
   * 加载中或没有更多时直接返回当前列表；页码与是否还有更多只在请求成功后更新，
   * 查询参数变化后的刷新失败时，下一次加载从第 1 页开始；
   * 经 remove 移除过条目时，下一次加载按移除条数回退位置补齐；追加请求进行中时 remove 会作废该请求
   * 请求失败时抛出错误，被作废的请求失败时不抛出并标记 stale
   */
  async function loadPage(params?: P, refresh = false): Promise<PagedLoadResult<T>> {
    if (!refresh && (loading.value || !hasMore.value)) {
      return { list: list.value, stale: false };
    }

    const id = ++requestId;
    const offset = refresh || page.value === 0 ? 0 : Math.max(0, page.value * limit - removed);
    appendingId = offset === 0 ? 0 : id;
    const next = Math.floor(offset / limit) + 1;
    loading.value = true;
    error.value = false;
    try {
      const result = await fetchPage({ ...(params ?? ({} as P)), page: next, limit });
      if (id !== requestId) return { list: list.value, stale: true };

      const items = (result.list ?? []).slice(offset % limit);
      list.value = offset === 0 ? items : [...list.value, ...items];
      total.value = result.total ?? list.value.length;
      hasMore.value = result.totalPages !== undefined ? next < result.totalPages : list.value.length < total.value;
      page.value = next;
      removed = 0;
      loadedKey = paramsKey(params);
      onPageLoaded?.(items, next);
      return { list: list.value, stale: false };
    } catch (err) {
      if (id !== requestId) return { list: list.value, stale: true };
      if (refresh && paramsKey(params) !== loadedKey) {
        page.value = 0;
        hasMore.value = true;
      }
      error.value = true;
      throw err;
    } finally {
      if (id === requestId) loading.value = false;
    }
  }

  /** 同 loadPage，只返回列表 */
  async function load(params?: P, refresh = false): Promise<T[]> {
    return (await loadPage(params, refresh)).list;
  }

  /** 从列表移除一条并减少总数，下一次加载补齐服务端随之前移的条目 */
  function remove(index: number) {
    if (index < 0 || index >= list.value.length) return;
    list.value.splice(index, 1);
    total.value = Math.max(0, total.value - 1);
    removed++;
    if (loading.value && appendingId === requestId) {
      requestId++;
      loading.value = false;
    }
  }

  /** 清空列表并作废进行中的请求 */
  function reset() {
    requestId++;
    removed = 0;
    list.value = [];
    loading.value = false;
    error.value = false;
    hasMore.value = true;
    page.value = 0;
    total.value = 0;
    loadedKey = '';
  }

  return { list, loading, error, hasMore, page, total, load, loadPage, remove, reset };
}
