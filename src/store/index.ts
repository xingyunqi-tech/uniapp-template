import { createPersistedPinia } from './plugins/persist';

export * from './modules/user';
export * from './modules/global';
export * from './plugins/persist';

export default createPersistedPinia();
