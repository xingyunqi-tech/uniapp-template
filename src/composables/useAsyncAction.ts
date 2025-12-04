import { ref } from 'vue';
import { DELAY_TIMES } from '@/constants/form';

export interface AsyncActionOptions<T = unknown> {
  /** 异步操作函数 */
  action: () => Promise<T>;
  /** 成功提示文本 */
  successText?: string;
  /** 失败提示文本 */
  errorText?: string;
  /** 成功后的回调 */
  onSuccess?: (result: T) => void;
  /** 失败后的回调 */
  onError?: (error: unknown) => void;
  /** 成功后延迟执行时间（毫秒），设为 0 则不延迟 */
  delay?: number;
  /** 是否显示成功提示，默认 true */
  showSuccessToast?: boolean;
  /** 是否显示失败提示，默认 true */
  showErrorToast?: boolean;
}

export interface UseAsyncActionReturn<T = unknown> {
  /** 是否正在执行 */
  loading: ReturnType<typeof ref<boolean>>;
  /** 执行异步操作 */
  execute: () => Promise<T | undefined>;
}

/**
 * 异步操作 Composable
 * @description 封装异步操作的通用逻辑，包括 loading 状态、Toast 提示、成功/失败回调
 * @example
 * ```ts
 * const { loading, execute } = useAsyncAction({
 *   action: () => api.saveProfile(formData),
 *   successText: '保存成功',
 *   onSuccess: () => router.back(),
 * });
 *
 * // 在按钮点击时调用
 * <button :loading="loading" @click="execute">保存</button>
 * ```
 */
export function useAsyncAction<T = unknown>(options: AsyncActionOptions<T>): UseAsyncActionReturn<T> {
  const {
    action,
    successText = '操作成功',
    errorText = '操作失败',
    onSuccess,
    onError,
    delay = DELAY_TIMES.LONG,
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  const loading = ref(false);

  async function execute(): Promise<T | undefined> {
    if (loading.value) return undefined;

    loading.value = true;

    try {
      const result = await action();

      if (showSuccessToast && successText) {
        uni.showToast({
          title: successText,
          icon: 'success',
        });
      }

      if (onSuccess) {
        if (delay > 0) {
          setTimeout(() => {
            onSuccess(result);
          }, delay);
        } else {
          onSuccess(result);
        }
      }

      return result;
    } catch (error) {
      console.error('异步操作失败:', error);

      if (showErrorToast && errorText) {
        uni.showToast({
          title: errorText,
          icon: 'none',
        });
      }

      onError?.(error);
      return undefined;
    } finally {
      loading.value = false;
    }
  }

  return {
    loading,
    execute,
  };
}

/**
 * 创建异步操作的快捷方法
 * @description 用于一次性创建并执行异步操作
 * @example
 * ```ts
 * await executeAsync({
 *   action: () => api.delete(id),
 *   successText: '删除成功',
 *   onSuccess: () => fetchList(),
 * });
 * ```
 */
export async function executeAsync<T = unknown>(options: AsyncActionOptions<T>): Promise<T | undefined> {
  const { execute } = useAsyncAction(options);
  return execute();
}
