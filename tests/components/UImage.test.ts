import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import UImage from '@/components/UImage/index.vue';

const global = { stubs: { 'uni-icons': true } };

describe('UImage', () => {
  it('高度自适应时，加载中为容器撑开高度，加载完成后取消', async () => {
    const wrapper = mount(UImage, { props: { src: '/static/a.png' }, global });

    expect(wrapper.classes()).toContain('u-image--state');

    await wrapper.find('.u-image__img').trigger('load');

    expect(wrapper.classes()).not.toContain('u-image--state');
  });

  it('高度自适应时，加载失败为容器撑开高度并显示失败提示', async () => {
    const wrapper = mount(UImage, { props: { src: '/static/a.png' }, global });

    await wrapper.find('.u-image__img').trigger('error');

    expect(wrapper.classes()).toContain('u-image--state');
    expect(wrapper.find('.u-image__error').exists()).toBe(true);
  });

  it('高度自适应且宽度固定时，加载中占位为正方形', () => {
    const wrapper = mount(UImage, { props: { src: '/static/a.png', width: '80px' }, global });

    expect(wrapper.attributes('style')).toContain('min-height: 80px');
  });

  it('宽度为百分比时，加载中不按宽度设置占位高度', () => {
    const wrapper = mount(UImage, { props: { src: '/static/a.png' }, global });

    expect(wrapper.attributes('style') ?? '').not.toContain('min-height');
  });

  it('指定高度时不额外撑开', () => {
    const wrapper = mount(UImage, { props: { src: '/static/a.png', width: 160, height: 160 }, global });

    expect(wrapper.classes()).not.toContain('u-image--state');
  });
});
