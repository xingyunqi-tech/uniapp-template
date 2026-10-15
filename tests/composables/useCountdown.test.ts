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
});
