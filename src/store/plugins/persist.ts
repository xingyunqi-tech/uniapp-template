import { createPinia } from 'pinia';
import { createPersistedState } from 'pinia-plugin-persistedstate';

/**
 * 创建配置好持久化的Pinia实例
 */
export const createPersistedPinia = () => {
  const pinia = createPinia();

  const piniaPersistedState = createPersistedState();

  pinia.use(piniaPersistedState);

  return pinia;
};
