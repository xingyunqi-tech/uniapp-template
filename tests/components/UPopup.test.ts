import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import UPopup from '@/components/UPopup/index.vue';

const popupApi = { open: vi.fn(), close: vi.fn() };

const UniPopupStub = defineComponent({
  emits: ['change', 'maskClick'],
  setup(_, { slots, expose }) {
    expose(popupApi);
    return () => h('div', { class: 'uni-popup' }, slots.default?.());
  },
});

const UniPopupDialogStub = defineComponent({
  props: { modelValue: { type: String, default: '' }, mode: { type: String, default: 'base' } },
  emits: ['confirm', 'close'],
  setup(props) {
    return () => h('div', { class: 'uni-popup-dialog', 'data-value': props.modelValue });
  },
});

const global = {
  stubs: { 'uni-popup': UniPopupStub, 'uni-popup-dialog': UniPopupDialogStub, 'uni-icons': true },
};

describe('UPopup', () => {
  it('open / close 调用 uni-popup 的对应方法', () => {
    popupApi.open.mockClear();
    popupApi.close.mockClear();
    const wrapper = mount(UPopup, { global });

    (wrapper.vm as unknown as { open: () => void }).open();
    (wrapper.vm as unknown as { close: () => void }).close();

    expect(popupApi.open).toHaveBeenCalledTimes(1);
    expect(popupApi.close).toHaveBeenCalledTimes(1);
  });

  it('关闭时依次触发 change 与 close，打开时只触发 change', async () => {
    const wrapper = mount(UPopup, { global });
    const popup = wrapper.findComponent(UniPopupStub);

    popup.vm.$emit('change', { show: true });
    popup.vm.$emit('change', { show: false });

    expect(wrapper.emitted('change')).toEqual([[{ show: true }], [{ show: false }]]);
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('输入对话框把默认值传给 uni-popup-dialog，确认时传出输入值并关闭', async () => {
    popupApi.close.mockClear();
    const wrapper = mount(UPopup, {
      props: { type: 'dialog', dialogMode: 'input', dialogValue: '默认值' },
      global,
    });
    const dialog = wrapper.findComponent(UniPopupDialogStub);

    expect(dialog.attributes('data-value')).toBe('默认值');
    dialog.vm.$emit('confirm', '新的值');

    expect(wrapper.emitted('confirm')).toEqual([['新的值']]);
    expect(popupApi.close).toHaveBeenCalledTimes(1);
  });

  it('基础对话框确认时传出 undefined', () => {
    const wrapper = mount(UPopup, { props: { type: 'dialog' }, global });

    wrapper.findComponent(UniPopupDialogStub).vm.$emit('confirm');

    expect(wrapper.emitted('confirm')).toEqual([[undefined]]);
  });
});
