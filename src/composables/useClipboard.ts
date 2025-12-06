import { ref, type Ref } from 'vue';

export interface UseClipboardOptions {
  /** 复制成功提示文本 */
  successMessage?: string;
  /** 复制失败提示文本 */
  errorMessage?: string;
  /** 是否显示提示，默认 true */
  showToast?: boolean;
}

export interface UseClipboardReturn {
  /** 复制文本到剪贴板 */
  copy: (text: string) => Promise<boolean>;
  /** 最后复制的内容 */
  copiedText: Ref<string>;
  /** 是否正在复制 */
  isCopying: Ref<boolean>;
  /** 是否复制成功 */
  isSuccess: Ref<boolean>;
}

/**
 * 剪贴板 Composable
 * @description 统一剪贴板操作，支持多端
 * @example
 * ```ts
 * const { copy, copiedText, isSuccess } = useClipboard();
 *
 * // 复制文本
 * async function handleCopy() {
 *   const success = await copy('要复制的内容');
 *   if (success) {
 *     console.log('复制成功');
 *   }
 * }
 * ```
 */
export function useClipboard(options: UseClipboardOptions = {}): UseClipboardReturn {
  const { successMessage = '复制成功', errorMessage = '复制失败', showToast = true } = options;

  const copiedText = ref('');
  const isCopying = ref(false);
  const isSuccess = ref(false);

  /**
   * 复制文本到剪贴板
   */
  async function copy(text: string): Promise<boolean> {
    if (isCopying.value) return false;

    isCopying.value = true;
    isSuccess.value = false;

    try {
      // 使用 uni.setClipboardData (支持所有端)
      await new Promise<void>((resolve, reject) => {
        uni.setClipboardData({
          data: text,
          showToast: false, // 手动控制提示
          success: () => resolve(),
          fail: err => reject(err),
        });
      });

      copiedText.value = text;
      isSuccess.value = true;

      if (showToast) {
        uni.showToast({
          title: successMessage,
          icon: 'success',
          duration: 1500,
        });
      }

      return true;
    } catch (error) {
      console.error('Clipboard copy error:', error);
      isSuccess.value = false;

      if (showToast) {
        uni.showToast({
          title: errorMessage,
          icon: 'none',
          duration: 1500,
        });
      }

      return false;
    } finally {
      isCopying.value = false;
    }
  }

  return {
    copy,
    copiedText,
    isCopying,
    isSuccess,
  };
}
