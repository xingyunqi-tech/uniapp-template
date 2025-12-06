/**
 * Toast 工具函数
 * 封装 uni.showToast，提供简洁的调用方式
 */

export interface ToastOptions {
  /** 提示文本 */
  title: string;
  /** 图标类型 */
  icon?: 'success' | 'error' | 'loading' | 'none';
  /** 显示时长 (ms)，默认 1500 */
  duration?: number;
  /** 是否显示遮罩层 */
  mask?: boolean;
  /** 自定义图标路径 (仅 App 和 H5 支持) */
  image?: string;
}

/**
 * 显示 Toast 提示
 * @param options Toast 配置或提示文本
 *
 * @example
 * ```ts
 * // 简单用法
 * showToast('操作成功');
 *
 * // 完整配置
 * showToast({
 *   title: '加载中',
 *   icon: 'loading',
 *   duration: 2000,
 * });
 * ```
 */
export function showToast(options: ToastOptions | string): void {
  const opts = typeof options === 'string' ? { title: options } : options;

  uni.showToast({
    title: opts.title,
    icon: opts.icon ?? 'none',
    duration: opts.duration ?? 1500,
    mask: opts.mask ?? false,
    image: opts.image,
  });
}

/**
 * 显示成功提示
 * @param title 提示文本
 * @param duration 显示时长 (ms)
 *
 * @example
 * ```ts
 * showSuccess('保存成功');
 * ```
 */
export function showSuccess(title: string, duration = 1500): void {
  uni.showToast({
    title,
    icon: 'success',
    duration,
  });
}

/**
 * 显示错误提示
 * @param title 提示文本
 * @param duration 显示时长 (ms)
 *
 * @example
 * ```ts
 * showError('操作失败');
 * ```
 */
export function showError(title: string, duration = 1500): void {
  uni.showToast({
    title,
    icon: 'error',
    duration,
  });
}

/**
 * 显示普通提示 (无图标)
 * @param title 提示文本
 * @param duration 显示时长 (ms)
 *
 * @example
 * ```ts
 * showInfo('请输入手机号');
 * ```
 */
export function showInfo(title: string, duration = 1500): void {
  uni.showToast({
    title,
    icon: 'none',
    duration,
  });
}

/**
 * 隐藏 Toast
 */
export function hideToast(): void {
  uni.hideToast();
}

// ==================== Loading 相关 ====================
// 说明：Loading 功能已统一到 useLoading composable
// 推荐使用 useLoading 或直接导入 showLoading/hideLoading
//
// @example
// ```ts
// // 方式 1：使用 composable
// import { useLoading } from '@/composables';
// const { showLoading, hideLoading, withLoading } = useLoading();
//
// // 方式 2：直接导入单例方法
// import { showLoading, hideLoading, withLoading } from '@/composables';
//
// // 显示加载
// showLoading('加载中...');
// hideLoading();
//
// // 或使用 withLoading 包装异步操作
// await withLoading(async () => {
//   await fetchData();
// }, '数据加载中...');
// ```
