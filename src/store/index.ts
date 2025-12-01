import type { App } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';

// 创建 Pinia 实例
const pinia = createPinia();

// 使用持久化插件
pinia.use(piniaPluginPersistedstate);

/**
 * 安装 Pinia Store
 * @param app Vue 应用实例
 */
export function setupStore(app: App) {
  app.use(pinia);
}

// 导出 Store 模块
export * from './modules/user';
export * from './modules/global';

export { pinia };
export default pinia;
