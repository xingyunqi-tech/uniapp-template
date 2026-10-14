/**
 * 支付查询与退款工具函数
 * 按支付方式调用微信支付或支付宝接口
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
