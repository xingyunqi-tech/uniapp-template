import { afterEach, describe, expect, it, vi } from 'vitest';

async function loadSubscribe() {
  vi.resetModules();
  return import('@/utils/subscribe');
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.mocked(uni).requestSubscribeMessage = undefined as never;
});

describe('requestSubscribe', () => {
  it('申请已配置模板并返回用户同意的模板 ID', async () => {
    vi.stubEnv('VITE_WX_TMPL_ORDER_PAID', 'TPL_PAID');
    const requestSubscribeMessage = vi.fn(({ success }) => success({ errMsg: 'ok', TPL_PAID: 'accept' }));
    vi.mocked(uni).requestSubscribeMessage = requestSubscribeMessage as never;
    const { requestSubscribe } = await loadSubscribe();

    await expect(requestSubscribe(['orderPaid'])).resolves.toEqual(['TPL_PAID']);
    expect(requestSubscribeMessage).toHaveBeenCalledWith(expect.objectContaining({ tmplIds: ['TPL_PAID'] }));
  });

  it('用户拒绝时返回空数组', async () => {
    vi.stubEnv('VITE_WX_TMPL_ORDER_PAID', 'TPL_PAID');
    vi.mocked(uni).requestSubscribeMessage = vi.fn(({ success }) =>
      success({ errMsg: 'ok', TPL_PAID: 'reject' }),
    ) as never;
    const { requestSubscribe } = await loadSubscribe();

    await expect(requestSubscribe(['orderPaid'])).resolves.toEqual([]);
  });

  it('调用失败时不抛错', async () => {
    vi.stubEnv('VITE_WX_TMPL_ORDER_PAID', 'TPL_PAID');
    vi.mocked(uni).requestSubscribeMessage = vi.fn(({ fail }) => fail({ errMsg: 'fail' })) as never;
    const { requestSubscribe } = await loadSubscribe();

    await expect(requestSubscribe(['orderPaid'])).resolves.toEqual([]);
  });

  it('模板未配置时不发起申请', async () => {
    vi.stubEnv('VITE_WX_TMPL_ORDER_PAID', '');
    const requestSubscribeMessage = vi.fn();
    vi.mocked(uni).requestSubscribeMessage = requestSubscribeMessage as never;
    const { requestSubscribe } = await loadSubscribe();

    await expect(requestSubscribe(['orderPaid'])).resolves.toEqual([]);
    expect(requestSubscribeMessage).not.toHaveBeenCalled();
  });
});
