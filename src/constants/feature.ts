export type FeatureFlag = 'ORDER' | 'ADDRESS';

/** 功能入口开关，关闭时只隐藏入口，页面与路由保留 */
export const FEATURE_FLAGS: Readonly<Record<FeatureFlag, boolean>> = {
  /** 「我的」页的我的订单入口 */
  ORDER: false,
  /** 设置页的收货地址入口 */
  ADDRESS: false,
};
