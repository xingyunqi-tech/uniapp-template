import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { useSendSms } from '@/composables/useSendSms';

describe('useSendSms', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(uni.showToast).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('验证码必须为纯数字', () => {
    const { validateCode } = useSendSms();

    expect(validateCode('12a456')).toBe(false);
    expect(uni.showToast).toHaveBeenCalledWith(expect.objectContaining({ title: '验证码为6位数字' }));
    expect(validateCode('123456')).toBe(true);
  });

  it('手机号为空或格式错误时提示对应文案', () => {
    const { validatePhone, validateCode } = useSendSms();

    expect(validatePhone('')).toBe(false);
    expect(uni.showToast).toHaveBeenLastCalledWith({ title: '请输入手机号', icon: 'none' });
    expect(validatePhone('123')).toBe(false);
    expect(uni.showToast).toHaveBeenLastCalledWith({ title: '请输入正确的手机号', icon: 'none' });
    expect(validateCode('')).toBe(false);
    expect(uni.showToast).toHaveBeenLastCalledWith({ title: '请输入验证码', icon: 'none' });
    expect(validatePhone('13800000000')).toBe(true);
  });

  it('设置 scene 后重新进入页面恢复该手机号的剩余倒计时', async () => {
    const sendApi = vi.fn().mockResolvedValue(undefined);
    const first = useSendSms({ sendApi, scene: 'login' });
    await expect(first.send('13800000000')).resolves.toBe(true);

    vi.advanceTimersByTime(20_000);

    const phone = ref('13800000000');
    const second = useSendSms({ sendApi, scene: 'login', phone: () => phone.value });
    expect(second.isCounting.value).toBe(true);
    expect(second.countdown.value).toBe(40);

    await expect(second.send('13800000000')).resolves.toBe(false);
    expect(sendApi).toHaveBeenCalledTimes(1);
  });

  it('发送请求返回前离开页面，回到页面时仍恢复倒计时', async () => {
    let resolveSend: () => void = () => {};
    const sendApi = vi.fn(() => new Promise<void>(resolve => (resolveSend = resolve)));
    let sms!: ReturnType<typeof useSendSms>;
    const wrapper = mount(
      defineComponent({
        setup() {
          sms = useSendSms({ sendApi, scene: 'login' });
          return () => null;
        },
      }),
    );

    const pending = sms.send('13700000000');
    wrapper.unmount();
    resolveSend();
    await expect(pending).resolves.toBe(false);

    expect(useSendSms({ sendApi, scene: 'login', phone: () => '13700000000' }).isCounting.value).toBe(true);
  });

  it('不同场景或手机号不共享倒计时', async () => {
    const sendApi = vi.fn().mockResolvedValue(undefined);
    await useSendSms({ sendApi, scene: 'login' }).send('13800000000');

    expect(useSendSms({ sendApi, scene: 'register', phone: () => '13800000000' }).isCounting.value).toBe(false);
    expect(useSendSms({ sendApi, scene: 'login', phone: () => '13900000000' }).isCounting.value).toBe(false);
  });

  it('倒计时结束后不再恢复', async () => {
    const sendApi = vi.fn().mockResolvedValue(undefined);
    await useSendSms({ sendApi, scene: 'login' }).send('13800000000');

    vi.advanceTimersByTime(61_000);

    const next = useSendSms({ sendApi, scene: 'login', phone: () => '13800000000' });
    expect(next.isCounting.value).toBe(false);
    await expect(next.send('13800000000')).resolves.toBe(true);
  });

  it('未设置 scene 时不持久化', async () => {
    const sendApi = vi.fn().mockResolvedValue(undefined);
    await useSendSms({ sendApi }).send('13800000000');

    expect(useSendSms({ sendApi, phone: () => '13800000000' }).isCounting.value).toBe(false);
  });
});
