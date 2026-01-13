/**
 * 支付宝支付工具函数
 * 支持 H5、支付宝小程序、App 等多端
 */
import {
  alipayControllerCreateMobilePaymentV1,
  alipayControllerCreateWebPaymentV1,
  alipayControllerQueryOrderV1,
  alipayControllerRefundV1,
  alipayControllerCloseOrderV1,
} from '@/api';
import type { CreatePaymentDto, RefundDto } from '@/api';

/**
 * 支付结果
 */
export interface PaymentResult {
  success: boolean;
  message: string;
  outTradeNo?: string;
}

/**
 * 创建支付宝小程序支付
 */
export async function createMiniProgramPayment(params: CreatePaymentDto): Promise<PaymentResult> {
  try {
    // #ifdef MP-ALIPAY
    const paymentData = await alipayControllerCreateMobilePaymentV1(params);

    // 支付宝小程序使用 my.tradePay
    return new Promise(resolve => {
      my.tradePay({
        tradeNO: (paymentData as any).tradeNO || params.outTradeNo,
        success: () => {
          resolve({
            success: true,
            message: '支付成功',
            outTradeNo: params.outTradeNo,
          });
        },
        fail: (err: any) => {
          console.error('支付宝支付失败:', err);
          resolve({
            success: false,
            message: err.errorMessage || '支付失败',
            outTradeNo: params.outTradeNo,
          });
        },
      });
    });
    // #endif

    // #ifndef MP-ALIPAY
    return {
      success: false,
      message: '当前平台不支持支付宝小程序支付',
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
 * 创建 App 支付
 */
export async function createAppPayment(params: CreatePaymentDto): Promise<PaymentResult> {
  try {
    // #ifdef APP-PLUS
    const paymentData = await alipayControllerCreateMobilePaymentV1(params);

    // App 使用 uni.requestPayment
    return new Promise(resolve => {
      uni.requestPayment({
        provider: 'alipay',
        orderInfo: (paymentData as any).orderInfo || paymentData,
        success: () => {
          resolve({
            success: true,
            message: '支付成功',
            outTradeNo: params.outTradeNo,
          });
        },
        fail: (err: any) => {
          console.error('支付宝支付失败:', err);
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
      message: '当前平台不支持支付宝 App 支付',
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
 * 创建手机网站支付（H5）
 * 仅支持 H5 平台，使用 DOM 操作提交支付表单
 */
export async function createMobilePayment(params: CreatePaymentDto): Promise<PaymentResult> {
  // #ifndef H5
  return {
    success: false,
    message: '当前平台不支持支付宝 H5 支付',
  };
  // #endif

  // #ifdef H5
  try {
    // 运行时双重检查，确保 DOM API 可用
    if (typeof document === 'undefined') {
      return {
        success: false,
        message: '当前环境不支持此支付方式',
      };
    }

    const paymentData = await alipayControllerCreateMobilePaymentV1(params);

    // 创建临时表单并提交
    const div = document.createElement('div');
    div.innerHTML = paymentData as any;
    document.body.appendChild(div);
    const form = div.querySelector<HTMLFormElement>('form');

    if (!form) {
      document.body.removeChild(div);
      return {
        success: false,
        message: '支付表单解析失败',
      };
    }

    // 提交表单
    (form as HTMLFormElement).submit();
    // 表单提交后移除临时 DOM 元素
    setTimeout(() => {
      document.body.removeChild(div);
    }, 100);

    return {
      success: true,
      message: '正在跳转支付宝...',
      outTradeNo: params.outTradeNo,
    };
  } catch (error) {
    console.error('创建支付订单失败:', error);
    return {
      success: false,
      message: '创建支付订单失败',
    };
  }
  // #endif
}

/**
 * 创建电脑网站支付（PC）
 * 仅支持 H5 平台，使用 DOM 操作提交支付表单
 */
export async function createWebPayment(params: CreatePaymentDto): Promise<PaymentResult> {
  // #ifndef H5
  return {
    success: false,
    message: '当前平台不支持支付宝网站支付',
  };
  // #endif

  // #ifdef H5
  try {
    // 运行时双重检查，确保 DOM API 可用
    if (typeof document === 'undefined') {
      return {
        success: false,
        message: '当前环境不支持此支付方式',
      };
    }

    const paymentData = await alipayControllerCreateWebPaymentV1(params);

    // 创建临时表单并提交
    const div = document.createElement('div');
    div.innerHTML = paymentData as any;
    document.body.appendChild(div);
    const form = div.querySelector<HTMLFormElement>('form');

    if (!form) {
      document.body.removeChild(div);
      return {
        success: false,
        message: '支付表单解析失败',
      };
    }

    // 提交表单
    (form as HTMLFormElement).submit();
    // 表单提交后移除临时 DOM 元素
    setTimeout(() => {
      document.body.removeChild(div);
    }, 100);

    return {
      success: true,
      message: '正在跳转支付宝...',
      outTradeNo: params.outTradeNo,
    };
  } catch (error) {
    console.error('创建支付订单失败:', error);
    return {
      success: false,
      message: '创建支付订单失败',
    };
  }
  // #endif
}

/**
 * 查询订单状态
 */
export async function queryOrderStatus(outTradeNo: string): Promise<any> {
  try {
    const result = await alipayControllerQueryOrderV1(outTradeNo);
    return result;
  } catch (error) {
    console.error('查询订单状态失败:', error);
    throw error;
  }
}

/**
 * 申请退款
 */
export async function refundOrder(params: RefundDto): Promise<boolean> {
  try {
    await alipayControllerRefundV1(params);
    uni.showToast({ title: '退款申请已提交', icon: 'success' });
    return true;
  } catch (error) {
    console.error('申请退款失败:', error);
    uni.showToast({ title: '退款申请失败', icon: 'none' });
    return false;
  }
}

/**
 * 关闭订单
 */
export async function closeOrder(outTradeNo: string): Promise<boolean> {
  try {
    await alipayControllerCloseOrderV1(outTradeNo);
    uni.showToast({ title: '订单已关闭', icon: 'success' });
    return true;
  } catch (error) {
    console.error('关闭订单失败:', error);
    uni.showToast({ title: '关闭订单失败', icon: 'none' });
    return false;
  }
}

/**
 * 统一支付入口（自动判断平台）
 */
export async function pay(params: CreatePaymentDto): Promise<PaymentResult> {
  // #ifdef MP-ALIPAY
  return createMiniProgramPayment(params);
  // #endif

  // #ifdef APP-PLUS
  return createAppPayment(params);
  // #endif

  // #ifdef H5
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  return isMobile ? createMobilePayment(params) : createWebPayment(params);
  // #endif

  // #ifdef MP-WEIXIN
  return {
    success: false,
    message: '当前平台不支持支付宝支付，请使用微信支付',
  };
  // #endif
}

/**
 * 金额转换：元转分
 */
export function yuanToFen(yuan: number): number {
  return Math.round(yuan * 100);
}

/**
 * 金额转换：分转元
 */
export function fenToYuan(fen: number): string {
  return (fen / 100).toFixed(2);
}
