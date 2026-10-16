import { describe, expect, it, vi } from 'vitest';
import { defineComponent } from 'vue';
import { mount } from '@vue/test-utils';
import UInput from '@/components/UInput/index.vue';
import { U_FORM_ITEM_KEY } from '@/components/UForm/context';

vi.mock('@/store/modules/global', () => ({
  useGlobalStore: () => ({ primaryColor: '#1989fa' }),
}));

const EasyinputStub = defineComponent({
  name: 'UniEasyinput',
  props: {
    modelValue: { type: [String, Number], default: '' },
    type: { type: String, default: 'text' },
    placeholder: { type: String, default: '' },
    placeholderStyle: { type: String, default: '' },
    styles: { type: Object, default: () => ({}) },
    primaryColor: { type: String, default: '' },
    maxlength: { type: [Number, String], default: 140 },
    clearable: { type: Boolean, default: true },
    disabled: { type: Boolean, default: false },
    passwordIcon: { type: Boolean, default: true },
  },
  emits: ['update:modelValue', 'blur', 'focus', 'confirm', 'clear', 'input'],
  template: '<div class="easyinput"><slot name="left" /><slot name="right" /></div>',
});

const global = { stubs: { 'uni-easyinput': EasyinputStub } };

describe('UInput', () => {
  it('透传输入属性并使用主题样式', () => {
    const input = mount(UInput, {
      props: { modelValue: 'a', type: 'password', placeholder: '请输入', maxlength: 20, clearable: false },
      global,
    }).findComponent(EasyinputStub);

    expect(input.props()).toMatchObject({
      modelValue: 'a',
      type: 'password',
      placeholder: '请输入',
      maxlength: 20,
      clearable: false,
      passwordIcon: true,
      primaryColor: '#1989fa',
      placeholderStyle: 'color: var(--color-text-placeholder)',
    });
    expect(input.props('styles')).toEqual({
      color: 'var(--color-text)',
      backgroundColor: 'var(--color-bg)',
      disableColor: 'var(--color-bg-grey)',
      borderColor: 'var(--color-border)',
    });
  });

  it('输入时触发 update:modelValue，清除时触发 clear', async () => {
    const wrapper = mount(UInput, { props: { modelValue: '' }, global });
    const input = wrapper.findComponent(EasyinputStub);

    input.vm.$emit('update:modelValue', 'abc');
    input.vm.$emit('clear');

    expect(wrapper.emitted('update:modelValue')).toEqual([['abc']]);
    expect(wrapper.emitted('clear')).toHaveLength(1);
  });

  it('showCount 且 maxlength 大于 0 时显示字数统计', async () => {
    const wrapper = mount(UInput, { props: { modelValue: 'abc', maxlength: 10, showCount: true }, global });

    expect(wrapper.find('.u-input__count').text()).toBe('3/10');

    await wrapper.setProps({ maxlength: -1 });
    expect(wrapper.find('.u-input__count').exists()).toBe(false);
  });

  it('前后缀插槽渲染在输入框内', () => {
    const wrapper = mount(UInput, {
      slots: { prefix: '<span class="pre">+86</span>', suffix: '<span class="suffix">元</span>' },
      global,
    });

    expect(wrapper.find('.easyinput .pre').exists()).toBe(true);
    expect(wrapper.find('.easyinput .suffix').exists()).toBe(true);
  });

  it('失焦时触发 blur 并通知所在 UFormItem', () => {
    const onBlur = vi.fn();
    const wrapper = mount(UInput, {
      global: { ...global, provide: { [U_FORM_ITEM_KEY]: { onBlur } } },
    });

    wrapper.findComponent(EasyinputStub).vm.$emit('blur', { detail: { value: '' } });

    expect(wrapper.emitted('blur')).toHaveLength(1);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });
});
