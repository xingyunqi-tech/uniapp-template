import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useUserStore } from '@/store/modules/user';
import { guardCurrentPage, setupRouterInterceptor } from '@/utils/router-interceptor';

const getCurrentPagesMock = getCurrentPages as unknown as Mock;
const loginWithRedirect = (path: string) => `/pages/login/index?redirect=${encodeURIComponent(path)}`;

function onPage(fullPath: string) {
  getCurrentPagesMock.mockReturnValue([{ $page: { fullPath } }]);
}

describe('guardCurrentPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    (uni.redirectTo as Mock).mockReset();
  });

  afterEach(() => {
    getCurrentPagesMock.mockReset().mockReturnValue([]);
  });

  it('未登录进入受保护页时重定向到登录页并携带完整路径', () => {
    onPage('/pages-sub/order/detail/index?id=1');

    guardCurrentPage();

    expect(uni.redirectTo).toHaveBeenCalledWith({ url: loginWithRedirect('/pages-sub/order/detail/index?id=1') });
  });

  it('未登录进入白名单页时不跳转', () => {
    onPage('/pages-sub/other/about/index');

    guardCurrentPage();

    expect(uni.redirectTo).not.toHaveBeenCalled();
  });

  it('白名单页 URL 带 hash 时仍按白名单放行', () => {
    onPage('/pages/index/index#/pages-sub/order/detail/index?id=1');

    guardCurrentPage();

    expect(uni.redirectTo).not.toHaveBeenCalled();
  });

  it('已登录进入受保护页时不跳转', () => {
    useUserStore().setToken('token');
    onPage('/pages-sub/order/detail/index?id=1');

    guardCurrentPage();

    expect(uni.redirectTo).not.toHaveBeenCalled();
  });
});

describe('路由拦截器', () => {
  type Invoke = (args: { url: string }) => { url: string } | false;
  const invokers = new Map<string, Invoke>();

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers({ toFake: ['setTimeout'] });
    (uni.navigateTo as Mock).mockReset();
    (uni.redirectTo as Mock).mockReset();
    (uni.addInterceptor as Mock).mockImplementation((method: string, options: { invoke: Invoke }) => {
      invokers.set(method, options.invoke);
    });
    setupRouterInterceptor();
  });

  afterEach(() => {
    vi.useRealTimers();
    invokers.clear();
    getCurrentPagesMock.mockReset().mockReturnValue([]);
  });

  it('未登录跳转受保护页时拦截，并以 navigateTo 打开登录页', () => {
    const result = invokers.get('navigateTo')?.({ url: '/pages-sub/order/list/index?status=1' });
    vi.runAllTimers();

    expect(result).toBe(false);
    expect(uni.navigateTo).toHaveBeenCalledWith({ url: loginWithRedirect('/pages-sub/order/list/index?status=1') });
  });

  it('页面栈已满时以 redirectTo 打开登录页', () => {
    getCurrentPagesMock.mockReturnValue(Array.from({ length: 10 }, () => ({})));

    const result = invokers.get('navigateTo')?.({ url: '/pages-sub/order/list/index' });
    vi.runAllTimers();

    expect(result).toBe(false);
    expect(uni.navigateTo).not.toHaveBeenCalled();
    expect(uni.redirectTo).toHaveBeenCalledWith({ url: loginWithRedirect('/pages-sub/order/list/index') });
  });

  it('原调用为 redirectTo 时以 redirectTo 打开登录页', () => {
    const result = invokers.get('redirectTo')?.({ url: '/pages-sub/order/list/index' });
    vi.runAllTimers();

    expect(result).toBe(false);
    expect(uni.navigateTo).not.toHaveBeenCalled();
    expect(uni.redirectTo).toHaveBeenCalledWith({ url: loginWithRedirect('/pages-sub/order/list/index') });
  });

  it('已登录跳转受保护页时放行', () => {
    useUserStore().setToken('token');
    const args = { url: '/pages-sub/order/list/index' };

    expect(invokers.get('navigateTo')?.(args)).toBe(args);
  });
});
