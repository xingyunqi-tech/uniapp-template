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

  it('未能拉起微信支付等非取消的失败时返回失败', async () => {
    vi.mocked(uni).requestPayment = vi.fn(({ fail }) => fail({ errMsg: 'requestPayment:fail not install' })) as never;

    await expect(createAppPayment(params)).resolves.toMatchObject({
      message: '支付失败，请稍后重试',
      status: PaymentStatus.FAILED,
    });
  });

  it('下单失败时返回接口错误信息、不拉起支付，请求不弹出错误提示', async () => {
    createApp.mockRejectedValue(new Error('订单已支付'));
    vi.mocked(uni).requestPayment = vi.fn() as never;

    await expect(createAppPayment(params)).resolves.toMatchObject({
      success: false,
      message: '订单已支付',
      status: PaymentStatus.FAILED,
    });
    expect(uni.requestPayment).not.toHaveBeenCalled();
    expect(createApp).toHaveBeenCalledWith(params, { showError: false });
  });
});
