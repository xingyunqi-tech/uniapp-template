import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import UMenuItem from '@/components/UMenuItem/index.vue';

vi.mock('@/store/modules/global', () => ({
  useGlobalStore: () => ({ primaryColor: '#1989fa' }),
}));

const IconsStub = defineComponent({
  name: 'UniIcons',
  props: {
    type: { type: String, default: '' },
    size: { type: [String, Number], default: '' },
    color: { type: String, default: '' },
  },
  setup(props) {
    return () => h('i', { class: `icon-${props.type}` });
  },
});

const global = { stubs: { 'uni-icons': IconsStub } };

describe('UMenuItem', () => {
  it('渲染标题、描述、右侧文字和角标', () => {
    const wrapper = mount(UMenuItem, {
      props: { title: '订单', label: '查看全部订单', rightText: '3 笔', badge: 'NEW' },
      global,
    });

    expect(wrapper.find('.u-menu-item__title').text()).toBe('订单');
    expect(wrapper.find('.u-menu-item__label').text()).toBe('查看全部订单');
    expect(wrapper.find('.u-menu-item__right-text').text()).toBe('3 笔');
    expect(wrapper.find('.u-menu-item__badge').text()).toBe('NEW');
  });

  it('默认显示箭头和下边框，可关闭', () => {
    const wrapper = mount(UMenuItem, { props: { title: '设置' }, global });
    expect(wrapper.find('.icon-right').exists()).toBe(true);
    expect(wrapper.classes()).toContain('u-menu-item--border');

    const plain = mount(UMenuItem, { props: { title: '设置', showArrow: false, border: false }, global });
    expect(plain.find('.icon-right').exists()).toBe(false);
    expect(plain.classes()).not.toContain('u-menu-item--border');
  });

  it('图标使用自定义颜色与尺寸，危险项使用错误色', () => {
    const wrapper = mount(UMenuItem, {
      props: { title: '收藏', icon: 'star', iconColor: 'gold', iconSize: 48 },
      global,
    });
    const icon = wrapper.findAllComponents(IconsStub).find(c => c.props('type') === 'star')!;

    expect(icon.props('color')).toBe('gold');
    expect(icon.props('size')).toBe('48rpx');

    const danger = mount(UMenuItem, {
      props: { title: '退出', icon: 'closeempty', iconColor: 'gold', danger: true },
      global,
    });
    expect(danger.findAllComponents(IconsStub)[0].props('color')).toBe('var(--color-error)');
    expect(danger.classes()).toContain('u-menu-item--danger');
  });

  it('点击时触发 click，禁用时不触发且无按下态', async () => {
    const wrapper = mount(UMenuItem, { props: { title: '设置' }, global });
    await wrapper.trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
    expect(wrapper.attributes('hover-class')).toBe('u-menu-item--hover');

    const disabled = mount(UMenuItem, { props: { title: '设置', disabled: true }, global });
    await disabled.trigger('click');
    expect(disabled.emitted('click')).toBeUndefined();
    expect(disabled.attributes('hover-class')).toBe('');
    expect(disabled.classes()).toContain('u-menu-item--disabled');
  });

  it('显示开关时隐藏箭头，开关使用主题色并透传状态', () => {
    const wrapper = mount(UMenuItem, {
      props: { title: '通知', showSwitch: true, switchChecked: true, disabled: true },
      global,
    });
    const switchEl = wrapper.find('switch');

    expect(wrapper.find('.icon-right').exists()).toBe(false);
    expect(switchEl.attributes()).toMatchObject({ checked: 'true', disabled: 'true', color: '#1989fa' });
  });

  it('开关切换时触发 switchChange', async () => {
    const wrapper = mount(UMenuItem, { props: { title: '通知', showSwitch: true }, global });

    await wrapper.find('switch').trigger('change', { detail: { value: true } });

    expect(wrapper.emitted('switchChange')).toEqual([[true]]);
  });

  it('点击开关不触发整行 click', async () => {
    const wrapper = mount(UMenuItem, { props: { title: '通知', showSwitch: true }, global });

    await wrapper.find('switch').trigger('click');

    expect(wrapper.emitted('click')).toBeUndefined();
  });

  it('icon、title、value 插槽替换对应区域默认内容', () => {
    const wrapper = mount(UMenuItem, {
      props: { title: '默认标题', label: '描述', rightText: '默认值' },
      slots: {
        icon: '<image class="slot-icon" />',
        title: '<text class="slot-title">自定义标题</text>',
        value: '<text class="slot-value">自定义值</text>',
      },
      global,
    });

    expect(wrapper.find('.u-menu-item__icon .slot-icon').exists()).toBe(true);
    expect(wrapper.find('.slot-title').text()).toBe('自定义标题');
    expect(wrapper.find('.u-menu-item__title').exists()).toBe(false);
    expect(wrapper.find('.u-menu-item__label').text()).toBe('描述');
    expect(wrapper.find('.slot-value').text()).toBe('自定义值');
    expect(wrapper.find('.u-menu-item__right-text').exists()).toBe(false);
  });

  it('默认插槽替换整个内容区', () => {
    const wrapper = mount(UMenuItem, {
      props: { title: '默认标题', label: '描述' },
      slots: { default: '<view class="slot-content">内容</view>' },
      global,
    });

    expect(wrapper.find('.u-menu-item__content .slot-content').text()).toBe('内容');
    expect(wrapper.find('.u-menu-item__title').exists()).toBe(false);
    expect(wrapper.find('.u-menu-item__label').exists()).toBe(false);
  });

  it('未传 icon 且无 icon 插槽时不渲染图标区', () => {
    const wrapper = mount(UMenuItem, { props: { title: '设置' }, global });

    expect(wrapper.find('.u-menu-item__icon').exists()).toBe(false);
  });

  it('isContact 时渲染客服按钮', () => {
    const wrapper = mount(UMenuItem, { props: { title: '联系客服', isContact: true }, global });

    expect(wrapper.find('.u-menu-item__contact-btn').attributes('open-type')).toBe('contact');
    expect(
      mount(UMenuItem, { props: { title: '设置' }, global })
        .find('button')
        .exists(),
    ).toBe(false);
  });
});
