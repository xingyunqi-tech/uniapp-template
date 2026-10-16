import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import UBackTop from '@/components/UBackTop/index.vue';

const global = { stubs: { 'uni-icons': true } };

const pageScrollTo = vi.fn();

beforeEach(() => {
  pageScrollTo.mockClear();
  (uni as unknown as { pageScrollTo: typeof pageScrollTo }).pageScrollTo = pageScrollTo;
});

describe('UBackTop', () => {
  it('滚动距离未超过阈值时不显示', () => {
    const wrapper = mount(UBackTop, { props: { scrollTop: 400 }, global });

    expect(wrapper.find('.u-back-top').exists()).toBe(false);
  });

  it('滚动距离超过阈值时显示', async () => {
    const wrapper = mount(UBackTop, { props: { scrollTop: 0, threshold: 100 }, global });

    await wrapper.setProps({ scrollTop: 101 });

    expect(wrapper.find('.u-back-top').exists()).toBe(true);
  });

  it('点击时滚动页面到顶部并触发 click', async () => {
    const wrapper = mount(UBackTop, { props: { scrollTop: 800, duration: 200 }, global });

    await wrapper.find('.u-back-top').trigger('click');

    expect(pageScrollTo).toHaveBeenCalledWith({ scrollTop: 0, duration: 200 });
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('pageScroll 为 false 时只触发 click', async () => {
    const wrapper = mount(UBackTop, { props: { scrollTop: 800, pageScroll: false }, global });

    await wrapper.find('.u-back-top').trigger('click');

    expect(pageScrollTo).not.toHaveBeenCalled();
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('默认插槽替换图标', () => {
    const wrapper = mount(UBackTop, {
      props: { scrollTop: 800 },
      slots: { default: '<text class="custom">顶部</text>' },
      global,
    });

    expect(wrapper.find('.custom').text()).toBe('顶部');
  });
});
