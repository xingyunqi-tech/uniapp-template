import { ref, type Ref } from 'vue';
import { isMP } from '@/utils/platform';

/**
 * 权限类型
 */
export type PermissionType =
  | 'scope.userLocation' // 精确地理位置
  | 'scope.userLocationBackground' // 后台定位
  | 'scope.userFuzzyLocation' // 模糊地理位置
  | 'scope.record' // 麦克风
  | 'scope.camera' // 摄像头
  | 'scope.bluetooth' // 蓝牙
  | 'scope.writePhotosAlbum' // 保存到相册
  | 'scope.addPhoneContact' // 添加到联系人
  | 'scope.addPhoneCalendar' // 添加到日历
  | 'scope.werun' // 微信运动步数
  | 'scope.address' // 通讯地址
  | 'scope.invoiceTitle' // 发票抬头
  | 'scope.invoice'; // 获取发票

/**
 * 权限状态
 */
export type PermissionStatus = 'authorized' | 'denied' | 'not-determined' | 'unknown';

/**
 * 权限配置
 */
export interface PermissionConfig {
  /** 权限类型 */
  type: PermissionType;
  /** 权限描述（用于提示用户） */
  desc?: string;
  /** 被拒绝时的提示文案 */
  deniedTip?: string;
}

/**
 * 权限名称映射
 */
const PERMISSION_NAMES: Record<PermissionType, string> = {
  'scope.userLocation': '精确地理位置',
  'scope.userLocationBackground': '后台定位',
  'scope.userFuzzyLocation': '模糊地理位置',
  'scope.record': '麦克风',
  'scope.camera': '摄像头',
  'scope.bluetooth': '蓝牙',
  'scope.writePhotosAlbum': '相册写入',
  'scope.addPhoneContact': '通讯录',
  'scope.addPhoneCalendar': '日历',
  'scope.werun': '微信运动',
  'scope.address': '通讯地址',
  'scope.invoiceTitle': '发票抬头',
  'scope.invoice': '发票',
};

export interface UsePermissionOptions {
  /** 权限类型 */
  type: PermissionType;
  /** 被拒绝时是否自动引导打开设置 */
  autoOpenSettings?: boolean;
  /** 被拒绝时的提示文案 */
  deniedTip?: string;
}

export interface UsePermissionReturn {
  /** 权限状态 */
  status: Ref<PermissionStatus>;
  /** 是否已授权 */
  isAuthorized: Ref<boolean>;
  /** 是否正在请求 */
  isRequesting: Ref<boolean>;
  /** 检查权限状态 */
  check: () => Promise<PermissionStatus>;
  /** 请求权限 */
  request: () => Promise<boolean>;
  /** 打开设置页面 */
  openSettings: () => Promise<void>;
}

/**
 * 权限管理 Composable
 * @description 统一权限请求和状态管理，支持多端
 *
 * @example
 * ```ts
 * const { isAuthorized, request, check } = usePermission({
 *   type: 'scope.camera',
 *   autoOpenSettings: true,
 *   deniedTip: '需要摄像头权限才能拍照',
 * });
 *
 * // 检查权限
 * await check();
 *
 * // 请求权限
 * async function handleTakePhoto() {
 *   const granted = await request();
 *   if (granted) {
 *     // 拍照
 *   }
 * }
 * ```
 */
export function usePermission(options: UsePermissionOptions): UsePermissionReturn {
  const { type, autoOpenSettings = true, deniedTip } = options;

  const status = ref<PermissionStatus>('unknown');
  const isAuthorized = ref(false);
  const isRequesting = ref(false);

  const permissionName = PERMISSION_NAMES[type] || type;
  const defaultDeniedTip = deniedTip || `需要${permissionName}权限，请在设置中开启`;

  /**
   * 检查权限状态
   */
  async function check(): Promise<PermissionStatus> {
    // 仅小程序有授权设置，H5 与 App 由系统在调用对应接口时申请权限
    if (!isMP()) {
      status.value = 'authorized';
      isAuthorized.value = true;
      return 'authorized';
    }

    try {
      const res = await uni.getSetting();
      const authSetting = res.authSetting;
      const permissionValue = authSetting[type as keyof typeof authSetting];

      if (permissionValue === true) {
        status.value = 'authorized';
        isAuthorized.value = true;
        return 'authorized';
      } else if (permissionValue === false) {
        status.value = 'denied';
        isAuthorized.value = false;
        return 'denied';
      } else {
        status.value = 'not-determined';
        isAuthorized.value = false;
        return 'not-determined';
      }
    } catch (error) {
      console.error('[usePermission] check error:', error);
      status.value = 'unknown';
      isAuthorized.value = false;
      return 'unknown';
    }
  }

  /**
   * 请求权限
   */
  async function request(): Promise<boolean> {
    if (isRequesting.value) return false;

    // 仅小程序有授权设置，H5 与 App 由系统在调用对应接口时申请权限
    if (!isMP()) {
      status.value = 'authorized';
      isAuthorized.value = true;
      return true;
    }

    isRequesting.value = true;

    try {
      // 先检查当前状态
      const currentStatus = await check();

      // 已授权
      if (currentStatus === 'authorized') {
        return true;
      }

      // 已拒绝，引导打开设置
      if (currentStatus === 'denied') {
        if (autoOpenSettings) {
          const confirmed = await showDeniedModal();
          if (confirmed) {
            await openSettings();
          }
        }
        return false;
      }

      // 未决定，请求授权
      const res = await uni.authorize({ scope: type });

      if (res.errMsg?.includes('ok')) {
        status.value = 'authorized';
        isAuthorized.value = true;
        return true;
      }

      status.value = 'denied';
      isAuthorized.value = false;
      return false;
    } catch (error: any) {
      console.error('[usePermission] request error:', error);

      // 用户拒绝授权
      if (error?.errMsg?.includes('deny') || error?.errMsg?.includes('auth')) {
        status.value = 'denied';
        isAuthorized.value = false;

        if (autoOpenSettings) {
          const confirmed = await showDeniedModal();
          if (confirmed) {
            await openSettings();
          }
        }
      }

      return false;
    } finally {
      isRequesting.value = false;
    }
  }

  /**
   * 显示权限被拒绝的弹窗
   */
  async function showDeniedModal(): Promise<boolean> {
    return new Promise(resolve => {
      uni.showModal({
        title: '权限申请',
        content: defaultDeniedTip,
        confirmText: '去设置',
        cancelText: '取消',
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
   * 打开设置页面
   */
  async function openSettings(): Promise<void> {
    try {
      await uni.openSetting();
      // 从设置页返回后重新检查权限
      await check();
    } catch (error) {
      console.error('[usePermission] openSettings error:', error);
    }
  }

  return {
    status,
    isAuthorized,
    isRequesting,
    check,
    request,
    openSettings,
  };
}

/**
 * 请求相机权限
 * @description 便捷方法
 */
export function useCameraPermission(options?: Omit<UsePermissionOptions, 'type'>) {
  return usePermission({
    type: 'scope.camera',
    deniedTip: '需要摄像头权限才能拍照',
    ...options,
  });
}

/**
 * 请求相册写入权限
 * @description 便捷方法
 */
export function useAlbumPermission(options?: Omit<UsePermissionOptions, 'type'>) {
  return usePermission({
    type: 'scope.writePhotosAlbum',
    deniedTip: '需要相册权限才能保存图片',
    ...options,
  });
}

/**
 * 请求定位权限
 * @description 便捷方法
 */
export function useLocationPermission(options?: Omit<UsePermissionOptions, 'type'>) {
  return usePermission({
    type: 'scope.userLocation',
    deniedTip: '需要定位权限才能获取当前位置',
    ...options,
  });
}

/**
 * 请求麦克风权限
 * @description 便捷方法
 */
export function useRecordPermission(options?: Omit<UsePermissionOptions, 'type'>) {
  return usePermission({
    type: 'scope.record',
    deniedTip: '需要麦克风权限才能录音',
    ...options,
  });
}
