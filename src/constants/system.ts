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

/**
 * 应用名称
 */
export const APP_NAME = 'UniApp Template';

/**
 * 版权信息
 */
export const COPYRIGHT = 'Copyright © 2025 All Rights Reserved';

/**
 * ICP 备案号
 */
export const ICP_LICENSE = '沪ICP备2025155741号-1';

/**
 * 工信部备案管理系统链接
 */
export const ICP_LINK = 'https://beian.miit.gov.cn/';
