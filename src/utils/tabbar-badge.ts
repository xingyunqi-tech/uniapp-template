import { TAB_BAR_BADGE } from '@/constants/pages';
import { getCurrentRoute, isTabBarPage } from '@/utils/router';

const noop = () => {};

/**
 * 按未读数同步 TabBar 角标，未开启或当前不是 TabBar 页时不处理（非 TabBar 页调用会失败）
 * @param count 未读数
 */
export function syncTabBarBadge(count: number): void {
  if (!TAB_BAR_BADGE.enabled || !isTabBarPage(getCurrentRoute())) return;

  const { index, type } = TAB_BAR_BADGE;
  if (count <= 0) {
    uni.removeTabBarBadge({ index, fail: noop });
    uni.hideTabBarRedDot({ index, fail: noop });
    return;
  }

  if (type === 'dot') {
    uni.showTabBarRedDot({ index, fail: noop });
  } else {
    uni.setTabBarBadge({ index, text: count > 99 ? '99+' : String(count), fail: noop });
  }
}
