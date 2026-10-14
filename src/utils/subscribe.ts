/**
 * 微信小程序订阅消息
 */

/** 订阅消息场景 */
export type SubscribeScene = 'orderPaid';

/** 各场景的模板 ID，需与后端 WECHAT_SUBSCRIBE_* 配置一致 */
const TEMPLATE_IDS: Record<SubscribeScene, string | undefined> = {
  orderPaid: import.meta.env.VITE_WX_TMPL_ORDER_PAID,
};

/**
 * 申请订阅消息授权，必须在用户点击事件中同步调用（不能先 await 其它异步操作）
 * 非微信小程序或模板未配置时直接返回；用户拒绝或调用失败不抛错
 * @returns 用户同意订阅的模板 ID
 *
 * @example
 * ```typescript
 * async function handlePay() {
 *   await requestSubscribe(['orderPaid']);
 *   await pay(order);
 * }
 * ```
 */
export function requestSubscribe(scenes: SubscribeScene[]): Promise<string[]> {
  // #ifdef MP-WEIXIN
  const tmplIds = scenes.map(scene => TEMPLATE_IDS[scene]).filter((id): id is string => !!id);
  if (tmplIds.length === 0) return Promise.resolve([]);

  return new Promise(resolve => {
    uni.requestSubscribeMessage({
      tmplIds,
      // 结果以模板 ID 为 key，值为 accept / reject / ban / filter，类型声明未包含
      success: res => resolve(tmplIds.filter(id => (res as unknown as Record<string, string>)[id] === 'accept')),
      fail: () => resolve([]),
    });
  });
  // #endif

  // #ifndef MP-WEIXIN
  return Promise.resolve([]);
  // #endif
}
