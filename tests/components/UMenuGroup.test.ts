import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import UMenuGroup from '@/components/UMenuGroup/index.vue';

describe('UMenuGroup', () => {
  it('没有标题时不渲染标题', () => {
    const wrapper = mount(UMenuGroup);

    expect(wrapper.find('.u-menu-group__title').exists()).toBe(false);
  });

  it('渲染标题', () => {
    const wrapper = mount(UMenuGroup, { props: { title: '账号设置' } });

    expect(wrapper.find('.u-menu-group__title').text()).toBe('账号设置');
  });

  it('默认插槽渲染在列表容器内', () => {
    const wrapper = mount(UMenuGroup, { slots: { default: '<div class="item">菜单项</div>' } });

    expect(wrapper.find('.u-menu-group__list .item').text()).toBe('菜单项');
  });

  it('开启 virtualHost，父组件 class 合并到根节点', () => {
    const wrapper = mount(UMenuGroup, { attrs: { class: 'demo-section' } });

    expect((UMenuGroup as { options?: Record<string, unknown> }).options).toMatchObject({ virtualHost: true });
    expect(wrapper.classes()).toEqual(expect.arrayContaining(['u-menu-group', 'demo-section']));
  });
});
