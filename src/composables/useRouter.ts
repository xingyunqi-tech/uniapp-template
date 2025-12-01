/**
 * 路由组合式 API
 * 提供类似 vue-router 的 useRouter 和 useRoute 体验
 */
import {
  navigateTo,
  redirectTo,
  navigateBack,
  switchTab,
  reLaunch,
  getCurrentRoute,
  getCurrentQuery,
  canGoBack,
  type QueryParams,
  type NavigateOptions,
} from '@/utils/router';

export interface Router {
  /** 跳转到指定页面 */
  push: (url: string, params?: QueryParams, options?: NavigateOptions) => Promise<void>;
  /** 替换当前页面 */
  replace: (url: string, params?: QueryParams) => Promise<void>;
  /** 返回上一页 */
  back: (delta?: number) => Promise<void>;
  /** 返回上一页 (别名) */
  go: (delta: number) => Promise<void>;
  /** 切换到 TabBar 页面 */
  switchTab: (url: string) => Promise<void>;
  /** 重启应用到指定页面 */
  reLaunch: (url: string, params?: QueryParams) => Promise<void>;
  /** 是否可以返回 */
  canGoBack: () => boolean;
}

export interface Route {
  /** 当前页面路径 */
  path: string;
  /** 当前页面完整路径 (含参数) */
  fullPath: string;
  /** 当前页面参数 */
  query: QueryParams;
  /** 页面栈中的索引 */
  index: number;
}

/**
 * 获取路由实例
 * @example
 * const router = useRouter();
 * router.push('/pages/detail/index', { id: 1 });
 * router.back();
 */
export function useRouter(): Router {
  return {
    push: navigateTo,
    replace: redirectTo,
    back: navigateBack,
    go: (delta: number) => navigateBack(Math.abs(delta)),
    switchTab,
    reLaunch,
    canGoBack,
  };
}

/**
 * 获取当前路由信息
 * @example
 * const route = useRoute();
 * console.log(route.path, route.query);
 */
export function useRoute(): Route {
  const pages = getCurrentPages();
  const path = getCurrentRoute();
  const query = getCurrentQuery();

  // 构建完整路径
  const queryString = Object.entries(query)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${v}`)
    .join('&');

  return {
    path,
    fullPath: queryString ? `${path}?${queryString}` : path,
    query,
    index: pages.length - 1,
  };
}

/**
 * 监听页面参数变化
 * 用于页面间传参时的响应式处理
 */
export function useRouteQuery<T extends QueryParams = QueryParams>(): T {
  return getCurrentQuery() as T;
}
