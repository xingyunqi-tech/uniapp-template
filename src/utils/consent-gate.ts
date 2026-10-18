import { PAGES } from '@/constants/pages';
import { getCurrentFullPath, getCurrentRoute } from './router';

const GATE_EXEMPT_PAGES: readonly string[] = [PAGES.CONSENT, PAGES.AGREEMENT];

let navigating = false;

/**
 * 关闭所有页面并打开协议同意页，同意后回到当前页；当前页为协议同意页、协议详情页、页面未就绪或正在跳转时不处理
 */
export function openConsentGate(): void {
  const route = getCurrentRoute();
  if (navigating || !route || GATE_EXEMPT_PAGES.includes(route)) return;
  navigating = true;
  uni.reLaunch({
    url: `${PAGES.CONSENT}?redirect=${encodeURIComponent(getCurrentFullPath() || route)}`,
    complete: () => {
      navigating = false;
    },
  });
}
