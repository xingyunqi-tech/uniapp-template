/**
 * 订单相关常量
 */

/**
 * 订单状态枚举
 */
export const ORDER_STATUS = {
  /** 待付款 */
  PENDING: 'pending',
  /** 待发货 */
  PAID: 'paid',
  /** 待收货 */
  SHIPPED: 'shipped',
  /** 已完成 */
  COMPLETED: 'completed',
  /** 已取消 */
  CANCELLED: 'cancelled',
} as const;

export type OrderStatusType = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

/**
 * 订单状态配置映射
 */
export const ORDER_STATUS_MAP: Record<
  OrderStatusType,
  {
    text: string;
    class: string;
    icon?: string;
  }
> = {
  [ORDER_STATUS.PENDING]: {
    text: '待付款',
    class: 'warning',
    icon: 'i-carbon-time',
  },
  [ORDER_STATUS.PAID]: {
    text: '待发货',
    class: 'info',
    icon: 'i-carbon-delivery-parcel',
  },
  [ORDER_STATUS.SHIPPED]: {
    text: '待收货',
    class: 'primary',
    icon: 'i-carbon-delivery-truck',
  },
  [ORDER_STATUS.COMPLETED]: {
    text: '已完成',
    class: 'success',
    icon: 'i-carbon-checkmark-outline',
  },
  [ORDER_STATUS.CANCELLED]: {
    text: '已取消',
    class: 'disabled',
    icon: 'i-carbon-close-outline',
  },
};

/**
 * 获取订单状态文本
 */
export function getOrderStatusText(status: OrderStatusType): string {
  return ORDER_STATUS_MAP[status]?.text ?? '未知状态';
}

/**
 * 获取订单状态样式类
 */
export function getOrderStatusClass(status: OrderStatusType): string {
  return ORDER_STATUS_MAP[status]?.class ?? '';
}

/**
 * 订单标签页配置
 */
export const ORDER_TABS = [
  { label: '全部', value: 'all' },
  { label: '待付款', value: ORDER_STATUS.PENDING },
  { label: '待发货', value: ORDER_STATUS.PAID },
  { label: '待收货', value: ORDER_STATUS.SHIPPED },
  { label: '已完成', value: ORDER_STATUS.COMPLETED },
] as const;
