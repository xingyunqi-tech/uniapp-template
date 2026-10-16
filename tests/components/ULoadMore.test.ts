import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import ULoadMore from '@/components/ULoadMore/index.vue';

describe('ULoadMore', () => {
  it('默认显示加载更多文案', () => {
    const wrapper = mount(ULoadMore);

    expect(wrapper.find('.u-load-more__text').text()).toBe('上拉加载更多');
    expect(wrapper.find('.u-load-more__spinner').exists()).toBe(false);
  });

  it('加载中显示旋转图标与加载文案', () => {
    const wrapper = mount(ULoadMore, { props: { status: 'loading', loadingText: '努力加载中' } });

    expect(wrapper.find('.u-load-more__spinner').exists()).toBe(true);
    expect(wrapper.find('.u-load-more__text').text()).toBe('努力加载中');
  });

  it('没有更多时显示对应文案', () => {
    const wrapper = mount(ULoadMore, { props: { status: 'nomore', nomoreText: '到底了' } });

    expect(wrapper.find('.u-load-more__text').text()).toBe('到底了');
    expect(wrapper.find('.u-load-more__line').exists()).toBe(false);
  });

  it('没有更多且开启 showLine 时两侧显示分割线', () => {
    const wrapper = mount(ULoadMore, { props: { status: 'nomore', showLine: true } });

    expect(wrapper.classes()).toContain('u-load-more--line');
    expect(wrapper.findAll('.u-load-more__line')).toHaveLength(2);
  });

  it('非没有更多状态下 showLine 不渲染分割线', () => {
    const wrapper = mount(ULoadMore, { props: { status: 'loadmore', showLine: true } });

    expect(wrapper.find('.u-load-more__line').exists()).toBe(false);
  });

  it('开启 virtualHost，父组件 class 合并到根节点', () => {
    const wrapper = mount(ULoadMore, { attrs: { class: 'footer' } });

    expect((ULoadMore as { options?: Record<string, unknown> }).options).toMatchObject({ virtualHost: true });
    expect(wrapper.classes()).toEqual(expect.arrayContaining(['u-load-more', 'footer']));
  });
});
