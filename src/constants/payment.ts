/**
 * 支付相关常量
 */

/**
 * 支付方式枚举
 */
export enum PaymentMethod {
  /** 微信支付 */
  WECHAT = 'wechat',
  /** 支付宝支付 */
  ALIPAY = 'alipay',
  /** 余额支付 */
  BALANCE = 'balance',
}

/**
 * 支付状态枚举
 */
export enum PaymentStatus {
  /** 待支付 */
  PENDING = 'pending',
  /** 处理中 */
  PROCESSING = 'processing',
  /** 支付成功 */
  SUCCESS = 'success',
  /** 支付失败 */
  FAILED = 'failed',
  /** 已取消 */
  CANCELLED = 'cancelled',
  /** 已退款 */
  REFUNDED = 'refunded',
}

/**
 * 支付方式配置映射
 */
export const PAYMENT_METHOD_MAP: Record<
  PaymentMethod,
  {
    text: string;
    icon?: string;
  }
> = {
  [PaymentMethod.WECHAT]: {
    text: '微信支付',
    icon: 'i-carbon-logo-wechat',
  },
  [PaymentMethod.ALIPAY]: {
    text: '支付宝',
    icon: 'i-carbon-logo-alipay',
  },
  [PaymentMethod.BALANCE]: {
    text: '余额支付',
    icon: 'i-carbon-wallet',
  },
};

/**
 * 支付状态配置映射
 */
export const PAYMENT_STATUS_MAP: Record<
  PaymentStatus,
  {
    text: string;
    class: string;
  }
> = {
  [PaymentStatus.PENDING]: {
    text: '待支付',
    class: 'warning',
  },
  [PaymentStatus.PROCESSING]: {
    text: '处理中',
    class: 'info',
  },
  [PaymentStatus.SUCCESS]: {
    text: '支付成功',
    class: 'success',
  },
  [PaymentStatus.FAILED]: {
    text: '支付失败',
    class: 'error',
  },
  [PaymentStatus.CANCELLED]: {
    text: '已取消',
    class: 'disabled',
  },
  [PaymentStatus.REFUNDED]: {
    text: '已退款',
    class: 'info',
  },
};

/**
 * 获取支付方式文本
 */
export function getPaymentMethodText(method: PaymentMethod): string {
  return PAYMENT_METHOD_MAP[method]?.text ?? '未知支付方式';
}

/**
 * 获取支付状态文本
 */
export function getPaymentStatusText(status: PaymentStatus): string {
  return PAYMENT_STATUS_MAP[status]?.text ?? '未知状态';
}

/**
 * 获取支付状态样式类
 */
export function getPaymentStatusClass(status: PaymentStatus): string {
  return PAYMENT_STATUS_MAP[status]?.class ?? '';
}
