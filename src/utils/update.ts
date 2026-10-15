/**
 * 小程序更新管理
 * 用于检测和提示用户更新小程序
 */

/** 更新配置选项 */
export interface UpdateOptions {
  /** 更新提示标题 */
  title?: string;
  /** 更新提示内容 */
  content?: string;
  /** 确认按钮文字 */
  confirmText?: string;
  /** 是否强制更新（不显示取消按钮） */
  forceUpdate?: boolean;
}

/**
 * 检查并应用小程序更新
 * @param options 更新配置
 *
 * @example
 * ```ts
 * // 在 App.vue 的 onLaunch 中调用
 * import { checkUpdate } from '@/utils/update'
 *
 * onLaunch(() => {
 *   checkUpdate()
 * })
 * ```
 */
export function checkUpdate(options: UpdateOptions = {}): void {
  const {
    title = '更新提示',
    content = '新版本已经准备好，是否重启应用？',
    confirmText = '立即更新',
    forceUpdate = false,
  } = options;

  // #ifdef MP
  // 小程序环境才执行更新检查
  if (typeof uni.getUpdateManager !== 'function') {
    console.warn('[Update] 当前环境不支持 UpdateManager');
    return;
  }

  const updateManager = uni.getUpdateManager();

  // 检查更新
  updateManager.onCheckForUpdate((res: { hasUpdate: boolean }) => {
    if (res.hasUpdate) {
      console.log('[Update] 发现新版本');
    }
  });

  // 新版本下载完成
  updateManager.onUpdateReady(() => {
    uni.showModal({
      title,
      content,
      confirmText,
      showCancel: !forceUpdate,
      success: (res: UniApp.ShowModalRes) => {
        if (res.confirm) {
          // 强制重启应用使用新版本
          updateManager.applyUpdate();
        }
      },
    });
  });

  // 新版本下载失败
  updateManager.onUpdateFailed(() => {
    uni.showModal({
      title: '更新失败',
      content: '新版本下载失败，请检查网络后重试，或删除小程序重新搜索打开',
      showCancel: false,
      confirmText: '我知道了',
    });
  });
  // #endif
}
