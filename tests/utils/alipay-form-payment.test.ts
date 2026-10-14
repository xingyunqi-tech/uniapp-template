import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const createMobilePaymentApi = vi.hoisted(() => vi.fn());
const createWebPaymentApi = vi.hoisted(() => vi.fn());

vi.mock('@/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@/api')>()),
  alipayControllerCreateMobilePaymentV1: createMobilePaymentApi,
  alipayControllerCreateWebPaymentV1: createWebPaymentApi,
}));

const { createMobilePayment, createWebPayment } = await import('@/utils/alipay-pay');

const params = { outTradeNo: 'ORD1', subject: '测试订单' };
const formHtml = '<form action="https://openapi.alipay.com/gateway.do" method="POST"></form>';

let submit: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  submit = vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe.each([
  ['createMobilePayment', createMobilePayment, createMobilePaymentApi],
  ['createWebPayment', createWebPayment, createWebPaymentApi],
] as const)('%s', (_name, pay, api) => {
  it('提交接口返回的支付表单', async () => {
    api.mockResolvedValue({ form: formHtml });

    await expect(pay(params)).resolves.toMatchObject({ success: true, outTradeNo: 'ORD1' });
    expect(api).toHaveBeenCalledWith(params);
    expect(submit).toHaveBeenCalledTimes(1);
  });

  it('返回内容不含表单时提示解析失败', async () => {
    api.mockResolvedValue({ form: '<div></div>' });

    await expect(pay(params)).resolves.toMatchObject({ success: false, message: '支付表单解析失败' });
    expect(submit).not.toHaveBeenCalled();
  });
});
