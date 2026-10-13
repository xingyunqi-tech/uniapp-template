import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { safeBack } from '@/utils/router';
import { PAGES } from '@/constants/pages';

type RouteOptions = { url?: string; delta?: number; success?: () => void };

const getCurrentPagesMock = getCurrentPages as unknown as Mock;
const uniMock = uni as unknown as Record<string, Mock>;

function onStack(length: number) {
  getCurrentPagesMock.mockReturnValue(Array.from({ length }, () => ({})));
}

describe('safeBack', () => {
  beforeEach(() => {
    for (const method of ['navigateBack', 'switchTab', 'redirectTo']) {
      uniMock[method] = vi.fn((options: RouteOptions) => options.success?.());
    }
  });

  afterEach(() => {
    getCurrentPagesMock.mockReset().mockReturnValue([]);
  });

  it('有上一页时返回上一页', async () => {
    onStack(2);

    await safeBack(PAGES.ADDRESS);

    expect(uniMock.navigateBack).toHaveBeenCalledWith(expect.objectContaining({ delta: 1 }));
    expect(uniMock.redirectTo).not.toHaveBeenCalled();
  });

  it('无上一页且兜底页为普通页面时重定向到兜底页', async () => {
    onStack(1);

    await safeBack(PAGES.ADDRESS);

    expect(uniMock.navigateBack).not.toHaveBeenCalled();
    expect(uniMock.redirectTo).toHaveBeenCalledWith(expect.objectContaining({ url: PAGES.ADDRESS }));
  });

  it('无上一页且兜底页为 TabBar 页时切换到该 Tab', async () => {
    onStack(1);

    await safeBack(PAGES.MINE);

    expect(uniMock.switchTab).toHaveBeenCalledWith(expect.objectContaining({ url: PAGES.MINE }));
  });

  it('页面栈深度不足 delta 时打开兜底页', async () => {
    onStack(2);

    await safeBack(PAGES.HOME, 2);

    expect(uniMock.navigateBack).not.toHaveBeenCalled();
    expect(uniMock.switchTab).toHaveBeenCalledWith(expect.objectContaining({ url: PAGES.HOME }));
  });
});
