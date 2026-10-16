import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import UPageState from '@/components/UPageState/index.vue';
import UButton from '@/components/UButton/index.vue';

const global = {
  stubs: {
    ULoading: {
      props: ['visible', 'fullscreen', 'text'],
      template: '<div class="loading" :data-fullscreen="String(fullscreen)">{{ text }}</div>',
    },
    UEmpty: {
      props: ['text', 'type', 'icon'],
      template: '<div class="empty" :data-type="type" :data-icon="icon">{{ text }}<slot /></div>',
    },
  },
  components: { UButton },
};

const content = { default: '<div class="content">内容</div>' };

describe('UPageState', () => {
  it('无状态时渲染默认插槽', () => {
    const wrapper = mount(UPageState, { slots: content, global });

    expect(wrapper.find('.content').exists()).toBe(true);
    expect(wrapper.find('.loading').exists()).toBe(false);
  });

  it('加载中显示局部 ULoading 并替换内容', () => {
    const wrapper = mount(UPageState, { props: { loading: true, loadingText: '加载中' }, slots: content, global });

    expect(wrapper.find('.loading').attributes('data-fullscreen')).toBe('false');
    expect(wrapper.find('.loading').text()).toBe('加载中');
    expect(wrapper.find('.content').exists()).toBe(false);
  });

  it('按 loading > error > empty 的优先级显示', async () => {
    const wrapper = mount(UPageState, { props: { loading: true, error: true, empty: true }, slots: content, global });
    expect(wrapper.find('.loading').exists()).toBe(true);

    await wrapper.setProps({ loading: false });
    expect(wrapper.find('.empty').text()).toContain('加载失败');

    await wrapper.setProps({ error: false });
    expect(wrapper.find('.empty').text()).toBe('暂无数据');
  });

  it('error 为字符串时作为错误文案，点击重试触发 retry', async () => {
    const wrapper = mount(UPageState, { props: { error: '订单加载失败' }, global });

    expect(wrapper.find('.empty').text()).toContain('订单加载失败');
    expect(wrapper.find('.empty').attributes('data-type')).toBe('network');
    await wrapper.find('.u-button').trigger('click');
    expect(wrapper.emitted('retry')).toHaveLength(1);
  });

  it('error 为空字符串时视为无错误', () => {
    const wrapper = mount(UPageState, { props: { error: '' }, slots: content, global });

    expect(wrapper.find('.content').exists()).toBe(true);
  });

  it('showRetry 为 false 时不显示重试按钮，error-action 插槽追加操作', () => {
    const plain = mount(UPageState, { props: { error: true, showRetry: false }, global });
    const withAction = mount(UPageState, {
      props: { error: true, showRetry: false },
      slots: { 'error-action': '<button class="back">返回</button>' },
      global,
    });

    expect(plain.find('.u-button').exists()).toBe(false);
    expect(plain.find('.u-page-state__actions').exists()).toBe(false);
    expect(withAction.find('.back').exists()).toBe(true);
    expect(withAction.find('.u-button').exists()).toBe(false);
  });

  it('空状态使用 emptyText / emptyType / emptyIcon', () => {
    const wrapper = mount(UPageState, {
      props: { empty: true, emptyText: '订单不存在', emptyType: 'search', emptyIcon: 'star' },
      global,
    });

    const empty = wrapper.find('.empty');
    expect(empty.text()).toBe('订单不存在');
    expect(empty.attributes('data-type')).toBe('search');
    expect(empty.attributes('data-icon')).toBe('star');
  });

  it('具名插槽替换对应状态的默认展示', async () => {
    const wrapper = mount(UPageState, {
      props: { loading: true },
      slots: {
        loading: '<div class="skeleton" />',
        error: '<div class="custom-error" />',
        empty: '<div class="custom-empty" />',
      },
      global,
    });
    expect(wrapper.find('.skeleton').exists()).toBe(true);

    await wrapper.setProps({ loading: false, error: true });
    expect(wrapper.find('.custom-error').exists()).toBe(true);

    await wrapper.setProps({ error: false, empty: true });
    expect(wrapper.find('.custom-empty').exists()).toBe(true);
    expect(wrapper.find('.empty').exists()).toBe(false);
  });

  it('keepContentOnLoading 时已展示过内容的刷新不切换为加载态', async () => {
    const wrapper = mount(UPageState, {
      props: { loading: true, keepContentOnLoading: true },
      slots: content,
      global,
    });
    expect(wrapper.find('.loading').exists()).toBe(true);

    await wrapper.setProps({ loading: false });
    await wrapper.setProps({ loading: true });
    expect(wrapper.find('.content').exists()).toBe(true);
    expect(wrapper.find('.loading').exists()).toBe(false);
  });

  it('keepContentOnLoading 时从错误态重新加载仍显示加载态', async () => {
    const wrapper = mount(UPageState, {
      props: { error: true, keepContentOnLoading: true },
      slots: content,
      global,
    });

    await wrapper.setProps({ error: false, loading: true });
    expect(wrapper.find('.loading').exists()).toBe(true);
  });

  it('未开启 keepContentOnLoading 时刷新替换内容', async () => {
    const wrapper = mount(UPageState, { slots: content, global });

    await wrapper.setProps({ loading: true });
    expect(wrapper.find('.content').exists()).toBe(false);
    expect(wrapper.find('.loading').exists()).toBe(true);
  });

  it('开启 virtualHost，fullHeight 与父组件 class 合并到根节点', () => {
    const wrapper = mount(UPageState, { props: { fullHeight: true }, attrs: { class: 'page-body' }, global });

    expect((UPageState as { options?: Record<string, unknown> }).options).toMatchObject({ virtualHost: true });
    expect(wrapper.classes()).toEqual(expect.arrayContaining(['u-page-state', 'u-page-state--full', 'page-body']));
  });
});
