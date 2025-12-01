/**
 * 页面路径常量
 */
export const PAGES = {
  HOME: '/pages/index/index',
  LOGIN: '/pages/login/index',
  REGISTER: '/pages/register/index',
  MINE: '/pages/mine/index',
  ADDRESS: '/pages/address/index',
  SETTINGS: '/pages/settings/index',
} as const;

/**
 * 白名单页面（无需登录）
 */
export const WHITE_LIST = [PAGES.LOGIN, PAGES.REGISTER, PAGES.HOME] as const;
