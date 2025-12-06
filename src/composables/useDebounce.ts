import { ref, watch, onUnmounted, type Ref } from 'vue';
import { debounce, type DebounceOptions } from '@/utils/debounce';

export type UseDebounceOptions = DebounceOptions;

export interface UseDebounceReturn<T> {
  /** 防抖后的值 */
  debouncedValue: Ref<T>;
  /** 取消防抖 */
  cancel: () => void;
  /** 立即执行 */
  flush: () => void;
}

/**
 * 值防抖 Composable
 * @description 对响应式值进行防抖处理
 * @example
 * ```ts
 * const searchText = ref('');
 * const { debouncedValue } = useDebounce(searchText, { delay: 500 });
 *
 * // 监听防抖后的值进行搜索
 * watch(debouncedValue, (value) => {
 *   search(value);
 * });
 * ```
 */
export function useDebounce<T>(value: Ref<T>, options: UseDebounceOptions = {}): UseDebounceReturn<T> {
  const { delay = 300, immediate = false } = options;

  const debouncedValue = ref<T>(value.value) as Ref<T>;

  // 复用 utils 的防抖函数
  const debouncedUpdate = debounce(
    (newValue: T) => {
      debouncedValue.value = newValue;
    },
    { delay, immediate },
  );

  watch(value, newValue => {
    debouncedUpdate(newValue);
  });

  // 组件卸载时清理
  onUnmounted(() => {
    debouncedUpdate.cancel();
  });

  return {
    debouncedValue,
    cancel: debouncedUpdate.cancel,
    flush: debouncedUpdate.flush,
  };
}

export type UseDebounceFnOptions = DebounceOptions;

export interface UseDebounceFnReturn<T extends (...args: any[]) => any> {
  /** 防抖函数 */
  debouncedFn: (...args: Parameters<T>) => void;
  /** 取消防抖 */
  cancel: () => void;
  /** 立即执行 */
  flush: () => void;
  /** 是否正在等待执行 */
  isPending: Ref<boolean>;
}

/**
 * 函数防抖 Composable
 * @description 对函数进行防抖处理，提供响应式的 isPending 状态
 * @example
 * ```ts
 * const { debouncedFn, isPending } = useDebounceFn(
 *   (keyword: string) => fetchSearchResults(keyword),
 *   { delay: 500 }
 * );
 *
 * // 输入时调用
 * function onInput(e: Event) {
 *   debouncedFn(e.target.value);
 * }
 * ```
 */
export function useDebounceFn<T extends (...args: any[]) => any>(
  fn: T,
  options: UseDebounceFnOptions = {},
): UseDebounceFnReturn<T> {
  const { delay = 300, immediate = false } = options;

  const isPending = ref(false);

  // 包装函数以支持 isPending 响应式状态
  const debouncedCore = debounce(
    (...args: Parameters<T>) => {
      isPending.value = false;
      fn(...args);
    },
    { delay, immediate },
  );

  function debouncedFn(...args: Parameters<T>) {
    isPending.value = true;
    debouncedCore(...args);
  }

  function cancel() {
    debouncedCore.cancel();
    isPending.value = false;
  }

  function flush() {
    debouncedCore.flush();
    isPending.value = false;
  }

  // 组件卸载时清理
  onUnmounted(() => {
    cancel();
  });

  return {
    debouncedFn,
    cancel,
    flush,
    isPending,
  };
}
