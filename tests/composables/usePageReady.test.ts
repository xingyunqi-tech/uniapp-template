import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const onLoadCallbacks: (() => void)[] = [];

vi.mock('@dcloudio/uni-app', () => ({
  onLoad: (callback: () => void) => onLoadCallbacks.push(callback),
}));

const reportPerformanceMetric = vi.fn();

vi.mock('@/utils/performance-reporter', () => ({
  reportPerformanceMetric: (...args: unknown[]) => reportPerformanceMetric(...args),
}));

import { usePageReady } from '@/composables/usePageReady';

beforeEach(() => {
  onLoadCallbacks.length = 0;
  reportPerformanceMetric.mockClear();
  vi.useFakeTimers();
  vi.mocked(getCurrentPages).mockReturnValue([{ route: 'pages/index/index' }] as never);
});

afterEach(() => {
  vi.useRealTimers();
  vi.mocked(getCurrentPages).mockReturnValue([]);
});

describe('usePageReady', () => {
  it('上报 onLoad 到 ready 的耗时与当前页面路径', () => {
    const { ready } = usePageReady();

    onLoadCallbacks.forEach(callback => callback());
    vi.advanceTimersByTime(320);
    ready();

    expect(reportPerformanceMetric).toHaveBeenCalledWith({
      name: 'pageReady',
      duration: 320,
      path: 'pages/index/index',
    });
  });

  it('同一页面实例只上报一次', () => {
    const { ready } = usePageReady();

    onLoadCallbacks.forEach(callback => callback());
    ready();
    ready();

    expect(reportPerformanceMetric).toHaveBeenCalledTimes(1);
  });

  it('onLoad 之前调用 ready 不上报并在开发环境警告', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { ready } = usePageReady();

    ready();

    expect(reportPerformanceMetric).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});
