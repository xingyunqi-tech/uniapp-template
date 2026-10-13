import { ref, onUnmounted } from 'vue';
import { DELAY_TIMES } from '@/constants/form';

export interface AsyncActionOptions<T = unknown> {
  /** 异步操作函数 */
  action: () => Promise<T>;
  /** 成功提示文本 */
  successText?: string;
  /** 失败提示文本 */
  errorText?: string;
  /** 成功后的回调，返回 Promise 时等待其完成后才解除锁定 */
  onSuccess?: (result: T) => void | Promise<void>;
  /** 失败后的回调 */
  onError?: (error: unknown) => void;
  /** 成功后延迟执行时间（毫秒），设为 0 则不延迟 */
  delay?: number;
  /** 是否显示成功提示，默认 true */
  showSuccessToast?: boolean;
  /** 是否显示失败提示，默认 false（请求错误已由请求层提示） */
  showErrorToast?: boolean;
}

export interface UseAsyncActionReturn<T = unknown> {
  /** 是否正在执行 */
  loading: ReturnType<typeof ref<boolean>>;
  /** 执行异步操作 */
  execute: () => Promise<T | undefined>;
}

/** 内部执行上下文，用于生命周期管理 */
interface ExecutionContext {
  /** 是否已卸载/取消 */
  isCancelled: boolean;
  /** 延迟定时器 */
  delayTimer: ReturnType<typeof setTimeout> | null;
  /** 清理定时器 */
  clearTimer: () => void;
}

/** 创建执行上下文 */
function createExecutionContext(): ExecutionContext {
  const context: ExecutionContext = {
    isCancelled: false,
    delayTimer: null,
    clearTimer() {
      if (this.delayTimer) {
        clearTimeout(this.delayTimer);
        this.delayTimer = null;
      }
    },
  };
  return context;
}

/** 解析选项，填充默认值 */
function resolveOptions<T>(options: AsyncActionOptions<T>) {
  return {
    action: options.action,
    successText: options.successText ?? '操作成功',
    errorText: options.errorText ?? '操作失败',
    onSuccess: options.onSuccess,
    onError: options.onError,
    delay: options.delay ?? DELAY_TIMES.LONG,
    showSuccessToast: options.showSuccessToast ?? true,
    showErrorToast: options.showErrorToast ?? false,
  };
}

/**
 * 核心异步执行函数
 * @internal 内部使用，提取公共逻辑
 */
async function _executeAsync<T>(
  options: ReturnType<typeof resolveOptions<T>>,
  context: ExecutionContext,
  onFinally?: () => void,
  onSettled?: () => void,
): Promise<T | undefined> {
  const { action, successText, errorText, onSuccess, onError, delay, showSuccessToast, showErrorToast } = options;
  let settleInTimer = false;

  try {
    const result = await action();

    // 已取消，不执行后续操作
    if (context.isCancelled) return result;

    if (showSuccessToast && successText) {
      uni.showToast({
        title: successText,
        icon: 'success',
      });
    }

    if (onSuccess) {
      if (delay > 0) {
        settleInTimer = true;
        context.delayTimer = setTimeout(async () => {
          try {
            if (!context.isCancelled) {
              await onSuccess(result);
            }
          } finally {
            onSettled?.();
          }
        }, delay);
      } else {
        await onSuccess(result);
      }
    }

    return result;
  } catch (error) {
    // 已取消，不执行后续操作
    if (context.isCancelled) return undefined;

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
    onFinally?.();
    if (!settleInTimer) onSettled?.();
  }
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
  const resolvedOptions = resolveOptions(options);
  const loading = ref(false);
  const context = createExecutionContext();
  /** 成功回调执行完之前保持锁定，防止延迟期间重复提交 */
  let locked = false;

  async function execute(): Promise<T | undefined> {
    if (locked) return undefined;

    locked = true;
    loading.value = true;

    return _executeAsync(
      resolvedOptions,
      context,
      () => {
        if (!context.isCancelled) {
          loading.value = false;
        }
      },
      () => {
        locked = false;
      },
    );
  }

  // 组件卸载时清理
  onUnmounted(() => {
    context.isCancelled = true;
    context.clearTimer();
  });

  return {
    loading,
    execute,
  };
}

/**
 * 创建异步操作的快捷方法
 * @description 用于一次性执行异步操作，不依赖 Vue 组件生命周期
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
  const resolvedOptions = resolveOptions(options);
  const context = createExecutionContext();

  return _executeAsync(resolvedOptions, context);
}
