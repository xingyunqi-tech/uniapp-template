/**
 * 页面启动参数：合并普通 query 与小程序码 scene
 */
import { computed, getCurrentInstance, ref, type ComponentInternalInstance, type DeepReadonly, type Ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { parseSceneParams, resolveLaunchParams, type LaunchParams } from '@/utils/router';

export { parseSceneParams, resolveLaunchParams, type LaunchParams };

interface PageProxy {
  $mpType?: string;
  $scope?: { options?: Record<string, unknown> };
  $page?: { options?: Record<string, unknown> };
}

/** 沿 parent 查找所在页面根实例 */
function findPageProxy(instance: ComponentInternalInstance | null): PageProxy | null {
  for (let current = instance; current; current = current.parent) {
    const proxy = current.proxy as PageProxy | null;
    if (proxy?.$mpType === 'page') return proxy;
  }
  return null;
}

/** 页面实例参数：小程序取 $scope.options，H5 与 App 取 $page.options */
function readPageOptions(page: PageProxy | null): Record<string, unknown> | undefined {
  return page?.$scope?.options ?? page?.$page?.options;
}

/** useLaunchParams 返回值 */
export interface UseLaunchParamsReturn {
  /** 所在页面启动参数，onLoad 前读取时取所在页面实例参数，取不到时为空对象 */
  params: Readonly<Ref<DeepReadonly<LaunchParams>>>;
  /** 读取单个参数，不存在时返回 undefined */
  get: (key: string) => string | undefined;
}

/**
 * 在页面 setup 中获取启动参数（普通 query、微信小程序码 scene、支付宝小程序码 query 统一处理）
 *
 * @example
 * ```ts
 * const { params, get } = useLaunchParams();
 * onLoad(() => fetchDetail(get('id')));
 * ```
 */
export function useLaunchParams(): UseLaunchParamsReturn {
  const page = findPageProxy(getCurrentInstance());
  const loaded = ref<LaunchParams | null>(null);
  const current = () => loaded.value ?? resolveLaunchParams(readPageOptions(page));
  const params = computed<DeepReadonly<LaunchParams>>(current);

  onLoad(query => {
    loaded.value = resolveLaunchParams(query);
  });

  return {
    params,
    get: key => current()[key],
  };
}
