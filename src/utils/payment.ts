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
  const { method, outTradeNo, description, openid } = params;

  // 支付金额由后端按订单金额确定
  if (method === PaymentMethod.WECHAT) {
    return WechatPay.pay({
      outTradeNo,
      description,
      openid,
    });
  } else if (method === PaymentMethod.ALIPAY) {
    return AlipayPay.pay({
      outTradeNo,
      subject: description,
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
 * @param refundNo 退款单号，同一笔退款重试时须保持不变
 * @param refundAmount 退款金额（元）
 */
export async function refund(
  method: PaymentMethod,
  outTradeNo: string,
  refundNo: string,
  refundAmount: number,
  reason?: string,
): Promise<boolean> {
  if (method === PaymentMethod.WECHAT) {
    return WechatPay.refundOrder({
      outTradeNo,
      outRefundNo: refundNo,
      refundAmount: AlipayPay.yuanToFen(refundAmount), // 元转分
      reason,
    });
  } else if (method === PaymentMethod.ALIPAY) {
    return AlipayPay.refundOrder({
      outTradeNo,
      outRequestNo: refundNo,
      refundAmount: refundAmount.toFixed(2), // 保留两位小数
      refundReason: reason,
    });
  }
  return false;
}

// 导出金额转换工具
export { yuanToFen, fenToYuan } from './alipay-pay';
