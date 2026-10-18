/**
 * UniApp 路由工具函数
 * 封装 uni-app 路由 API，提供类似 vue-router 的使用体验
 */
import { PAGES, TAB_BAR_PAGES } from '@/constants/pages';

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

/** 路由拦截器阻止跳转时失败信息的后缀 */
export const ROUTE_INTERCEPTED_SUFFIX = ':fail intercepted';

/**
 * 是否为路由拦截器阻止跳转产生的失败
 */
export function isRouteIntercepted(error: unknown): boolean {
  const errMsg = (error as { errMsg?: unknown } | null)?.errMsg;
  return typeof errMsg === 'string' && errMsg.endsWith(ROUTE_INTERCEPTED_SUFFIX);
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

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** 按 & 拆分查询串：值按第一个 = 拆分，忽略空键，无值的键取空串 */
function splitQueryString(queryString: string, decode: (value: string) => string): Record<string, string> {
  return queryString.split('&').reduce<Record<string, string>>((params, pair) => {
    const separatorIndex = pair.indexOf('=');
    const key = separatorIndex === -1 ? pair : pair.slice(0, separatorIndex);
    const value = separatorIndex === -1 ? '' : pair.slice(separatorIndex + 1);
    if (key) {
      params[decode(key)] = decode(value);
    }
    return params;
  }, {});
}

/**
 * 解析 URL 查询参数：值按第一个 = 拆分，忽略 # 之后的片段，编码格式错误时保留原值
 */
export function parseQuery(url: string): QueryParams {
  const queryIndex = url.indexOf('?');
  if (queryIndex === -1) return {};
  const queryString = url.slice(queryIndex + 1).split('#')[0];
  if (!queryString) return {};
  return splitQueryString(queryString, safeDecode);
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
 * 安全返回：页面栈中有上一页时返回，否则打开兜底页（TabBar 页用 switchTab，其余用 redirectTo）
 * @param fallback 无上一页时打开的页面，默认首页
 * @param delta 返回的页面数
 */
export function safeBack(fallback: string = PAGES.HOME, delta = 1): Promise<void> {
  if (getPageStackLength() > delta) {
    return navigateBack(delta);
  }
  return isTabBarPage(fallback) ? switchTab(fallback) : redirectTo(fallback);
}

/**
 * 是否为 TabBar 页面
 * @param url 页面路径（可带查询参数）
 */
export function isTabBarPage(url: string): boolean {
  return (TAB_BAR_PAGES as readonly string[]).includes(getPathFromUrl(url));
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
 * 小程序的 $page.fullPath 会对原始编码的参数再编码一次，改用 route 与 options 原值拼接
 */
export function getCurrentFullPath(): string {
  // #ifdef MP
  const route = getCurrentRoute();
  if (!route) return '';
  const query = joinRawQuery(getCurrentQuery());
  return query ? `${route}?${query}` : route;
  // #endif

  // #ifndef MP

  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1] as { $page?: { fullPath?: string } } | undefined;
  return currentPage?.$page?.fullPath ?? '';
  // #endif
}

/**
 * 解码页面 onLoad 参数值：H5 与 App 运行时已解码，小程序需手动解码，编码格式错误时返回原值
 */
export function decodeQueryValue(value: string): string {
  // #ifdef MP
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
  // #endif

  // #ifndef MP

  return value;
  // #endif
}

/**
 * 获取当前页面参数
 */
export function getCurrentQuery(): QueryParams {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1] as UniApp.PageInstance | undefined;
  return (currentPage?.options as QueryParams) || {};
}

/** 拼接查询参数，小程序 options 为原始编码值，不再编码 */
function joinRawQuery(query: QueryParams): string {
  return Object.entries(query)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
}

/** 启动参数，值均为解码后的字符串 */
export type LaunchParams = Record<string, string>;

/** scene 参数名 */
export const SCENE_KEY = 'scene';

/**
 * 解析微信小程序码 scene（最长 32 字符，约定短键名 `k=v&k2=v2`，如 `sc=AB12&id=9`；不含 `=` 时整体保留为 `scene`）
 * @param scene 经 decodeQueryValue 解码后的 scene，解析时不解码
 */
export function parseSceneParams(scene: string | undefined | null): LaunchParams {
  if (!scene) return {};
  if (!scene.includes('=')) return { [SCENE_KEY]: scene };
  return splitQueryString(scene, value => value);
}

/**
 * 将页面 onLoad 参数解析为启动参数：各参数经 decode 解码，scene 展开后合并，同名时普通参数优先
 * @param query 页面 onLoad 参数或页面实例 options
 * @param decode 参数值解码函数，默认 decodeQueryValue
 */
export function resolveLaunchParams(
  query: Record<string, unknown> | undefined | null,
  decode: (value: string) => string = decodeQueryValue,
): LaunchParams {
  if (!query) return {};
  const params: LaunchParams = {};
  for (const [key, value] of Object.entries(query)) {
    if (key === SCENE_KEY || value === undefined || value === null) continue;
    params[key] = decode(String(value));
  }
  const scene = query[SCENE_KEY];
  const sceneParams = scene === undefined || scene === null ? {} : parseSceneParams(decode(String(scene)));
  return { ...sceneParams, ...params };
}

/** 分享码参数名，转发时不透传来源方的分享码 */
export const SHARE_CODE_KEYS: readonly string[] = ['sc', 'shareCode'];

/** 不作为分享落地页的页面，分享时改为首页 */
const UNSHAREABLE_PAGES: string[] = [PAGES.LOGIN, PAGES.REGISTER, PAGES.FORGOT_PASSWORD, PAGES.ERROR];

/** 私有页面前缀：页面内容属于当前用户，不开放分享 */
const PRIVATE_PAGE_PREFIXES: readonly string[] = ['/pages-sub/order/', '/pages-sub/user/'];

/**
 * 是否为私有页面（订单、用户分包），私有页不可分享
 * @param url 页面路径（可带查询参数）
 */
export function isPrivatePage(url: string): boolean {
  const path = getPathFromUrl(url);
  return PRIVATE_PAGE_PREFIXES.some(prefix => path.startsWith(prefix));
}

/**
 * 当前页面的分享路径与参数：私有页与登录等页面分享为首页，参数按 resolveLaunchParams 合并后去掉来源方的分享码并重新编码
 */
export function getShareTarget(): { path: string; query: string } {
  const route = getCurrentRoute();
  if (!route || UNSHAREABLE_PAGES.includes(route) || isPrivatePage(route)) return { path: PAGES.HOME, query: '' };
  const query = Object.entries(resolveLaunchParams(getCurrentQuery()))
    .filter(([key]) => !SHARE_CODE_KEYS.includes(key))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  return { path: query ? `${route}?${query}` : route, query };
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

/** 上一页的路径与查询参数是否与 url 相同 */
export function isPreviousPage(url: string): boolean {
  const pages = getCurrentPages();
  const previous = pages[pages.length - 2] as (Page.PageInstance & { options?: QueryParams }) | undefined;
  if (!previous?.route || `/${previous.route}` !== getPathFromUrl(url)) return false;
  const expected = parseQuery(url);
  const actual = previous.options ?? {};
  const keys = new Set([...Object.keys(expected), ...Object.keys(actual)]);
  return [...keys].every(key => String(expected[key] ?? '') === String(actual[key] ?? ''));
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
