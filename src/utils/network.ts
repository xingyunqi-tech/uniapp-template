/**
 * 全局网络状态管理
 * 统一管理应用的网络状态，供 App.vue 初始化和组件使用
 */
import { ref, readonly, type Ref } from 'vue';

// ==================== 类型定义 ====================

/** 网络类型 */
export type NetworkType = 'wifi' | '2g' | '3g' | '4g' | '5g' | 'ethernet' | 'unknown' | 'none';

/** 网络监听配置 */
export interface NetworkListenerOptions {
  /** 断网提示文案 */
  offlineMessage?: string;
  /** 恢复网络提示文案 */
  onlineMessage?: string;
  /** 是否显示提示 */
  showToast?: boolean;
  /** 状态稳定该时长 (ms) 后才提示，期间来回切换不提示 */
  toastDelay?: number;
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

/** 是否在线 (只读) */
export const isOnline = globalNetworkState.isConnected;

/** 监听回调列表 */
const callbacks: NetworkChangeCallback[] = [];

/** 是否已初始化 */
let isInitialized = false;

/** 全局配置 */
let globalOptions: NetworkListenerOptions = {};

/** 最近一次已提示（或启动时确认）的连接状态 */
let notifiedConnected = true;

let toastTimer: ReturnType<typeof setTimeout> | null = null;

let hasStatusEvent = false;

// ==================== 内部方法 ====================

/**
 * 更新全局网络状态
 */
function updateNetworkState(isConnected: boolean, networkType: NetworkType): void {
  _isConnected.value = isConnected;
  _networkType.value = networkType;
}

function clearToastTimer(): void {
  if (toastTimer) {
    clearTimeout(toastTimer);
    toastTimer = null;
  }
}

function notifyIfChanged(): void {
  const isConnected = _isConnected.value;
  if (isConnected === notifiedConnected) return;
  notifiedConnected = isConnected;

  const { offlineMessage = '网络已断开', onlineMessage = '网络已恢复' } = globalOptions;
  uni.showToast(
    isConnected
      ? { title: onlineMessage, icon: 'none', duration: 1500 }
      : { title: offlineMessage, icon: 'none', duration: 3000 },
  );
}

/**
 * 网络状态变化处理
 */
function handleNetworkChange(res: UniApp.OnNetworkStatusChangeSuccess): void {
  const { showToast = true, toastDelay = 1000 } = globalOptions;

  hasStatusEvent = true;
  updateNetworkState(res.isConnected, res.networkType as NetworkType);

  // 触发所有回调
  callbacks.forEach(cb => cb(res.isConnected, res.networkType as NetworkType));

  clearToastTimer();
  if (!showToast) {
    notifiedConnected = res.isConnected;
    return;
  }
  if (toastDelay > 0) {
    toastTimer = setTimeout(() => {
      toastTimer = null;
      notifyIfChanged();
    }, toastDelay);
  } else {
    notifyIfChanged();
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
      if (hasStatusEvent) return;
      const isConnected = res.networkType !== 'none';
      updateNetworkState(isConnected, res.networkType as NetworkType);
      notifiedConnected = isConnected;
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
 * 判断是否是移动网络
 */
export function isMobileNetwork(): boolean {
  return ['2g', '3g', '4g', '5g'].includes(_networkType.value);
}
