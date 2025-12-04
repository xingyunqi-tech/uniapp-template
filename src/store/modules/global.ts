import { defineStore } from 'pinia';
import { ref } from 'vue';
import { DEFAULT_LOCALE, DEFAULT_THEME_STYLE, LOCALE_TYPE, THEME_TYPE } from '@/constants';
import { i18n } from '@/utils/locale';
import type { LocaleKey, ThemeStyleKey } from '@/interface/system';

/**
 * 全局状态管理 Store
 * 管理主题、语言等全局配置
 */
export const useGlobalStore = defineStore('global', () => {
  // ==================== 主题相关 ====================
  const currentTheme = ref<ThemeStyleKey>(DEFAULT_THEME_STYLE);

  /**
   * 切换主题
   */
  function toggleTheme() {
    currentTheme.value = currentTheme.value === THEME_TYPE.LIGHT ? THEME_TYPE.DARK : THEME_TYPE.LIGHT;
  }

  /**
   * 设置主题
   * @param theme 主题值
   */
  function setTheme(theme: ThemeStyleKey) {
    currentTheme.value = theme;
  }

  // ==================== 语言相关 ====================
  const currentLocale = ref<LocaleKey>(DEFAULT_LOCALE);

  /**
   * 切换语言
   */
  function toggleLocale() {
    const newLocale = currentLocale.value === LOCALE_TYPE.ZH_CN ? LOCALE_TYPE.EN_US : LOCALE_TYPE.ZH_CN;
    setLocale(newLocale);
  }

  /**
   * 设置语言
   * @param locale 语言值
   */
  function setLocale(locale: LocaleKey) {
    currentLocale.value = locale;
    i18n.global.locale.value = locale;
  }

  return {
    // 主题相关
    currentTheme,
    toggleTheme,
    setTheme,
    // 语言相关
    currentLocale,
    toggleLocale,
    setLocale,
  };
});
