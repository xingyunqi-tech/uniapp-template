import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PAGES, PaymentStatus } from '@/constants';

const calls: string[] = [];

const requestSubscribe = vi.hoisted(() => vi.fn());
const wechatPay = vi.hoisted(() => vi.fn());
const alipayMiniPay = vi.hoisted(() => vi.fn());
const alipayPay = vi.hoisted(() => vi.fn());
const alertModal = vi.hoisted(() => vi.fn());

vi.mock('@/utils/subscribe', () => ({ requestSubscribe }));
vi.mock('@/utils/wechat-pay', () => ({ pay: wechatPay }));
vi.mock('@/utils/alipay-pay', () => ({ createMiniProgramPayment: alipayMiniPay, pay: alipayPay }));
vi.mock('@/utils/modal', () => ({ alert: alertModal }));

const { usePayment, payOnWechat, payOnAlipayMini, payOnH5, getPaymentSubject } =
  await import('@/composables/usePayment');

const order = { id: '12', orderNo: 'ORD1' };

beforeEach(() => {
  calls.length = 0;
  requestSubscribe.mockReset().mockImplementation(() => {
    calls.push('subscribe');
    return Promise.resolve([]);
  });
  wechatPay.mockReset().mockImplementation(() => {
    calls.push('pay');
    return Promise.resolve({ success: true, message: '支付成功', status: PaymentStatus.SUCCESS });
  });
  alipayMiniPay.mockReset();
  alipayPay.mockReset();
  vi.mocked(uni.redirectTo).mockClear();
  vi.mocked(uni.showToast).mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getPaymentSubject', () => {
  it('同一订单号生成相同的支付标题', () => {
    expect(getPaymentSubject('ORD1')).toBe('订单 ORD1');
  });
});

describe('payOnWechat', () => {
  it('先申请订阅消息授权再发起支付', async () => {
    await expect(payOnWechat(order)).resolves.toEqual({ status: PaymentStatus.SUCCESS, message: '支付成功' });

    expect(calls).toEqual(['subscribe', 'pay']);
    expect(requestSubscribe).toHaveBeenCalledWith(['orderPaid']);
    expect(wechatPay).toHaveBeenCalledWith({ outTradeNo: 'ORD1', description: '订单 ORD1' });
  });

  it('订阅授权同步发起，不等待其它异步操作', () => {
    void payOnWechat(order);

    expect(requestSubscribe).toHaveBeenCalledTimes(1);
  });

  it('支付结果没有状态时按 success 判断', async () => {
    wechatPay.mockResolvedValue({ success: false, message: '支付失败' });

    await expect(payOnWechat(order)).resolves.toEqual({ status: PaymentStatus.FAILED, message: '支付失败' });
  });
});

describe('payOnAlipayMini', () => {
  it('透传支付宝小程序支付的状态', async () => {
    alipayMiniPay.mockResolvedValue({ success: false, message: '已取消支付', status: PaymentStatus.CANCELLED });

    await expect(payOnAlipayMini(order)).resolves.toEqual({
      status: PaymentStatus.CANCELLED,
      message: '已取消支付',
    });
    expect(alipayMiniPay).toHaveBeenCalledWith({ outTradeNo: 'ORD1', subject: '订单 ORD1' });
  });
});

describe('payOnH5', () => {
  it('表单提交成功时标记为已跳转', async () => {
    alipayPay.mockResolvedValue({ success: true, message: '正在跳转支付宝...' });

    await expect(payOnH5(order)).resolves.toMatchObject({ status: PaymentStatus.PROCESSING, redirected: true });
  });

  it('表单提交失败时返回失败', async () => {
    alipayPay.mockResolvedValue({ success: false, message: '创建支付订单失败' });

    await expect(payOnH5(order)).resolves.toEqual({ status: PaymentStatus.FAILED, message: '创建支付订单失败' });
  });

  it('微信内置浏览器中弹窗提示到浏览器打开，不发起支付', async () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 MicroMessenger/8.0');

    await expect(payOnH5(order)).resolves.toMatchObject({ status: PaymentStatus.FAILED, notified: true });
    expect(alipayPay).not.toHaveBeenCalled();
    expect(alertModal).toHaveBeenCalledTimes(1);
  });
});

describe('usePayment', () => {
  it('支付进行中时忽略重复调用，且不跳转结果页', async () => {
    const { pay, paying, handlePayResult } = usePayment();

    const first = pay(order);
    expect(paying.value).toBe(true);
    const second = await pay(order);
    handlePayResult(second, order.id);
    await first;

    expect(second).toMatchObject({ ignored: true });
    expect(uni.redirectTo).not.toHaveBeenCalled();
    expect(wechatPay).toHaveBeenCalledTimes(1);
    expect(paying.value).toBe(false);
  });

  it('支付过程抛错时返回失败并解除锁定', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    wechatPay.mockRejectedValue(new Error('network'));
    const { pay, paying } = usePayment();

    await expect(pay(order)).resolves.toEqual({ status: PaymentStatus.FAILED, message: '支付失败' });
    expect(paying.value).toBe(false);
  });

  it.each([PaymentStatus.SUCCESS, PaymentStatus.PROCESSING])('结果为 %s 时进入支付结果页', status => {
    const { handlePayResult } = usePayment();

    handlePayResult({ status, message: '' }, '12');

    expect(uni.redirectTo).toHaveBeenCalledWith({ url: `${PAGES.PAYMENT_RESULT}?orderId=12` });
  });

  it('取消或失败时提示且留在当前页', () => {
    const { handlePayResult } = usePayment();

    handlePayResult({ status: PaymentStatus.CANCELLED, message: '已取消支付' }, '12');

    expect(uni.showToast).toHaveBeenCalledWith({ title: '已取消支付', icon: 'none' });
    expect(uni.redirectTo).not.toHaveBeenCalled();
  });

  it('已跳转到支付平台时不做处理', () => {
    const { handlePayResult } = usePayment();

    handlePayResult({ status: PaymentStatus.PROCESSING, message: '', redirected: true }, '12');

    expect(uni.redirectTo).not.toHaveBeenCalled();
    expect(uni.showToast).not.toHaveBeenCalled();
  });

  it('已弹窗说明时不再提示', () => {
    const { handlePayResult } = usePayment();

    handlePayResult({ status: PaymentStatus.FAILED, message: '', notified: true }, '12');

    expect(uni.redirectTo).not.toHaveBeenCalled();
    expect(uni.showToast).not.toHaveBeenCalled();
  });
});
