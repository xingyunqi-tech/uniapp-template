import { beforeEach, describe, expect, it, vi } from 'vitest';
import { forceHideLoading, hideLoading, showLoading, useLoading, withLoading } from '@/composables/useLoading';

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>(res => {
    resolve = res;
  });
  return { promise, resolve };
}

describe('useLoading', () => {
  beforeEach(() => {
    forceHideLoading();
    vi.mocked(uni.showLoading).mockClear();
    vi.mocked(uni.hideLoading).mockClear();
  });

  it('原生调用之后的非原生调用结束时，原生 Loading 保持显示', () => {
    showLoading('原生');
    showLoading({ text: '自定义', useNative: false });

    hideLoading();
    expect(uni.hideLoading).not.toHaveBeenCalled();

    hideLoading();
    expect(uni.hideLoading).toHaveBeenCalledTimes(1);
    expect(useLoading().visible.value).toBe(false);
  });

  it('原生调用结束后仅剩非原生调用时关闭原生 Loading', async () => {
    const native = deferred();
    const custom = deferred();
    const first = withLoading(() => native.promise, '原生');
    const second = withLoading(() => custom.promise, { text: '自定义', useNative: false });

    native.resolve();
    await first;
    expect(uni.hideLoading).toHaveBeenCalledTimes(1);
    expect(useLoading().visible.value).toBe(true);
    expect(useLoading().text.value).toBe('自定义');

    custom.resolve();
    await second;
    expect(uni.hideLoading).toHaveBeenCalledTimes(1);
    expect(useLoading().visible.value).toBe(false);
  });

  it('全部为非原生调用时不调用原生 API', () => {
    showLoading({ useNative: false });
    hideLoading();

    expect(uni.showLoading).not.toHaveBeenCalled();
    expect(uni.hideLoading).not.toHaveBeenCalled();
  });

  it('hideLoading 不移除进行中的 withLoading', async () => {
    const task = deferred();
    showLoading('手动');
    const pending = withLoading(() => task.promise, '包装');

    hideLoading();
    expect(useLoading().visible.value).toBe(true);
    expect(useLoading().text.value).toBe('包装');

    task.resolve();
    await pending;
    expect(useLoading().visible.value).toBe(false);
    expect(uni.hideLoading).toHaveBeenCalledTimes(1);
  });
});
