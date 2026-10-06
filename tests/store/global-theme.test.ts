import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setActivePinia } from 'pinia';
import { createApp } from 'vue';
import { createPersistedPinia } from '@/store/plugins/persist';
import { useGlobalStore } from '@/store/modules/global';

const systemTheme = { value: 'light' };
const setTabBarStyle = vi.fn();

function createStore() {
  const pinia = createPersistedPinia();
  createApp({}).use(pinia);
  setActivePinia(pinia);
  return useGlobalStore();
}

describe('useGlobalStore 主题', () => {
  beforeEach(() => {
    Object.assign(uni, {
      getAppBaseInfo: () => ({ theme: systemTheme.value }),
      setNavigationBarColor: vi.fn(),
      setTabBarStyle,
      setTabBarItem: vi.fn(),
    });
    Object.assign(globalThis, { getCurrentPages: () => [{ route: 'pages/index/index' }] });
    uni.removeStorageSync('global');
    systemTheme.value = 'light';
    setTabBarStyle.mockClear();
  });

  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'getCurrentPages');
  });

  it('未手动设置时跟随系统主题', () => {
    systemTheme.value = 'dark';
    const store = createStore();

    store.initTheme();

    expect(store.followSystemTheme).toBe(true);
    expect(store.currentTheme).toBe('dark');
  });

  it('已保存主题但无 followSystemTheme 的旧数据保留手动选择', () => {
    uni.setStorageSync('global', JSON.stringify({ currentTheme: 'dark', currentLocale: 'zh-CN' }));
    const store = createStore();

    store.initTheme();

    expect(store.followSystemTheme).toBe(false);
    expect(store.currentTheme).toBe('dark');
  });

  it('手动设置主题后系统主题变化不再生效', () => {
    const store = createStore();

    store.setTheme('dark');
    store.syncSystemTheme('light');

    expect(store.currentTheme).toBe('dark');
  });

  it('TabBar 页面重复应用同一主题时只设置一次 TabBar 样式', () => {
    const store = createStore();

    store.setTheme('dark');
    setTabBarStyle.mockClear();
    store.setTheme('light');
    store.initTheme();
    store.initTheme();

    expect(setTabBarStyle).toHaveBeenCalledTimes(1);
  });
});
