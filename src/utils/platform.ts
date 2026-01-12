/**
 * 平台判断工具
 * 统一处理多端差异判断
 */

// ==================== 平台类型 ====================

/** 平台类型 */
export type PlatformType = 'h5' | 'mp-weixin' | 'mp-alipay' | 'mp-baidu' | 'mp-toutiao' | 'app' | 'unknown';

/** 运行环境类型 */
export type RuntimeType = 'development' | 'production';

// ==================== 平台判断 ====================

/**
 * 是否为 H5 环境
 */
export function isH5(): boolean {
  // #ifdef H5
  return true;
  // #endif
  // #ifndef H5
  return false;
  // #endif
}

/**
 * 是否为微信小程序
 */
export function isWeixin(): boolean {
  // #ifdef MP-WEIXIN
  return true;
  // #endif
  // #ifndef MP-WEIXIN
  return false;
  // #endif
}

/**
 * 是否为支付宝小程序
 */
export function isAlipay(): boolean {
  // #ifdef MP-ALIPAY
  return true;
  // #endif
  // #ifndef MP-ALIPAY
  return false;
  // #endif
}

/**
 * 是否为百度小程序
 */
export function isBaidu(): boolean {
  // #ifdef MP-BAIDU
  return true;
  // #endif
  // #ifndef MP-BAIDU
  return false;
  // #endif
}

/**
 * 是否为字节跳动小程序
 */
export function isToutiao(): boolean {
  // #ifdef MP-TOUTIAO
  return true;
  // #endif
  // #ifndef MP-TOUTIAO
  return false;
  // #endif
}

/**
 * 是否为小程序环境 (任意小程序平台)
 */
export function isMP(): boolean {
  // #ifdef MP
  return true;
  // #endif
  // #ifndef MP
  return false;
  // #endif
}

/**
 * 是否为 App 环境
 */
export function isApp(): boolean {
  // #ifdef APP-PLUS
  return true;
  // #endif
  // #ifndef APP-PLUS
  return false;
  // #endif
}

/**
 * 是否为 iOS App
 */
export function isIOS(): boolean {
  // #ifdef APP-PLUS
  const deviceInfo = uni.getDeviceInfo();
  return deviceInfo.platform === 'ios';
  // #endif
  // #ifndef APP-PLUS
  return false;
  // #endif
}

/**
 * 是否为 Android App
 */
export function isAndroid(): boolean {
  // #ifdef APP-PLUS
  const deviceInfo = uni.getDeviceInfo();
  return deviceInfo.platform === 'android';
  // #endif
  // #ifndef APP-PLUS
  return false;
  // #endif
}

// ==================== 获取平台信息 ====================

/**
 * 获取当前平台类型
 */
export function getPlatform(): PlatformType {
  // #ifdef H5
  return 'h5';
  // #endif
  // #ifdef MP-WEIXIN
  return 'mp-weixin';
  // #endif
  // #ifdef MP-ALIPAY
  return 'mp-alipay';
  // #endif
  // #ifdef MP-BAIDU
  return 'mp-baidu';
  // #endif
  // #ifdef MP-TOUTIAO
  return 'mp-toutiao';
  // #endif
  // #ifdef APP-PLUS
  return 'app';
  // #endif
  return 'unknown';
}

/**
 * 获取运行环境类型
 */
export function getRuntime(): RuntimeType {
  return import.meta.env.DEV ? 'development' : 'production';
}

/**
 * 是否为开发环境
 */
export function isDev(): boolean {
  return import.meta.env.DEV;
}

/**
 * 是否为生产环境
 */
export function isProd(): boolean {
  return import.meta.env.PROD;
}

// ==================== 设备信息 ====================

/** 设备信息接口 */
export interface DeviceInfo {
  /** 平台类型 */
  platform: PlatformType;
  /** 操作系统 */
  os: string;
  /** 操作系统版本 */
  osVersion: string;
  /** 设备品牌 */
  brand: string;
  /** 设备型号 */
  model: string;
  /** 屏幕宽度 */
  screenWidth: number;
  /** 屏幕高度 */
  screenHeight: number;
  /** 可用窗口宽度 */
  windowWidth: number;
  /** 可用窗口高度 */
  windowHeight: number;
  /** 状态栏高度 */
  statusBarHeight: number;
  /** 安全区域 */
  safeArea: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  /** 设备像素比 */
  pixelRatio: number;
}

/** 设备信息缓存 */
let cachedDeviceInfo: DeviceInfo | null = null;

/**
 * 获取设备信息
 * @param refresh 是否刷新缓存
 */
export function getDeviceInfo(refresh = false): DeviceInfo {
  if (cachedDeviceInfo && !refresh) {
    return cachedDeviceInfo;
  }

  try {
    const deviceInfo = uni.getDeviceInfo();
    const windowInfo = uni.getWindowInfo();

    cachedDeviceInfo = {
      platform: getPlatform(),
      os: deviceInfo.platform || 'unknown',
      osVersion: deviceInfo.system || 'unknown',
      brand: deviceInfo.brand || 'unknown',
      model: deviceInfo.model || 'unknown',
      screenWidth: windowInfo.screenWidth || 375,
      screenHeight: windowInfo.screenHeight || 667,
      windowWidth: windowInfo.windowWidth || 375,
      windowHeight: windowInfo.windowHeight || 667,
      statusBarHeight: windowInfo.statusBarHeight || 0,
      safeArea: {
        top: windowInfo.safeArea?.top || 0,
        bottom: windowInfo.safeArea?.bottom || 0,
        left: windowInfo.safeArea?.left || 0,
        right: windowInfo.safeArea?.right || 0,
      },
      pixelRatio: windowInfo.pixelRatio || 2,
    };
  } catch {
    cachedDeviceInfo = {
      platform: getPlatform(),
      os: 'unknown',
      osVersion: 'unknown',
      brand: 'unknown',
      model: 'unknown',
      screenWidth: 375,
      screenHeight: 667,
      windowWidth: 375,
      windowHeight: 667,
      statusBarHeight: 0,
      safeArea: { top: 0, bottom: 0, left: 0, right: 0 },
      pixelRatio: 2,
    };
  }

  return cachedDeviceInfo;
}

/**
 * 获取状态栏高度 (px)
 */
export function getStatusBarHeight(): number {
  return getDeviceInfo().statusBarHeight;
}

/**
 * 获取安全区域底部高度 (px)
 */
export function getSafeAreaBottom(): number {
  return getDeviceInfo().safeArea.bottom;
}

/**
 * 获取导航栏高度 (px)
 * 状态栏 + 导航栏内容区 (44px)
 */
export function getNavBarHeight(): number {
  return getStatusBarHeight() + 44;
}

// ==================== 平台特定功能检测 ====================

/**
 * 是否支持 WebP 图片格式
 */
export function supportsWebP(): boolean {
  // 小程序和 App 都支持 WebP
  if (isMP() || isApp()) {
    return true;
  }

  // H5 需要检测
  // #ifdef H5
  try {
    const canvas = document.createElement('canvas');
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  } catch {
    return false;
  }
  // #endif

  return false;
}

/**
 * 是否支持蓝牙功能
 */
export function supportsBluetooth(): boolean {
  // H5 不支持蓝牙
  if (isH5()) {
    return false;
  }
  return true;
}

/**
 * 是否支持 NFC 功能
 */
export function supportsNFC(): boolean {
  // 仅 App 和部分小程序支持
  if (isApp() || isWeixin()) {
    return true;
  }
  return false;
}

/**
 * 是否支持分享到朋友圈
 */
export function supportsShareTimeline(): boolean {
  return isWeixin();
}

/** 分享平台类型（用于 API） */
export type SharePlatformType = 'WECHAT' | 'ALIPAY' | 'H5' | 'APP';

/**
 * 获取分享平台标识（用于 API 调用）
 * 返回大写格式：WECHAT, ALIPAY, H5, APP
 */
export function getSharePlatform(): SharePlatformType {
  // #ifdef MP-WEIXIN
  return 'WECHAT';
  // #endif
  // #ifdef MP-ALIPAY
  return 'ALIPAY';
  // #endif
  // #ifdef H5
  return 'H5';
  // #endif
  // #ifdef APP-PLUS
  return 'APP';
  // #endif

  return 'H5';
}
