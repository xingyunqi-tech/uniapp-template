import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { syncTabBarBadge } from '@/utils/tabbar-badge';
import { TAB_BAR_BADGE } from '@/constants/pages';

const getCurrentPagesMock = getCurrentPages as unknown as Mock;
const uniMock = uni as unknown as Record<string, Mock>;
const BADGE_APIS = ['setTabBarBadge', 'removeTabBarBadge', 'showTabBarRedDot', 'hideTabBarRedDot'];

function onPage(route: string) {
  getCurrentPagesMock.mockReturnValue([{ route }]);
}

describe('syncTabBarBadge', () => {
  const original = { ...TAB_BAR_BADGE };

  beforeEach(() => {
    BADGE_APIS.forEach(api => (uniMock[api] = vi.fn()));
    onPage('pages/mine/index');
  });

  afterEach(() => {
    Object.assign(TAB_BAR_BADGE, original);
    getCurrentPagesMock.mockReset().mockReturnValue([]);
  });

  it('有未读时显示数字角标，超过 99 显示 99+', () => {
    syncTabBarBadge(120);

    expect(uniMock.setTabBarBadge).toHaveBeenCalledWith(
      expect.objectContaining({ index: TAB_BAR_BADGE.index, text: '99+' }),
    );
  });

  it('未读为 0 时移除角标', () => {
    syncTabBarBadge(0);

    expect(uniMock.removeTabBarBadge).toHaveBeenCalled();
    expect(uniMock.setTabBarBadge).not.toHaveBeenCalled();
  });

  it('当前不是 TabBar 页时不调用角标接口', () => {
    onPage('pages-sub/user/settings/index');

    syncTabBarBadge(3);

    BADGE_APIS.forEach(api => expect(uniMock[api]).not.toHaveBeenCalled());
  });

  it('配置为红点时显示红点', () => {
    TAB_BAR_BADGE.type = 'dot';

    syncTabBarBadge(3);

    expect(uniMock.showTabBarRedDot).toHaveBeenCalled();
    expect(uniMock.setTabBarBadge).not.toHaveBeenCalled();
  });

  it('关闭配置时不调用角标接口', () => {
    TAB_BAR_BADGE.enabled = false;

    syncTabBarBadge(3);

    BADGE_APIS.forEach(api => expect(uniMock[api]).not.toHaveBeenCalled());
  });
});
