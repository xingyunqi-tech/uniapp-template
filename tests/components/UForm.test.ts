import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, nextTick, reactive, ref } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import UForm from '@/components/UForm/index.vue';
import UFormItem from '@/components/UFormItem/index.vue';
import UInput from '@/components/UInput/index.vue';
import type { UFormExpose } from '@/components/UForm/context';
import type { FormRules } from '@/utils/form-rules';

vi.mock('@/store/modules/global', () => ({
  useGlobalStore: () => ({ primaryColor: '#1989fa' }),
}));

const EasyinputStub = defineComponent({
  name: 'UniEasyinput',
  props: { modelValue: { type: [String, Number], default: '' } },
  emits: ['update:modelValue', 'blur'],
  template: '<div class="easyinput" />',
});

const FormsItemStub = defineComponent({
  name: 'UniFormsItemStub',
  props: {
    label: { type: String, default: '' },
    required: { type: Boolean, default: false },
    labelWidth: { type: [String, Number], default: '' },
    labelAlign: { type: String, default: '' },
  },
  template: '<div class="forms-item"><slot /></div>',
});

const global = {
  stubs: { 'uni-easyinput': EasyinputStub, 'uni-forms-item': FormsItemStub, 'uni-icons': true },
  components: { UForm, UFormItem, UInput },
};

function mountForm(rules: FormRules, formProps: Record<string, unknown> = {}) {
  const model = reactive({ phone: '', password: '' });
  const formRef = ref<UFormExpose | null>(null);
  const wrapper = mount(
    defineComponent({
      setup: () => ({ model, rules, formRef, formProps }),
      template: `
        <UForm ref="formRef" :model="model" :rules="rules" v-bind="formProps">
          <UFormItem label="手机号" prop="phone"><UInput v-model="model.phone" /></UFormItem>
          <UFormItem label="密码" prop="password"><UInput v-model="model.password" /></UFormItem>
        </UForm>
      `,
    }),
    { global },
  );
  const items = () => wrapper.findAllComponents(UFormItem);
  const errorOf = (index: number) => items()[index].find('.u-form-item__error');
  const blur = (index: number) => items()[index].findComponent(EasyinputStub).vm.$emit('blur', {});
  return { wrapper, model, form: () => formRef.value!, items, errorOf, blur };
}

const rules: FormRules = {
  phone: [
    { required: true, message: '请输入手机号' },
    { pattern: /^1\d{10}$/, message: '手机号格式错误' },
  ],
  password: { required: true, message: '请输入密码' },
};

beforeEach(() => {
  vi.mocked(uni.showToast).mockClear();
});

describe('UForm', () => {
  it('validate 按规则顺序 Toast 第一条错误，并在 UFormItem 下方显示各字段错误', async () => {
    const { form, errorOf } = mountForm(rules);

    await expect(form().validate()).resolves.toBe(false);
    await nextTick();

    expect(uni.showToast).toHaveBeenCalledWith({ title: '请输入手机号', icon: 'none' });
    expect(errorOf(0).text()).toBe('请输入手机号');
    expect(errorOf(1).text()).toBe('请输入密码');
  });

  it('全部通过时 validate 返回 true 且不提示', async () => {
    const { form, model } = mountForm(rules);
    model.phone = '13800000000';
    model.password = '123456';

    await expect(form().validate()).resolves.toBe(true);
    expect(uni.showToast).not.toHaveBeenCalled();
  });

  it('errorToast 为 false 时不提示；validate 可只校验指定字段', async () => {
    const { form, errorOf } = mountForm(rules, { errorToast: false });

    await expect(form().validate('password')).resolves.toBe(false);
    await nextTick();

    expect(uni.showToast).not.toHaveBeenCalled();
    expect(errorOf(0).exists()).toBe(false);
    expect(errorOf(1).text()).toBe('请输入密码');
  });

  it('规则含 required 时 UFormItem 显示必填标记', () => {
    const { items } = mountForm({ phone: rules.phone });

    expect(items()[0].findComponent(FormsItemStub).props('required')).toBe(true);
    expect(items()[1].findComponent(FormsItemStub).props('required')).toBe(false);
  });

  it('UInput 失焦时按 blur 规则校验所在字段', async () => {
    const { model, errorOf, blur } = mountForm(rules);

    blur(0);
    await flushPromises();
    expect(errorOf(0).text()).toBe('请输入手机号');
    expect(errorOf(1).exists()).toBe(false);

    model.phone = '123';
    await flushPromises();
    expect(errorOf(0).text()).toBe('手机号格式错误');

    model.phone = '13800000000';
    await flushPromises();
    expect(errorOf(0).exists()).toBe(false);
  });

  it('validateTrigger 为 submit 时失焦不校验', async () => {
    const { errorOf, blur } = mountForm(rules, { validateTrigger: 'submit' });

    blur(0);
    await flushPromises();

    expect(errorOf(0).exists()).toBe(false);
  });

  it('trigger 为 change 的规则在值变化时校验', async () => {
    const { model, errorOf } = mountForm({ phone: { pattern: /^\d+$/, message: '只能输入数字', trigger: 'change' } });

    model.phone = 'a';
    await flushPromises();

    expect(errorOf(0).text()).toBe('只能输入数字');
  });

  it('clearValidate 后丢弃进行中的异步校验结果', async () => {
    let resolve: (value: boolean) => void = () => {};
    const { form, model, errorOf } = mountForm({
      phone: { validator: () => new Promise<boolean>(r => (resolve = r)), message: '已被注册' },
    });
    model.phone = '13800000000';

    const result = form().validateField('phone');
    form().clearValidate();
    resolve(false);

    await expect(result).resolves.toBe(false);
    await nextTick();
    expect(errorOf(0).exists()).toBe(false);
  });

  it('resetFields 恢复初始值并清除错误', async () => {
    const { form, model, errorOf } = mountForm(rules, { validateTrigger: 'change' });

    model.phone = '123';
    await form().validate();
    await nextTick();
    expect(errorOf(0).text()).toBe('手机号格式错误');

    form().resetFields();
    await flushPromises();

    expect(model.phone).toBe('');
    expect(errorOf(0).exists()).toBe(false);
  });

  it('依赖字段变化时重新校验已出错的字段，错误随之消失', async () => {
    const { model, errorOf, blur } = mountForm({
      password: { validator: (value, model) => value === model.phone, message: '两次输入不一致', deps: ['phone'] },
    });
    model.phone = 'abc';
    model.password = 'abd';
    await flushPromises();
    blur(1);
    await flushPromises();
    expect(errorOf(1).text()).toBe('两次输入不一致');

    model.phone = 'abd';
    await flushPromises();
    expect(errorOf(1).exists()).toBe(false);

    model.phone = 'xyz';
    await flushPromises();
    expect(errorOf(1).text()).toBe('两次输入不一致');
  });

  it('依赖字段变化时不校验未校验过的字段', async () => {
    const { model, errorOf } = mountForm({
      password: { validator: (value, model) => value === model.phone, message: '两次输入不一致', deps: ['phone'] },
    });
    model.password = 'abd';
    await flushPromises();
    model.phone = 'abc';
    await flushPromises();

    expect(errorOf(1).exists()).toBe(false);
  });

  it('失焦异步校验返回前值发生变化时，旧结果不写入', async () => {
    let resolve: (value: boolean) => void = () => {};
    const { model, errorOf, blur } = mountForm({
      phone: { validator: () => new Promise<boolean>(r => (resolve = r)), message: '已被注册', trigger: 'blur' },
    });
    model.phone = '13800000000';
    await flushPromises();
    blur(0);
    await flushPromises();

    model.phone = '13900000000';
    await flushPromises();
    resolve(false);
    await flushPromises();

    expect(errorOf(0).exists()).toBe(false);
  });

  it('字段已有错误时值变化不运行 trigger 为 blur 的规则，失焦与 validate 时运行', async () => {
    const remote = vi.fn(() => Promise.resolve<boolean>(false));
    const { form, model, errorOf, blur } = mountForm({
      phone: [
        { pattern: /^\d+$/, message: '只能输入数字' },
        { validator: remote, message: '已被注册', trigger: 'blur' },
      ],
    });
    model.phone = 'a';
    await flushPromises();
    blur(0);
    await flushPromises();
    expect(errorOf(0).text()).toBe('只能输入数字');

    model.phone = '1';
    await flushPromises();
    expect(errorOf(0).exists()).toBe(false);
    expect(remote).not.toHaveBeenCalled();

    blur(0);
    await flushPromises();
    expect(remote).toHaveBeenCalledTimes(1);
    expect(errorOf(0).text()).toBe('已被注册');

    await form().validate();
    expect(remote).toHaveBeenCalledTimes(2);
  });

  it('setInitialValues 更新 resetFields 恢复的初始值', async () => {
    const { form, model } = mountForm(rules);

    model.phone = '13800000000';
    form().setInitialValues();
    model.phone = '123';
    form().resetFields();
    await flushPromises();
    expect(model.phone).toBe('13800000000');

    form().setInitialValues({ phone: '13900000000', password: 'abc' });
    form().resetFields();
    await flushPromises();
    expect(model).toEqual({ phone: '13900000000', password: 'abc' });
  });

  it('UFormItem 未设置时继承 UForm 的 label 宽度与对齐', () => {
    const { items } = mountForm(rules, { labelWidth: 200, labelAlign: 'right' });

    expect(items()[0].findComponent(FormsItemStub).props('labelWidth')).toBe('200rpx');
    expect(items()[0].findComponent(FormsItemStub).props('labelAlign')).toBe('right');
  });
});
