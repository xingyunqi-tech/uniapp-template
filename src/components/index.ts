/**
 * 组件统一导出
 *
 * 注意：
 * 1. uni-ui 组件已通过 easycom 自动注册，无需手动导入
 * 2. 本项目自定义组件 (U* 前缀) 也已通过 easycom 注册，可直接在模板中使用
 * 3. 本文件提供显式导出，便于 IDE 类型提示和按需导入
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

// ==================== 布局组件 ====================
// 认证页面布局 (登录、注册、忘记密码等)
export { default as AuthLayout } from './AuthLayout/index.vue';

// ==================== 基础组件 ====================
// 横幅/通知组件
export { default as UBanner } from './UBanner/index.vue';

// 空状态组件 (uni-ui 无此组件)
export { default as UEmpty } from './UEmpty/index.vue';

// 固定位置按钮
export { default as UFixedButton } from './UFixedButton/index.vue';

// 图片组件 (封装懒加载、错误处理、重试)
export { default as UImage } from './UImage/index.vue';

// 加载动画组件
export { default as ULoading } from './ULoading/index.vue';

// 富文本渲染组件
export { default as URichText } from './URichText/index.vue';

// 标签页组件
export { default as UTabs } from './UTabs/index.vue';

// ==================== 表单组件 ====================
// 表单项包装组件
export { default as UFormItem } from './UFormItem/index.vue';

// 密码强度指示器
export { default as UPasswordStrength } from './UPasswordStrength/index.vue';

// 短信验证码输入组件
export { default as USmsInput } from './USmsInput/index.vue';

// 图片上传组件 (支持多选、压缩、自动上传)
export { default as UImageUpload } from './UImageUpload/index.vue';

// ==================== 菜单组件 ====================
// 菜单组容器
export { default as UMenuGroup } from './UMenuGroup/index.vue';

// 菜单项
export { default as UMenuItem } from './UMenuItem/index.vue';
