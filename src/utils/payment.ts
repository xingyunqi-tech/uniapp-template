/**
 * 统一支付工具函数
 * 整合微信支付和支付宝支付，提供统一的支付接口
 */
import * as WechatPay from './wechat-pay';
import * as AlipayPay from './alipay-pay';

/**
 * 支付方式枚举
 */
export enum PaymentMethod {
  WECHAT = 'wechat',
  ALIPAY = 'alipay',
}

/**
 * 统一支付参数
 */
export interface UnifiedPaymentParams {
  /** 支付方式 */
  method: PaymentMethod;
  /** 商户订单号 */
  outTradeNo: string;
  /** 商品描述/标题 */
  description: string;
  /** 订单金额（元） */
  amount: number;
  /** 微信 openid（微信支付必需） */
  openid?: string;
}

/**
 * 统一支付结果
 */
export interface UnifiedPaymentResult {
  success: boolean;
  message: string;
  outTradeNo?: string;
}

/**
 * 统一支付入口
 */
export async function unifiedPay(params: UnifiedPaymentParams): Promise<UnifiedPaymentResult> {
  const { method, outTradeNo, description, amount, openid } = params;

  if (method === PaymentMethod.WECHAT) {
    // 微信支付（金额单位：分）
    return WechatPay.pay({
      outTradeNo,
      description,
      amount: AlipayPay.yuanToFen(amount), // 元转分
      openid,
    });
  } else if (method === PaymentMethod.ALIPAY) {
    // 支付宝支付（金额单位：元）
    return AlipayPay.pay({
      outTradeNo,
      subject: description,
      totalAmount: amount.toFixed(2), // 保留两位小数
    });
  }

  return {
    success: false,
    message: '不支持的支付方式',
  };
}

/**
 * 查询订单状态
 */
export async function queryOrder(method: PaymentMethod, outTradeNo: string): Promise<any> {
  if (method === PaymentMethod.WECHAT) {
    return WechatPay.queryOrderStatus(outTradeNo);
  } else if (method === PaymentMethod.ALIPAY) {
    return AlipayPay.queryOrderStatus(outTradeNo);
  }
  throw new Error('不支持的支付方式');
}

/**
 * 申请退款
 */
export async function refund(
  method: PaymentMethod,
  outTradeNo: string,
  refundAmount: number,
  reason?: string,
): Promise<boolean> {
  if (method === PaymentMethod.WECHAT) {
    return WechatPay.refundOrder({
      outTradeNo,
      outRefundNo: `${outTradeNo}_refund_${Date.now()}`,
      refundAmount: AlipayPay.yuanToFen(refundAmount), // 元转分
      totalAmount: AlipayPay.yuanToFen(refundAmount), // 元转分
      reason,
    });
  } else if (method === PaymentMethod.ALIPAY) {
    return AlipayPay.refundOrder({
      outTradeNo,
      refundAmount: refundAmount.toFixed(2), // 保留两位小数
      refundReason: reason,
    });
  }
  return false;
}

// 导出金额转换工具
export { yuanToFen, fenToYuan } from './alipay-pay';
