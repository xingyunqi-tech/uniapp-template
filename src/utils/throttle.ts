/**
 * 节流工具函数
 * 纯函数版本，不依赖 Vue 响应式
 */

export interface ThrottleOptions {
  /** 节流时间 (毫秒)，默认 300 */
  interval?: number;
  /** 是否在节流结束后执行最后一次，默认 true */
  trailing?: boolean;
  /** 是否立即执行第一次，默认 true */
  leading?: boolean;
}

export interface ThrottledFunction<T extends (...args: any[]) => any> {
  /** 节流后的函数 */
  (...args: Parameters<T>): void;
  /** 取消节流 */
  cancel: () => void;
}

/**
 * 创建节流函数
 * @description 纯函数版本，适用于非响应式场景
 * @example
 * ```ts
 * // 基础用法
 * const throttledScroll = throttle(() => {
 *   handleScroll();
 * }, { interval: 100 });
 *
 * // 滚动时调用
 * window.addEventListener('scroll', throttledScroll);
 *
 * // 取消节流
 * throttledScroll.cancel();
 * ```
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  options: ThrottleOptions = {},
): ThrottledFunction<T> {
  const { interval = 300, trailing = true, leading = true } = options;

  let lastExecTime = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  function cancel() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    lastArgs = null;
  }

  /** 设置尾部执行 */
  function scheduleTrailing(wait: number) {
    timer = setTimeout(() => {
      if (lastArgs) {
        fn(...lastArgs);
      }
      lastExecTime = Date.now();
      timer = null;
    }, wait);
  }

  const throttledFn = function (...args: Parameters<T>) {
    const now = Date.now();
    const remaining = interval - (now - lastExecTime);
    lastArgs = args;

    // 清除之前的定时器
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }

    // 首次调用且 leading = false 时不执行，开始计时，由尾部执行
    if (!leading && lastExecTime === 0) {
      lastExecTime = now;
      if (trailing) scheduleTrailing(interval);
      return;
    }

    // 间隔已过
    if (remaining <= 0 || remaining > interval) {
      fn(...args);
      lastExecTime = now;
    } else if (trailing) {
      scheduleTrailing(remaining);
    }
  } as ThrottledFunction<T>;

  throttledFn.cancel = cancel;

  return throttledFn;
}
