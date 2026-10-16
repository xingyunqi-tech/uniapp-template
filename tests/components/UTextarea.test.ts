import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import UTextarea from '@/components/UTextarea/index.vue';
import { U_FORM_ITEM_KEY } from '@/components/UForm/context';

describe('UTextarea', () => {
  it('输入时触发 update:modelValue 与 input', async () => {
    const wrapper = mount(UTextarea, { props: { modelValue: '' } });

    await wrapper.find('textarea').trigger('input', { detail: { value: '你好' } });

    expect(wrapper.emitted('update:modelValue')).toEqual([['你好']]);
    expect(wrapper.emitted('input')).toEqual([['你好']]);
  });

  it('有 maxlength 时默认显示字数统计，showCount 为 false 时隐藏', async () => {
    const wrapper = mount(UTextarea, { props: { modelValue: 'abc', maxlength: 100 } });

    expect(wrapper.find('.u-textarea__count').text()).toBe('3/100');

    await wrapper.setProps({ showCount: false });
    expect(wrapper.find('.u-textarea__count').exists()).toBe(false);

    await wrapper.setProps({ showCount: undefined, maxlength: -1 });
    expect(wrapper.find('.u-textarea__count').exists()).toBe(false);
  });

  it('禁用时添加禁用样式类', () => {
    const wrapper = mount(UTextarea, { props: { disabled: true } });

    expect(wrapper.classes()).toContain('u-textarea--disabled');
  });

  it('失焦时触发 blur 并通知所在 UFormItem', async () => {
    const onBlur = vi.fn();
    const wrapper = mount(UTextarea, { global: { provide: { [U_FORM_ITEM_KEY]: { onBlur } } } });

    await wrapper.find('textarea').trigger('blur');

    expect(wrapper.emitted('blur')).toHaveLength(1);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });
});
