import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { DEFAULT_LOCALE, DEFAULT_THEME_STYLE, LOCALE_TYPE, THEME_TYPE } from '@/constants';
import { i18n } from '@/utils/locale';
import type { LocaleKey, ThemeStyleKey } from '@/interface/system';

/**
 * 应用主题到页面
 * 通过设置导航栏和 TabBar 样式来切换主题
 */
function applyTheme(theme: ThemeStyleKey) {
  const isDark = theme === THEME_TYPE.DARK;

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
    const currentTheme = ref<ThemeStyleKey>(DEFAULT_THEME_STYLE);

    /**
     * 切换主题
     */
    function toggleTheme() {
      const newTheme = currentTheme.value === THEME_TYPE.LIGHT ? THEME_TYPE.DARK : THEME_TYPE.LIGHT;
      setTheme(newTheme);
    }

    /**
     * 设置主题
     * @param theme 主题值
     */
    function setTheme(theme: ThemeStyleKey) {
      currentTheme.value = theme;
      applyTheme(theme);
    }

    /**
     * 初始化主题 (应用启动时调用)
     */
    function initTheme() {
      applyTheme(currentTheme.value);
    }

    // 监听主题变化自动应用
    watch(currentTheme, newTheme => {
      applyTheme(newTheme);
    });

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
      initTheme,
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
