/**
 * UniApp API Promise 封装
 * 将 uni API 转换为 Promise 形式，便于使用 async/await
 *
 * 注意：导航相关函数请使用 @/utils/router 或 @/composables/useRouter
 */

// ==================== 提示相关 ====================

export interface ToastOptions {
  title: string;
  icon?: 'success' | 'error' | 'loading' | 'none';
  duration?: number;
  mask?: boolean;
}

/**
 * 显示 Toast 提示
 */
export function showToast(options: ToastOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    uni.showToast({
      icon: 'none',
      duration: 2000,
      ...options,
      success: () => resolve(),
      fail: err => reject(err),
    });
  });
}

/**
 * 隐藏 Toast
 */
export function hideToast(): void {
  uni.hideToast();
}

export interface LoadingOptions {
  title: string;
  mask?: boolean;
}

/**
 * 显示 Loading
 */
export function showLoading(options: LoadingOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    uni.showLoading({
      mask: true,
      ...options,
      success: () => resolve(),
      fail: err => reject(err),
    });
  });
}

/**
 * 隐藏 Loading
 */
export function hideLoading(): void {
  uni.hideLoading();
}

export interface ModalOptions {
  title?: string;
  content: string;
  showCancel?: boolean;
  cancelText?: string;
  confirmText?: string;
  cancelColor?: string;
  confirmColor?: string;
}

export interface ModalResult {
  confirm: boolean;
  cancel: boolean;
}

/**
 * 显示模态对话框
 */
export function showModal(options: ModalOptions): Promise<ModalResult> {
  return new Promise((resolve, reject) => {
    uni.showModal({
      title: '提示',
      showCancel: true,
      cancelText: '取消',
      confirmText: '确定',
      ...options,
      success: res => resolve({ confirm: res.confirm, cancel: res.cancel }),
      fail: err => reject(err),
    });
  });
}

export interface ActionSheetOptions {
  itemList: string[];
  itemColor?: string;
}

/**
 * 显示操作菜单
 */
export function showActionSheet(options: ActionSheetOptions): Promise<number> {
  return new Promise((resolve, reject) => {
    uni.showActionSheet({
      ...options,
      success: res => resolve(res.tapIndex),
      fail: err => reject(err),
    });
  });
}

// ==================== 存储相关 ====================

/**
 * 异步获取存储数据
 */
export function getStorage<T = unknown>(key: string): Promise<T | null> {
  return new Promise(resolve => {
    uni.getStorage({
      key,
      success: res => resolve(res.data as T),
      fail: () => resolve(null),
    });
  });
}

/**
 * 异步设置存储数据
 */
export function setStorage<T>(key: string, data: T): Promise<void> {
  return new Promise((resolve, reject) => {
    uni.setStorage({
      key,
      data,
      success: () => resolve(),
      fail: err => reject(err),
    });
  });
}

/**
 * 异步移除存储数据
 */
export function removeStorage(key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    uni.removeStorage({
      key,
      success: () => resolve(),
      fail: err => reject(err),
    });
  });
}

/**
 * 异步清空存储
 */
export function clearStorage(): Promise<void> {
  return new Promise(() => {
    uni.clearStorage();
  });
}

// ==================== 系统信息 ====================

/**
 * 获取系统信息
 */
export function getSystemInfo(): Promise<UniApp.GetSystemInfoResult> {
  return new Promise((resolve, reject) => {
    uni.getSystemInfo({
      success: res => resolve(res),
      fail: err => reject(err),
    });
  });
}

/**
 * 获取设备信息
 */
export function getDeviceInfo(): UniApp.GetDeviceInfoResult {
  return uni.getDeviceInfo();
}

/**
 * 获取窗口信息
 */
export function getWindowInfo(): UniApp.GetWindowInfoResult {
  return uni.getWindowInfo();
}

// ==================== 网络相关 ====================

/**
 * 获取网络状态
 */
export function getNetworkType(): Promise<string> {
  return new Promise((resolve, reject) => {
    uni.getNetworkType({
      success: res => resolve(res.networkType),
      fail: err => reject(err),
    });
  });
}

// ==================== 剪贴板 ====================

/**
 * 设置剪贴板内容
 */
export function setClipboardData(data: string): Promise<void> {
  return new Promise((resolve, reject) => {
    uni.setClipboardData({
      data,
      success: () => resolve(),
      fail: err => reject(err),
    });
  });
}

/**
 * 获取剪贴板内容
 */
export function getClipboardData(): Promise<string> {
  return new Promise((resolve, reject) => {
    uni.getClipboardData({
      success: res => resolve(res.data),
      fail: err => reject(err),
    });
  });
}

// ==================== 图片相关 ====================

export interface ChooseImageOptions {
  count?: number;
  sizeType?: ('original' | 'compressed')[];
  sourceType?: ('album' | 'camera')[];
}

export interface ChooseImageResult {
  tempFilePaths: string | string[];
  tempFiles: { path: string; size: number }[];
}

/**
 * 选择图片
 */
export function chooseImage(options: ChooseImageOptions = {}): Promise<ChooseImageResult> {
  return new Promise((resolve, reject) => {
    uni.chooseImage({
      count: 9,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      ...options,
      success: res =>
        resolve({
          tempFilePaths: res.tempFilePaths,
          tempFiles: res.tempFiles as { path: string; size: number }[],
        }),
      fail: err => reject(err),
    });
  });
}

/**
 * 预览图片
 */
export function previewImage(urls: string[], current?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    uni.previewImage({
      urls,
      current: current || urls[0],
      success: () => resolve(),
      fail: err => reject(err),
    });
  });
}

// ==================== 位置相关 ====================

export interface LocationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  speed?: number;
}

/**
 * 获取当前位置
 */
export function getLocation(type: 'wgs84' | 'gcj02' = 'gcj02'): Promise<LocationResult> {
  return new Promise((resolve, reject) => {
    uni.getLocation({
      type,
      success: res =>
        resolve({
          latitude: res.latitude,
          longitude: res.longitude,
          accuracy: res.accuracy,
          altitude: res.altitude,
          speed: res.speed,
        }),
      fail: err => reject(err),
    });
  });
}

// ==================== 扫码 ====================

export interface ScanCodeResult {
  result: string;
  scanType: string;
  charSet: string;
  path?: string;
}

/**
 * 扫描二维码
 */
export function scanCode(): Promise<ScanCodeResult> {
  return new Promise((resolve, reject) => {
    uni.scanCode({
      success: res =>
        resolve({
          result: res.result,
          scanType: res.scanType,
          charSet: res.charSet,
          path: res.path,
        }),
      fail: err => reject(err),
    });
  });
}

// ==================== 分享 ====================

/**
 * 设置导航栏标题
 */
export function setNavigationBarTitle(title: string): Promise<void> {
  return new Promise((resolve, reject) => {
    uni.setNavigationBarTitle({
      title,
      success: () => resolve(),
      fail: err => reject(err),
    });
  });
}

/**
 * 设置导航栏颜色
 */
export function setNavigationBarColor(frontColor: '#ffffff' | '#000000', backgroundColor: string): Promise<void> {
  return new Promise((resolve, reject) => {
    uni.setNavigationBarColor({
      frontColor,
      backgroundColor,
      success: () => resolve(),
      fail: err => reject(err),
    });
  });
}
