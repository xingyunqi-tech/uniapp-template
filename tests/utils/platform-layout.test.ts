import { afterEach, describe, expect, it, vi } from 'vitest';
import { getDeviceInfo, getNavBarHeight, getSafeAreaBottom } from '@/utils/platform';
import { getNavBarLayout } from '@/composables/useStatusBar';

function mockWindowInfo(info: Record<string, unknown>) {
  vi.mocked(uni).getWindowInfo = vi.fn(() => info) as never;
  getDeviceInfo(true);
}

afterEach(() => {
  delete (uni as unknown as Record<string, unknown>).getMenuButtonBoundingClientRect;
  delete (uni as unknown as Record<string, unknown>).getSystemInfoSync;
});

describe('getSafeAreaBottom', () => {
  it('优先使用 safeAreaInsets.bottom', () => {
    mockWindowInfo({ screenHeight: 844, safeArea: { bottom: 810 }, safeAreaInsets: { bottom: 34 } });
    expect(getSafeAreaBottom()).toBe(34);
  });

  it('缺少 safeAreaInsets 时按 screenHeight - safeArea.bottom 计算', () => {
    mockWindowInfo({ screenHeight: 844, safeArea: { bottom: 810 } });
    expect(getSafeAreaBottom()).toBe(34);
  });

  it('没有安全区信息时为 0', () => {
    mockWindowInfo({ screenHeight: 667 });
    expect(getSafeAreaBottom()).toBe(0);
  });
});

describe('getNavBarHeight', () => {
  it('与 getNavBarLayout 的状态栏和内容区高度之和一致', () => {
    mockWindowInfo({ statusBarHeight: 47 });
    vi.mocked(uni).getMenuButtonBoundingClientRect = vi.fn(() => ({ top: 51, height: 32 })) as never;
    vi.mocked(uni).getSystemInfoSync = vi.fn(() => ({})) as never;
    const { statusBarHeight, navBarHeight } = getNavBarLayout();

    expect(getNavBarHeight()).toBe(statusBarHeight + navBarHeight);
  });
});
