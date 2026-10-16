import { describe, expect, it } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import UTabs, { type TabItem } from '@/components/UTabs/index.vue';

const tabs: TabItem[] = [
  { label: '全部', value: 'all' },
  { label: '待付款', value: 'unpaid', badge: 120 },
  { label: '已关闭', value: 'closed', disabled: true },
];

describe('UTabs', () => {
  it('当前值对应的标签高亮', () => {
    const wrapper = mount(UTabs, { props: { modelValue: 'unpaid', tabs } });
    const items = wrapper.findAll('.u-tabs__item');

    expect(items[1].classes()).toContain('u-tabs__item--active');
    expect(items[0].classes()).not.toContain('u-tabs__item--active');
  });

  it('角标超过 99 时显示 99+', () => {
    const wrapper = mount(UTabs, { props: { modelValue: 'all', tabs } });

    expect(wrapper.find('.u-tabs__badge').text()).toBe('99+');
  });

  it('点击标签时更新绑定值并触发 change', async () => {
    const wrapper = mount(UTabs, { props: { modelValue: 'all', tabs } });

    await wrapper.findAll('.u-tabs__item')[1].trigger('click');

    expect(wrapper.emitted('update:modelValue')).toEqual([['unpaid']]);
    expect(wrapper.emitted('change')).toEqual([[tabs[1]]]);
  });

  it('禁用的标签点击无效', async () => {
    const wrapper = mount(UTabs, { props: { modelValue: 'all', tabs } });

    await wrapper.findAll('.u-tabs__item')[2].trigger('click');

    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(wrapper.emitted('change')).toBeUndefined();
  });

  it('可滚动模式滚动到选中项的前一项，选中第一项时滚动到第一项', async () => {
    const wrapper = mount(UTabs, { props: { modelValue: 'closed', tabs, scrollable: true } });
    const scrollView = () => wrapper.find('scroll-view');

    expect(scrollView().attributes('scroll-into-view')).toBe('u-tabs-item-1');
    expect(wrapper.findAll('.u-tabs__item')[1].attributes('id')).toBe('u-tabs-item-1');

    await wrapper.setProps({ modelValue: 'all' });

    expect(scrollView().attributes('scroll-into-view')).toBe('u-tabs-item-0');
  });

  it('滚动目标不变时重新触发滚动', async () => {
    const wrapper = mount(UTabs, { props: { modelValue: 'unpaid', tabs, scrollable: true } });
    const scrollView = () => wrapper.find('scroll-view');

    expect(scrollView().attributes('scroll-into-view')).toBe('u-tabs-item-0');

    await wrapper.setProps({ modelValue: 'all' });
    expect(scrollView().attributes('scroll-into-view')).toBeFalsy();

    await flushPromises();
    expect(scrollView().attributes('scroll-into-view')).toBe('u-tabs-item-0');
  });

  it('选中值不在列表中时不滚动', () => {
    const wrapper = mount(UTabs, { props: { modelValue: 'missing', tabs, scrollable: true } });

    expect(wrapper.find('scroll-view').attributes('scroll-into-view')).toBeFalsy();
  });

  it('可滚动与卡片类型添加对应样式类', () => {
    const wrapper = mount(UTabs, { props: { modelValue: 'all', tabs, scrollable: true, type: 'card' } });

    expect(wrapper.classes()).toEqual(expect.arrayContaining(['u-tabs--scrollable', 'u-tabs--card']));
  });
});
