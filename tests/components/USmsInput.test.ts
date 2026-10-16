import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import USmsInput from '@/components/USmsInput/index.vue';

const global = { stubs: { 'uni-easyinput': true } };

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('USmsInput', () => {
  it('点击发送按钮触发 send，默认不自动开始倒计时', async () => {
    const wrapper = mount(USmsInput, { props: { modelValue: '' }, global });

    await wrapper.find('.u-sms-btn').trigger('click');

    expect(wrapper.emitted('send')).toHaveLength(1);
    expect(wrapper.find('.u-sms-btn').text()).toBe('获取验证码');
  });

  it('autoStart 时点击后开始倒计时并禁用按钮，结束后恢复', async () => {
    const wrapper = mount(USmsInput, { props: { modelValue: '', autoStart: true, countdownSeconds: 3 }, global });
    const button = () => wrapper.find('.u-sms-btn');

    await button().trigger('click');
    expect(button().text()).toBe('3s');
    expect(button().attributes('disabled')).toBeDefined();

    await button().trigger('click');
    expect(wrapper.emitted('send')).toHaveLength(1);

    vi.advanceTimersByTime(3000);
    await wrapper.vm.$nextTick();
    expect(button().text()).toBe('获取验证码');
  });

  it('传入外部倒计时时按外部状态显示', () => {
    const wrapper = mount(USmsInput, {
      props: { modelValue: '', countdown: 42, isCounting: true, countdownTemplate: '{s} 秒后重发' },
      global,
    });

    expect(wrapper.find('.u-sms-btn').text()).toBe('42 秒后重发');
    expect(wrapper.find('.u-sms-btn').attributes('disabled')).toBeDefined();
  });

  it('只传外部 countdown 时按秒数大于 0 判断倒计时', async () => {
    const wrapper = mount(USmsInput, { props: { modelValue: '', countdown: 10 }, global });
    const button = () => wrapper.find('.u-sms-btn');

    expect(button().text()).toBe('10s');
    expect(button().attributes('disabled')).toBeDefined();

    await wrapper.setProps({ countdown: 0 });

    expect(button().text()).toBe('获取验证码');
  });

  it('暴露的倒计时状态与外部传入值一致', () => {
    const wrapper = mount(USmsInput, { props: { modelValue: '', countdown: 42, isCounting: true }, global });
    const exposed = wrapper.vm as unknown as { isCounting: boolean; countdown: number };

    expect(exposed.isCounting).toBe(true);
    expect(exposed.countdown).toBe(42);
  });

  it('受控模式下 autoStart 与 startCountdown 不启动内部倒计时', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const wrapper = mount(USmsInput, { props: { modelValue: '', countdown: 0, autoStart: true }, global });

    await wrapper.find('.u-sms-btn').trigger('click');
    (wrapper.vm as unknown as { startCountdown: () => void }).startCountdown();
    await wrapper.setProps({ countdown: undefined });

    expect(wrapper.find('.u-sms-btn').text()).toBe('获取验证码');
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });

  it('禁用时点击不触发 send', async () => {
    const wrapper = mount(USmsInput, { props: { modelValue: '', disabled: true }, global });

    await wrapper.find('.u-sms-btn').trigger('click');

    expect(wrapper.emitted('send')).toBeUndefined();
  });
});
