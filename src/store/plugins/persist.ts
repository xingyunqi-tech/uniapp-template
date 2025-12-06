import { createPinia } from 'pinia';
import { createPersistedState, type StorageLike } from 'pinia-plugin-persistedstate';

/**
 * UniApp 统一存储适配器
 * 用于 Pinia 持久化，支持多端（H5/小程序/App）
 */
export const uniStorage: StorageLike = {
  getItem(key: string): string | null {
    try {
      return uni.getStorageSync(key) || null;
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      uni.setStorageSync(key, value);
    } catch (error) {
      console.error('[Storage] setItem error:', error);
    }
  },
};

/**
 * 创建配置好持久化的 Pinia 实例
 * 全局统一使用 uniStorage 作为存储适配器
 */
export const createPersistedPinia = () => {
  const pinia = createPinia();

  // 配置全局默认存储
  const piniaPersistedState = createPersistedState({
    storage: uniStorage,
  });

  pinia.use(piniaPersistedState);

  return pinia;
};
