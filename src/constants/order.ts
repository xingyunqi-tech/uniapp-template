/**
 * 订单相关常量
 *
 * 注意: 订单状态直接从 API 导入，确保与后端保持一致
 */

import { OrderStatus, type OrderPaymentChannel } from '@/api';

// 重导出 API 类型，供其他模块使用
export { OrderStatus };
export type OrderStatusType = OrderStatus;

/**
 * 订单状态配置映射
 */
export const ORDER_STATUS_MAP: Record<
  OrderStatus,
  {
    text: string;
    class: string;
    icon?: UniIconsType;
  }
> = {
  [OrderStatus.UNPAID]: {
    text: '待付款',
    class: 'warning',
    icon: 'calendar',
  },
  [OrderStatus.PAID]: {
    text: '已付款',
    class: 'success',
    icon: 'checkmarkempty',
  },
  [OrderStatus.REFUNDED]: {
    text: '已退款',
    class: 'info',
    icon: 'undo',
  },
  [OrderStatus.CLOSED]: {
    text: '已关闭',
    class: 'disabled',
    icon: 'closeempty',
  },
};

/**
 * 获取订单状态文本
 */
export function getOrderStatusText(status: OrderStatus): string {
  return ORDER_STATUS_MAP[status]?.text ?? '未知状态';
}

/**
 * 获取订单状态样式类
 */
export function getOrderStatusClass(status: OrderStatus): string {
  return ORDER_STATUS_MAP[status]?.class ?? '';
}

/**
 * 支付渠道显示文本
 */
export const PAYMENT_CHANNEL_TEXT: Record<OrderPaymentChannel, string> = {
  WECHAT: '微信支付',
  ALIPAY: '支付宝',
};

/**
 * 获取支付渠道文本
 */
export function getPaymentChannelText(channel: OrderPaymentChannel): string {
  return PAYMENT_CHANNEL_TEXT[channel] ?? channel;
}

/**
 * 订单标签页配置
 */
export const ORDER_TABS = [
  { label: '全部', value: 'all' },
  { label: '待付款', value: OrderStatus.UNPAID },
  { label: '已付款', value: OrderStatus.PAID },
  { label: '已退款', value: OrderStatus.REFUNDED },
] as const;
