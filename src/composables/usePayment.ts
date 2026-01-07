/**
 * 支付相关 Composable
 */

import { ref } from 'vue';
import { PaymentMethod, PaymentStatus } from '@/constants';

// TODO: 等待后端 OpenAPI 文档生成后，使用 Orval 自动生成以下 API
// import { createPayment, queryPayment, type CreatePaymentParams } from '@/api';

export interface CreatePaymentParams {
  orderId: string;
  paymentMethod: PaymentMethod;
  amount: number;
  description?: string;
}

/**
 * 支付 Composable
 */
export function usePayment() {
  const paying = ref(false);

  /**
   * 发起支付
   */
  async function pay(params: CreatePaymentParams) {
    paying.value = true;
    try {
      // TODO: 等待 Orval 生成 API 后替换
      // 1. 创建支付订单
      // const paymentResult = await createPayment(params);

      // 2. 根据支付方式调起支付
      if (params.paymentMethod === PaymentMethod.WECHAT) {
        // 临时模拟微信支付参数
        const mockPaymentParams = {
          timeStamp: Date.now().toString(),
          nonceStr: 'mock-nonce',
          package: 'prepay_id=mock',
          signType: 'RSA',
          paySign: 'mock-sign',
        };
        return await payWithWechat(mockPaymentParams);
      } else if (params.paymentMethod === PaymentMethod.ALIPAY) {
        // 临时模拟支付宝支付参数
        const mockPaymentParams = {
          orderInfo: 'mock-order-info',
        };
        return await payWithAlipay(mockPaymentParams);
      } else if (params.paymentMethod === PaymentMethod.BALANCE) {
        // 余额支付直接返回成功
        return { status: PaymentStatus.SUCCESS };
      }

      throw new Error('不支持的支付方式');
    } finally {
      paying.value = false;
    }
  }

  /**
   * 微信支付
   */
  async function payWithWechat(paymentParams: any) {
    return new Promise((resolve, reject) => {
      // #ifdef MP-WEIXIN
      uni.requestPayment({
        provider: 'wxpay',
        timeStamp: paymentParams.timeStamp,
        nonceStr: paymentParams.nonceStr,
        package: paymentParams.package,
        signType: paymentParams.signType,
        paySign: paymentParams.paySign,
        success: () => {
          resolve({ status: PaymentStatus.SUCCESS });
        },
        fail: (err: any) => {
          if (err.errMsg === 'requestPayment:fail cancel') {
            reject(new Error('用户取消支付'));
          } else {
            reject(new Error('支付失败'));
          }
        },
      });
      // #endif

      // #ifdef H5
      // H5 微信支付需要跳转到微信支付页面
      if (paymentParams.mwebUrl) {
        // 跳转前先 resolve，支付结果通过回调页面处理
        resolve({ status: PaymentStatus.PROCESSING });
        setTimeout(() => {
          window.location.href = paymentParams.mwebUrl;
        }, 100);
      } else {
        reject(new Error('缺少支付参数'));
      }
      // #endif

      // #ifdef APP-PLUS
      reject(new Error('当前平台不支持微信支付'));
      // #endif
    });
  }

  /**
   * 支付宝支付
   */
  async function payWithAlipay(paymentParams: any) {
    return new Promise((resolve, reject) => {
      // #ifdef MP-ALIPAY
      uni.requestPayment({
        provider: 'alipay',
        orderInfo: paymentParams.orderInfo,
        success: () => {
          resolve({ status: PaymentStatus.SUCCESS });
        },
        fail: (err: any) => {
          if (err.errMsg === 'requestPayment:fail cancel') {
            reject(new Error('用户取消支付'));
          } else {
            reject(new Error('支付失败'));
          }
        },
      });
      // #endif

      // #ifdef H5
      // H5 支付宝支付需要跳转到支付宝页面
      if (paymentParams.payUrl) {
        // 跳转前先 resolve，支付结果通过回调页面处理
        resolve({ status: PaymentStatus.PROCESSING });
        setTimeout(() => {
          window.location.href = paymentParams.payUrl;
        }, 100);
      } else {
        reject(new Error('缺少支付参数'));
      }
      // #endif

      // #ifdef APP-PLUS
      reject(new Error('当前平台不支持支付宝支付'));
      // #endif
    });
  }

  /**
   * 查询支付结果
   */
  async function checkPaymentStatus(paymentId: string) {
    // TODO: 等待 Orval 生成 API 后替换
    // const result = await queryPayment(paymentId);
    // return result.status === PaymentStatus.SUCCESS;

    // 临时返回成功
    console.log('查询支付状态:', paymentId);
    return true;
  }

  return {
    paying,
    pay,
    checkPaymentStatus,
  };
}
