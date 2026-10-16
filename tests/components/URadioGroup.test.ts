import { describe, expect, it } from 'vitest';
import { defineComponent, nextTick, reactive } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import URadioGroup, { type RadioOption } from '@/components/URadioGroup/index.vue';
import UForm from '@/components/UForm/index.vue';
import UFormItem from '@/components/UFormItem/index.vue';

const options: RadioOption[] = [
  { label: '男', value: 1 },
  { label: '女', value: 2 },
  { label: '保密', value: 0, disabled: true },
];

function items(wrapper: ReturnType<typeof mount>) {
  return wrapper.findAll('.u-radio-group__item');
}

describe('URadioGroup', () => {
  it('按选项渲染文字，选中项显示圆点', () => {
    const wrapper = mount(URadioGroup, { props: { options, modelValue: 2 } });

    expect(items(wrapper).map(item => item.text())).toEqual(['男', '女', '保密']);
    expect(items(wrapper)[1].classes()).toContain('u-radio-group__item--checked');
    expect(wrapper.findAll('.u-radio-group__dot')).toHaveLength(1);
  });

  it('点击未选项触发 update:modelValue 与 change，点击已选项不触发', async () => {
    const wrapper = mount(URadioGroup, { props: { options, modelValue: 2 } });

    await items(wrapper)[1].trigger('click');
    await items(wrapper)[0].trigger('click');

    expect(wrapper.emitted('update:modelValue')).toEqual([[1]]);
    expect(wrapper.emitted('change')).toEqual([[1]]);
  });

  it('禁用的选项与整体禁用时点击无效', async () => {
    const wrapper = mount(URadioGroup, { props: { options } });
    await items(wrapper)[2].trigger('click');
    expect(items(wrapper)[2].classes()).toContain('u-radio-group__item--disabled');

    await wrapper.setProps({ disabled: true });
    await items(wrapper)[0].trigger('click');

    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });

  it('direction 与 shape 对应样式类', () => {
    const wrapper = mount(URadioGroup, { props: { options, direction: 'vertical', shape: 'square' } });

    expect(wrapper.classes()).toContain('u-radio-group--vertical');
    expect(wrapper.find('.u-radio-group__icon').classes()).toContain('u-radio-group__icon--square');
  });

  it('在 UFormItem 内选择后按 change 时机校验', async () => {
    const model = reactive({ gender: 0 });
    const rules = {
      gender: { validator: (value: unknown) => value === 2 || '请选择女', trigger: 'change' as const },
    };
    const wrapper = mount(
      defineComponent({
        components: { UForm, UFormItem, URadioGroup },
        setup: () => ({ model, rules, options }),
        template: `
          <UForm :model="model" :rules="rules">
            <UFormItem label="性别" prop="gender">
              <URadioGroup v-model="model.gender" :options="options" />
            </UFormItem>
          </UForm>
        `,
      }),
      { global: { stubs: { 'uni-forms-item': { template: '<div><slot /></div>' } } } },
    );

    await wrapper.find('.u-radio-group__item').trigger('click');
    await nextTick();
    await flushPromises();
    expect(model.gender).toBe(1);
    expect(wrapper.find('.u-form-item__error').text()).toBe('请选择女');
  });
});
