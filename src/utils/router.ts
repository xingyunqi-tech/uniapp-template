/**
 * UniApp 路由工具函数
 * 封装 uni-app 路由 API，提供类似 vue-router 的使用体验
 */

/** 动画类型 */
export type AnimationType =
  | 'auto'
  | 'none'
  | 'slide-in-right'
  | 'slide-in-left'
  | 'slide-in-top'
  | 'slide-in-bottom'
  | 'fade-in'
  | 'zoom-out'
  | 'zoom-fade-out'
  | 'pop-in';

export interface NavigateOptions {
  /** 跳转动画效果 */
  animationType?: AnimationType;
  /** 跳转动画时长 */
  animationDuration?: number;
  /** 传递的事件 */

  events?: Record<string, (...args: any[]) => void>;
}

export interface QueryParams {
  [key: string]: string | number | boolean | undefined;
}

/**
 * 将查询参数对象转换为 URL 查询字符串
 */
function buildQueryString(params?: QueryParams): string {
  if (!params) return '';
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
  return query ? `?${query}` : '';
}

/**
 * 解析 URL 查询参数
 */
export function parseQuery(url: string): QueryParams {
  const queryString = url.split('?')[1];
  if (!queryString) return {};

  return queryString.split('&').reduce(
    (params, pair) => {
      const [key, value] = pair.split('=');
      if (key) {
        params[decodeURIComponent(key)] = decodeURIComponent(value || '');
      }
      return params;
    },
    {} as Record<string, string>,
  );
}

/**
 * 页面跳转 (保留当前页面，跳转到应用内的某个页面)
 * @param url 页面路径
 * @param params 查询参数
 * @param options 跳转选项
 */
export function navigateTo(url: string, params?: QueryParams, options?: NavigateOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    uni.navigateTo({
      url: url + buildQueryString(params),
      ...options,
      success: () => resolve(),
      fail: err => reject(err),
    });
  });
}

/**
 * 页面重定向 (关闭当前页面，跳转到应用内的某个页面)
 * @param url 页面路径
 * @param params 查询参数
 */
export function redirectTo(url: string, params?: QueryParams): Promise<void> {
  return new Promise((resolve, reject) => {
    uni.redirectTo({
      url: url + buildQueryString(params),
      success: () => resolve(),
      fail: err => reject(err),
    });
  });
}

/**
 * 页面返回 (关闭当前页面，返回上一页面或多级页面)
 * @param delta 返回的页面数
 */
export function navigateBack(delta = 1): Promise<void> {
  return new Promise((resolve, reject) => {
    uni.navigateBack({
      delta,
      success: () => resolve(),
      fail: err => reject(err),
    });
  });
}

/**
 * 切换 Tab 页面 (跳转到 tabBar 页面，并关闭其他所有非 tabBar 页面)
 * @param url tabBar 页面路径
 */
export function switchTab(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    uni.switchTab({
      url,
      success: () => resolve(),
      fail: err => reject(err),
    });
  });
}

/**
 * 重启应用 (关闭所有页面，打开到应用内的某个页面)
 * @param url 页面路径
 * @param params 查询参数
 */
export function reLaunch(url: string, params?: QueryParams): Promise<void> {
  return new Promise((resolve, reject) => {
    uni.reLaunch({
      url: url + buildQueryString(params),
      success: () => resolve(),
      fail: err => reject(err),
    });
  });
}

/**
 * 获取当前页面路由
 */
export function getCurrentRoute(): string {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  return currentPage ? `/${currentPage.route}` : '';
}

/**
 * 获取当前页面完整路径（含查询参数），读取失败返回空串
 */
export function getCurrentFullPath(): string {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1] as { $page?: { fullPath?: string } } | undefined;
  return currentPage?.$page?.fullPath ?? '';
}

/**
 * 获取当前页面参数
 */
export function getCurrentQuery(): QueryParams {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1] as UniApp.PageInstance | undefined;
  return (currentPage?.options as QueryParams) || {};
}

/**
 * 获取页面栈长度
 */
export function getPageStackLength(): number {
  return getCurrentPages().length;
}

/**
 * 判断是否可以返回
 */
export function canGoBack(): boolean {
  return getPageStackLength() > 1;
}

/**
 * 提取路径（去除查询参数与 hash）
 * @param url 完整 URL
 */
export function getPathFromUrl(url: string): string {
  return url.split(/[?#]/)[0];
}

/**
 * 检查路由是否在白名单中
 * @param url 页面 URL
 * @param whiteList 白名单列表
 */
export function isInWhiteList(url: string, whiteList: readonly string[]): boolean {
  const path = getPathFromUrl(url);
  return whiteList.some(route => path === route || path.startsWith(route + '/'));
}
