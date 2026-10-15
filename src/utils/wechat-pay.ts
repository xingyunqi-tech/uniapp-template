/**
 * 微信支付工具函数
 * 封装微信支付相关逻辑，支持小程序、App 等多端
 */
import {
  wechatPayControllerCreateJsapiPaymentV1,
  wechatPayControllerCreateAppPaymentV1,
  wechatPayControllerQueryOrderV1,
  wechatPayControllerRefundV1,
} from '@/api';
import type { CreateWechatJsapiPaymentDto, CreateWechatAppPaymentDto, WechatRefundDto } from '@/api';
import { PaymentStatus } from '@/constants';

/**
 * 支付结果
 */
export interface PaymentResult {
  success: boolean;
  message: string;
  outTradeNo?: string;
  /** 支付状态，未提供时按 success 判断成功或失败 */
  status?: PaymentStatus;
}

/** 获取小程序登录 code，供后端换取付款用户的 openid */
function getLoginCode(): Promise<string> {
  return new Promise((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success: res => (res.code ? resolve(res.code) : reject(new Error('未获取到微信登录 code'))),
      fail: reject,
    });
  });
}

/**
 * 创建 JSAPI 支付（小程序）：后端以登录 code 确定付款用户并下单，返回支付参数后拉起收银台
 */
export async function createJsapiPayment(params: Omit<CreateWechatJsapiPaymentDto, 'code'>): Promise<PaymentResult> {
  try {
    // #ifdef MP-WEIXIN
    const code = await getLoginCode();
    const paymentData = await wechatPayControllerCreateJsapiPaymentV1({ ...params, code });

    return await new Promise(resolve => {
      uni.requestPayment({
        provider: 'wxpay',
        timeStamp: paymentData.timeStamp,
        nonceStr: paymentData.nonceStr,
        package: paymentData.package,
        signType: paymentData.signType,
        paySign: paymentData.paySign,
        success: () => {
          resolve({
            success: true,
            message: '支付成功',
            outTradeNo: params.outTradeNo,
            status: PaymentStatus.SUCCESS,
          });
        },
        // 收银台已拉起，非取消的失败可能已扣款，以订单状态为准
        fail: (err: { errMsg?: string }) => {
          const cancelled = err.errMsg?.includes('cancel') ?? false;
          if (!cancelled) console.error('微信支付失败:', err);
          resolve({
            success: false,
            message: cancelled ? '已取消支付' : '支付结果确认中，请稍后在订单中查看',
            outTradeNo: params.outTradeNo,
            status: cancelled ? PaymentStatus.CANCELLED : PaymentStatus.PROCESSING,
          });
        },
      });
    });
    // #endif

    // #ifndef MP-WEIXIN
    return {
      success: false,
      message: '当前平台不支持微信支付',
    };
    // #endif
  } catch (error) {
    console.error('创建支付订单失败:', error);
    return {
      success: false,
      message: '创建支付订单失败',
    };
  }
}

/**
 * 创建 APP 支付
 */
export async function createAppPayment(params: CreateWechatAppPaymentDto): Promise<PaymentResult> {
  try {
    // #ifdef APP-PLUS
    // 1. 调用后端接口创建支付订单
    const paymentData = await wechatPayControllerCreateAppPaymentV1(params);

    // 2. 调用微信支付
    return new Promise(resolve => {
      uni.requestPayment({
        provider: 'wxpay',
        orderInfo: { ...paymentData },
        success: () => {
          resolve({
            success: true,
            message: '支付成功',
            outTradeNo: params.outTradeNo,
          });
        },
        fail: (err: any) => {
          console.error('微信支付失败:', err);
          resolve({
            success: false,
            message: err.errMsg || '支付失败',
            outTradeNo: params.outTradeNo,
          });
        },
      });
    });
    // #endif

    // #ifndef APP-PLUS
    return {
      success: false,
      message: '当前平台不支持微信 APP 支付',
    };
    // #endif
  } catch (error) {
    console.error('创建支付订单失败:', error);
    return {
      success: false,
      message: '创建支付订单失败',
    };
  }
}

/**
 * 查询订单状态
 */
export async function queryOrderStatus(outTradeNo: string): Promise<any> {
  try {
    const result = await wechatPayControllerQueryOrderV1(outTradeNo);
    return result;
  } catch (error) {
    console.error('查询订单状态失败:', error);
    throw error;
  }
}

/**
 * 申请退款
 */
export async function refundOrder(params: WechatRefundDto): Promise<boolean> {
  try {
    await wechatPayControllerRefundV1(params);
    uni.showToast({ title: '退款申请已提交', icon: 'success' });
    return true;
  } catch (error) {
    console.error('申请退款失败:', error);
    uni.showToast({ title: '退款申请失败', icon: 'none' });
    return false;
  }
}

/**
 * 统一支付入口（自动判断平台）
 */
export async function pay(params: { outTradeNo: string; description: string }): Promise<PaymentResult> {
  // #ifdef MP-WEIXIN
  return createJsapiPayment({ outTradeNo: params.outTradeNo, description: params.description });
  // #endif

  // #ifdef APP-PLUS
  return createAppPayment({ outTradeNo: params.outTradeNo, description: params.description });
  // #endif

  // #ifdef H5
  return {
    success: false,
    message: 'H5 平台请使用支付宝支付',
  };
  // #endif

  // #ifdef MP-ALIPAY
  return {
    success: false,
    message: '支付宝小程序请使用支付宝支付',
  };
  // #endif
}
