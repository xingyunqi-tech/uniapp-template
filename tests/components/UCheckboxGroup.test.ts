import { describe, expect, it } from 'vitest';
import { defineComponent, nextTick, reactive } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import UCheckboxGroup, { type CheckboxOption } from '@/components/UCheckboxGroup/index.vue';
import UForm from '@/components/UForm/index.vue';
import UFormItem from '@/components/UFormItem/index.vue';

const options: CheckboxOption[] = [
  { label: '阅读', value: 'read' },
  { label: '运动', value: 'sport' },
  { label: '音乐', value: 'music', disabled: true },
];

function items(wrapper: ReturnType<typeof mount>) {
  return wrapper.findAll('.u-checkbox-group__item');
}

describe('UCheckboxGroup', () => {
  it('按选项渲染文字并标记选中项', () => {
    const wrapper = mount(UCheckboxGroup, { props: { options, modelValue: ['sport'] } });

    expect(items(wrapper).map(item => item.text())).toEqual(['阅读', '运动', '音乐']);
    expect(items(wrapper)[1].classes()).toContain('u-checkbox-group__item--checked');
    expect(items(wrapper)[0].classes()).not.toContain('u-checkbox-group__item--checked');
  });

  it('点击未选项追加到数组，点击已选项移除', async () => {
    const wrapper = mount(UCheckboxGroup, { props: { options, modelValue: ['sport'] } });

    await items(wrapper)[0].trigger('click');
    await items(wrapper)[1].trigger('click');

    expect(wrapper.emitted('update:modelValue')).toEqual([[['sport', 'read']], [[]]]);
    expect(wrapper.emitted('change')).toEqual([[['sport', 'read']], [[]]]);
  });

  it('禁用的选项与整体禁用时点击无效', async () => {
    const wrapper = mount(UCheckboxGroup, { props: { options } });
    await items(wrapper)[2].trigger('click');
    expect(items(wrapper)[2].classes()).toContain('u-checkbox-group__item--disabled');

    await wrapper.setProps({ disabled: true });
    await items(wrapper)[0].trigger('click');

    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });

  it('达到 max 后未选项不可选，已选项仍可取消', async () => {
    const wrapper = mount(UCheckboxGroup, { props: { options, modelValue: ['read'], max: 1 } });

    expect(items(wrapper)[1].classes()).toContain('u-checkbox-group__item--disabled');
    await items(wrapper)[1].trigger('click');
    await items(wrapper)[0].trigger('click');

    expect(wrapper.emitted('update:modelValue')).toEqual([[[]]]);
  });

  it('direction 与 shape 对应样式类', () => {
    const wrapper = mount(UCheckboxGroup, { props: { options, direction: 'vertical', shape: 'circle' } });

    expect(wrapper.classes()).toContain('u-checkbox-group--vertical');
    expect(wrapper.find('.u-checkbox-group__icon').classes()).toContain('u-checkbox-group__icon--circle');
  });

  it('在 UFormItem 内选择后按 change 时机校验', async () => {
    const model = reactive({ hobbies: [] as string[] });
    const rules = { hobbies: { required: true, message: '请选择爱好', trigger: 'change' as const } };
    const wrapper = mount(
      defineComponent({
        components: { UForm, UFormItem, UCheckboxGroup },
        setup: () => ({ model, rules, options }),
        template: `
          <UForm :model="model" :rules="rules">
            <UFormItem label="爱好" prop="hobbies">
              <UCheckboxGroup v-model="model.hobbies" :options="options" />
            </UFormItem>
          </UForm>
        `,
      }),
      { global: { stubs: { 'uni-forms-item': { template: '<div><slot /></div>' } } } },
    );

    await wrapper.find('.u-checkbox-group__item').trigger('click');
    await flushPromises();
    expect(model.hobbies).toEqual(['read']);
    expect(wrapper.find('.u-form-item__error').exists()).toBe(false);

    await wrapper.find('.u-checkbox-group__item').trigger('click');
    await nextTick();
    await flushPromises();
    expect(wrapper.find('.u-form-item__error').text()).toBe('请选择爱好');
  });
});
