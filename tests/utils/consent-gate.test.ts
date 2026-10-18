import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { PAGES } from '@/constants/pages';

const getCurrentPagesMock = getCurrentPages as unknown as Mock;
const reLaunch = vi.fn();

function onPage(route: string, options: Record<string, string> = {}) {
  getCurrentPagesMock.mockReturnValue([{ route, options }]);
}

async function loadGate() {
  vi.resetModules();
  return (await import('@/utils/consent-gate')).openConsentGate;
}

beforeEach(() => {
  reLaunch.mockReset();
  (uni as unknown as { reLaunch: Mock }).reLaunch = reLaunch;
});

afterEach(() => {
  getCurrentPagesMock.mockReset().mockReturnValue([]);
});

describe('openConsentGate', () => {
  it('关闭所有页面打开协议同意页，redirect 为编码后的当前页完整路径', async () => {
    const openConsentGate = await loadGate();
    onPage('pages-sub/exam/paper/index', { id: '1', from: 'a%20b' });

    openConsentGate();

    expect(reLaunch).toHaveBeenCalledTimes(1);
    expect(reLaunch.mock.calls[0][0].url).toBe(
      `${PAGES.CONSENT}?redirect=${encodeURIComponent('/pages-sub/exam/paper/index?id=1&from=a%20b')}`,
    );
  });

  it.each([PAGES.CONSENT, PAGES.AGREEMENT])('当前页为 %s 时不跳转', async page => {
    const openConsentGate = await loadGate();
    onPage(page.slice(1));

    openConsentGate();

    expect(reLaunch).not.toHaveBeenCalled();
  });

  it('页面未就绪时不跳转', async () => {
    const openConsentGate = await loadGate();

    openConsentGate();

    expect(reLaunch).not.toHaveBeenCalled();
  });

  it('跳转完成前不重复跳转，完成后可再次跳转', async () => {
    const openConsentGate = await loadGate();
    onPage('pages/index/index');

    openConsentGate();
    openConsentGate();

    expect(reLaunch).toHaveBeenCalledTimes(1);

    reLaunch.mock.calls[0][0].complete();
    openConsentGate();

    expect(reLaunch).toHaveBeenCalledTimes(2);
  });
});
