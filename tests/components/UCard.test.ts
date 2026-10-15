import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import UCard from '@/components/UCard/index.vue';

describe('UCard', () => {
  it('没有标题与右侧内容时不渲染标题栏', () => {
    const wrapper = mount(UCard, { slots: { default: '内容' } });

    expect(wrapper.find('.u-card__header').exists()).toBe(false);
    expect(wrapper.text()).toBe('内容');
  });

  it('渲染标题与右侧文字', () => {
    const wrapper = mount(UCard, { props: { title: '金额明细', extra: '共 3 项' } });

    expect(wrapper.find('.u-card__title').text()).toBe('金额明细');
    expect(wrapper.find('.u-card__extra').text()).toBe('共 3 项');
  });

  it('extra 插槽优先于 extra 文字', () => {
    const wrapper = mount(UCard, { props: { title: '标题', extra: '文字' }, slots: { extra: '<i>插槽</i>' } });

    expect(wrapper.find('.u-card__extra').text()).toBe('插槽');
  });

  it('关闭内边距与阴影时添加对应样式类', () => {
    const wrapper = mount(UCard, { props: { padding: false, shadow: false } });

    expect(wrapper.classes()).toEqual(expect.arrayContaining(['u-card--flush', 'u-card--flat']));
  });

  it('点击时触发 click', async () => {
    const wrapper = mount(UCard);

    await wrapper.trigger('click');

    expect(wrapper.emitted('click')).toHaveLength(1);
  });
});
