import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useThrottleFn } from '@/composables/useThrottle';

describe('useThrottleFn', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('trailing 为 false 时被丢弃的调用在窗口结束后复位 isThrottled', () => {
    const fn = vi.fn();
    const { throttledFn, isThrottled } = useThrottleFn(fn, { interval: 100, trailing: false });

    throttledFn();
    expect(fn).toHaveBeenCalledTimes(1);
    expect(isThrottled.value).toBe(false);

    vi.advanceTimersByTime(30);
    throttledFn();
    expect(fn).toHaveBeenCalledTimes(1);
    expect(isThrottled.value).toBe(true);

    vi.advanceTimersByTime(70);
    expect(isThrottled.value).toBe(false);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('trailing 为 true 时尾调用执行后复位 isThrottled', () => {
    const fn = vi.fn();
    const { throttledFn, isThrottled } = useThrottleFn(fn, { interval: 100 });

    throttledFn(1);
    throttledFn(2);
    expect(isThrottled.value).toBe(true);

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenLastCalledWith(2);
    expect(isThrottled.value).toBe(false);
  });

  it('cancel 后 isThrottled 为 false 且不再复位执行', () => {
    const fn = vi.fn();
    const { throttledFn, isThrottled, cancel } = useThrottleFn(fn, { interval: 100, trailing: false });

    throttledFn();
    throttledFn();
    cancel();
    expect(isThrottled.value).toBe(false);
    vi.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
