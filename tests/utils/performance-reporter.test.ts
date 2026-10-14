import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type ObserverCallback = (list: { getEntries: () => unknown[] }) => void;

let observerCallback: ObserverCallback | undefined;
const observe = vi.fn();

async function loadReporter() {
  vi.resetModules();
  return import('@/utils/performance-reporter');
}

function emit(entries: unknown[]) {
  observerCallback?.({ getEntries: () => entries });
}

beforeEach(() => {
  observerCallback = undefined;
  observe.mockClear();
  vi.stubGlobal('wx', {
    getPerformance: () => ({
      createObserver: (callback: ObserverCallback) => {
        observerCallback = callback;
        return { observe };
      },
    }),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('performance-reporter', () => {
  it('启用后监听 navigation 与 render 条目，只上报关注的指标并取整', async () => {
    const report = vi.fn();
    const { initPerformanceReporter } = await loadReporter();

    initPerformanceReporter({ enabled: true, report });
    emit([
      { name: 'appLaunch', duration: 1234.6, path: 'pages/index/index' },
      { name: 'firstPaint', duration: 0, path: 'pages/index/index' },
      { name: 'firstRender', duration: 88.2, path: 'pages/mine/index' },
    ]);

    expect(observe).toHaveBeenCalledWith({ entryTypes: ['navigation', 'render'] });
    expect(report.mock.calls.map(([metric]) => metric)).toEqual([
      { name: 'appLaunch', duration: 1235, path: 'pages/index/index' },
      { name: 'firstRender', duration: 88, path: 'pages/mine/index' },
    ]);
  });

  it('未启用时不创建监听也不上报', async () => {
    const report = vi.fn();
    const { initPerformanceReporter, reportPerformanceMetric } = await loadReporter();

    initPerformanceReporter({ enabled: false, report });
    reportPerformanceMetric({ name: 'pageReady', duration: 10, path: 'pages/index/index' });

    expect(observerCallback).toBeUndefined();
    expect(report).not.toHaveBeenCalled();
  });

  it('未传入 report 时不创建监听', async () => {
    const { initPerformanceReporter } = await loadReporter();

    initPerformanceReporter({ enabled: true });

    expect(observerCallback).toBeUndefined();
  });

  it('多次初始化只创建一个监听', async () => {
    const report = vi.fn();
    const { initPerformanceReporter } = await loadReporter();

    initPerformanceReporter({ enabled: true, report });
    initPerformanceReporter({ enabled: true, report });

    expect(observe).toHaveBeenCalledTimes(1);
  });

  it('未命中采样时不上报', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9);
    const report = vi.fn();
    const { initPerformanceReporter, reportPerformanceMetric } = await loadReporter();

    initPerformanceReporter({ enabled: true, sampleRate: 0.5, report });
    reportPerformanceMetric({ name: 'pageReady', duration: 10, path: 'pages/index/index' });

    expect(report).not.toHaveBeenCalled();
  });

  it('基础库不支持 getPerformance 时仍可手动上报', async () => {
    vi.stubGlobal('wx', {});
    const report = vi.fn();
    const { initPerformanceReporter, reportPerformanceMetric } = await loadReporter();

    initPerformanceReporter({ enabled: true, report });
    reportPerformanceMetric({ name: 'pageReady', duration: 10, path: 'pages/index/index' });

    expect(report).toHaveBeenCalledWith({ name: 'pageReady', duration: 10, path: 'pages/index/index' });
  });

  it('上报函数抛错时不向外抛出', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { initPerformanceReporter, reportPerformanceMetric } = await loadReporter();

    initPerformanceReporter({
      enabled: true,
      report: () => {
        throw new Error('report failed');
      },
    });

    expect(() => reportPerformanceMetric({ name: 'pageReady', duration: 10, path: '' })).not.toThrow();
  });
});
