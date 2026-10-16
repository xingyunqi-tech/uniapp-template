import { afterEach, describe, expect, it, vi } from 'vitest';
import { getErrorQueueSize, initErrorReporter, reportError, updateErrorReporterOptions } from '@/utils/error-reporter';

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('未配置上报目标', () => {
  it('不入队、不发起上报', () => {
    vi.useFakeTimers();
    updateErrorReporterOptions({ enabled: true, consoleLog: false, reportUrl: '', customReport: undefined });

    reportError('no-target');
    vi.advanceTimersByTime(60_000);

    expect(getErrorQueueSize()).toBe(0);
    expect(uni.request).not.toHaveBeenCalled();
  });

  it('开启 consoleLog 时仍打印到控制台', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    updateErrorReporterOptions({ enabled: true, consoleLog: true, reportUrl: '', customReport: undefined });

    reportError('console-only');

    expect(errorSpy).toHaveBeenCalledWith('[ErrorReporter] js:', 'console-only', expect.anything());
    expect(getErrorQueueSize()).toBe(0);
  });

  it('配置 customReport 后入队', () => {
    updateErrorReporterOptions({ enabled: true, consoleLog: false, customReport: vi.fn() });

    reportError('with-target');

    expect(getErrorQueueSize()).toBe(1);
    updateErrorReporterOptions({ enabled: false, customReport: undefined });
  });
});

describe('H5 window.onerror', () => {
  it('保留并调用已有的 onerror，返回其结果', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const previous = vi.fn(() => false);
    window.onerror = previous;
    initErrorReporter({ enabled: false, consoleLog: false });

    const handled = window.onerror?.('boom', 'a.js', 1, 2, new Error('boom'));

    expect(previous).toHaveBeenCalledWith('boom', 'a.js', 1, 2, expect.any(Error));
    expect(handled).toBe(false);
  });
});
