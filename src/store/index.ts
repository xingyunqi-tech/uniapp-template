import { createPersistedPinia } from './plugins/persist';

export * from './modules/user';
export * from './modules/global';
export * from './modules/address';
export * from './modules/favorite';
export * from './modules/feedback';
export * from './modules/order';
export * from './modules/share';
export * from './modules/region';
export * from './plugins/persist';

export default createPersistedPinia();
