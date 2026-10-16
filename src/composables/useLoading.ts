import { ref, readonly, type DeepReadonly, type Ref } from 'vue';

export interface LoadingOptions {
  /** 加载文字 */
  text?: string;
  /** 是否显示遮罩 */
  mask?: boolean;
  /** 是否使用原生 Loading（uni.showLoading），默认 true */
  useNative?: boolean;
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
// 全局单例，并发调用全部结束后才隐藏

const _visible = ref(false);
const _text = ref('');
const _mask = ref(true);

interface LoadingEntry {
  text: string;
  mask: boolean;
  useNative: boolean;
  /** 由 withLoading 创建，结束时自行移除 */
  scoped?: boolean;
}

/** 未结束的 Loading 调用，按显示顺序排列 */
const _entries: LoadingEntry[] = [];

/** 当前原生 Loading 对应的调用 */
let _nativeEntry: LoadingEntry | null = null;

function resolveOptions(options?: string | LoadingOptions): LoadingEntry {
  if (typeof options === 'string') {
    return { text: options, mask: true, useNative: true };
  }
  return {
    text: options?.text ?? '加载中...',
    mask: options?.mask ?? true,
    useNative: options?.useNative ?? true,
  };
}

function findLastNative(): LoadingEntry | null {
  for (let i = _entries.length - 1; i >= 0; i--) {
    if (_entries[i].useNative) return _entries[i];
  }
  return null;
}

/** 按未结束的调用同步可见状态与原生 Loading */
function syncState(): void {
  const top = _entries[_entries.length - 1];
  _visible.value = !!top;
  _text.value = top?.text ?? '';
  _mask.value = top?.mask ?? true;

  const nativeEntry = findLastNative();
  if (nativeEntry === _nativeEntry) return;
  _nativeEntry = nativeEntry;
  if (nativeEntry) {
    uni.showLoading({ title: nativeEntry.text, mask: nativeEntry.mask });
  } else {
    uni.hideLoading();
  }
}

function pushEntry(options?: string | LoadingOptions, scoped = false): LoadingEntry {
  const entry = { ...resolveOptions(options), scoped };
  _entries.push(entry);
  syncState();
  return entry;
}

function removeEntry(entry: LoadingEntry): void {
  const index = _entries.lastIndexOf(entry);
  if (index === -1) return;
  _entries.splice(index, 1);
  syncState();
}

/**
 * 显示 Loading
 * @param options 配置选项或提示文字
 */
function showLoading(options?: string | LoadingOptions): void {
  pushEntry(options);
}

/**
 * 隐藏最近一次 showLoading 显示的 Loading，所有调用结束后才真正隐藏
 */
function hideLoading(): void {
  for (let i = _entries.length - 1; i >= 0; i--) {
    if (!_entries[i].scoped) {
      removeEntry(_entries[i]);
      return;
    }
  }
}

/**
 * 强制隐藏 Loading（清空所有调用）
 */
function forceHideLoading(): void {
  _entries.length = 0;
  _visible.value = false;
  _text.value = '';
  _mask.value = true;
  _nativeEntry = null;
  uni.hideLoading();
}

/**
 * 包装异步操作，自动显示/隐藏 Loading
 * 支持并发调用，所有操作完成后才隐藏
 */
async function withLoading<T>(fn: () => Promise<T>, options?: string | LoadingOptions): Promise<T> {
  const entry = pushEntry(options, true);
  try {
    return await fn();
  } finally {
    removeEntry(entry);
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
