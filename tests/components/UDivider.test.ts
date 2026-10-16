import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import UDivider from '@/components/UDivider/index.vue';

describe('UDivider', () => {
  it('没有文字时只渲染一条线', () => {
    const wrapper = mount(UDivider);

    expect(wrapper.findAll('.u-divider__line')).toHaveLength(1);
    expect(wrapper.find('.u-divider__content').exists()).toBe(false);
  });

  it('有文字时文字两侧各一条线', () => {
    const wrapper = mount(UDivider, { props: { text: '没有更多了' } });

    expect(wrapper.findAll('.u-divider__line')).toHaveLength(2);
    expect(wrapper.find('.u-divider__text').text()).toBe('没有更多了');
  });

  it('默认插槽替代文字', () => {
    const wrapper = mount(UDivider, { slots: { default: '<i class="custom">自定义</i>' } });

    expect(wrapper.find('.custom').text()).toBe('自定义');
    expect(wrapper.find('.u-divider__text').exists()).toBe(false);
  });

  it('文字位置、虚线与外边距对应样式类', () => {
    const wrapper = mount(UDivider, { props: { text: '标题', align: 'left', dashed: true, margin: false } });

    expect(wrapper.classes()).toEqual(expect.arrayContaining(['u-divider--left', 'u-divider--dashed']));
    expect(wrapper.classes()).not.toContain('u-divider--margin');
  });
});
