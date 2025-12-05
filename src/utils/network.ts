/**
 * 全局网络状态管理
 * 统一管理应用的网络状态，供 App.vue 初始化和组件使用
 */
import { ref, readonly, type Ref } from 'vue';

// ==================== 类型定义 ====================

/** 网络类型 */
export type NetworkType = 'wifi' | '2g' | '3g' | '4g' | '5g' | 'ethernet' | 'unknown' | 'none';

/** 网络状态接口 */
export interface NetworkState {
  /** 是否连接 */
  isConnected: boolean;
  /** 网络类型 */
  networkType: NetworkType;
}

/** 网络监听配置 */
export interface NetworkListenerOptions {
  /** 断网提示文案 */
  offlineMessage?: string;
  /** 恢复网络提示文案 */
  onlineMessage?: string;
  /** 是否显示提示 */
  showToast?: boolean;
}

/** 网络状态变化回调 */
export type NetworkChangeCallback = (isConnected: boolean, networkType: NetworkType) => void;

// ==================== 全局状态 (单例) ====================

/** 全局网络状态 - 内部可写 */
const _isConnected = ref(true);
const _networkType = ref<NetworkType>('unknown');

/** 全局网络状态 - 外部只读 */
export const globalNetworkState = {
  /** 是否连接网络 (只读) */
  isConnected: readonly(_isConnected) as Readonly<Ref<boolean>>,
  /** 网络类型 (只读) */
  networkType: readonly(_networkType) as Readonly<Ref<NetworkType>>,
};

/** 监听回调列表 */
const callbacks: NetworkChangeCallback[] = [];

/** 是否已初始化 */
let isInitialized = false;

/** 全局配置 */
let globalOptions: NetworkListenerOptions = {};

// ==================== 内部方法 ====================

/**
 * 更新全局网络状态
 */
function updateNetworkState(isConnected: boolean, networkType: NetworkType): void {
  _isConnected.value = isConnected;
  _networkType.value = networkType;
}

/**
 * 网络状态变化处理
 */
function handleNetworkChange(res: UniApp.OnNetworkStatusChangeSuccess): void {
  const {
    showToast = true,
    offlineMessage = '网络已断开，请检查网络设置',
    onlineMessage = '网络已恢复',
  } = globalOptions;

  const wasConnected = _isConnected.value;
  updateNetworkState(res.isConnected, res.networkType as NetworkType);

  // 触发所有回调
  callbacks.forEach(cb => cb(res.isConnected, res.networkType as NetworkType));

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
}

// ==================== 公共 API ====================

/**
 * 初始化全局网络监听
 * 应在 App.vue 的 onLaunch 中调用（只需调用一次）
 *
 * @example
 * ```ts
 * // App.vue
 * onLaunch(() => {
 *   setupNetworkListener({
 *     offlineMessage: '网络已断开',
 *     showToast: true,
 *   });
 * });
 * ```
 */
export function setupNetworkListener(options: NetworkListenerOptions = {}): void {
  if (isInitialized) {
    console.warn('[Network] 网络监听已初始化，请勿重复调用');
    return;
  }

  isInitialized = true;
  globalOptions = options;

  // 获取初始网络状态
  uni.getNetworkType({
    success: res => {
      updateNetworkState(res.networkType !== 'none', res.networkType as NetworkType);
    },
  });

  // 监听网络变化
  uni.onNetworkStatusChange(handleNetworkChange);
}

/**
 * 添加网络状态变化监听
 * @param callback 回调函数
 * @returns 取消监听的函数
 *
 * @example
 * ```ts
 * const unsubscribe = onNetworkChange((isConnected, type) => {
 *   console.log('网络状态:', isConnected, type);
 * });
 *
 * // 取消监听
 * unsubscribe();
 * ```
 */
export function onNetworkChange(callback: NetworkChangeCallback): () => void {
  callbacks.push(callback);
  return () => {
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  };
}

/**
 * 检查当前网络状态
 * @returns Promise<NetworkState> 网络状态
 */
export async function checkNetworkStatus(): Promise<NetworkState> {
  try {
    const res = await uni.getNetworkType();
    const isConnected = res.networkType !== 'none';
    updateNetworkState(isConnected, res.networkType as NetworkType);
    return {
      isConnected,
      networkType: res.networkType as NetworkType,
    };
  } catch {
    return {
      isConnected: false,
      networkType: 'unknown',
    };
  }
}

/**
 * 确保有网络连接后执行操作
 * @param action 要执行的操作
 * @param errorMessage 无网络时的提示
 *
 * @example
 * ```ts
 * await withNetworkRequired(
 *   () => api.fetchData(),
 *   '请检查网络后重试'
 * );
 * ```
 */
export async function withNetworkRequired<T>(action: () => Promise<T>, errorMessage?: string): Promise<T> {
  const state = await checkNetworkStatus();

  if (!state.isConnected) {
    uni.showToast({
      title: errorMessage || '网络已断开，请检查网络设置',
      icon: 'none',
    });
    return Promise.reject(new Error('No network connection'));
  }

  return action();
}

/**
 * 判断是否是 WiFi 网络
 */
export function isWifiNetwork(): boolean {
  return _networkType.value === 'wifi';
}

/**
 * 判断是否是移动网络
 */
export function isMobileNetwork(): boolean {
  return ['2g', '3g', '4g', '5g'].includes(_networkType.value);
}
