import { afterEach, describe, expect, it, type Mock } from 'vitest';
import { getCurrentFullPath, getShareTarget, isPrivatePage } from '@/utils/router';
import { PAGES } from '@/constants/pages';

const getCurrentPagesMock = getCurrentPages as unknown as Mock;

function onPage(route: string, options: Record<string, string> = {}) {
  getCurrentPagesMock.mockReturnValue([{ route, options }]);
}

describe('getShareTarget', () => {
  afterEach(() => {
    getCurrentPagesMock.mockReset().mockReturnValue([]);
  });

  it('分享当前页面并携带原始参数', () => {
    onPage('pages-sub/other/about/index', { id: '1', from: 'a%20b' });

    expect(getShareTarget()).toEqual({
      path: '/pages-sub/other/about/index?id=1&from=a%20b',
      query: 'id=1&from=a%20b',
    });
  });

  it.each(['pages-sub/order/detail/index', 'pages-sub/order/payment-result/index', 'pages-sub/user/address/index'])(
    '私有页 %s 分享为首页',
    route => {
      onPage(route, { id: '1' });

      expect(getShareTarget()).toEqual({ path: PAGES.HOME, query: '' });
    },
  );

  it('不透传来源方的分享码', () => {
    onPage('pages-sub/other/about/index', { id: '1', sc: 'AAA', shareCode: 'BBB' });

    expect(getShareTarget()).toEqual({ path: '/pages-sub/other/about/index?id=1', query: 'id=1' });
  });

  it('小程序码 scene 展开为普通参数并去掉来源方分享码', () => {
    onPage('pages-sub/other/about/index', { scene: encodeURIComponent('sc=AAA&id=9') });

    expect(getShareTarget()).toEqual({ path: '/pages-sub/other/about/index?id=9', query: 'id=9' });
  });

  it('scene 展开后的值重新编码', () => {
    onPage('pages-sub/other/about/index', { scene: encodeURIComponent('n=a b&id=1'), id: '2' });

    expect(getShareTarget().query).toBe('n=a%20b&id=2');
  });

  it('不含键值的 scene 原值保留', () => {
    onPage('pages-sub/other/about/index', { scene: 'promo01' });

    expect(getShareTarget().query).toBe('scene=promo01');
  });

  it('登录等页面分享为首页', () => {
    onPage('pages/login/index', { redirect: 'x' });

    expect(getShareTarget()).toEqual({ path: PAGES.HOME, query: '' });
  });

  it('页面栈为空时分享为首页', () => {
    expect(getShareTarget()).toEqual({ path: PAGES.HOME, query: '' });
  });
});

describe('getCurrentFullPath', () => {
  afterEach(() => {
    getCurrentPagesMock.mockReset().mockReturnValue([]);
  });

  it('小程序按原始参数拼接，不重复编码', () => {
    getCurrentPagesMock.mockReturnValue([
      {
        route: 'pages-sub/order/list/index',
        options: { keyword: '%E4%B8%AD' },
        $page: { fullPath: '/pages-sub/order/list/index?keyword=%25E4%25B8%25AD' },
      },
    ]);

    expect(getCurrentFullPath()).toBe('/pages-sub/order/list/index?keyword=%E4%B8%AD');
  });

  it('页面栈为空时返回空串', () => {
    expect(getCurrentFullPath()).toBe('');
  });
});

describe('isPrivatePage', () => {
  it('订单与用户分包为私有页，忽略查询参数', () => {
    expect(isPrivatePage('/pages-sub/order/list/index?status=1')).toBe(true);
    expect(isPrivatePage('/pages-sub/user/settings/index')).toBe(true);
  });

  it('其他页面不是私有页', () => {
    expect(isPrivatePage('/pages/index/index')).toBe(false);
    expect(isPrivatePage('/pages-sub/other/about/index')).toBe(false);
    expect(isPrivatePage('/pages-sub/orders/index')).toBe(false);
  });
});
