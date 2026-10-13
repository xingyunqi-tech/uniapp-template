/**
 * 防抖工具函数
 * 纯函数版本，不依赖 Vue 响应式
 */

export interface DebounceOptions {
  /** 延迟时间 (毫秒)，默认 300 */
  delay?: number;
  /** 是否立即执行一次，默认 false */
  immediate?: boolean;
}

export interface DebouncedFunction<T extends (...args: any[]) => any> {
  /** 防抖后的函数 */
  (...args: Parameters<T>): void;
  /** 取消防抖 */
  cancel: () => void;
  /** 立即执行 */
  flush: () => void;
}

/**
 * 创建防抖函数
 * @description 纯函数版本，适用于非响应式场景
 * @example
 * ```ts
 * // 基础用法
 * const debouncedSearch = debounce((keyword: string) => {
 *   fetchSearchResults(keyword);
 * }, { delay: 500 });
 *
 * // 输入时调用
 * debouncedSearch('hello');
 *
 * // 取消防抖
 * debouncedSearch.cancel();
 *
 * // 立即执行
 * debouncedSearch.flush();
 * ```
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  options: DebounceOptions = {},
): DebouncedFunction<T> {
  const { delay = 300, immediate = false } = options;

  let timer: ReturnType<typeof setTimeout> | null = null;
  /** 等待执行的参数，没有待执行调用时为 null */
  let pendingArgs: Parameters<T> | null = null;
  let isFirstCall = true;

  function cancel() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    pendingArgs = null;
  }

  function flush() {
    if (!pendingArgs) return;
    const args = pendingArgs;
    cancel();
    fn(...args);
  }

  const debouncedFn = function (...args: Parameters<T>) {
    // 首次调用且开启立即执行
    if (immediate && isFirstCall) {
      isFirstCall = false;
      fn(...args);
      return;
    }

    isFirstCall = false;
    cancel();
    pendingArgs = args;

    timer = setTimeout(flush, delay);
  } as DebouncedFunction<T>;

  debouncedFn.cancel = cancel;
  debouncedFn.flush = flush;

  return debouncedFn;
}
