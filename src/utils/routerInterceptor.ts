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
import { isInWhiteList, getPathFromUrl } from '@/utils/router';

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

/**
 * 路由拦截处理
 * @param args 路由参数
 * @returns 是否允许跳转
 */
function handleRouteIntercept(args: { url: string }): boolean | { url: string } {
  const userStore = useUserStore();
  const url = args.url;

  // 1. 白名单路由直接放行
  if (isInWhiteList(url, WHITE_LIST)) {
    return true;
  }

  // 2. 未登录跳转登录页
  if (!userStore.isLoggedIn) {
    // 保存原始路径，登录后跳转
    const redirectUrl = encodeURIComponent(url);

    // 使用 setTimeout 确保在当前路由操作完成后再执行
    setTimeout(() => {
      uni.redirectTo({
        url: `${PAGES.LOGIN}?redirect=${redirectUrl}`,
      });
    }, 0);

    return false;
  }

  // 3. 检查角色权限
  if (!checkPageRole(url)) {
    uni.showToast({
      title: '暂无权限访问',
      icon: 'none',
    });

    setTimeout(() => {
      uni.redirectTo({
        url: `${PAGES.FORBIDDEN}?type=403`,
      });
    }, 0);

    return false;
  }

  return true;
}

/**
 * 设置路由拦截器
 */
export function setupRouterInterceptor(): void {
  // 需要拦截的路由方法
  const interceptMethods = ['navigateTo', 'redirectTo', 'reLaunch'] as const;

  interceptMethods.forEach(method => {
    uni.addInterceptor(method, {
      invoke(args: { url: string }) {
        const result = handleRouteIntercept(args);
        if (result === false) {
          return false;
        }
        return typeof result === 'object' ? result : args;
      },
      fail(err) {
        console.error(`路由跳转失败 [${method}]:`, err);
      },
    });
  });

  // switchTab 单独处理 (TabBar 页面通常都需要登录)
  uni.addInterceptor('switchTab', {
    invoke(args: { url: string }) {
      const userStore = useUserStore();

      // 未登录跳转登录页
      if (!userStore.isLoggedIn) {
        setTimeout(() => {
          uni.redirectTo({
            url: PAGES.LOGIN,
          });
        }, 0);
        return false;
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
