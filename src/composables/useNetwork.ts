/**
 * 网络状态监听 Composable
 * 用于监听网络状态变化，提供离线提示等功能
 */
import { ref, onMounted, onUnmounted } from 'vue';

/** 网络类型 */
export type NetworkType = 'wifi' | '2g' | '3g' | '4g' | '5g' | 'ethernet' | 'unknown' | 'none';

/** 网络状态接口 */
export interface NetworkState {
  /** 是否连接 */
  isConnected: boolean;
  /** 网络类型 */
  networkType: NetworkType;
}

/** useNetwork 配置选项 */
export interface UseNetworkOptions {
  /** 断网时是否自动显示提示 */
  showToast?: boolean;
  /** 断网提示文案 */
  offlineMessage?: string;
  /** 恢复网络提示文案 */
  onlineMessage?: string;
}

/**
 * 网络状态监听
 * @param options 配置选项
 * @returns 网络状态和方法
 *
 * @example
 * ```ts
 * const { isConnected, networkType, checkNetwork } = useNetwork({
 *   showToast: true,
 *   offlineMessage: '网络已断开'
 * })
 * ```
 */
export function useNetwork(options: UseNetworkOptions = {}) {
  const { showToast = true, offlineMessage = '网络已断开，请检查网络设置', onlineMessage = '网络已恢复' } = options;

  /** 是否连接网络 */
  const isConnected = ref(true);
  /** 网络类型 */
  const networkType = ref<NetworkType>('unknown');
  /** 是否正在检查网络 */
  const isChecking = ref(false);

  /**
   * 网络状态变化回调
   */
  const handleNetworkChange = (res: UniApp.OnNetworkStatusChangeSuccess) => {
    const wasConnected = isConnected.value;
    isConnected.value = res.isConnected;
    networkType.value = res.networkType as NetworkType;

    if (showToast) {
      // 从有网变成无网
      if (wasConnected && !res.isConnected) {
        uni.showToast({
          title: offlineMessage,
          icon: 'none',
          duration: 2000,
        });
      }
      // 从无网恢复有网
      else if (!wasConnected && res.isConnected) {
        uni.showToast({
          title: onlineMessage,
          icon: 'success',
          duration: 1500,
        });
      }
    }
  };

  /**
   * 主动检查网络状态
   */
  async function checkNetwork(): Promise<NetworkState> {
    isChecking.value = true;
    try {
      const res = await uni.getNetworkType();
      const connected = res.networkType !== 'none';
      isConnected.value = connected;
      networkType.value = res.networkType as NetworkType;

      return {
        isConnected: connected,
        networkType: res.networkType as NetworkType,
      };
    } finally {
      isChecking.value = false;
    }
  }

  /**
   * 判断是否是 WiFi 网络
   */
  function isWifi(): boolean {
    return networkType.value === 'wifi';
  }

  /**
   * 判断是否是移动网络
   */
  function isMobile(): boolean {
    return ['2g', '3g', '4g', '5g'].includes(networkType.value);
  }

  /**
   * 执行需要网络的操作（自动检查网络状态）
   * @param action 要执行的操作
   * @param errorMessage 无网络时的提示信息
   */
  async function withNetwork<T>(action: () => Promise<T>, errorMessage?: string): Promise<T> {
    if (!isConnected.value) {
      const state = await checkNetwork();
      if (!state.isConnected) {
        uni.showToast({
          title: errorMessage || offlineMessage,
          icon: 'none',
        });
        return Promise.reject(new Error('No network connection'));
      }
    }
    return action();
  }

  // 组件挂载时开始监听
  onMounted(() => {
    // 获取初始网络状态
    checkNetwork();
    // 监听网络变化
    uni.onNetworkStatusChange(handleNetworkChange);
  });

  // 组件卸载时移除监听
  onUnmounted(() => {
    uni.offNetworkStatusChange(handleNetworkChange);
  });

  return {
    /** 是否连接网络 */
    isConnected,
    /** 网络类型 */
    networkType,
    /** 是否正在检查 */
    isChecking,
    /** 主动检查网络状态 */
    checkNetwork,
    /** 判断是否是 WiFi */
    isWifi,
    /** 判断是否是移动网络 */
    isMobile,
    /** 执行需要网络的操作 */
    withNetwork,
  };
}
