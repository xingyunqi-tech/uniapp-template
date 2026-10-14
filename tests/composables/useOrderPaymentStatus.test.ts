import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getOrder = vi.hoisted(() => vi.fn());
const unmountCallbacks = vi.hoisted(() => [] as (() => void)[]);

vi.mock('@/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@/api')>()),
  getOrder,
}));

vi.mock('vue', async importOriginal => ({
  ...(await importOriginal<typeof import('vue')>()),
  onUnmounted: (callback: () => void) => unmountCallbacks.push(callback),
}));

const { useOrderPaymentStatus } = await import('@/composables/useOrderPaymentStatus');

function orderWith(status: string) {
  return { id: 1, orderNo: 'ORD1', status };
}

beforeEach(() => {
  vi.useFakeTimers();
  getOrder.mockReset();
  unmountCallbacks.length = 0;
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useOrderPaymentStatus', () => {
  it('订单已支付时显示支付成功', async () => {
    getOrder.mockResolvedValue(orderWith('PAID'));
    const { state, orderNo, check } = useOrderPaymentStatus();

    await check(1);

    expect(state.value).toBe('paid');
    expect(orderNo.value).toBe('ORD1');
    expect(getOrder).toHaveBeenCalledWith(1, { showError: false });
  });

  it('待支付时按间隔重试，回调到达后显示支付成功', async () => {
    getOrder.mockResolvedValueOnce(orderWith('UNPAID')).mockResolvedValueOnce(orderWith('PAID'));
    const { state, check } = useOrderPaymentStatus({ interval: 1000 });

    const pending = check(1);
    await vi.advanceTimersByTimeAsync(1000);
    await pending;

    expect(getOrder).toHaveBeenCalledTimes(2);
    expect(state.value).toBe('paid');
  });

  it('达到最大次数仍待支付时显示确认中', async () => {
    getOrder.mockResolvedValue(orderWith('UNPAID'));
    const { state, check } = useOrderPaymentStatus({ interval: 1000, maxAttempts: 3 });

    const pending = check(1);
    await vi.advanceTimersByTimeAsync(2000);
    await pending;

    expect(getOrder).toHaveBeenCalledTimes(3);
    expect(state.value).toBe('unpaid');
  });

  it('订单已关闭时停止查询', async () => {
    getOrder.mockResolvedValue(orderWith('CLOSED'));
    const { state, check } = useOrderPaymentStatus();

    await check(1);

    expect(state.value).toBe('closed');
    expect(getOrder).toHaveBeenCalledTimes(1);
  });

  it('每次查询都失败时显示查询失败', async () => {
    getOrder.mockRejectedValue(new Error('network'));
    const { state, check } = useOrderPaymentStatus({ interval: 1000, maxAttempts: 2 });

    const pending = check(1);
    await vi.advanceTimersByTimeAsync(1000);
    await pending;

    expect(state.value).toBe('error');
  });

  it('页面卸载后停止轮询', async () => {
    getOrder.mockResolvedValue(orderWith('UNPAID'));
    const { check } = useOrderPaymentStatus({ interval: 1000, maxAttempts: 5 });

    const pending = check(1);
    await vi.advanceTimersByTimeAsync(0);
    unmountCallbacks.forEach(callback => callback());
    await vi.advanceTimersByTimeAsync(5000);
    await pending;

    expect(getOrder).toHaveBeenCalledTimes(1);
  });
});
