import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useUserStore } from '@/store/modules/user';
import { guardCurrentPage, setupRouterInterceptor } from '@/utils/router-interceptor';
import { isRouteIntercepted } from '@/utils/router';
import { PAGES, PAGE_ROLES, ROLE } from '@/constants';

const getCurrentPagesMock = getCurrentPages as unknown as Mock;
const loginWithRedirect = (path: string) => `/pages/login/index?redirect=${encodeURIComponent(path)}`;

function onPage(fullPath: string) {
  const [path, query = ''] = fullPath.split('?');
  const options = Object.fromEntries(
    query
      .split('&')
      .filter(Boolean)
      .map(pair => pair.split('=')),
  );
  getCurrentPagesMock.mockReturnValue([{ route: path.slice(1), options, $page: { fullPath } }]);
}

/** 模拟启动时登录态恢复进行中，返回结束恢复的函数 */
function pendingSession() {
  const store = useUserStore();
  let finish: (loggedIn: boolean) => Promise<void> = async () => {};
  store.sessionPending = true;
  store.ensureSession = vi.fn(
    () =>
      new Promise<void>(resolve => {
        finish = async loggedIn => {
          if (loggedIn) store.setToken('token');
          store.sessionPending = false;
          resolve();
          await Promise.resolve();
        };
      }),
  );
  return (loggedIn: boolean) => finish(loggedIn);
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

  it('登录态恢复中进入受保护页时等待恢复，登录成功则不跳转', async () => {
    const finish = pendingSession();
    onPage('/pages-sub/order/detail/index?id=1');

    guardCurrentPage();
    expect(uni.redirectTo).not.toHaveBeenCalled();
    await finish(true);

    expect(uni.redirectTo).not.toHaveBeenCalled();
  });

  it('登录态恢复中进入受保护页，恢复后仍未登录时跳转登录页', async () => {
    const finish = pendingSession();
    onPage('/pages-sub/order/detail/index?id=1');

    guardCurrentPage();
    await finish(false);

    expect(uni.redirectTo).toHaveBeenCalledWith({ url: loginWithRedirect('/pages-sub/order/detail/index?id=1') });
  });
});

describe('路由拦截器', () => {
  type InvokeArgs = { url: string; fail?: (result: { errMsg: string }) => void; complete?: () => void };
  type Invoke = (args: InvokeArgs) => InvokeArgs | false;
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
    const fail = vi.fn();
    const args = { url: '/pages-sub/order/list/index', fail };

    expect(invokers.get('navigateTo')?.(args)).toBe(args);
    expect(fail).not.toHaveBeenCalled();
  });

  it('未登录被拦截时以失败结束本次调用', () => {
    const fail = vi.fn();
    const complete = vi.fn();

    const result = invokers.get('navigateTo')?.({ url: '/pages-sub/order/list/index', fail, complete });

    expect(result).toBe(false);
    expect(fail).toHaveBeenCalledWith({ errMsg: 'navigateTo:fail intercepted' });
    expect(complete).toHaveBeenCalledTimes(1);
    expect(isRouteIntercepted(fail.mock.calls[0][0])).toBe(true);
  });

  it('无页面权限被拦截时以失败结束本次调用', () => {
    const path = '/pages-sub/order/list/index';
    PAGE_ROLES[path] = [ROLE.ADMIN];
    try {
      useUserStore().setToken('token');
      const fail = vi.fn();

      const result = invokers.get('redirectTo')?.({ url: path, fail });

      expect(result).toBe(false);
      expect(fail).toHaveBeenCalledWith({ errMsg: 'redirectTo:fail intercepted' });
    } finally {
      delete PAGE_ROLES[path];
    }
  });

  it('switchTab 未登录被拦截时以失败结束本次调用', () => {
    const fail = vi.fn();

    const result = invokers.get('switchTab')?.({ url: '/pages-sub/order/list/index', fail });

    expect(result).toBe(false);
    expect(fail).toHaveBeenCalledWith({ errMsg: 'switchTab:fail intercepted' });
  });

  it('登录态恢复中跳转受保护页时拦截，恢复登录后重新发起跳转', async () => {
    const finish = pendingSession();

    const result = invokers.get('navigateTo')?.({ url: '/pages-sub/order/list/index' });
    vi.runAllTimers();
    expect(result).toBe(false);
    expect(uni.navigateTo).not.toHaveBeenCalled();
    await finish(true);

    expect(uni.navigateTo).toHaveBeenCalledWith({ url: '/pages-sub/order/list/index' });
  });

  it('switchTab 未登录时打开登录页并携带 redirect', () => {
    invokers.get('switchTab')?.({ url: '/pages-sub/order/list/index' });
    vi.runAllTimers();

    expect(uni.redirectTo).toHaveBeenCalledWith({ url: loginWithRedirect('/pages-sub/order/list/index') });
  });

  describe('无页面权限', () => {
    const path = '/pages-sub/order/list/index';
    const forbiddenUrl = `${PAGES.FORBIDDEN}?type=403`;

    beforeEach(() => {
      PAGE_ROLES[path] = [ROLE.ADMIN];
      useUserStore().setToken('token');
    });

    afterEach(() => {
      delete PAGE_ROLES[path];
    });

    it('navigateTo 时以 navigateTo 打开 403 页，保留当前页', () => {
      invokers.get('navigateTo')?.({ url: path });
      vi.runAllTimers();

      expect(uni.navigateTo).toHaveBeenCalledWith({ url: forbiddenUrl });
      expect(uni.redirectTo).not.toHaveBeenCalled();
    });

    it('navigateTo 且页面栈已满时以 redirectTo 打开 403 页', () => {
      getCurrentPagesMock.mockReturnValue(Array.from({ length: 10 }, () => ({})));

      invokers.get('navigateTo')?.({ url: path });
      vi.runAllTimers();

      expect(uni.navigateTo).not.toHaveBeenCalled();
      expect(uni.redirectTo).toHaveBeenCalledWith({ url: forbiddenUrl });
    });

    it('redirectTo 时以 redirectTo 打开 403 页', () => {
      invokers.get('redirectTo')?.({ url: path });
      vi.runAllTimers();

      expect(uni.navigateTo).not.toHaveBeenCalled();
      expect(uni.redirectTo).toHaveBeenCalledWith({ url: forbiddenUrl });
    });
  });
});
