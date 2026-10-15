import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
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

  it('可滚动与卡片类型添加对应样式类', () => {
    const wrapper = mount(UTabs, { props: { modelValue: 'all', tabs, scrollable: true, type: 'card' } });

    expect(wrapper.classes()).toEqual(expect.arrayContaining(['u-tabs--scrollable', 'u-tabs--card']));
  });
});
