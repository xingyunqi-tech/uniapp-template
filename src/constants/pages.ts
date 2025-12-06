import { ROLE } from './permission';

/**
 * 页面路径常量
 */
export const PAGES = {
  // ========== 主包页面 ==========
  /** 首页 (TabBar) */
  HOME: '/pages/index/index',
  /** 我的 (TabBar) */
  MINE: '/pages/mine/index',
  /** 登录 */
  LOGIN: '/pages/login/index',
  /** 注册 */
  REGISTER: '/pages/register/index',
  /** 忘记密码 */
  FORGOT_PASSWORD: '/pages/forgot-password/index',
  /** 404 错误页 */
  ERROR: '/pages/error/index',
  /** 协议详情 */
  AGREEMENT: '/pages/agreement/index',
  /** 403 无权限页 */
  FORBIDDEN: '/pages/error/index',

  // ========== order 分包 ==========
  /** 我的订单 */
  ORDER: '/pages-sub/order/list/index',

  // ========== user 分包 ==========
  /** 地址管理 */
  ADDRESS: '/pages-sub/user/address/index',
  /** 编辑地址 */
  ADDRESS_EDIT: '/pages-sub/user/address-edit/index',
  /** 设置 */
  SETTINGS: '/pages-sub/user/settings/index',
  /** 编辑资料 */
  PROFILE: '/pages-sub/user/profile/index',
  /** 修改密码 */
  PASSWORD: '/pages-sub/user/password/index',
  /** 我的收藏 */
  FAVORITE: '/pages-sub/user/favorite/index',

  // ========== other 分包 ==========
  /** 意见反馈 */
  FEEDBACK: '/pages-sub/other/feedback/index',
  /** 关于我们 */
  ABOUT: '/pages-sub/other/about/index',
  /** 联系客服 */
  CONTACT: '/pages-sub/other/contact/index',
  /** Webview 容器 */
  WEBVIEW: '/pages-sub/other/webview/index',
} as const;

/**
 * 白名单页面（无需登录）
 */
export const WHITE_LIST = [
  PAGES.LOGIN,
  PAGES.REGISTER,
  PAGES.FORGOT_PASSWORD,
  PAGES.HOME,
  PAGES.ERROR,
  PAGES.AGREEMENT,
  PAGES.ABOUT,
  PAGES.WEBVIEW,
] as const;

/**
 * 页面权限配置
 * 配置需要特定角色才能访问的页面
 *
 * @example
 * ```ts
 * // 配置管理员专属页面
 * PAGE_ROLES['/pages-sub/admin/dashboard/index'] = [ROLE.ADMIN];
 * ```
 */
export const PAGE_ROLES: Record<string, ROLE[]> = {
  // 示例：管理员专属页面
  // '/pages-sub/admin/dashboard/index': [ROLE.ADMIN],
};
