/**
 * UniApp 统一存储 API
 * 支持多端，自动适配 H5/小程序/App
 */

export interface StorageOptions {
  /** 过期时间 (毫秒) */
  expires?: number;
}

/** 带过期时间的存储数据格式 */
interface StorageDataWithExpiry<T> {
  /** 存储的值 */
  __value: T;
  /** 过期时间戳 (毫秒) */
  __expires?: number;
}

/**
 * 存储键名常量
 */
export const STORAGE_KEYS = {
  /** 用户 Token */
  TOKEN: 'token',
  /** 搜索历史 */
  SEARCH_HISTORY: 'search_history',
  /** 浏览历史 */
  VIEW_HISTORY: 'view_history',
  /** 草稿数据 */
  DRAFT: 'draft',
} as const;

/**
 * 检查是否为带过期时间的数据格式
 */
function isStorageDataWithExpiry<T>(data: unknown): data is StorageDataWithExpiry<T> {
  return data !== null && typeof data === 'object' && '__value' in data;
}

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
   * 获取存储数据
   * @param key 存储键名
   * @param defaultValue 默认值
   */
  get<T>(key: string, defaultValue?: T): T | null {
    try {
      const fullKey = this.getKey(key);
      const rawData = uni.getStorageSync(fullKey);

      if (rawData === '' || rawData === null || rawData === undefined) {
        return defaultValue ?? null;
      }

      // uni.getStorageSync 已自动处理 JSON 解析
      // 检查是否为带过期时间的数据格式
      if (isStorageDataWithExpiry<T>(rawData)) {
        // 检查是否过期
        if (rawData.__expires && Date.now() > rawData.__expires) {
          this.remove(key);
          return defaultValue ?? null;
        }
        return rawData.__value;
      }

      // 普通数据直接返回
      return rawData as T;
    } catch (error) {
      console.error('Storage get error:', error);
      return defaultValue ?? null;
    }
  }

  /**
   * 设置存储数据
   * @param key 存储键名
   * @param value 存储值
   * @param options 存储选项 (设置 expires 时会包装数据)
   */
  set<T>(key: string, value: T, options?: StorageOptions): void {
    try {
      const fullKey = this.getKey(key);

      // 有过期时间时，包装数据
      if (options?.expires) {
        const data: StorageDataWithExpiry<T> = {
          __value: value,
          __expires: Date.now() + options.expires,
        };
        uni.setStorageSync(fullKey, data);
      } else {
        // 无过期时间，直接存储原始值
        uni.setStorageSync(fullKey, value);
      }
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
    try {
      const fullKey = this.getKey(key);
      const rawData = uni.getStorageSync(fullKey);

      // 空值判断
      if (rawData === '' || rawData === null || rawData === undefined) {
        return false;
      }

      // 检查是否为带过期时间的数据且已过期
      if (isStorageDataWithExpiry(rawData)) {
        if (rawData.__expires && Date.now() > rawData.__expires) {
          this.remove(key);
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
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
