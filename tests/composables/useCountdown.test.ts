import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('vue', async importOriginal => ({
  ...(await importOriginal<typeof import('vue')>()),
  onUnmounted: () => {},
}));

const { useCountdown } = await import('@/composables/useCountdown');

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useCountdown', () => {
  it('每秒递减，归零时结束并回调', () => {
    const onFinish = vi.fn();
    const { countdown, isCounting, start } = useCountdown({ seconds: 3, onFinish });

    start();
    expect(countdown.value).toBe(3);

    vi.advanceTimersByTime(1000);
    expect(countdown.value).toBe(2);

    vi.advanceTimersByTime(2000);
    expect(countdown.value).toBe(0);
    expect(isCounting.value).toBe(false);
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('定时器提前几毫秒触发时仍按整秒递减', () => {
    const { countdown, start } = useCountdown({ seconds: 60 });

    start();
    vi.setSystemTime(Date.now() - 5);
    vi.advanceTimersByTime(1000);

    expect(countdown.value).toBe(59);
  });

  it('定时器被挂起期间流逝的时间计入剩余秒数', () => {
    const { countdown, start } = useCountdown({ seconds: 60 });

    start();
    vi.setSystemTime(Date.now() + 30_000);
    vi.advanceTimersByTime(1000);

    expect(countdown.value).toBe(29);
  });

  it('挂起时长超过剩余时间时恢复后立即结束', () => {
    const onFinish = vi.fn();
    const { countdown, isCounting, start } = useCountdown({ seconds: 60, onFinish });

    start();
    vi.setSystemTime(Date.now() + 120_000);
    vi.advanceTimersByTime(1000);

    expect(countdown.value).toBe(0);
    expect(isCounting.value).toBe(false);
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('startUntil 倒计时到指定时间戳并按 interval 刷新剩余毫秒', () => {
    const onFinish = vi.fn();
    const { remaining, isCounting, startUntil } = useCountdown({ interval: 100, onFinish });

    startUntil(Date.now() + 250);
    expect(remaining.value).toBe(250);

    vi.advanceTimersByTime(50);
    expect(remaining.value).toBe(200);

    vi.advanceTimersByTime(200);
    expect(remaining.value).toBe(0);
    expect(isCounting.value).toBe(false);
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('start(0) 先进入计时状态，异步结束并回调一次', () => {
    const onFinish = vi.fn();
    const { isCounting, start } = useCountdown({ onFinish });

    start(0);
    expect(isCounting.value).toBe(true);
    expect(onFinish).not.toHaveBeenCalled();

    vi.advanceTimersByTime(0);
    expect(isCounting.value).toBe(false);
    expect(onFinish).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(5000);
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('startUntil 传入已过去的时间戳时异步结束并回调一次', () => {
    const onFinish = vi.fn();
    const { isCounting, remaining, startUntil } = useCountdown({ onFinish });

    startUntil(Date.now() - 1000);
    expect(isCounting.value).toBe(true);
    expect(remaining.value).toBe(0);
    expect(onFinish).not.toHaveBeenCalled();

    vi.advanceTimersByTime(0);
    expect(isCounting.value).toBe(false);
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('countdown 随 remaining 换算为秒', () => {
    const { countdown, remaining, start, reset } = useCountdown({ seconds: 5 });

    start();
    expect(countdown.value).toBe(Math.round(remaining.value / 1000));

    vi.advanceTimersByTime(2000);
    expect(remaining.value).toBe(3000);
    expect(countdown.value).toBe(3);

    reset();
    expect(countdown.value).toBe(0);
  });

  it('stop 后保留剩余时间，reset 清零', () => {
    const { remaining, start, stop, reset } = useCountdown({ seconds: 10 });

    start();
    vi.advanceTimersByTime(3000);
    stop();
    vi.advanceTimersByTime(3000);
    expect(remaining.value).toBe(7000);

    reset();
    expect(remaining.value).toBe(0);
  });
});
