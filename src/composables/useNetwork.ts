/**
 * 网络状态 Composable
 * 提供组件级的网络状态访问，引用全局单例状态
 *
 * 注意：全局网络监听由 App.vue 中的 setupNetworkListener 初始化
 * 此 composable 仅提供访问接口，不会重复注册监听器
 */
import { computed, onUnmounted } from 'vue';
import {
  globalNetworkState,
  onNetworkChange,
  checkNetworkStatus,
  withNetworkRequired,
  isWifiNetwork,
  isMobileNetwork,
  type NetworkType,
  type NetworkState,
  type NetworkChangeCallback,
} from '@/utils/network';

// 重新导出类型，保持向后兼容
export type { NetworkType, NetworkState };

/** useNetwork 配置选项 */
export interface UseNetworkOptions {
  /** 网络状态变化回调 */
  onChange?: NetworkChangeCallback;
}

/**
 * 网络状态 Composable
 *
 * @description
 * 提供响应式的网络状态访问，基于全局单例状态。
 * 全局监听由 App.vue 初始化，此 composable 仅提供访问接口。
 *
 * @param options 配置选项
 * @returns 网络状态和工具方法
 *
 * @example
 * ```ts
 * const { isConnected, networkType, isWifi, withNetwork } = useNetwork();
 *
 * // 响应式访问
 * watchEffect(() => {
 *   if (!isConnected.value) {
 *     console.log('网络已断开');
 *   }
 * });
 *
 * // 执行需要网络的操作
 * await withNetwork(() => api.fetchData());
 * ```
 *
 * @example
 * ```ts
 * // 监听网络变化
 * const { isConnected } = useNetwork({
 *   onChange: (connected, type) => {
 *     console.log('网络变化:', connected, type);
 *   }
 * });
 * ```
 */
export function useNetwork(options: UseNetworkOptions = {}) {
  const { onChange } = options;

  // 注册变化回调（组件卸载时自动移除）
  let unsubscribe: (() => void) | null = null;

  if (onChange) {
    unsubscribe = onNetworkChange(onChange);
  }

  // 组件卸载时取消监听
  onUnmounted(() => {
    unsubscribe?.();
  });

  // 计算属性：是否是 WiFi
  const isWifi = computed(() => isWifiNetwork());

  // 计算属性：是否是移动网络
  const isMobile = computed(() => isMobileNetwork());

  /**
   * 执行需要网络的操作
   * @param action 要执行的操作
   * @param errorMessage 无网络时的提示
   */
  async function withNetwork<T>(action: () => Promise<T>, errorMessage?: string): Promise<T> {
    return withNetworkRequired(action, errorMessage);
  }

  return {
    /** 是否连接网络 (响应式) */
    isConnected: globalNetworkState.isConnected,
    /** 网络类型 (响应式) */
    networkType: globalNetworkState.networkType,
    /** 是否是 WiFi 网络 (计算属性) */
    isWifi,
    /** 是否是移动网络 (计算属性) */
    isMobile,
    /** 主动检查网络状态 */
    checkNetwork: checkNetworkStatus,
    /** 执行需要网络的操作 */
    withNetwork,
  };
}
