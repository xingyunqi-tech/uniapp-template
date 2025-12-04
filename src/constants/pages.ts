/**
 * 页面路径常量
 */
export const PAGES = {
  HOME: '/pages/index/index',
  LOGIN: '/pages/login/index',
  REGISTER: '/pages/register/index',
  FORGOT_PASSWORD: '/pages/forgot-password/index',
  MINE: '/pages/mine/index',
  ADDRESS: '/pages/address/index',
  ADDRESS_EDIT: '/pages/address-edit/index',
  SETTINGS: '/pages/settings/index',
  PROFILE: '/pages/profile/index',
  PASSWORD: '/pages/password/index',
  ERROR: '/pages/error/index',
  FAVORITE: '/pages/favorite/index',
  FEEDBACK: '/pages/feedback/index',
  ABOUT: '/pages/about/index',
  AGREEMENT: '/pages/agreement/index',
  CONTACT: '/pages/contact/index',
  ORDER: '/pages/order/index',
} as const;

/**
 * 白名单页面（无需登录）
 */
export const WHITE_LIST = [PAGES.LOGIN, PAGES.REGISTER, PAGES.FORGOT_PASSWORD, PAGES.HOME, PAGES.ERROR] as const;
