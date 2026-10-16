import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import UFormItem, { type FormItemRule } from '@/components/UFormItem/index.vue';

const global = {
  stubs: {
    'uni-forms-item': {
      name: 'UniFormsItemStub',
      props: ['label', 'required', 'rules', 'labelWidth'],
      template: '<div class="forms-item">{{ label }}<slot /></div>',
    },
    'uni-icons': true,
  },
};

describe('UFormItem', () => {
  it('值为空时显示占位符', () => {
    const wrapper = mount(UFormItem, { props: { label: '地区', value: '', placeholder: '请选择' }, global });

    expect(wrapper.find('.u-form-item__placeholder').text()).toBe('请选择');
  });

  it('值为 0 时显示值而不是占位符', () => {
    const wrapper = mount(UFormItem, { props: { label: '数量', value: 0, placeholder: '请输入' }, global });

    expect(wrapper.find('.u-form-item__placeholder').exists()).toBe(false);
    expect(wrapper.find('.u-form-item__value').text()).toBe('0');
  });

  it('校验规则原样传给 uni-forms-item', () => {
    const rules: FormItemRule[] = [
      { required: true, errorMessage: '请输入昵称' },
      { validateFunction: (_rule, value, _data, callback) => (value ? true : callback('昵称不能为空')) },
    ];
    const wrapper = mount(UFormItem, { props: { label: '昵称', name: 'nickname', rules }, global });

    expect(wrapper.findComponent({ name: 'UniFormsItemStub' }).props('rules')).toEqual(rules);
  });

  it('alignTop 时添加顶部对齐样式类', () => {
    const wrapper = mount(UFormItem, { props: { label: '详细地址', alignTop: true }, global });

    expect(wrapper.classes()).toContain('u-form-item--top');
  });

  it('点击内容区触发 click，与是否显示箭头无关', async () => {
    const withArrow = mount(UFormItem, { props: { label: '地区', showArrow: true }, global });
    const plain = mount(UFormItem, { props: { label: '昵称' }, global });

    await withArrow.find('.u-form-item__content').trigger('click');
    await plain.find('.u-form-item__content').trigger('click');

    expect(withArrow.emitted('click')).toHaveLength(1);
    expect(plain.emitted('click')).toHaveLength(1);
  });

  it('labelWidth 数字按 rpx 传给 uni-forms-item，字符串原样传递，默认 160rpx', () => {
    const labelWidthOf = (props: Record<string, unknown>) =>
      mount(UFormItem, { props: { label: '昵称', ...props }, global })
        .findComponent({ name: 'UniFormsItemStub' })
        .props('labelWidth');

    expect(labelWidthOf({})).toBe('160rpx');
    expect(labelWidthOf({ labelWidth: 200 })).toBe('200rpx');
    expect(labelWidthOf({ labelWidth: '100px' })).toBe('100px');
  });
});
