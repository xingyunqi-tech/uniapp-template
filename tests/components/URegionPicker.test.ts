import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import URegionPicker, { type RegionValue } from '@/components/URegionPicker/index.vue';
import { U_FORM_ITEM_KEY } from '@/components/UForm/context';

const names: Record<string, string> = {
  '110000': '北京市',
  '110100': '市辖区',
  '110101': '东城区',
};

const regionStore = {
  regionTree: [{ value: '110000', text: '北京市' }],
  fetchRegionTree: vi.fn(() => Promise.resolve([])),
  codesToNames: vi.fn(() => Promise.resolve({ province: '', city: '', district: '' })),
  codesToNamesSync: vi.fn((province: string, city: string, district: string) => ({
    province: names[province] ?? '',
    city: names[city] ?? '',
    district: names[district] ?? '',
  })),
};

vi.mock('@/store/modules/region', () => ({
  useRegionStore: () => regionStore,
}));

const DataPickerStub = defineComponent({
  props: {
    localdata: { type: Array, default: () => [] },
    popupTitle: { type: String, default: '' },
    value: { type: Array, default: () => [] },
    readonly: { type: Boolean, default: false },
  },
  emits: ['change'],
  setup(_, { slots }) {
    return () => h('div', { class: 'data-picker' }, slots.default?.());
  },
});

const global = { stubs: { 'uni-data-picker': DataPickerStub, 'uni-icons': true } };

const empty: RegionValue = { province: '', city: '', district: '' };
const beijing: RegionValue = { province: '110000', city: '110100', district: '110101' };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('URegionPicker', () => {
  it('挂载时加载地区树并传给 uni-data-picker', () => {
    const wrapper = mount(URegionPicker, { props: { modelValue: empty, title: '选择地区' }, global });
    const picker = wrapper.findComponent(DataPickerStub);

    expect(regionStore.fetchRegionTree).toHaveBeenCalledTimes(1);
    expect(picker.props('localdata')).toEqual(regionStore.regionTree);
    expect(picker.props('popupTitle')).toBe('选择地区');
    expect(picker.props('value')).toEqual([]);
  });

  it('根节点 u-region-picker 包裹 uni-data-picker，自定义插槽时同样保留', () => {
    const wrapper = mount(URegionPicker, {
      props: { modelValue: empty },
      slots: { default: '<i class="custom" />' },
      global,
    });

    expect(wrapper.classes()).toContain('u-region-picker');
    expect(wrapper.find('.u-region-picker .data-picker').exists()).toBe(true);
  });

  it('未选择时显示占位文字', () => {
    const wrapper = mount(URegionPicker, { props: { modelValue: empty, placeholder: '请选择' }, global });

    expect(wrapper.find('.u-region-picker__text').text()).toBe('请选择');
    expect(wrapper.find('.u-region-picker__text--placeholder').exists()).toBe(true);
  });

  it('已选择时显示省市区名称并补齐名称缓存', () => {
    const wrapper = mount(URegionPicker, { props: { modelValue: beijing }, global });

    expect(wrapper.find('.u-region-picker__text').text()).toBe('北京市 市辖区 东城区');
    expect(wrapper.findComponent(DataPickerStub).props('value')).toEqual(['110000', '110100', '110101']);
    expect(regionStore.codesToNames).toHaveBeenCalledWith('110000', '110100', '110101');
  });

  it('编码不完整时不请求名称', () => {
    mount(URegionPicker, { props: { modelValue: { ...beijing, district: '' } }, global });

    expect(regionStore.codesToNames).not.toHaveBeenCalled();
  });

  it('选择完成后更新编码并带上名称', () => {
    const wrapper = mount(URegionPicker, { props: { modelValue: empty }, global });

    wrapper.findComponent(DataPickerStub).vm.$emit('change', {
      detail: {
        value: [
          { value: '110000', text: '北京市' },
          { value: '110100', text: '市辖区' },
          { value: '110101', text: '东城区' },
        ],
      },
    });

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([beijing]);
    expect(wrapper.emitted('change')?.[0]).toEqual([
      { value: beijing, names: { province: '北京市', city: '市辖区', district: '东城区' } },
    ]);
  });

  it('未选到区级时不更新', () => {
    const wrapper = mount(URegionPicker, { props: { modelValue: empty }, global });

    wrapper.findComponent(DataPickerStub).vm.$emit('change', {
      detail: { value: [{ value: '110000', text: '北京市' }] },
    });

    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });

  it('作用域插槽提供名称文本，替换默认展示', () => {
    const wrapper = mount(URegionPicker, {
      props: { modelValue: beijing, separator: '/' },
      slots: { default: '<template #default="{ text }"><i class="custom">{{ text }}</i></template>' },
      global,
    });

    expect(wrapper.find('.custom').text()).toBe('北京市/市辖区/东城区');
    expect(wrapper.find('.u-region-picker__field').exists()).toBe(false);
  });

  it('禁用时 uni-data-picker 只读，禁用样式只加在内置展示区域', () => {
    const wrapper = mount(URegionPicker, { props: { modelValue: empty, disabled: true }, global });

    expect(wrapper.findComponent(DataPickerStub).props('readonly')).toBe(true);
    expect(wrapper.find('.u-region-picker__field').classes()).toContain('u-region-picker__field--disabled');
    expect(wrapper.classes()).toEqual(['u-region-picker']);
  });

  it('自定义插槽禁用时外层容器不带禁用样式', () => {
    const wrapper = mount(URegionPicker, {
      props: { modelValue: empty, disabled: true },
      slots: { default: '<i class="custom" />' },
      global,
    });

    expect(wrapper.findComponent(DataPickerStub).props('readonly')).toBe(true);
    expect(wrapper.classes()).toEqual(['u-region-picker']);
  });

  it('在 UFormItem 内时外层容器带 in-form-item 类，独立使用时不带', () => {
    const standalone = mount(URegionPicker, { props: { modelValue: empty }, global });
    expect(standalone.classes()).not.toContain('u-region-picker--in-form-item');

    const inFormItem = mount(URegionPicker, {
      props: { modelValue: empty },
      global: { ...global, provide: { [U_FORM_ITEM_KEY]: { onBlur: vi.fn() } } },
    });
    expect(inFormItem.classes()).toContain('u-region-picker--in-form-item');
  });

  it('地区树加载失败时不抛出', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    regionStore.fetchRegionTree.mockReturnValueOnce(Promise.reject(new Error('network')));

    mount(URegionPicker, { props: { modelValue: empty }, global });
    await flushPromises();

    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
