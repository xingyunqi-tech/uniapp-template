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
import { uniStorage } from '../plugins/persist';

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

/** 最近一次应用到 TabBar 的主题 */
let tabBarTheme: ThemeType | null = null;

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

  // 动态切换 TabBar 样式（TabBar 为全局共享，主题未变时跳过）
  if (isTabBarPage() && tabBarTheme !== theme) {
    tabBarTheme = theme;
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

/** vue-i18n 语言值对应的 uni 内置语言 */
const UNI_LOCALE_MAP: Record<string, string> = {
  [LOCALE_TYPE.ZH_CN]: 'zh-Hans',
  [LOCALE_TYPE.EN_US]: 'en',
};

/**
 * 同步 uni 内置组件与 API 的语言，未变化时不调用
 */
function syncUniLocale(locale: LocaleType) {
  const uniLocale = UNI_LOCALE_MAP[locale];
  if (uniLocale && uni.getLocale() !== uniLocale) {
    uni.setLocale(uniLocale);
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

    /** 是否跟随系统主题，用户手动切换后关闭 */
    const followSystemTheme = ref(true);

    /**
     * 应用当前主题 (应用启动、页面显示时调用)
     */
    function initTheme() {
      if (followSystemTheme.value) {
        const systemTheme = uni.getAppBaseInfo().theme;
        if (systemTheme === THEME_TYPE.LIGHT || systemTheme === THEME_TYPE.DARK) {
          currentTheme.value = systemTheme;
        }
      }
      applyTheme(currentTheme.value);
    }

    /**
     * 设置是否跟随系统主题，开启时立即同步系统主题
     */
    function setFollowSystemTheme(follow: boolean) {
      followSystemTheme.value = follow;
      if (follow) {
        initTheme();
      }
    }

    /**
     * 系统主题变化时调用，仅在跟随系统时生效
     */
    function syncSystemTheme(theme: ThemeType) {
      if (!followSystemTheme.value) return;
      currentTheme.value = theme;
      applyTheme(theme);
    }

    /**
     * 初始化语言 (应用启动时调用)
     * 将持久化的语言设置同步到 i18n 实例
     */
    function initLocale() {
      i18n.global.locale.value = currentLocale.value;
      // App 端 uni.setLocale 会重启应用，启动时不同步
      // #ifndef APP
      syncUniLocale(currentLocale.value);
      // #endif
    }

    /**
     * 设置主题
     * @param theme 主题值
     */
    function setTheme(theme: ThemeType) {
      followSystemTheme.value = false;
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
      syncUniLocale(locale);
    }

    /** 是否为深色主题 */
    const isDark = computed(() => currentTheme.value === THEME_TYPE.DARK);

    /** 主题类名 */
    const themeClass = computed(() => (currentTheme.value === THEME_TYPE.DARK ? 'dark-theme' : ''));

    return {
      // 主题相关
      currentTheme,
      followSystemTheme,
      isDark,
      themeClass,
      initTheme,
      setFollowSystemTheme,
      syncSystemTheme,
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
      pick: ['currentTheme', 'followSystemTheme', 'currentLocale', 'showDevOptions'],
      // 使用统一的 uniStorage 适配器，与其他 Store 保持一致
      storage: uniStorage,
      // 已保存主题但无 followSystemTheme 的旧数据视为手动设置过主题
      afterHydrate: ({ store }) => {
        try {
          const state = JSON.parse(uniStorage.getItem(store.$id) || '{}') as Record<string, unknown>;
          if ('currentTheme' in state && !('followSystemTheme' in state)) {
            store.followSystemTheme = false;
          }
        } catch {
          // 存储内容无法解析时保持默认值
        }
      },
    },
  },
);
