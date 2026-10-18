import { createPersistedPinia } from './plugins/persist';

export * from './modules/user';
export * from './modules/global';
export * from './modules/address';
export * from './modules/favorite';
export * from './modules/feedback';
export * from './modules/order';
export * from './modules/share';
export * from './modules/region';
export * from './modules/notification';
export * from './modules/config';
export * from './modules/consent';
export * from './modules/exam';
export * from './modules/practice';
export * from './modules/wrong-book';
export * from './modules/study';
export * from './modules/question-collection';
export * from './modules/question-report';
export * from './plugins/persist';

export default createPersistedPinia();
