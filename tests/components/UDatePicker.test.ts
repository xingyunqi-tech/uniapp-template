import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, reactive } from 'vue';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import UDatePicker from '@/components/UDatePicker/index.vue';
import UForm from '@/components/UForm/index.vue';
import UFormItem from '@/components/UFormItem/index.vue';
import { U_FORM_ITEM_KEY } from '@/components/UForm/context';

const UPopupStub = defineComponent({
  name: 'UPopup',
  props: { modelValue: { type: Boolean, default: false } },
  emits: ['update:modelValue'],
  setup(props, { slots }) {
    return () => (props.modelValue ? h('div', { class: 'popup' }, slots.default?.()) : null);
  },
});

const PickerViewStub = defineComponent({
  name: 'PickerView',
  props: { value: { type: Array, default: () => [] } },
  emits: ['change'],
  setup(_, { slots }) {
    return () => h('div', { class: 'picker-view' }, slots.default?.());
  },
});

const PickerViewColumnStub = defineComponent({
  setup(_, { slots }) {
    return () => h('div', { class: 'picker-view-column' }, slots.default?.());
  },
});

const global = {
  stubs: {
    UPopup: UPopupStub,
    'picker-view': PickerViewStub,
    'picker-view-column': PickerViewColumnStub,
    'uni-icons': true,
  },
};

function columnTexts(wrapper: VueWrapper) {
  return wrapper
    .findAll('.picker-view-column')
    .map(column => column.findAll('.u-date-picker__option').map(o => o.text()));
}

function pickerIndexes(wrapper: VueWrapper) {
  return wrapper.findComponent(PickerViewStub).props('value') as number[];
}

async function scrollTo(wrapper: VueWrapper, indexes: number[]) {
  wrapper.findComponent(PickerViewStub).vm.$emit('change', { detail: { value: indexes } });
  await nextTick();
}

async function confirm(wrapper: VueWrapper) {
  await wrapper.find('.u-date-picker__action--confirm').trigger('click');
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2024, 4, 15, 9, 30));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('UDatePicker', () => {
  it('未选择时显示占位文字，有值时按 format 展示', async () => {
    const wrapper = mount(UDatePicker, { props: { modelValue: '' }, global });
    expect(wrapper.find('.u-date-picker__text').text()).toBe('请选择日期');
    expect(wrapper.find('.u-date-picker__text--placeholder').exists()).toBe(true);

    await wrapper.setProps({ modelValue: '2024-05-01', format: 'YYYY年MM月DD日' });
    expect(wrapper.find('.u-date-picker__text').text()).toBe('2024年05月01日');
  });

  it('format 中重复出现的占位符全部替换', () => {
    const wrapper = mount(UDatePicker, {
      props: { modelValue: '2024-05-01 08:05', type: 'datetime', format: 'YYYY-MM-DD (MM月) HH:mm HH时' },
      global,
    });

    expect(wrapper.find('.u-date-picker__text').text()).toBe('2024-05-01 (05月) 08:05 08时');
  });

  it('打开后默认定位到今天，确认输出 YYYY-MM-DD', async () => {
    const wrapper = mount(UDatePicker, { props: { modelValue: '', start: '2020-01-01', end: '2030-12-31' }, global });

    await wrapper.find('.u-date-picker__field').trigger('click');
    expect(columnTexts(wrapper).map(column => column.length)).toEqual([11, 12, 31]);
    expect(pickerIndexes(wrapper)).toEqual([4, 4, 14]);

    await scrollTo(wrapper, [5, 1, 9]);
    await confirm(wrapper);

    expect(wrapper.emitted('update:modelValue')).toEqual([['2025-02-10']]);
    expect(wrapper.emitted('change')).toEqual([['2025-02-10']]);
    expect(wrapper.find('.popup').exists()).toBe(false);
  });

  it('切换到小月时日期截断到当月最后一天', async () => {
    const wrapper = mount(UDatePicker, {
      props: { modelValue: '2024-01-31', start: '2024-01-01', end: '2024-12-31' },
      global,
    });

    await wrapper.find('.u-date-picker__field').trigger('click');
    await scrollTo(wrapper, [0, 1, 30]);

    expect(columnTexts(wrapper)[2]).toHaveLength(29);
    await confirm(wrapper);
    expect(wrapper.emitted('update:modelValue')).toEqual([['2024-02-29']]);
  });

  it('start/end 所在年月只保留范围内的月份和日期', async () => {
    const wrapper = mount(UDatePicker, {
      props: { modelValue: '2024-03-20', start: '2024-03-10', end: '2025-02-05' },
      global,
    });

    await wrapper.find('.u-date-picker__field').trigger('click');
    expect(columnTexts(wrapper)[1][0]).toBe('03月');
    expect(columnTexts(wrapper)[2][0]).toBe('10日');

    await scrollTo(wrapper, [1, 0, 0]);
    expect(columnTexts(wrapper)[1]).toEqual(['01月', '02月']);
  });

  it('time 类型输出 HH:mm', async () => {
    const wrapper = mount(UDatePicker, { props: { modelValue: '08:05', type: 'time' }, global });
    expect(wrapper.find('.u-date-picker__text').text()).toBe('08:05');

    await wrapper.find('.u-date-picker__field').trigger('click');
    expect(columnTexts(wrapper).map(column => column.length)).toEqual([24, 60]);
    expect(pickerIndexes(wrapper)).toEqual([8, 5]);

    await scrollTo(wrapper, [18, 45]);
    await confirm(wrapper);
    expect(wrapper.emitted('update:modelValue')).toEqual([['18:45']]);
  });

  it('datetime 类型输出 YYYY-MM-DD HH:mm', async () => {
    const wrapper = mount(UDatePicker, {
      props: { modelValue: '', type: 'datetime', start: '2024-01-01 00:00' },
      global,
    });

    await wrapper.find('.u-date-picker__field').trigger('click');
    expect(columnTexts(wrapper)).toHaveLength(5);
    await confirm(wrapper);

    expect(wrapper.emitted('update:modelValue')).toEqual([['2024-05-15 09:30']]);
  });

  it('daterange 分别选择开始和结束，确认时按先后排序', async () => {
    const wrapper = mount(UDatePicker, {
      props: { modelValue: [], type: 'daterange', start: '2024-01-01', end: '2024-12-31' },
      global,
    });

    await wrapper.find('.u-date-picker__field').trigger('click');
    await scrollTo(wrapper, [0, 5, 0]);
    await wrapper.findAll('.u-date-picker__tab')[1].trigger('click');
    expect(wrapper.findAll('.u-date-picker__tab')[1].classes()).toContain('u-date-picker__tab--active');
    await scrollTo(wrapper, [0, 0, 0]);
    await confirm(wrapper);

    expect(wrapper.emitted('update:modelValue')).toEqual([[['2024-01-01', '2024-06-01']]]);
  });

  it('daterange 有值时用分隔文字连接', () => {
    const wrapper = mount(UDatePicker, {
      props: { modelValue: ['2024-01-01', '2024-01-07'], type: 'daterange', rangeSeparator: ' ~ ' },
      global,
    });

    expect(wrapper.find('.u-date-picker__text').text()).toBe('2024-01-01 ~ 2024-01-07');
  });

  it('点击清除图标清空值，禁用时不显示清除且不打开', async () => {
    const wrapper = mount(UDatePicker, { props: { modelValue: '2024-05-01' }, global });

    await wrapper.find('.u-date-picker__suffix').trigger('click');
    expect(wrapper.emitted('update:modelValue')).toEqual([['']]);
    expect(wrapper.find('.popup').exists()).toBe(false);

    await wrapper.setProps({ disabled: true });
    expect(wrapper.classes()).toContain('u-date-picker--disabled');
    await wrapper.find('.u-date-picker__field').trigger('click');
    expect(wrapper.find('.popup').exists()).toBe(false);
  });

  it('取消时不更新值', async () => {
    const wrapper = mount(UDatePicker, { props: { modelValue: '' }, global });

    await wrapper.find('.u-date-picker__field').trigger('click');
    await wrapper.find('.u-date-picker__action').trigger('click');

    expect(wrapper.find('.popup').exists()).toBe(false);
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });

  it('在 UFormItem 内使用无边框样式，确认后按 change 时机校验', async () => {
    const model = reactive({ date: '' });
    const rules = {
      date: { validator: (value: unknown) => value === '2024-05-16' || '日期不可选', trigger: 'change' as const },
    };
    const wrapper = mount(
      defineComponent({
        components: { UForm, UFormItem, UDatePicker },
        setup: () => ({ model, rules }),
        template: `
          <UForm :model="model" :rules="rules">
            <UFormItem label="日期" prop="date"><UDatePicker v-model="model.date" /></UFormItem>
          </UForm>
        `,
      }),
      { global: { ...global, stubs: { ...global.stubs, 'uni-forms-item': { template: '<div><slot /></div>' } } } },
    );

    expect(wrapper.find('.u-date-picker').classes()).toContain('u-date-picker--plain');
    await wrapper.find('.u-date-picker__field').trigger('click');
    await confirm(wrapper);
    await nextTick();
    await flushPromises();

    expect(model.date).toBe('2024-05-15');
    expect(wrapper.find('.u-form-item__error').text()).toBe('日期不可选');
  });

  function mountInForm(rules: Record<string, unknown>) {
    const model = reactive({ date: '' });
    const wrapper = mount(
      defineComponent({
        components: { UForm, UFormItem, UDatePicker },
        setup: () => ({ model, rules }),
        template: `
          <UForm :model="model" :rules="rules">
            <UFormItem label="日期" prop="date"><UDatePicker v-model="model.date" /></UFormItem>
          </UForm>
        `,
      }),
      { global: { ...global, stubs: { ...global.stubs, 'uni-forms-item': { template: '<div><slot /></div>' } } } },
    );
    return { model, wrapper };
  }

  it('在 UFormItem 内确认关闭弹层后执行 blur 规则', async () => {
    const validator = vi.fn((value: unknown) => value === '2024-05-16' || '日期不可选');
    const { model, wrapper } = mountInForm({ date: { validator, trigger: 'blur' } });

    await wrapper.find('.u-date-picker__field').trigger('click');
    await flushPromises();
    expect(validator).not.toHaveBeenCalled();

    await confirm(wrapper);
    await nextTick();
    await flushPromises();

    expect(model.date).toBe('2024-05-15');
    expect(validator).toHaveBeenCalledTimes(1);
    expect(wrapper.find('.u-form-item__error').text()).toBe('日期不可选');
  });

  it('在 UFormItem 内取消关闭弹层后执行 blur 规则', async () => {
    const { wrapper } = mountInForm({ date: { required: true, message: '请选择日期', trigger: 'blur' } });

    await wrapper.find('.u-date-picker__field').trigger('click');
    await flushPromises();
    expect(wrapper.find('.u-form-item__error').exists()).toBe(false);

    await wrapper.find('.u-date-picker__action').trigger('click');
    await nextTick();
    await flushPromises();

    expect(wrapper.find('.u-form-item__error').text()).toBe('请选择日期');
  });

  it('点遮罩关闭弹层时通知表单项失焦', async () => {
    const onBlur = vi.fn();
    const wrapper = mount(UDatePicker, {
      props: { modelValue: '' },
      global: { ...global, provide: { [U_FORM_ITEM_KEY]: { onBlur } } },
    });

    await wrapper.find('.u-date-picker__field').trigger('click');
    expect(onBlur).not.toHaveBeenCalled();

    wrapper.findComponent(UPopupStub).vm.$emit('update:modelValue', false);
    await nextTick();

    expect(onBlur).toHaveBeenCalledTimes(1);
    expect(wrapper.find('.popup').exists()).toBe(false);
  });
});
