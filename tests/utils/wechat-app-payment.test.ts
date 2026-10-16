import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PaymentStatus } from '@/constants';

const createApp = vi.hoisted(() => vi.fn());

vi.mock('@/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@/api')>()),
  wechatPayControllerCreateAppPaymentV1: createApp,
}));

const { createAppPayment } = await import('@/utils/wechat-pay');

const params = { outTradeNo: 'ORD1', description: '订单 ORD1' };

beforeEach(() => {
  createApp.mockReset().mockResolvedValue({ prepayid: 'P' });
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('createAppPayment', () => {
  it('支付成功时返回成功状态', async () => {
    vi.mocked(uni).requestPayment = vi.fn(({ success }) => success({})) as never;

    await expect(createAppPayment(params)).resolves.toMatchObject({ success: true, status: PaymentStatus.SUCCESS });
    expect(uni.requestPayment).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'wxpay', orderInfo: { prepayid: 'P' } }),
    );
  });

  it('用户取消时返回已取消', async () => {
    vi.mocked(uni).requestPayment = vi.fn(({ fail }) => fail({ errMsg: 'requestPayment:fail cancel' })) as never;

    await expect(createAppPayment(params)).resolves.toMatchObject({
      message: '已取消支付',
      status: PaymentStatus.CANCELLED,
    });
  });

  it('收银台返回非取消的失败时以订单状态为准', async () => {
    vi.mocked(uni).requestPayment = vi.fn(({ fail }) => fail({ errMsg: 'requestPayment:fail' })) as never;

    await expect(createAppPayment(params)).resolves.toMatchObject({ status: PaymentStatus.PROCESSING });
  });

  it('下单失败时返回失败状态且不拉起支付', async () => {
    createApp.mockRejectedValue(new Error('422'));
    vi.mocked(uni).requestPayment = vi.fn() as never;

    await expect(createAppPayment(params)).resolves.toMatchObject({ success: false, status: PaymentStatus.FAILED });
    expect(uni.requestPayment).not.toHaveBeenCalled();
  });
});
