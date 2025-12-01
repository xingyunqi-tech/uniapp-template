import { defineStore } from 'pinia';
import { ref } from 'vue';
import { storage, STORAGE_KEYS } from '@/utils/storage';

/**
 * 主题类型
 */
export type ThemeKey = 'light' | 'dark' | 'system';

/**
 * 全局状态管理 Store
 * 管理主题等全局配置
 */
export const useGlobalStore = defineStore(
  'global',
  () => {
    // ==================== 主题相关 ====================
    const currentTheme = ref<ThemeKey>('light');

    /**
     * 切换主题
     */
    function toggleTheme() {
      const newTheme: ThemeKey = currentTheme.value === 'dark' ? 'light' : 'dark';
      setTheme(newTheme);
    }

    /**
     * 设置主题
     * @param theme 主题值
     */
    function setTheme(theme: ThemeKey) {
      currentTheme.value = theme;
      storage.set(STORAGE_KEYS.THEME, theme);

      // 设置导航栏颜色
      const navBarColor = theme === 'dark' ? '#1a1a1a' : '#ffffff';
      const textStyle = theme === 'dark' ? 'white' : 'black';

      uni.setNavigationBarColor({
        frontColor: textStyle === 'white' ? '#ffffff' : '#000000',
        backgroundColor: navBarColor,
        animation: {
          duration: 300,
          timingFunc: 'easeIn',
        },
      });
    }

    /**
     * 初始化主题
     */
    function initTheme() {
      const savedTheme = storage.get<ThemeKey>(STORAGE_KEYS.THEME);
      if (savedTheme) {
        currentTheme.value = savedTheme;
      } else {
        // 默认使用浅色主题
        currentTheme.value = 'light';
      }
    }

    // ==================== 调试模式相关 ====================
    const debugMode = ref(false);
    const clickCount = ref(0);
    let clickTimer: ReturnType<typeof setTimeout> | null = null;

    /**
     * 切换调试模式
     */
    function toggleDebugMode() {
      debugMode.value = !debugMode.value;

      if (debugMode.value) {
        uni.showToast({
          title: '调试模式已开启',
          icon: 'success',
        });
      } else {
        uni.showToast({
          title: '调试模式已关闭',
          icon: 'none',
        });
      }
    }

    /**
     * 处理 Logo 连续点击逻辑 (5 次快速点击开启调试模式)
     */
    function handleLogoClick() {
      clickCount.value++;

      if (clickTimer) {
        clearTimeout(clickTimer);
      }

      if (clickCount.value >= 5) {
        toggleDebugMode();
        clickCount.value = 0;
        return;
      }

      clickTimer = setTimeout(() => {
        clickCount.value = 0;
      }, 500);
    }

    return {
      // 主题相关
      currentTheme,
      toggleTheme,
      setTheme,
      initTheme,

      // 调试模式相关
      debugMode,
      handleLogoClick,
    };
  },
  {
    persist: {
      key: 'global-store',
      storage: {
        getItem: (key: string) => {
          return storage.get(key) as string | null;
        },
        setItem: (key: string, value: string) => {
          storage.set(key, value);
        },
      },
      pick: ['currentTheme', 'debugMode'],
    },
  },
);
