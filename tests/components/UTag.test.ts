import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import UTag from '@/components/UTag/index.vue';

const global = { stubs: { 'uni-icons': { props: ['type'], template: '<i class="icon" :data-type="type" />' } } };

describe('UTag', () => {
  it('按类型与尺寸添加样式类并渲染文字', () => {
    const wrapper = mount(UTag, {
      props: { text: '热卖', type: 'error', size: 'small', plain: true, round: true },
      global,
    });

    expect(wrapper.classes()).toEqual(
      expect.arrayContaining(['u-tag--error', 'u-tag--small', 'u-tag--plain', 'u-tag--round']),
    );
    expect(wrapper.find('.u-tag__text').text()).toBe('热卖');
  });

  it('默认插槽优先于 text', () => {
    const wrapper = mount(UTag, { props: { text: '文字' }, slots: { default: '插槽' }, global });

    expect(wrapper.find('.u-tag__text').text()).toBe('插槽');
  });

  it('默认插槽可放入非文本节点', () => {
    const wrapper = mount(UTag, { slots: { default: '<image class="slot-img" /><text>VIP</text>' }, global });
    const content = wrapper.find('.u-tag__text');

    expect(content.element.tagName.toLowerCase()).not.toBe('text');
    expect(content.find('.slot-img').exists()).toBe(true);
    expect(content.text()).toBe('VIP');
  });

  it('传入 icon 时渲染左侧图标', () => {
    const plain = mount(UTag, { global });
    const withIcon = mount(UTag, { props: { icon: 'star' }, global });

    expect(plain.find('.u-tag__icon').exists()).toBe(false);
    expect(withIcon.find('.u-tag__icon .icon').attributes('data-type')).toBe('star');
  });

  it('自定义颜色：实心设置背景色，镂空设置边框色', () => {
    const solid = mount(UTag, { props: { color: 'red', bgColor: 'blue' }, global });
    const plain = mount(UTag, { props: { color: 'red', bgColor: 'blue', plain: true }, global });

    expect(solid.attributes('style')).toContain('color: red');
    expect(solid.attributes('style')).toContain('background-color: blue');
    expect(plain.attributes('style')).toContain('border-color: red');
    expect(plain.attributes('style')).not.toContain('background-color');
  });

  it('点击标签触发 click', async () => {
    const wrapper = mount(UTag, { global });

    await wrapper.trigger('click');

    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('点击关闭按钮只触发 close', async () => {
    const wrapper = mount(UTag, { props: { closeable: true }, global });

    await wrapper.find('.u-tag__close').trigger('click');

    expect(wrapper.classes()).toContain('u-tag--closeable');
    expect(wrapper.emitted('close')).toHaveLength(1);
    expect(wrapper.emitted('click')).toBeUndefined();
  });
});
