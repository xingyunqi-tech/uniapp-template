import { PAGES } from '@/constants/pages';
import { safeBack } from '@/utils/router';

/**
 * 安全返回：有上一页时返回，从分享、扫码、H5 刷新等直接进入时打开兜底页
 * @param fallback 无上一页时打开的页面，默认首页
 * @example
 * const goBack = useSafeBack(PAGES.ADDRESS);
 * goBack();
 */
export function useSafeBack(fallback: string = PAGES.HOME): () => Promise<void> {
  return () => safeBack(fallback);
}
