/**
 * 订单支付 Composable
 */

import { ref } from 'vue';
import { PAGES, PaymentStatus } from '@/constants';
import * as WechatPay from '@/utils/wechat-pay';
import * as AlipayPay from '@/utils/alipay-pay';
import { requestSubscribe } from '@/utils/subscribe';

/** 待支付订单 */
export interface PayOrder {
  id: string;
  orderNo: string;
}

/** 支付结果 */
export interface PayResult {
  status: PaymentStatus;
  message: string;
  /** 页面已跳转到支付平台（H5 网页支付） */
  redirected?: boolean;
  /** 已有支付在进行，本次调用被忽略 */
  ignored?: boolean;
}

/** 支付标题，同一订单每次支付保持一致 */
export function getPaymentSubject(orderNo: string): string {
  return `订单 ${orderNo}`;
}

function toPayResult(result: WechatPay.PaymentResult | AlipayPay.PaymentResult): PayResult {
  return {
    status: result.status ?? (result.success ? PaymentStatus.SUCCESS : PaymentStatus.FAILED),
    message: result.message,
  };
}

/**
 * 微信小程序支付，订阅消息授权须在点击事件中先于其它异步操作发起
 */
export async function payOnWechat(order: PayOrder): Promise<PayResult> {
  await requestSubscribe(['orderPaid']);
  return toPayResult(await WechatPay.pay({ outTradeNo: order.orderNo, description: getPaymentSubject(order.orderNo) }));
}

/**
 * 支付宝小程序支付
 */
export async function payOnAlipayMini(order: PayOrder): Promise<PayResult> {
  return toPayResult(
    await AlipayPay.createMiniProgramPayment({ outTradeNo: order.orderNo, subject: getPaymentSubject(order.orderNo) }),
  );
}

/**
 * H5 支付宝网页支付，成功时页面跳转到支付宝
 */
export async function payOnH5(order: PayOrder): Promise<PayResult> {
  const result = await AlipayPay.pay({ outTradeNo: order.orderNo, subject: getPaymentSubject(order.orderNo) });
  return result.success
    ? { status: PaymentStatus.PROCESSING, message: result.message, redirected: true }
    : { status: PaymentStatus.FAILED, message: result.message };
}

/**
 * 订单支付：按平台选择支付方式，必须在点击事件中同步调用
 *
 * @example
 * ```typescript
 * const { paying, pay, handlePayResult } = usePayment();
 *
 * async function handlePay() {
 *   handlePayResult(await pay(order), order.id);
 * }
 * ```
 */
export function usePayment() {
  const paying = ref(false);

  async function pay(order: PayOrder): Promise<PayResult> {
    if (paying.value) {
      return { status: PaymentStatus.PROCESSING, message: '', ignored: true };
    }
    paying.value = true;
    try {
      // #ifdef MP-WEIXIN
      return await payOnWechat(order);
      // #endif

      // #ifdef MP-ALIPAY
      return await payOnAlipayMini(order);
      // #endif

      // #ifdef H5
      return await payOnH5(order);
      // #endif

      // #ifndef MP-WEIXIN || MP-ALIPAY || H5
      return { status: PaymentStatus.FAILED, message: '当前平台暂不支持支付' };
      // #endif
    } catch (error) {
      console.error('支付失败:', error);
      return { status: PaymentStatus.FAILED, message: '支付失败' };
    } finally {
      paying.value = false;
    }
  }

  /**
   * 处理支付结果：成功或结果未知时进入支付结果页（以服务端订单状态为准），取消或失败时提示
   */
  function handlePayResult(result: PayResult, orderId: PayOrder['id']) {
    if (result.ignored || result.redirected) return;

    if (result.status === PaymentStatus.SUCCESS || result.status === PaymentStatus.PROCESSING) {
      uni.redirectTo({ url: `${PAGES.PAYMENT_RESULT}?orderId=${orderId}` });
      return;
    }

    uni.showToast({ title: result.message, icon: 'none' });
  }

  return {
    paying,
    pay,
    handlePayResult,
  };
}
