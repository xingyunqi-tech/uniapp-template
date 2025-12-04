export interface ConfirmModalOptions {
  /** 标题 */
  title?: string;
  /** 内容 */
  content: string;
  /** 确认按钮文字 */
  confirmText?: string;
  /** 取消按钮文字 */
  cancelText?: string;
  /** 确认按钮颜色 */
  confirmColor?: string;
  /** 取消按钮颜色 */
  cancelColor?: string;
  /** 是否显示取消按钮 */
  showCancel?: boolean;
}

export interface UseConfirmModalReturn {
  /** 显示确认弹窗 */
  confirm: (options: ConfirmModalOptions | string) => Promise<boolean>;
  /** 显示警告弹窗（无取消按钮） */
  alert: (options: Omit<ConfirmModalOptions, 'showCancel'> | string) => Promise<void>;
  /** 显示危险操作确认弹窗 */
  danger: (options: ConfirmModalOptions | string) => Promise<boolean>;
}

/**
 * 确认弹窗 Composable
 * @description 封装 uni.showModal，提供 Promise 风格的 API
 * @example
 * ```ts
 * const { confirm, alert, danger } = useConfirmModal();
 *
 * // 确认弹窗
 * const confirmed = await confirm('确定要删除吗？');
 * if (confirmed) {
 *   // 执行删除
 * }
 *
 * // 警告弹窗
 * await alert('操作成功');
 *
 * // 危险操作
 * const result = await danger({ content: '此操作不可恢复，确定继续？' });
 * ```
 */
export function useConfirmModal(): UseConfirmModalReturn {
  /**
   * 显示确认弹窗
   * @returns 用户是否点击了确认
   */
  function confirm(options: ConfirmModalOptions | string): Promise<boolean> {
    const opts = typeof options === 'string' ? { content: options } : options;

    return new Promise(resolve => {
      uni.showModal({
        title: opts.title ?? '提示',
        content: opts.content,
        confirmText: opts.confirmText ?? '确定',
        cancelText: opts.cancelText ?? '取消',
        confirmColor: opts.confirmColor,
        cancelColor: opts.cancelColor,
        showCancel: opts.showCancel ?? true,
        success: res => {
          resolve(res.confirm);
        },
        fail: () => {
          resolve(false);
        },
      });
    });
  }

  /**
   * 显示警告弹窗（无取消按钮）
   */
  function alert(options: Omit<ConfirmModalOptions, 'showCancel'> | string): Promise<void> {
    const opts = typeof options === 'string' ? { content: options } : options;

    return new Promise(resolve => {
      uni.showModal({
        title: opts.title ?? '提示',
        content: opts.content,
        confirmText: opts.confirmText ?? '知道了',
        showCancel: false,
        success: () => {
          resolve();
        },
        fail: () => {
          resolve();
        },
      });
    });
  }

  /**
   * 显示危险操作确认弹窗
   * @returns 用户是否点击了确认
   */
  function danger(options: ConfirmModalOptions | string): Promise<boolean> {
    const opts = typeof options === 'string' ? { content: options } : options;

    return confirm({
      ...opts,
      title: opts.title ?? '警告',
      confirmText: opts.confirmText ?? '确定',
      confirmColor: opts.confirmColor ?? '#f56c6c',
    });
  }

  return {
    confirm,
    alert,
    danger,
  };
}
