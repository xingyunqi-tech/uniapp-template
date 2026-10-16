import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

const hooks = vi.hoisted(() => ({
  appMessage: undefined as
    undefined | ((res: { from: string }) => { path: string; promise?: Promise<{ path?: string }> }),
  timeline: undefined as undefined | (() => { query: string }),
}));

vi.mock('@dcloudio/uni-app', () => ({
  onShareAppMessage: (callback: typeof hooks.appMessage) => {
    hooks.appMessage = callback;
  },
  onShareTimeline: (callback: typeof hooks.timeline) => {
    hooks.timeline = callback;
  },
}));

const stores = vi.hoisted(() => ({
  createShareRecord: vi.fn(),
  isLoggedIn: false,
}));

vi.mock('@/store', () => ({
  useShareStore: () => ({ loading: false, createShareRecord: stores.createShareRecord }),
  useUserStore: () => ({
    get isLoggedIn() {
      return stores.isLoggedIn;
    },
  }),
}));

const { useShare } = await import('@/composables/useShare');

const getCurrentPagesMock = getCurrentPages as unknown as Mock;

function onPage(route: string, options: Record<string, string> = {}) {
  getCurrentPagesMock.mockReturnValue([{ route, options }]);
}

function friendPath() {
  return hooks.appMessage?.({ from: 'menu' }).path;
}

beforeEach(() => {
  hooks.appMessage = undefined;
  hooks.timeline = undefined;
  stores.isLoggedIn = false;
  stores.createShareRecord.mockReset().mockResolvedValue({ shareCode: 'MY' });
});

afterEach(() => {
  getCurrentPagesMock.mockReset().mockReturnValue([]);
});

describe('useShare 分享路径', () => {
  it('未指定 path 时保留当前页面参数', () => {
    onPage('pages-sub/other/about/index', { id: '1' });
    useShare({ defaultShare: { title: 't' } });

    expect(friendPath()).toBe('/pages-sub/other/about/index?id=1');
  });

  it('path 已带参数时追加参数用 & 连接', () => {
    useShare({ defaultShare: { path: '/pages/product/detail?id=1', query: { from: 'share' } } });

    expect(friendPath()).toBe('/pages/product/detail?id=1&from=share');
  });

  it('同名参数以追加的值为准', () => {
    onPage('pages-sub/other/about/index', { id: '1', from: 'old' });
    useShare({ defaultShare: { query: { from: 'new' } } });

    expect(friendPath()).toBe('/pages-sub/other/about/index?id=1&from=new');
  });

  it('不可分享的页面改为分享首页', () => {
    onPage('pages/login/index', { redirect: 'x' });
    useShare();

    expect(friendPath()).toBe('/pages/index/index');
  });

  it('私有页改为分享首页', () => {
    onPage('pages-sub/order/detail/index', { id: '1' });
    useShare();

    expect(friendPath()).toBe('/pages/index/index');
  });

  it('没有自己的分享码时去掉来源方的 sc', () => {
    onPage('pages-sub/other/about/index', { id: '1', sc: 'FROM' });
    useShare();

    expect(friendPath()).toBe('/pages-sub/other/about/index?id=1');
    expect(hooks.timeline?.().query).toBe('id=1');
  });

  it('朋友圈参数保留当前页面参数并编码追加的值', () => {
    onPage('pages-sub/other/about/index', { id: '1' });
    useShare({ defaultShare: { query: { name: 'a b' } } });

    expect(hooks.timeline?.().query).toBe('id=1&name=a%20b');
  });
});

describe('useShare 分享记录', () => {
  const tracking = { enableTracking: true, targetType: 'PRODUCT', targetId: '1' } as const;

  it('初始化时不创建分享记录', () => {
    stores.isLoggedIn = true;
    useShare(tracking);

    expect(stores.createShareRecord).not.toHaveBeenCalled();
  });

  it('已登录时在分享触发时创建记录，异步内容带上自己的分享码', async () => {
    stores.isLoggedIn = true;
    onPage('pages-sub/other/about/index', { sc: 'FROM' });
    useShare(tracking);

    const content = hooks.appMessage?.({ from: 'menu' });

    expect(stores.createShareRecord).toHaveBeenCalledTimes(1);
    expect(content?.path).toBe('/pages-sub/other/about/index');
    await expect(content?.promise).resolves.toMatchObject({ path: '/pages-sub/other/about/index?sc=MY' });
    expect(friendPath()).toBe('/pages-sub/other/about/index?sc=MY');
    expect(stores.createShareRecord).toHaveBeenCalledTimes(1);
  });

  it('未登录时分享不创建记录', () => {
    useShare(tracking);

    const content = hooks.appMessage?.({ from: 'menu' });
    hooks.timeline?.();

    expect(stores.createShareRecord).not.toHaveBeenCalled();
    expect(content?.promise).toBeUndefined();
  });

  it('已登录时分享到朋友圈创建记录', () => {
    stores.isLoggedIn = true;
    useShare(tracking);

    hooks.timeline?.();

    expect(stores.createShareRecord).toHaveBeenCalledTimes(1);
  });
});
