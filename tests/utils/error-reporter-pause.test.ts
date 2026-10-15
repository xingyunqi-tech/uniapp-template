import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  flushErrors,
  getErrorQueueSize,
  reportError,
  resetReportFailureCount,
  updateErrorReporterOptions,
} from '@/utils/error-reporter';

const customReport = vi.fn();
let seq = 0;

function enqueue() {
  reportError(`error-${++seq}`);
}

async function failTimes(times: number) {
  for (let i = 0; i < times; i++) {
    enqueue();
    await flushErrors();
  }
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  customReport.mockReset().mockRejectedValue(new Error('500'));
  updateErrorReporterOptions({ enabled: true, consoleLog: false, sampleRate: 1, customReport });
  resetReportFailureCount();
});

afterEach(async () => {
  customReport.mockReset().mockResolvedValue(undefined);
  resetReportFailureCount();
  await flushErrors();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('错误上报失败处理', () => {
  it('失败的错误放回队列，下次一并重试', async () => {
    await failTimes(2);

    expect(getErrorQueueSize()).toBe(2);
    expect(customReport).toHaveBeenLastCalledWith(expect.arrayContaining([expect.anything(), expect.anything()]));
  });

  it('连续失败 3 次后暂停 60 秒，暂停期间不上报，之后恢复', async () => {
    await failTimes(3);
    customReport.mockClear().mockResolvedValue(undefined);

    enqueue();
    await flushErrors();
    expect(customReport).not.toHaveBeenCalled();

    vi.advanceTimersByTime(60_000);
    await flushErrors();
    expect(customReport).toHaveBeenCalledTimes(1);
    expect(getErrorQueueSize()).toBe(0);
  });

  it('网络恢复时解除暂停', async () => {
    await failTimes(3);
    customReport.mockClear().mockResolvedValue(undefined);

    resetReportFailureCount();
    await flushErrors();

    expect(customReport).toHaveBeenCalledTimes(1);
  });

  it('上一次上报未结束时不重复上报', async () => {
    let finish: () => void = () => {};
    customReport.mockImplementation(() => new Promise<void>(resolve => (finish = resolve)));

    enqueue();
    const first = flushErrors();
    enqueue();
    await flushErrors();
    finish();
    await first;

    expect(customReport).toHaveBeenCalledTimes(1);
  });
});
