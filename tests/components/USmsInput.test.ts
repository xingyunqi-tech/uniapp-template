import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent } from 'vue';
import { mount } from '@vue/test-utils';
import USmsInput from '@/components/USmsInput/index.vue';
import UInput from '@/components/UInput/index.vue';

vi.mock('@/store/modules/global', () => ({
  useGlobalStore: () => ({ primaryColor: '#1989fa' }),
}));

const EasyinputStub = defineComponent({
  name: 'UniEasyinput',
  props: {
    placeholder: { type: String, default: '' },
    placeholderStyle: { type: String, default: '' },
    prefixIcon: { type: String, default: '' },
    styles: { type: Object, default: () => ({}) },
    primaryColor: { type: String, default: '' },
  },
  template: '<div />',
});

const global = { stubs: { 'uni-easyinput': EasyinputStub }, components: { UInput } };

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

  it('输入框颜色使用主题变量，主色跟随当前主题', () => {
    const input = mount(USmsInput, { props: { modelValue: '' }, global }).findComponent(EasyinputStub);

    expect(input.props('styles')).toEqual({
      color: 'var(--color-text)',
      backgroundColor: 'var(--color-bg)',
      disableColor: 'var(--color-bg-grey)',
      borderColor: 'var(--color-border)',
    });
    expect(input.props('placeholderStyle')).toBe('color: var(--color-text-placeholder)');
    expect(input.props('primaryColor')).toBe('#1989fa');
  });

  it('占位文字与前缀图标可配置，默认为请输入验证码与 email', async () => {
    const wrapper = mount(USmsInput, { props: { modelValue: '' }, global });
    const input = () => wrapper.findComponent(EasyinputStub);

    expect(input().props('placeholder')).toBe('请输入验证码');
    expect(input().props('prefixIcon')).toBe('email');

    await wrapper.setProps({ placeholder: '短信验证码', prefixIcon: '' });

    expect(input().props('placeholder')).toBe('短信验证码');
    expect(input().props('prefixIcon')).toBe('');
  });

  it('禁用时点击不触发 send', async () => {
    const wrapper = mount(USmsInput, { props: { modelValue: '', disabled: true }, global });

    await wrapper.find('.u-sms-btn').trigger('click');

    expect(wrapper.emitted('send')).toBeUndefined();
  });
});
