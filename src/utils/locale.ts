import { createI18n } from 'vue-i18n';
import { DEFAULT_LOCALE } from '@/constants/system';

// 导入语言包
import zhCN from '@/locale/zh-CN.json';
import enUS from '@/locale/en-US.json';

/**
 * vue-i18n 语言包配置
 */
const messages = {
  'zh-CN': zhCN,
  'en-US': enUS,
};

/**
 * 创建 i18n 实例
 */
export const i18n = createI18n({
  legacy: false, // 使用 Composition API 模式
  locale: DEFAULT_LOCALE, // 默认语言
  fallbackLocale: 'zh-CN', // 回退语言
  messages,
  globalInjection: true, // 全局注入$t函数
});

/**
 * 导出一个便捷函数
 */
export const t = i18n.global.t;
