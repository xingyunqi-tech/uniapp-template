import { afterEach, describe, expect, it, type Mock } from 'vitest';
import { getShareTarget } from '@/utils/router';
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
    onPage('pages-sub/order/detail/index', { id: '1', from: 'a%20b' });

    expect(getShareTarget()).toEqual({
      path: '/pages-sub/order/detail/index?id=1&from=a%20b',
      query: 'id=1&from=a%20b',
    });
  });

  it('登录等页面分享为首页', () => {
    onPage('pages/login/index', { redirect: 'x' });

    expect(getShareTarget()).toEqual({ path: PAGES.HOME, query: '' });
  });

  it('页面栈为空时分享为首页', () => {
    expect(getShareTarget()).toEqual({ path: PAGES.HOME, query: '' });
  });
});
