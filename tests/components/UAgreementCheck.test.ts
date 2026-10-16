import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import UAgreementCheck from '@/components/UAgreementCheck/index.vue';
import { PAGES } from '@/constants/pages';
import { navigateTo } from '@/utils/router';

vi.mock('@/utils/router', () => ({
  navigateTo: vi.fn(),
}));

const global = { stubs: { 'uni-icons': true } };

beforeEach(() => {
  vi.mocked(navigateTo).mockClear();
});

describe('UAgreementCheck', () => {
  it('已同意时显示勾选状态', () => {
    const wrapper = mount(UAgreementCheck, { props: { modelValue: true }, global });

    expect(wrapper.find('.u-agreement-check__box').classes()).toContain('checked');
    expect(wrapper.find('uni-icons-stub').exists()).toBe(true);
  });

  it('未同意时不显示勾选', () => {
    const wrapper = mount(UAgreementCheck, { props: { modelValue: false }, global });

    expect(wrapper.find('.u-agreement-check__box').classes()).not.toContain('checked');
    expect(wrapper.find('uni-icons-stub').exists()).toBe(false);
  });

  it('点击勾选框或文案时切换绑定值', async () => {
    const wrapper = mount(UAgreementCheck, { props: { modelValue: false }, global });

    await wrapper.find('.u-agreement-check__box').trigger('click');
    await wrapper.find('.u-agreement-check__text').trigger('click');

    expect(wrapper.emitted('update:modelValue')).toEqual([[true], [true]]);
  });

  it('显示自定义前缀文案', () => {
    const wrapper = mount(UAgreementCheck, { props: { modelValue: false, prefix: '登录即代表同意' }, global });

    expect(wrapper.find('.u-agreement-check__text').text()).toContain('登录即代表同意');
  });

  it('点击协议链接跳转对应协议页且不切换勾选', async () => {
    const wrapper = mount(UAgreementCheck, { props: { modelValue: false }, global });
    const links = wrapper.findAll('.u-agreement-check__link');

    await links[0].trigger('click');
    await links[1].trigger('click');

    expect(navigateTo).toHaveBeenNthCalledWith(1, PAGES.AGREEMENT, { type: 'user' });
    expect(navigateTo).toHaveBeenNthCalledWith(2, PAGES.AGREEMENT, { type: 'privacy' });
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });
});
