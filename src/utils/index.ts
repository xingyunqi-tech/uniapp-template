/**
 * 通用工具函数统一导出，仅含无副作用的轻量工具
 * 应用启动类（路由守卫、更新检查、网络监听、错误与性能上报、TabBar 角标）与业务模块（订阅消息、多语言）从对应文件导入，地区数据使用 useRegionStore
 */

export * from './router';
export * from './storage';
export * from './datetime';
export * from './formatters';
export * from './validator';
export * from './platform';
export * from './debounce';
export * from './throttle';
export * from './modal';
export * from './toast';
export * from './crypto';
