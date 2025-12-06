import { defineStore } from 'pinia';
import { ref } from 'vue';
import { DEFAULT_LOCALE, DEFAULT_THEME_STYLE, LOCALE_TYPE, THEME_TYPE } from '@/constants';
import type { LocaleType, ThemeType } from '@/constants';
import { i18n } from '@/utils/locale';

/**
 * 应用主题到页面
 * 通过设置导航栏、TabBar 样式来切换主题
 */
function applyTheme(theme: ThemeType) {
  const isDark = theme === THEME_TYPE.DARK;

  // H5 环境：设置根元素 class
  // #ifdef H5
  document.documentElement.classList.toggle('dark-theme', isDark);
  // #endif

  // 更新导航栏颜色
  uni.setNavigationBarColor({
    frontColor: isDark ? '#ffffff' : '#000000',
    backgroundColor: isDark ? '#1d1d1d' : '#ffffff',
    animation: {
      duration: 300,
      timingFunc: 'easeInOut',
    },
  });

  // 更新 TabBar 样式
  uni.setTabBarStyle({
    backgroundColor: isDark ? '#1d1d1d' : '#ffffff',
    borderStyle: isDark ? 'white' : 'black',
    color: isDark ? '#a3a6ad' : '#999999',
    selectedColor: isDark ? '#409eff' : '#07c160',
  });
}

/**
 * 全局状态管理 Store
 * 管理主题、语言等全局配置
 */
export const useGlobalStore = defineStore(
  'global',
  () => {
    // ==================== 主题相关 ====================
    /** 当前主题 */
    const currentTheme = ref<ThemeType>(DEFAULT_THEME_STYLE);

    /**
     * 初始化主题 (应用启动时调用)
     */
    function initTheme() {
      applyTheme(currentTheme.value);
    }

    /**
     * 设置主题
     * @param theme 主题值
     */
    function setTheme(theme: ThemeType) {
      currentTheme.value = theme;
      applyTheme(theme);
    }

    /**
     * 切换主题
     */
    function toggleTheme() {
      const newTheme = currentTheme.value === THEME_TYPE.LIGHT ? THEME_TYPE.DARK : THEME_TYPE.LIGHT;
      setTheme(newTheme);
    }

    // ==================== 语言相关 ====================
    const currentLocale = ref<LocaleType>(DEFAULT_LOCALE);

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
    function setLocale(locale: LocaleType) {
      currentLocale.value = locale;
      i18n.global.locale.value = locale;
    }

    return {
      // 主题相关
      currentTheme,
      /** 是否为深色主题 */
      get isDark() {
        return currentTheme.value === THEME_TYPE.DARK;
      },
      /** 主题类名 */
      get themeClass() {
        return currentTheme.value === THEME_TYPE.DARK ? 'dark-theme' : '';
      },
      initTheme,
      setTheme,
      toggleTheme,
      // 语言相关
      currentLocale,
      toggleLocale,
      setLocale,
    };
  },
  {
    persist: {
      pick: ['currentTheme', 'currentLocale'],
      storage: {
        getItem: (key: string) => uni.getStorageSync(key),
        setItem: (key: string, value: string) => uni.setStorageSync(key, value),
      },
    },
  },
);
