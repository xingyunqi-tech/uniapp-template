import { afterEach, describe, expect, it, type Mock } from 'vitest';
import { isPreviousPage } from '@/utils/router';

const getCurrentPagesMock = getCurrentPages as unknown as Mock;

function onStack(...pages: { route: string; options?: Record<string, string> }[]) {
  getCurrentPagesMock.mockReturnValue(pages);
}

afterEach(() => {
  getCurrentPagesMock.mockReset().mockReturnValue([]);
});

describe('isPreviousPage', () => {
  it('上一页路径与参数相同时为 true', () => {
    onStack({ route: 'pages-sub/exam/trial/index', options: { subjectId: 's1' } }, { route: 'pages/login/index' });

    expect(isPreviousPage('/pages-sub/exam/trial/index?subjectId=s1')).toBe(true);
  });

  it('参数不同或路径不同时为 false', () => {
    onStack({ route: 'pages-sub/exam/trial/index', options: { subjectId: 's1' } }, { route: 'pages/login/index' });

    expect(isPreviousPage('/pages-sub/exam/trial/index?subjectId=s2')).toBe(false);
    expect(isPreviousPage('/pages-sub/exam/trial/index')).toBe(false);
    expect(isPreviousPage('/pages/index/index')).toBe(false);
  });

  it('没有上一页时为 false', () => {
    onStack({ route: 'pages/login/index' });

    expect(isPreviousPage('/pages/login/index')).toBe(false);
  });
});
