import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import UStepper from '@/components/UStepper/index.vue';
import { U_FORM_ITEM_KEY } from '@/components/UForm/context';

const inputEvent = (value: string) => ({ detail: { value } });

describe('UStepper', () => {
  it('点击加减按步长更新值', async () => {
    const wrapper = mount(UStepper, { props: { modelValue: 2, step: 2, max: 10 } });

    await wrapper.find('.u-stepper__button--plus').trigger('click');
    await wrapper.find('.u-stepper__button--minus').trigger('click');

    expect(wrapper.emitted('update:modelValue')).toEqual([[4], [1]]);
    expect(wrapper.emitted('change')).toEqual([[4], [1]]);
  });

  it('达到上下限时禁用按钮并触发 overlimit', async () => {
    const wrapper = mount(UStepper, { props: { modelValue: 1, max: 1 } });

    expect(wrapper.find('.u-stepper__button--minus').classes()).toContain('u-stepper__button--disabled');
    expect(wrapper.find('.u-stepper__button--plus').classes()).toContain('u-stepper__button--disabled');

    await wrapper.find('.u-stepper__button--minus').trigger('click');
    await wrapper.find('.u-stepper__button--plus').trigger('click');

    expect(wrapper.emitted('overlimit')).toEqual([['minus'], ['plus']]);
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });

  it('小数步长按精度计算', async () => {
    const wrapper = mount(UStepper, { props: { modelValue: 0.1, min: 0, step: 0.2, integer: false } });

    await wrapper.find('.u-stepper__button--plus').trigger('click');

    expect(wrapper.emitted('update:modelValue')).toEqual([[0.3]]);
  });

  it('disabled 时不响应按钮且禁用输入', async () => {
    const wrapper = mount(UStepper, { props: { modelValue: 2, disabled: true } });

    await wrapper.find('.u-stepper__button--plus').trigger('click');

    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(wrapper.emitted('overlimit')).toBeUndefined();
    expect(wrapper.find('input').attributes('disabled')).toBeDefined();
  });

  it('inputDisabled 时只禁用输入', () => {
    const wrapper = mount(UStepper, { props: { modelValue: 2, inputDisabled: true } });

    expect(wrapper.find('input').attributes('disabled')).toBeDefined();
    expect(wrapper.find('.u-stepper__button--plus').classes()).not.toContain('u-stepper__button--disabled');
  });

  it('输入范围内的整数时更新值，越界或非整数在失焦时修正', async () => {
    const wrapper = mount(UStepper, { props: { modelValue: 2, max: 10 } });
    const input = wrapper.find('input');

    await input.trigger('input', inputEvent('5'));
    expect(wrapper.emitted('update:modelValue')).toEqual([[5]]);

    await wrapper.setProps({ modelValue: 5 });
    await input.trigger('input', inputEvent('30'));
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1);

    await input.trigger('blur');
    expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([10]);
  });

  it('清空输入后失焦恢复当前值', async () => {
    const wrapper = mount(UStepper, { props: { modelValue: 3 } });
    const input = wrapper.find('input');

    await input.trigger('input', inputEvent(''));
    await input.trigger('blur');

    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect((input.element as HTMLInputElement).value).toBe('3');
  });

  it('integer 为 false 时允许小数输入', async () => {
    const wrapper = mount(UStepper, { props: { modelValue: 1, integer: false } });

    await wrapper.find('input').trigger('input', inputEvent('1.5'));

    expect(wrapper.emitted('update:modelValue')).toEqual([[1.5]]);
  });

  it('未传 modelValue 时显示 min', () => {
    const wrapper = mount(UStepper, { props: { min: 3 } });

    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('3');
  });

  it('在 UFormItem 内失焦时通知表单项', async () => {
    const onBlur = vi.fn();
    const wrapper = mount(UStepper, {
      props: { modelValue: 2 },
      global: { provide: { [U_FORM_ITEM_KEY]: { onBlur } } },
    });

    await wrapper.find('input').trigger('blur');

    expect(onBlur).toHaveBeenCalledTimes(1);
  });
});
