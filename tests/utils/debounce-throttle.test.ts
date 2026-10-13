import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { debounce } from '@/utils/debounce';
import { throttle } from '@/utils/throttle';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('debounce', () => {
  it('停止调用 delay 后以最后一次参数执行', () => {
    const fn = vi.fn();
    const d = debounce(fn, { delay: 100 });
    d('a');
    d('b');
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('b');
  });

  it('flush 立即执行待执行的调用且之后不再执行', () => {
    const fn = vi.fn();
    const d = debounce(fn, { delay: 100 });
    d('a');
    d.flush();
    expect(fn).toHaveBeenCalledWith('a');
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('没有待执行调用时 flush 不执行', () => {
    const fn = vi.fn();
    const d = debounce(fn, { delay: 100, immediate: true });
    d('a');
    expect(() => d.flush()).not.toThrow();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('cancel 后不执行', () => {
    const fn = vi.fn();
    const d = debounce(fn, { delay: 100 });
    d('a');
    d.cancel();
    vi.advanceTimersByTime(100);
    expect(fn).not.toHaveBeenCalled();
  });
});

describe('throttle', () => {
  it('leading 为 true 时首次调用立即执行，间隔内的调用在尾部执行', () => {
    const fn = vi.fn();
    const t = throttle(fn, { interval: 100 });
    t('a');
    t('b');
    expect(fn).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith('b');
  });

  it('leading 为 false 时首次调用在间隔结束后执行', () => {
    const fn = vi.fn();
    const t = throttle(fn, { interval: 100, leading: false });
    t('a');
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('a');
  });

  it('leading 与 trailing 都为 false 时首个间隔内不执行', () => {
    const fn = vi.fn();
    const t = throttle(fn, { interval: 100, leading: false, trailing: false });
    t('a');
    vi.advanceTimersByTime(100);
    expect(fn).not.toHaveBeenCalled();
  });
});
