import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import UActionSheet, { type ActionItem } from '@/components/UActionSheet/index.vue';

const popupApi = { open: vi.fn(), close: vi.fn() };

const UPopupStub = defineComponent({
  name: 'UPopup',
  props: { bodyPadding: { type: Boolean, default: true } },
  emits: ['change', 'maskClick'],
  setup(_, { slots, expose }) {
    expose(popupApi);
    return () => h('div', { class: 'u-popup' }, slots.default?.());
  },
});

const global = { stubs: { UPopup: UPopupStub, 'uni-icons': true } };

const actions: ActionItem[] = [
  { label: '拍照', value: 'camera' },
  { label: '删除', value: 'delete', danger: true, disabled: true },
];

describe('UActionSheet', () => {
  it('内容区不使用 UPopup 的内边距', () => {
    const wrapper = mount(UActionSheet, { props: { actions }, global });

    expect(wrapper.findComponent(UPopupStub).props('bodyPadding')).toBe(false);
  });

  it('点击遮罩时触发 cancel', () => {
    const wrapper = mount(UActionSheet, { props: { actions }, global });

    wrapper.findComponent(UPopupStub).vm.$emit('maskClick');

    expect(wrapper.emitted('cancel')).toHaveLength(1);
  });

  it('maskClosable 为 false 时点击遮罩不触发 cancel', () => {
    const wrapper = mount(UActionSheet, { props: { actions, maskClosable: false }, global });

    wrapper.findComponent(UPopupStub).vm.$emit('maskClick');

    expect(wrapper.emitted('cancel')).toBeUndefined();
  });

  it('点击取消按钮触发 cancel 并关闭', async () => {
    popupApi.close.mockClear();
    const wrapper = mount(UActionSheet, { props: { actions }, global });

    await wrapper.find('.u-action-sheet__cancel').trigger('click');

    expect(wrapper.emitted('cancel')).toHaveLength(1);
    expect(popupApi.close).toHaveBeenCalledTimes(1);
  });

  it('点击选项触发 select，禁用项无效', async () => {
    const wrapper = mount(UActionSheet, { props: { actions }, global });
    const items = wrapper.findAll('.u-action-sheet__item');

    await items[0].trigger('click');
    await items[1].trigger('click');

    expect(wrapper.emitted('select')).toEqual([[actions[0], 0]]);
  });
});
