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
 * 站点信息
 */
export interface SiteProfile {
  /** 产品名称 */
  appName: string;
  /** 宣传语 */
  slogan: string;
  /** 公司名称 */
  companyName: string;
  /** 版权信息 */
  copyright: string;
  /** ICP 备案号 */
  icpLicense: string;
  /** 客服电话 */
  servicePhone: string;
  /** 客服服务时间 */
  serviceHours: string;
  /** 客服邮箱，空串表示不展示 */
  serviceEmail: string;
  /** 分享标题，空串时使用产品名称 */
  shareTitle: string;
}

/**
 * 默认站点信息，后台未配置或拉取失败时使用
 */
export const DEFAULT_SITE_PROFILE: Readonly<SiteProfile> = Object.freeze({
  appName: '备考刷题',
  slogan: '刷题、模考、错题本，一站式高效备考',
  companyName: '上海星芸启网络科技有限公司',
  copyright: 'Copyright © 2026 上海星芸启网络科技有限公司',
  icpLicense: '沪ICP备2025155741号-1',
  servicePhone: '13818234979',
  serviceHours: '工作日 9:00-18:00',
  serviceEmail: '',
  shareTitle: '',
});

/**
 * 工信部备案管理系统链接
 */
export const ICP_LINK = 'https://beian.miit.gov.cn/';

/**
 * webview 页允许打开的域名（含其子域名）
 */
export const WEBVIEW_ALLOWED_HOSTS: readonly string[] = ['sunweijie.top'];

/**
 * 原生组件属性颜色（swiper 指示点等原生属性不支持 CSS 变量）
 */
export const NATIVE_COLOR = {
  INDICATOR: 'rgba(255, 255, 255, 0.5)',
  INDICATOR_ACTIVE: '#ffffff',
} as const;

/**
 * 无 Token 启动时是否用微信/支付宝小程序登录凭证静默登录（H5/App 不生效）
 */
export const AUTO_SILENT_LOGIN = false;
