/**
 * API 响应状态码
 */
export const API_CODE = {
  /** 成功 */
  SUCCESS: 200,
} as const;

/**
 * 默认语言
 */
export const DEFAULT_LOCALE = 'zh-CN';

/**
 * 默认主题
 */
export const DEFAULT_THEME_STYLE = 'light';

/**
 * 语言包选项
 */
export enum LOCALE_TYPE {
  ZH_CN = 'zh-CN',
  EN_US = 'en-US',
}

/**
 * 主题选项
 */
export enum THEME_TYPE {
  LIGHT = 'light',
  DARK = 'dark',
}

/**
 * 语言类型
 */
export type LocaleType = `${LOCALE_TYPE}`;

/**
 * 主题类型
 */
export type ThemeType = `${THEME_TYPE}`;

// ============================================
// 原生 API 主题令牌 (setNavigationBarColor, setTabBarStyle)
// 这些值需要与 theme.scss 中的 CSS 变量保持同步
// ============================================

/** 导航栏前景色类型 (uni-app API 仅支持 #ffffff 或 #000000) */
export type NavFrontColor = '#ffffff' | '#000000';

/** TabBar 边框样式类型 (uni-app API 仅支持 'white' 或 'black') */
export type TabBarBorderStyle = 'white' | 'black';

/** 原生 API 主题令牌接口 */
export interface NativeThemeTokens {
  navFrontColor: NavFrontColor;
  navBackgroundColor: string;
  tabBarColor: string;
  tabBarSelectedColor: string;
  tabBarBackgroundColor: string;
  tabBarBorderStyle: TabBarBorderStyle;
}

/** 浅色主题 - 原生 API 令牌 */
export const LIGHT_THEME_TOKENS: NativeThemeTokens = {
  navFrontColor: '#000000',
  navBackgroundColor: '#fff', // --color-nav-bg
  tabBarColor: '#999', // --color-tabbar-text
  tabBarSelectedColor: '#1989fa', // --color-primary
  tabBarBackgroundColor: '#fff', // --color-tabbar-bg
  tabBarBorderStyle: 'black',
};

/** 深色主题 - 原生 API 令牌 */
export const DARK_THEME_TOKENS: NativeThemeTokens = {
  navFrontColor: '#ffffff',
  navBackgroundColor: '#1d1d1d', // --color-nav-bg
  tabBarColor: '#a3a6ad', // --color-tabbar-text
  tabBarSelectedColor: '#409eff', // --color-primary
  tabBarBackgroundColor: '#1d1d1d', // --color-tabbar-bg
  tabBarBorderStyle: 'white',
};

/** 获取原生 API 主题令牌 */
export const getThemeTokens = (isDark: boolean): NativeThemeTokens => (isDark ? DARK_THEME_TOKENS : LIGHT_THEME_TOKENS);

/**
 * 应用名称
 */
export const APP_NAME = 'UniApp Template';

/**
 * 版权信息
 */
export const COPYRIGHT = 'Copyright © 2024 All Rights Reserved';
