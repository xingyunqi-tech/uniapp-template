import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import UList from '@/components/UList/index.vue';
import UButton from '@/components/UButton/index.vue';

const global = {
  stubs: {
    ULoadMore: { props: ['status'], template: '<div class="load-more">{{ status }}</div>' },
    UEmpty: { props: ['text', 'type', 'icon'], template: '<div class="empty">{{ text }}<slot /></div>' },
  },
  components: { UButton },
};

describe('UList', () => {
  it('列表为空且加载中时只显示加载状态', () => {
    const wrapper = mount(UList, { props: { empty: true, loading: true }, global });

    expect(wrapper.find('.load-more').text()).toBe('loading');
    expect(wrapper.find('.empty').exists()).toBe(false);
  });

  it('列表为空且加载失败时显示错误与重试，点击重试触发 retry', async () => {
    const wrapper = mount(UList, { props: { empty: true, error: true, errorText: '加载失败' }, global });

    expect(wrapper.find('.empty').text()).toContain('加载失败');
    await wrapper.find('.u-button').trigger('click');
    expect(wrapper.emitted('retry')).toHaveLength(1);
  });

  it('列表为空时优先显示 empty 插槽', () => {
    const wrapper = mount(UList, { props: { empty: true }, slots: { empty: '<p class="custom">去逛逛</p>' }, global });

    expect(wrapper.find('.custom').exists()).toBe(true);
    expect(wrapper.find('.empty').exists()).toBe(false);
  });

  it('列表为空时显示默认空状态文字', () => {
    const wrapper = mount(UList, { props: { empty: true, emptyText: '暂无订单' }, global });

    expect(wrapper.find('.empty').text()).toBe('暂无订单');
  });

  it.each([
    [{ loading: true }, 'loading'],
    [{ finished: true }, 'nomore'],
    [{}, 'loadmore'],
  ])('有数据时底部状态 %o → %s', (props, status) => {
    const wrapper = mount(UList, { props: { empty: false, ...props }, slots: { default: '<p>项</p>' }, global });

    expect(wrapper.text()).toContain('项');
    expect(wrapper.find('.load-more').text()).toBe(status);
  });

  it('有数据时加载失败显示底部重试，点击触发 retry', async () => {
    const wrapper = mount(UList, { props: { empty: false, error: true }, slots: { default: '<p>项</p>' }, global });

    await wrapper.find('.u-list__footer-error').trigger('click');

    expect(wrapper.find('.load-more').exists()).toBe(false);
    expect(wrapper.emitted('retry')).toHaveLength(1);
  });
});
