/**
 * 组件统一导出
 *
 * 注意：uni-ui 组件已通过 easycom 自动注册，无需手动导入
 * 本文件导出的是项目自定义的基础组件封装
 *
 * 以下 uni-ui 组件可直接使用（无需导入）：
 * - uni-card: 卡片组件
 * - uni-list / uni-list-item: 列表组件
 * - uni-popup: 弹出层（支持 dialog/share/bottom 等模式）
 * - uni-nav-bar: 导航栏
 * - uni-notice-bar: 通知栏
 * - uni-load-more: 加载更多
 * - uni-swipe-action: 滑动操作
 */

// 空状态组件 (uni-ui 无此组件)
export { default as UEmpty } from './UEmpty/index.vue';

// 图片组件 (封装懒加载、错误处理、重试)
export { default as UImage } from './UImage/index.vue';
