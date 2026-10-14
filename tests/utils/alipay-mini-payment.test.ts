import { beforeEach, describe, expect, it, vi } from 'vitest';

const createMiniPayment = vi.hoisted(() => vi.fn());

vi.mock('@/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@/api')>()),
  alipayControllerCreateMiniPaymentV1: createMiniPayment,
}));

const { createMiniProgramPayment } = await import('@/utils/alipay-pay');

const params = { outTradeNo: 'ORD1', subject: '测试订单' };

function mockTradePay(resultCode: string) {
  vi.mocked(uni).requestPayment = vi.fn(() => Promise.resolve({ resultCode })) as never;
}

beforeEach(() => {
  createMiniPayment.mockReset().mockResolvedValue({ tradeNo: 'T1' });
  vi.mocked(uni).login = vi.fn(({ success }) => success({ code: 'AUTH1' })) as never;
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('createMiniProgramPayment', () => {
  it('用授权码下单并以交易号拉起收银台', async () => {
    mockTradePay('9000');

    await expect(createMiniProgramPayment(params)).resolves.toEqual({
      success: true,
      message: '支付成功',
      outTradeNo: 'ORD1',
    });
    expect(createMiniPayment).toHaveBeenCalledWith({ ...params, authCode: 'AUTH1' });
    expect(uni.requestPayment).toHaveBeenCalledWith({ provider: 'alipay', orderInfo: 'T1' });
  });

  it('用户取消支付时返回已取消', async () => {
    mockTradePay('6001');

    await expect(createMiniProgramPayment(params)).resolves.toMatchObject({ success: false, message: '已取消支付' });
  });

  it('支付结果未知时提示以订单状态为准', async () => {
    mockTradePay('8000');

    await expect(createMiniProgramPayment(params)).resolves.toMatchObject({
      success: false,
      message: '支付结果确认中，请稍后在订单中查看',
    });
  });

  it('结果码为数字时按相同规则处理', async () => {
    vi.mocked(uni).requestPayment = vi.fn(() => Promise.resolve({ resultCode: 9000 })) as never;

    await expect(createMiniProgramPayment(params)).resolves.toMatchObject({ success: true });
  });

  it('处理中结果码 6004 提示以订单状态为准', async () => {
    mockTradePay('6004');

    await expect(createMiniProgramPayment(params)).resolves.toMatchObject({
      success: false,
      message: '支付结果确认中，请稍后在订单中查看',
    });
  });

  it('其它结果码返回支付失败', async () => {
    mockTradePay('4000');

    await expect(createMiniProgramPayment(params)).resolves.toMatchObject({ success: false, message: '支付失败' });
  });

  it('拉起收银台失败时返回支付失败', async () => {
    vi.mocked(uni).requestPayment = vi.fn(() => Promise.reject(new Error('tradePay fail'))) as never;

    await expect(createMiniProgramPayment(params)).resolves.toMatchObject({ success: false, message: '支付失败' });
  });

  it('下单失败时返回失败且不拉起收银台', async () => {
    createMiniPayment.mockRejectedValue(new Error('422'));
    mockTradePay('9000');

    await expect(createMiniProgramPayment(params)).resolves.toMatchObject({ success: false, message: '支付失败' });
    expect(uni.requestPayment).not.toHaveBeenCalled();
  });

  it('获取授权码失败时返回失败', async () => {
    vi.mocked(uni).login = vi.fn(({ fail }) => fail({ errMsg: 'fail' })) as never;

    await expect(createMiniProgramPayment(params)).resolves.toMatchObject({ success: false });
    expect(createMiniPayment).not.toHaveBeenCalled();
  });
});
