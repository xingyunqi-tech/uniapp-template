/**
 * UniApp 统一存储 API
 * 支持多端，自动适配 H5/小程序/App
 */

export interface StorageOptions {
  /** 过期时间 (毫秒) */
  expires?: number;
}

interface StorageData<T> {
  value: T;
  expires?: number;
  timestamp: number;
}

/**
 * 存储键名常量
 */
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER_INFO: 'userInfo',
  THEME: 'theme',
} as const;

/**
 * 统一存储类
 */
class UniStorage {
  private prefix = 'uni_';

  /**
   * 获取完整的存储键名
   */
  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  /**
   * 检查数据是否过期
   */
  private isExpired(data: StorageData<unknown>): boolean {
    if (!data.expires) return false;
    return Date.now() > data.timestamp + data.expires;
  }

  /**
   * 获取存储数据
   * @param key 存储键名
   * @param defaultValue 默认值
   */
  get<T>(key: string, defaultValue?: T): T | null {
    try {
      const fullKey = this.getKey(key);
      const rawData = uni.getStorageSync(fullKey);

      if (!rawData) {
        return defaultValue ?? null;
      }

      // 尝试解析为带过期时间的数据格式
      try {
        const data = JSON.parse(rawData) as StorageData<T>;

        // 检查是否为新格式数据
        if (data && typeof data === 'object' && 'value' in data && 'timestamp' in data) {
          // 检查是否过期
          if (this.isExpired(data)) {
            this.remove(key);
            return defaultValue ?? null;
          }
          return data.value;
        }

        // 兼容旧格式数据
        return data as T;
      } catch {
        // 如果解析失败，返回原始数据
        return rawData as T;
      }
    } catch (error) {
      console.error('Storage get error:', error);
      return defaultValue ?? null;
    }
  }

  /**
   * 设置存储数据
   * @param key 存储键名
   * @param value 存储值
   * @param options 存储选项
   */
  set<T>(key: string, value: T, options?: StorageOptions): void {
    try {
      const fullKey = this.getKey(key);
      const data: StorageData<T> = {
        value,
        timestamp: Date.now(),
        expires: options?.expires,
      };
      uni.setStorageSync(fullKey, JSON.stringify(data));
    } catch (error) {
      console.error('Storage set error:', error);
    }
  }

  /**
   * 移除存储数据
   * @param key 存储键名
   */
  remove(key: string): void {
    try {
      const fullKey = this.getKey(key);
      uni.removeStorageSync(fullKey);
    } catch (error) {
      console.error('Storage remove error:', error);
    }
  }

  /**
   * 清空所有存储数据
   */
  clear(): void {
    try {
      uni.clearStorageSync();
    } catch (error) {
      console.error('Storage clear error:', error);
    }
  }

  /**
   * 获取存储信息
   */
  getInfo(): UniApp.GetStorageInfoSuccess | null {
    try {
      return uni.getStorageInfoSync();
    } catch (error) {
      console.error('Storage getInfo error:', error);
      return null;
    }
  }

  /**
   * 检查是否存在某个键
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * 获取所有带前缀的键
   */
  keys(): string[] {
    const info = this.getInfo();
    if (!info) return [];
    return info.keys.filter(key => key.startsWith(this.prefix));
  }
}

// 导出单例
export const storage = new UniStorage();

export default storage;
