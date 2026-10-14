import { onUnmounted, ref } from 'vue';
import { getOrder } from '@/api';
import { OrderStatus } from '@/constants';

/** 支付结果页展示状态 */
export type OrderPaymentState = 'checking' | 'paid' | 'unpaid' | 'closed' | 'error';

export interface UseOrderPaymentStatusOptions {
  /** 轮询间隔（毫秒），默认 1500 */
  interval?: number;
  /** 最多查询次数，默认 5 */
  maxAttempts?: number;
}

/**
 * 查询订单支付状态：订单仍为待支付时按间隔重试，支付平台回调更新订单前保持确认中
 *
 * @example
 * ```typescript
 * const { state, check } = useOrderPaymentStatus();
 * onLoad(options => check(Number(options.orderId)));
 * ```
 */
export function useOrderPaymentStatus(options: UseOrderPaymentStatusOptions = {}) {
  const { interval = 1500, maxAttempts = 5 } = options;

  const state = ref<OrderPaymentState>('checking');
  const orderNo = ref('');

  /** 每次 check 递增，页面卸载或重新查询时使进行中的轮询作废 */
  let checkId = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let stopWaiting: (() => void) | undefined;

  function wait(): Promise<void> {
    return new Promise(resolve => {
      stopWaiting = resolve;
      timer = setTimeout(resolve, interval);
    });
  }

  async function check(orderId: number): Promise<void> {
    const id = ++checkId;
    state.value = 'checking';

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const order = await getOrder(orderId, { showError: false });
        if (id !== checkId) return;
        orderNo.value = order.orderNo;

        if (order.status === OrderStatus.PAID || order.status === OrderStatus.REFUNDED) {
          state.value = 'paid';
          return;
        }
        if (order.status === OrderStatus.CLOSED) {
          state.value = 'closed';
          return;
        }
      } catch {
        if (id !== checkId) return;
        if (attempt === maxAttempts) {
          state.value = 'error';
          return;
        }
      }

      if (attempt < maxAttempts) {
        await wait();
        if (id !== checkId) return;
      }
    }

    state.value = 'unpaid';
  }

  onUnmounted(() => {
    checkId++;
    clearTimeout(timer);
    stopWaiting?.();
  });

  return {
    state,
    orderNo,
    check,
  };
}
