import { ref, type Ref } from 'vue';

export interface LocationInfo {
  /** 纬度 */
  latitude: number;
  /** 经度 */
  longitude: number;
  /** 速度 (m/s) */
  speed?: number;
  /** 精度 (m) */
  accuracy?: number;
  /** 高度 (m) */
  altitude?: number;
  /** 垂直精度 (m) */
  verticalAccuracy?: number;
  /** 水平精度 (m) */
  horizontalAccuracy?: number;
  /** 方向 (度) */
  heading?: number;
  /** 地址信息 (需要调用 getAddress) */
  address?: AddressInfo;
}

export interface AddressInfo {
  /** 国家 */
  country?: string;
  /** 省份 */
  province?: string;
  /** 城市 */
  city?: string;
  /** 区/县 */
  district?: string;
  /** 街道 */
  street?: string;
  /** 详细地址 */
  streetNum?: string;
  /** 完整地址 */
  poiName?: string;
}

export interface UseLocationOptions {
  /** 位置类型: wgs84 | gcj02，默认 gcj02 */
  type?: 'wgs84' | 'gcj02';
  /** 高度信息，默认 false */
  altitude?: boolean;
  /** 高精度定位，默认 false (会增加耗时) */
  highAccuracy?: boolean;
  /** 高精度定位超时时间 (ms)，默认 3000 */
  highAccuracyExpireTime?: number;
  /** 定位是否在后台进行，默认 false */
  isBackground?: boolean;
}

export interface UseLocationReturn {
  /** 当前位置信息 */
  location: Ref<LocationInfo | null>;
  /** 是否正在获取位置 */
  isLoading: Ref<boolean>;
  /** 错误信息 */
  error: Ref<Error | null>;
  /** 获取当前位置 */
  getLocation: () => Promise<LocationInfo | null>;
  /** 选择位置 (打开地图选点) */
  chooseLocation: () => Promise<LocationInfo | null>;
  /** 打开地图查看位置 */
  openLocation: (
    location: Pick<LocationInfo, 'latitude' | 'longitude'>,
    options?: OpenLocationOptions,
  ) => Promise<void>;
  /** 获取地址信息 (逆地理编码) */
  getAddress: (location: Pick<LocationInfo, 'latitude' | 'longitude'>) => Promise<AddressInfo | null>;
}

export interface OpenLocationOptions {
  /** 缩放级别 5-18，默认 18 */
  scale?: number;
  /** 位置名称 */
  name?: string;
  /** 详细地址 */
  address?: string;
}

/**
 * 位置服务 Composable
 * @description 统一位置服务，支持获取位置、选择位置、打开地图
 * @example
 * ```ts
 * const { location, isLoading, getLocation, chooseLocation, openLocation } = useLocation();
 *
 * // 获取当前位置
 * async function handleGetLocation() {
 *   const loc = await getLocation();
 *   if (loc) {
 *     console.log('当前位置:', loc.latitude, loc.longitude);
 *   }
 * }
 *
 * // 选择位置
 * async function handleChooseLocation() {
 *   const loc = await chooseLocation();
 *   if (loc) {
 *     console.log('选择的位置:', loc);
 *   }
 * }
 *
 * // 打开地图查看位置
 * async function handleOpenLocation() {
 *   await openLocation({ latitude: 39.9, longitude: 116.4 }, { name: '北京' });
 * }
 * ```
 */
export function useLocation(options: UseLocationOptions = {}): UseLocationReturn {
  const { type = 'gcj02', altitude = false, highAccuracy = false, highAccuracyExpireTime = 3000 } = options;

  const location = ref<LocationInfo | null>(null);
  const isLoading = ref(false);
  const error = ref<Error | null>(null);

  /**
   * 获取当前位置
   */
  async function getLocation(): Promise<LocationInfo | null> {
    if (isLoading.value) return null;

    isLoading.value = true;
    error.value = null;

    try {
      const res = await new Promise<LocationInfo>((resolve, reject) => {
        uni.getLocation({
          type,
          altitude,
          highAccuracyExpireTime,
          isHighAccuracy: highAccuracy,
          success: res => {
            const loc: LocationInfo = {
              latitude: res.latitude,
              longitude: res.longitude,
              speed: res.speed,
              accuracy: res.accuracy,
              altitude: res.altitude,
              verticalAccuracy: res.verticalAccuracy,
              horizontalAccuracy: res.horizontalAccuracy,
            };
            resolve(loc);
          },
          fail: err => {
            // 检查是否是权限问题
            if (err.errMsg?.includes('auth deny') || err.errMsg?.includes('authorize')) {
              reject(new Error('位置权限被拒绝，请在设置中开启'));
            } else {
              reject(new Error(err.errMsg || '获取位置失败'));
            }
          },
        });
      });

      location.value = res;
      return res;
    } catch (err) {
      error.value = err as Error;
      uni.showToast({
        title: (err as Error).message || '获取位置失败',
        icon: 'none',
      });
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 选择位置 (打开地图选点)
   */
  async function chooseLocation(): Promise<LocationInfo | null> {
    if (isLoading.value) return null;

    isLoading.value = true;
    error.value = null;

    try {
      const res = await new Promise<LocationInfo | null>((resolve, reject) => {
        uni.chooseLocation({
          success: res => {
            const loc: LocationInfo = {
              latitude: res.latitude,
              longitude: res.longitude,
              address: {
                poiName: res.name,
                streetNum: res.address,
              },
            };
            resolve(loc);
          },
          fail: err => {
            // 用户取消不算错误
            if (err.errMsg?.includes('cancel')) {
              resolve(null);
            } else {
              reject(new Error(err.errMsg || '选择位置失败'));
            }
          },
        });
      });

      if (res) {
        location.value = res;
      }
      return res;
    } catch (err) {
      error.value = err as Error;
      uni.showToast({
        title: (err as Error).message || '选择位置失败',
        icon: 'none',
      });
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 打开地图查看位置
   */
  async function openLocation(
    loc: Pick<LocationInfo, 'latitude' | 'longitude'>,
    openOptions: OpenLocationOptions = {},
  ): Promise<void> {
    const { scale = 18, name = '', address = '' } = openOptions;

    return new Promise((resolve, reject) => {
      uni.openLocation({
        latitude: loc.latitude,
        longitude: loc.longitude,
        scale,
        name,
        address,
        success: () => resolve(),
        fail: err => {
          const errMsg = err.errMsg || '打开地图失败';
          uni.showToast({
            title: errMsg,
            icon: 'none',
          });
          reject(new Error(errMsg));
        },
      });
    });
  }

  /**
   * 获取地址信息 (逆地理编码)
   *
   * @description
   * 此功能需要配合地图 SDK 或第三方服务使用。
   * 根据不同平台选择实现方式：
   *
   * **微信小程序**: 使用腾讯位置服务 SDK
   * ```ts
   * // 1. 申请腾讯位置服务 key: https://lbs.qq.com/
   * // 2. 安装 SDK: npm install qqmap-wx-jssdk
   * // 3. 调用逆地理编码 API
   * ```
   *
   * **H5**: 使用高德/百度地图 Web API
   * ```ts
   * // 高德地图示例
   * const response = await fetch(
   *   `https://restapi.amap.com/v3/geocode/regeo?key=YOUR_KEY&location=${loc.longitude},${loc.latitude}`
   * );
   * const data = await response.json();
   * ```
   *
   * **App**: 使用 uni-app 原生插件或 Native.js 调用原生 SDK
   *
   * @param loc 经纬度坐标
   * @returns 地址信息，未实现时返回 null
   */
  async function getAddress(loc: Pick<LocationInfo, 'latitude' | 'longitude'>): Promise<AddressInfo | null> {
    // 基础实现：抛出未实现提示，方便开发者发现需要接入地图服务
    if (import.meta.env.DEV) {
      console.warn(
        '[useLocation] getAddress 未实现，请根据项目需求接入地图服务。',
        '\n坐标:',
        loc,
        '\n参考文档: https://lbs.qq.com/ (腾讯) 或 https://lbs.amap.com/ (高德)',
      );
    }

    // TODO: 根据项目需求接入具体的地图服务 API
    // 可以在 src/utils/map.ts 中实现具体逻辑，然后在这里调用

    return null;
  }

  return {
    location,
    isLoading,
    error,
    getLocation,
    chooseLocation,
    openLocation,
    getAddress,
  };
}
