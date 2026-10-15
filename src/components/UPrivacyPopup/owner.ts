/** 当前持有隐私授权监听的弹窗实例，页面切换时用于判断是否已被其他页面接管 */
export const privacyListenerOwner: { current: object | null } = { current: null };
