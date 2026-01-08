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

/**
 * 支付结果
 */
export interface PaymentResult {
  success: boolean;
  message: string;
  outTradeNo?: string;
}

/**
 * 创建 JSAPI 支付（小程序/公众号）
 */
export async function createJsapiPayment(params: CreateWechatJsapiPaymentDto): Promise<PaymentResult> {
  try {
    // #ifdef MP-WEIXIN
    // 1. 调用后端接口创建支付订单
    const paymentData = await wechatPayControllerCreateJsapiPaymentV1(params);

    // 2. 调用微信支付
    return new Promise(resolve => {
      uni.requestPayment({
        provider: 'wxpay',
        ...(paymentData as any),
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
        ...(paymentData as any),
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
export async function pay(params: {
  outTradeNo: string;
  description: string;
  amount: number;
  openid?: string;
}): Promise<PaymentResult> {
  // #ifdef MP-WEIXIN
  if (!params.openid) {
    return {
      success: false,
      message: '缺少 openid 参数',
    };
  }
  return createJsapiPayment(params as CreateWechatJsapiPaymentDto);
  // #endif

  // #ifdef APP-PLUS
  return createAppPayment(params as CreateWechatAppPaymentDto);
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
