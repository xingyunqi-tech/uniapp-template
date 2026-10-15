import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

const hooks = vi.hoisted(() => ({
  appMessage: undefined as undefined | ((res: { from: string }) => { path: string }),
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

vi.mock('@/store', () => ({
  useShareStore: () => ({ loading: false }),
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
});

afterEach(() => {
  getCurrentPagesMock.mockReset().mockReturnValue([]);
});

describe('useShare 分享路径', () => {
  it('未指定 path 时保留当前页面参数', () => {
    onPage('pages-sub/order/detail/index', { id: '1' });
    useShare({ defaultShare: { title: 't' } });

    expect(friendPath()).toBe('/pages-sub/order/detail/index?id=1');
  });

  it('path 已带参数时追加参数用 & 连接', () => {
    useShare({ defaultShare: { path: '/pages/product/detail?id=1', query: { from: 'share' } } });

    expect(friendPath()).toBe('/pages/product/detail?id=1&from=share');
  });

  it('同名参数以追加的值为准', () => {
    onPage('pages-sub/order/detail/index', { id: '1', from: 'old' });
    useShare({ defaultShare: { query: { from: 'new' } } });

    expect(friendPath()).toBe('/pages-sub/order/detail/index?id=1&from=new');
  });

  it('不可分享的页面改为分享首页', () => {
    onPage('pages/login/index', { redirect: 'x' });
    useShare();

    expect(friendPath()).toBe('/pages/index/index');
  });

  it('朋友圈参数保留当前页面参数并编码追加的值', () => {
    onPage('pages-sub/order/detail/index', { id: '1' });
    useShare({ defaultShare: { query: { name: 'a b' } } });

    expect(hooks.timeline?.().query).toBe('id=1&name=a%20b');
  });
});
