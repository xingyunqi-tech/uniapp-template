import { ref, readonly, type DeepReadonly, type Ref } from 'vue';

export interface LoadingOptions {
  /** 加载文字 */
  text?: string;
  /** 是否显示遮罩 */
  mask?: boolean;
}

export interface UseLoadingReturn {
  /** Loading 是否可见（只读） */
  visible: DeepReadonly<Ref<boolean>>;
  /** Loading 文字（只读） */
  text: DeepReadonly<Ref<string>>;
  /** 是否显示遮罩（只读） */
  mask: DeepReadonly<Ref<boolean>>;
  /** 显示 Loading */
  showLoading: (options?: string | LoadingOptions) => void;
  /** 隐藏 Loading */
  hideLoading: () => void;
  /** 强制隐藏 Loading（重置引用计数） */
  forceHideLoading: () => void;
  /** 包装异步操作 */
  withLoading: <T>(fn: () => Promise<T>, options?: string | LoadingOptions) => Promise<T>;
}

// ==================== 全局单例状态 ====================
// 说明：Loading 状态设计为全局单例，整个应用共享同一个 Loading 状态
// 使用引用计数处理并发调用，确保所有异步操作完成后才隐藏 Loading

const _visible = ref(false);
const _text = ref('');
const _mask = ref(true);

/** 引用计数，用于处理并发调用 */
let _refCount = 0;

/**
 * 显示 Loading
 */
function showLoading(options?: string | LoadingOptions): void {
  _refCount++;

  if (typeof options === 'string') {
    _text.value = options;
  } else if (options) {
    _text.value = options.text ?? '';
    _mask.value = options.mask ?? true;
  } else {
    _text.value = '';
    _mask.value = true;
  }
  _visible.value = true;
}

/**
 * 隐藏 Loading
 * 使用引用计数，只有当所有调用都完成时才真正隐藏
 */
function hideLoading(): void {
  _refCount = Math.max(0, _refCount - 1);

  if (_refCount === 0) {
    _visible.value = false;
    _text.value = '';
  }
}

/**
 * 强制隐藏 Loading（重置引用计数）
 */
function forceHideLoading(): void {
  _refCount = 0;
  _visible.value = false;
  _text.value = '';
}

/**
 * 包装异步操作，自动显示/隐藏 Loading
 * 支持并发调用，所有操作完成后才隐藏
 */
async function withLoading<T>(fn: () => Promise<T>, options?: string | LoadingOptions): Promise<T> {
  try {
    showLoading(options);
    return await fn();
  } finally {
    hideLoading();
  }
}

// ==================== 导出单例方法 ====================
// 可以直接导入使用：import { showLoading, hideLoading } from '@/composables'

export { showLoading, hideLoading, forceHideLoading, withLoading };

/**
 * Loading 全局状态 Composable
 *
 * @description
 * 提供全局单例的 Loading 状态管理。
 * 整个应用共享同一个 Loading 状态，适用于页面级加载指示器。
 *
 * 注意：如果需要组件级的独立 Loading 状态，请使用组件内的 ref 自行管理。
 *
 * @example
 * ```ts
 * // 方式 1: 使用 composable
 * const { visible, showLoading, hideLoading, withLoading } = useLoading();
 *
 * // 方式 2: 直接导入单例方法
 * import { showLoading, hideLoading, withLoading } from '@/composables';
 *
 * // 显示加载
 * showLoading('加载中...');
 *
 * // 隐藏加载
 * hideLoading();
 *
 * // 异步操作包装
 * await withLoading(async () => {
 *   await fetchData();
 * }, '数据加载中...');
 * ```
 */
export function useLoading(): UseLoadingReturn {
  return {
    visible: readonly(_visible),
    text: readonly(_text),
    mask: readonly(_mask),
    showLoading,
    hideLoading,
    forceHideLoading,
    withLoading,
  };
}
