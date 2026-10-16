import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PaymentStatus } from '@/constants';

const createJsapi = vi.hoisted(() => vi.fn());

vi.mock('@/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@/api')>()),
  wechatPayControllerCreateJsapiPaymentV1: createJsapi,
}));

const { createJsapiPayment } = await import('@/utils/wechat-pay');

const params = { outTradeNo: 'ORD1', description: '订单 ORD1' };
const paymentData = { timeStamp: '1', nonceStr: 'N', package: 'prepay_id=P', signType: 'RSA', paySign: 'S' };

beforeEach(() => {
  createJsapi.mockReset().mockResolvedValue(paymentData);
  vi.mocked(uni).login = vi.fn(({ success }) => success({ code: 'LOGIN1' })) as never;
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('createJsapiPayment', () => {
  it('用登录 code 下单并用返回的参数拉起微信支付', async () => {
    vi.mocked(uni).requestPayment = vi.fn(({ success }) => success({})) as never;

    await expect(createJsapiPayment(params)).resolves.toMatchObject({ success: true, status: PaymentStatus.SUCCESS });
    expect(createJsapi).toHaveBeenCalledWith({ ...params, code: 'LOGIN1' }, { showError: false });
    expect(uni.requestPayment).toHaveBeenCalledWith(expect.objectContaining({ provider: 'wxpay', ...paymentData }));
  });

  it('用户取消时返回已取消', async () => {
    vi.mocked(uni).requestPayment = vi.fn(({ fail }) => fail({ errMsg: 'requestPayment:fail cancel' })) as never;

    await expect(createJsapiPayment(params)).resolves.toMatchObject({
      success: false,
      message: '已取消支付',
      status: PaymentStatus.CANCELLED,
    });
  });

  it('收银台返回非取消的失败时以订单状态为准', async () => {
    vi.mocked(uni).requestPayment = vi.fn(({ fail }) => fail({ errMsg: 'requestPayment:fail' })) as never;

    await expect(createJsapiPayment(params)).resolves.toMatchObject({ status: PaymentStatus.PROCESSING });
  });

  it('下单失败时不拉起支付', async () => {
    createJsapi.mockRejectedValue(new Error('422'));
    vi.mocked(uni).requestPayment = vi.fn() as never;

    await expect(createJsapiPayment(params)).resolves.toMatchObject({ success: false });
    expect(uni.requestPayment).not.toHaveBeenCalled();
  });
});
