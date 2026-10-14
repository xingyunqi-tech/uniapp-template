/**
 * 支付宝支付工具函数
 * 支持 H5（手机网站支付、电脑网站支付）与支付宝小程序支付，App 支付暂不支持
 */
import {
  alipayControllerCreateMiniPaymentV1,
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
 * 获取支付宝授权码（auth_base 静默授权，不弹窗）
 */
export function getAlipayAuthCode(): Promise<string> {
  return new Promise((resolve, reject) => {
    uni.login({
      success: res => (res.code ? resolve(res.code) : reject(new Error('未获取到支付宝授权码'))),
      fail: reject,
    });
  });
}

/** my.tradePay 的 resultCode 转为支付结果，8000 / 6004 表示结果未知，以服务端支付状态为准 */
function toTradePayResult(resultCode: unknown, outTradeNo: string): PaymentResult {
  switch (String(resultCode ?? '')) {
    case '9000':
      return { success: true, message: '支付成功', outTradeNo };
    case '6001':
      return { success: false, message: '已取消支付', outTradeNo };
    case '8000':
    case '6004':
      return { success: false, message: '支付结果确认中，请稍后在订单中查看', outTradeNo };
    default:
      return { success: false, message: '支付失败', outTradeNo };
  }
}

/**
 * 创建支付宝小程序支付：后端以授权码确定付款用户并下单，返回交易号后拉起收银台
 */
export async function createMiniProgramPayment(params: CreatePaymentDto): Promise<PaymentResult> {
  // #ifdef MP-ALIPAY
  try {
    const authCode = await getAlipayAuthCode();
    const { tradeNo } = await alipayControllerCreateMiniPaymentV1({ ...params, authCode });
    const res = await uni.requestPayment({ provider: 'alipay', orderInfo: tradeNo });
    return toTradePayResult((res as unknown as { resultCode?: unknown }).resultCode, params.outTradeNo);
  } catch (error) {
    console.error('支付宝小程序支付失败:', error);
    return {
      success: false,
      message: '支付失败',
      outTradeNo: params.outTradeNo,
    };
  }
  // #endif

  // #ifndef MP-ALIPAY
  return {
    success: false,
    message: '当前平台不支持支付宝小程序支付',
    outTradeNo: params.outTradeNo,
  };
  // #endif
}

/**
 * 创建 App 支付
 * 需要后端提供 alipay.trade.app.pay 接口返回 orderInfo，当前后端未提供，始终返回失败
 */
export async function createAppPayment(params: CreatePaymentDto): Promise<PaymentResult> {
  return {
    success: false,
    message: '暂不支持支付宝 App 支付',
    outTradeNo: params.outTradeNo,
  };
}

/**
 * 创建手机网站支付（H5）
 * 仅支持 H5 平台，使用 DOM 操作提交支付表单
 */
export async function createMobilePayment(params: CreatePaymentDto): Promise<PaymentResult> {
  // #ifdef H5
  try {
    // 运行时双重检查，确保 DOM API 可用
    if (typeof document === 'undefined') {
      return {
        success: false,
        message: '当前环境不支持此支付方式',
      };
    }

    const { form: formHtml } = await alipayControllerCreateMobilePaymentV1(params);

    // 创建临时表单并提交
    const div = document.createElement('div');
    div.innerHTML = formHtml;
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

  // #ifndef H5
  return {
    success: false,
    message: '当前平台不支持支付宝 H5 支付',
  };
  // #endif
}

/**
 * 创建电脑网站支付（PC）
 * 仅支持 H5 平台，使用 DOM 操作提交支付表单
 */
export async function createWebPayment(params: CreatePaymentDto): Promise<PaymentResult> {
  // #ifdef H5
  try {
    // 运行时双重检查，确保 DOM API 可用
    if (typeof document === 'undefined') {
      return {
        success: false,
        message: '当前环境不支持此支付方式',
      };
    }

    const { form: formHtml } = await alipayControllerCreateWebPaymentV1(params);

    // 创建临时表单并提交
    const div = document.createElement('div');
    div.innerHTML = formHtml;
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

  // #ifndef H5
  return {
    success: false,
    message: '当前平台不支持支付宝网站支付',
  };
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
