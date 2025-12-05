import { computed } from 'vue';
import { useGlobalStore } from '@/store/modules/global';
import { THEME_TYPE } from '@/constants';

/**
 * 主题相关的 composable
 * 用于在页面/组件中获取当前主题状态和类名
 */
export function useTheme() {
  const globalStore = useGlobalStore();

  /**
   * 当前是否为深色主题
   */
  const isDark = computed(() => globalStore.currentTheme === THEME_TYPE.DARK);

  /**
   * 当前主题值
   */
  const theme = computed(() => globalStore.currentTheme);

  /**
   * 主题类名，用于绑定到根元素
   * 返回 'dark-theme' 或 ''
   */
  const themeClass = computed(() => (isDark.value ? 'dark-theme' : ''));

  /**
   * 切换主题
   */
  function toggleTheme() {
    globalStore.toggleTheme();
  }

  return {
    isDark,
    theme,
    themeClass,
    toggleTheme,
  };
}
