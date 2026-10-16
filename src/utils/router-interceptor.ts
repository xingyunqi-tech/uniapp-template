/**
 * UniApp 路由拦截器
 * 用于实现路由守卫功能，替代 vue-router 的 beforeEach
 *
 * 功能：
 * 1. 白名单检查：无需登录即可访问的页面
 * 2. 登录检查：未登录用户重定向到登录页
 * 3. 角色权限检查：检查用户是否有权访问特定页面
 */
import { useUserStore } from '@/store/modules/user';
import { PAGES, WHITE_LIST, PAGE_ROLES } from '@/constants';
import {
  isInWhiteList,
  getPathFromUrl,
  getCurrentFullPath,
  getPageStackLength,
  ROUTE_INTERCEPTED_SUFFIX,
} from '@/utils/router';

/**
 * 检查页面角色权限
 * @param url 页面路径
 * @returns 是否有权限访问
 */
function checkPageRole(url: string): boolean {
  const userStore = useUserStore();
  const path = getPathFromUrl(url);

  // 获取页面所需角色
  const requiredRoles = PAGE_ROLES[path];

  // 未配置角色要求，允许访问
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  // 检查用户是否拥有所需角色
  return requiredRoles.some(role => userStore.hasRole(role));
}

type RouteAccess = 'allow' | 'login' | 'forbidden';

/**
 * 检查页面访问权限
 * @param url 页面路径（可带查询参数）
 */
function checkRouteAccess(url: string): RouteAccess {
  if (isInWhiteList(url, WHITE_LIST)) return 'allow';
  if (!useUserStore().isLoggedIn) return 'login';
  return checkPageRole(url) ? 'allow' : 'forbidden';
}

/** 登录页地址，登录后跳回 redirect */
function getLoginUrl(redirect: string): string {
  return `${PAGES.LOGIN}?redirect=${encodeURIComponent(redirect)}`;
}

/** 小程序页面栈最大层数 */
const MAX_PAGE_STACK = 10;

type InterceptMethod = 'navigateTo' | 'redirectTo' | 'reLaunch';

interface InterceptArgs {
  url: string;
  fail?: (result: UniApp.GeneralCallbackResult) => void;
  complete?: (result: UniApp.GeneralCallbackResult) => void;
}

/**
 * 阻止跳转并以失败结束本次调用，使回调与 Promise 都能收到结果
 */
function rejectNavigation(method: InterceptMethod | 'switchTab', args: InterceptArgs): false {
  const result = { errMsg: `${method}${ROUTE_INTERCEPTED_SUFFIX}` };
  args.fail?.(result);
  args.complete?.(result);
  return false;
}

/**
 * 打开登录页，沿用原跳转方式；navigateTo 在页面栈已满时改用 redirectTo
 */
function openLogin(method: InterceptMethod, url: string): void {
  if (method === 'reLaunch') {
    uni.reLaunch({ url });
  } else if (method === 'navigateTo' && getPageStackLength() < MAX_PAGE_STACK) {
    uni.navigateTo({ url });
  } else {
    uni.redirectTo({ url });
  }
}

/**
 * 路由拦截处理
 * @param method 被拦截的路由方法
 * @param args 路由参数
 * @returns 是否允许跳转
 */
function handleRouteIntercept(method: InterceptMethod, args: { url: string }): boolean {
  const access = checkRouteAccess(args.url);

  if (access === 'login') {
    // 使用 setTimeout 确保在当前路由操作完成后再执行
    setTimeout(() => {
      openLogin(method, getLoginUrl(args.url));
    }, 0);
    return false;
  }

  if (access === 'forbidden') {
    uni.showToast({
      title: '暂无权限访问',
      icon: 'none',
    });

    // navigateTo 保留当前页，页面栈已满或其他跳转方式时 redirectTo
    setTimeout(() => {
      const url = `${PAGES.FORBIDDEN}?type=403`;
      if (method === 'navigateTo' && getPageStackLength() < MAX_PAGE_STACK) {
        uni.navigateTo({ url });
      } else {
        uni.redirectTo({ url });
      }
    }, 0);

    return false;
  }

  return true;
}

/**
 * 校验当前页面的访问权限
 * 覆盖不经过路由 API 的进入方式：H5 刷新/直接访问、小程序分享卡片/扫码、navigator 组件
 */
export function guardCurrentPage(): void {
  const fullPath = getCurrentFullPath();
  if (!fullPath) return;

  const access = checkRouteAccess(fullPath);
  if (access === 'login') {
    uni.redirectTo({ url: getLoginUrl(fullPath) });
  } else if (access === 'forbidden') {
    uni.redirectTo({ url: `${PAGES.FORBIDDEN}?type=403` });
  }
}

/**
 * 设置路由拦截器
 */
export function setupRouterInterceptor(): void {
  // 需要拦截的路由方法
  const interceptMethods: InterceptMethod[] = ['navigateTo', 'redirectTo', 'reLaunch'];

  interceptMethods.forEach(method => {
    uni.addInterceptor(method, {
      invoke(args: InterceptArgs) {
        return handleRouteIntercept(method, args) ? args : rejectNavigation(method, args);
      },
      fail(err) {
        console.error(`路由跳转失败 [${method}]:`, err);
      },
    });
  });

  // switchTab 单独处理：白名单放行，未登录跳登录页并携带 redirect
  uni.addInterceptor('switchTab', {
    invoke(args: InterceptArgs) {
      const userStore = useUserStore();

      if (isInWhiteList(args.url, WHITE_LIST)) {
        return args;
      }

      // 未登录跳转登录页
      if (!userStore.isLoggedIn) {
        setTimeout(() => {
          uni.redirectTo({
            url: getLoginUrl(args.url),
          });
        }, 0);
        return rejectNavigation('switchTab', args);
      }

      return args;
    },
  });
}

/**
 * 移除路由拦截器
 */
export function removeRouterInterceptor(): void {
  const methods = ['navigateTo', 'redirectTo', 'reLaunch', 'switchTab'] as const;
  methods.forEach(method => {
    uni.removeInterceptor(method);
  });
}
