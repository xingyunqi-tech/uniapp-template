/**
 * UniApp 路由拦截器
 * 用于实现路由守卫功能，替代 vue-router 的 beforeEach
 */
import { useUserStore } from '@/store/modules/user';
import { PAGES, WHITE_LIST } from '@/constants';
import { isInWhiteList } from '@/utils/router';

/**
 * 路由拦截处理
 * @param args 路由参数
 * @returns 是否允许跳转
 */
function handleRouteIntercept(args: { url: string }): boolean | { url: string } {
  const userStore = useUserStore();
  const url = args.url;

  // 白名单路由直接放行
  if (isInWhiteList(url, WHITE_LIST)) {
    return true;
  }

  // 未登录跳转登录页
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
