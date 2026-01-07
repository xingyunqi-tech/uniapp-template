import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  DEFAULT_LOCALE,
  DEFAULT_THEME_STYLE,
  LOCALE_TYPE,
  THEME_TYPE,
  TAB_BAR_PAGES,
  TAB_BAR_CONFIG,
  NavTextColor,
} from '@/constants';
import type { LocaleType, ThemeType } from '@/constants';
import { i18n } from '@/utils/locale';
import themeConfig from '@/theme.json';

/**
 * 判断当前页面是否为 TabBar 页面
 */
function isTabBarPage(): boolean {
  const pages = getCurrentPages();
  if (pages.length === 0) return false;

  const currentPage = pages[pages.length - 1];
  const route = currentPage.route || '';

  // 使用常量定义的 TabBar 页面列表
  return TAB_BAR_PAGES.some(page => page === `/${route}`);
}

/**
 * 应用主题到页面
 * H5: 需要运行时调用 uni API 切换 navbar/tabbar
 * 小程序/App: 通过 theme.json 配置自动适配
 */
function applyTheme(theme: ThemeType) {
  const isDark = theme === THEME_TYPE.DARK;
  // 获取当前主题配置
  const currentThemeConfig = isDark ? themeConfig.dark : themeConfig.light;

  // #ifdef H5
  document.documentElement.classList.toggle('dark-theme', isDark);
  // #endif

  // 检查页面是否已准备好
  const pages = getCurrentPages();
  if (pages.length === 0) {
    // 页面栈为空，延迟执行
    setTimeout(() => applyTheme(theme), 100);
    return;
  }

  // 动态切换导航栏样式
  const frontColor = NavTextColor[currentThemeConfig.navTxtStyle as keyof typeof NavTextColor] || NavTextColor.black;
  uni.setNavigationBarColor({
    frontColor,
    backgroundColor: currentThemeConfig.navBgColor,
  });

  // 动态切换 TabBar 样式
  if (isTabBarPage()) {
    uni.setTabBarStyle({
      color: currentThemeConfig.tabFontColor,
      selectedColor: currentThemeConfig.tabSelectedColor,
      backgroundColor: currentThemeConfig.tabBgColor,
      borderStyle: currentThemeConfig.tabBorderStyle,
    });

    // 动态切换 TabBar 图标
    TAB_BAR_CONFIG.forEach(item => {
      uni.setTabBarItem({
        index: item.index,
        text: item.text,
        iconPath: currentThemeConfig[item.iconKey],
        selectedIconPath: currentThemeConfig[item.iconActiveKey],
      });
    });
  }
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
     * 初始化语言 (应用启动时调用)
     * 将持久化的语言设置同步到 i18n 实例
     */
    function initLocale() {
      i18n.global.locale.value = currentLocale.value;
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

    // ==================== 开发者选项 ====================
    /** 是否显示开发者选项 */
    const showDevOptions = ref(false);

    /**
     * 切换开发者选项显示状态
     */
    function toggleDevOptions() {
      showDevOptions.value = !showDevOptions.value;
    }

    /**
     * 设置开发者选项显示状态
     */
    function setDevOptions(show: boolean) {
      showDevOptions.value = show;
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

    /** 是否为深色主题 */
    const isDark = computed(() => currentTheme.value === THEME_TYPE.DARK);

    /** 主题类名 */
    const themeClass = computed(() => (currentTheme.value === THEME_TYPE.DARK ? 'dark-theme' : ''));

    return {
      // 主题相关
      currentTheme,
      isDark,
      themeClass,
      initTheme,
      setTheme,
      toggleTheme,
      // 开发者选项
      showDevOptions,
      toggleDevOptions,
      setDevOptions,
      // 语言相关
      currentLocale,
      initLocale,
      toggleLocale,
      setLocale,
    };
  },
  {
    persist: {
      pick: ['currentTheme', 'currentLocale', 'showDevOptions'],
      storage: {
        getItem: (key: string) => uni.getStorageSync(key),
        setItem: (key: string, value: string) => uni.setStorageSync(key, value),
      },
    },
  },
);
