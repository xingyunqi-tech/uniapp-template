import { ref, watch, onUnmounted, type Ref } from 'vue';
import { throttle, type ThrottleOptions } from '@/utils/throttle';

export type UseThrottleOptions = ThrottleOptions;

export interface UseThrottleReturn<T> {
  /** 节流后的值 */
  throttledValue: Ref<T>;
  /** 取消节流 */
  cancel: () => void;
}

/**
 * 值节流 Composable
 * @description 对响应式值进行节流处理
 * @example
 * ```ts
 * const scrollY = ref(0);
 * const { throttledValue } = useThrottle(scrollY, { interval: 100 });
 *
 * // 监听节流后的滚动位置
 * watch(throttledValue, (y) => {
 *   updatePosition(y);
 * });
 * ```
 */
export function useThrottle<T>(value: Ref<T>, options: UseThrottleOptions = {}): UseThrottleReturn<T> {
  const throttledValue = ref<T>(value.value) as Ref<T>;

  // 复用 utils 的节流函数
  const throttledUpdate = throttle((newValue: T) => {
    throttledValue.value = newValue;
  }, options);

  watch(value, newValue => {
    throttledUpdate(newValue);
  });

  // 组件卸载时清理
  onUnmounted(() => {
    throttledUpdate.cancel();
  });

  return {
    throttledValue,
    cancel: throttledUpdate.cancel,
  };
}

export type UseThrottleFnOptions = ThrottleOptions;

export interface UseThrottleFnReturn<T extends (...args: any[]) => any> {
  /** 节流函数 */
  throttledFn: (...args: Parameters<T>) => void;
  /** 取消节流 */
  cancel: () => void;
  /** 是否正在节流中 */
  isThrottled: Ref<boolean>;
}

/**
 * 函数节流 Composable
 * @description 对函数进行节流处理，提供响应式的 isThrottled 状态
 * @example
 * ```ts
 * const { throttledFn, isThrottled } = useThrottleFn(
 *   () => handleScroll(),
 *   { interval: 100 }
 * );
 *
 * // 滚动时调用
 * window.addEventListener('scroll', throttledFn);
 * ```
 */
export function useThrottleFn<T extends (...args: any[]) => any>(
  fn: T,
  options: UseThrottleFnOptions = {},
): UseThrottleFnReturn<T> {
  const { interval = 300, trailing = true, leading = true } = options;
  const isThrottled = ref(false);

  // 复用 utils 的节流函数，包装以支持 isThrottled 响应式状态
  const throttledCore = throttle(
    (...args: Parameters<T>) => {
      isThrottled.value = false;
      fn(...args);
    },
    { interval, trailing, leading },
  );

  function throttledFn(...args: Parameters<T>) {
    isThrottled.value = true;
    throttledCore(...args);
  }

  function cancel() {
    throttledCore.cancel();
    isThrottled.value = false;
  }

  // 组件卸载时清理
  onUnmounted(() => {
    cancel();
  });

  return {
    throttledFn,
    cancel,
    isThrottled,
  };
}
