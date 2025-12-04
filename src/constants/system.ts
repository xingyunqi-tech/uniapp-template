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
 * 应用名称
 */
export const APP_NAME = 'UniApp Template';

/**
 * 版权信息
 */
export const COPYRIGHT = 'Copyright © 2024 All Rights Reserved';
