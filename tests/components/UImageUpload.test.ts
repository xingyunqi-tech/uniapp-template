import { beforeAll, describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import UImageUpload, { type FileItem } from '@/components/UImageUpload/index.vue';

const FilePickerStub = defineComponent({
  props: {
    modelValue: { type: Array, default: () => [] },
    limit: { type: Number, default: 9 },
    imageStyles: { type: Object, default: () => ({}) },
  },
  emits: ['update:modelValue', 'select', 'delete'],
  setup(_, { slots }) {
    return () => h('div', { class: 'file-picker' }, slots.default?.());
  },
});

const global = { stubs: { 'uni-file-picker': FilePickerStub, 'uni-icons': true } };

const file = (name: string): FileItem => ({ name, extname: 'png', url: `/tmp/${name}.png` });

beforeAll(() => {
  (uni as unknown as { upx2px: (value: number) => number }).upx2px = value => value / 2;
});

describe('UImageUpload', () => {
  it('宽高按 rpx 换算为 px 传给 uni-file-picker', () => {
    const wrapper = mount(UImageUpload, { props: { imageWidth: 200, imageHeight: 160, maxCount: 3 }, global });
    const picker = wrapper.findComponent(FilePickerStub);

    expect(picker.props('imageStyles')).toMatchObject({ width: 100, height: 80 });
    expect(picker.props('limit')).toBe(3);
  });

  it('uni-file-picker 中的文件变化时同步到 v-model', async () => {
    const wrapper = mount(UImageUpload, { props: { modelValue: [] }, global });

    wrapper.findComponent(FilePickerStub).vm.$emit('update:modelValue', [file('a')]);
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:modelValue')?.slice(-1)[0]).toEqual([[file('a')]]);
  });

  it('父组件回写同一份数据时不再重复触发更新', async () => {
    const wrapper = mount(UImageUpload, { props: { modelValue: [] }, global });

    wrapper.findComponent(FilePickerStub).vm.$emit('update:modelValue', [file('a')]);
    await wrapper.vm.$nextTick();
    const emitted = wrapper.emitted('update:modelValue')!;
    await wrapper.setProps({ modelValue: emitted[emitted.length - 1][0] as FileItem[] });

    expect(wrapper.emitted('update:modelValue')).toHaveLength(emitted.length);
  });

  it('父组件传入新的列表时同步给 uni-file-picker', async () => {
    const wrapper = mount(UImageUpload, { props: { modelValue: [] }, global });

    await wrapper.setProps({ modelValue: [file('b')] });

    expect(wrapper.findComponent(FilePickerStub).props('modelValue')).toEqual([file('b')]);
  });

  it('转发 select 与 delete 事件', () => {
    const wrapper = mount(UImageUpload, { global });
    const picker = wrapper.findComponent(FilePickerStub);

    picker.vm.$emit('select', { tempFilePaths: ['/tmp/a.png'], tempFiles: [] });
    picker.vm.$emit('delete', { tempFile: file('a') });

    expect(wrapper.emitted('select')).toHaveLength(1);
    expect(wrapper.emitted('delete')).toHaveLength(1);
  });

  it('clear 清空已选图片并同步到 v-model', async () => {
    const wrapper = mount(UImageUpload, { props: { modelValue: [file('a')] }, global });

    (wrapper.vm as unknown as { clear: () => void }).clear();
    await wrapper.vm.$nextTick();

    expect(wrapper.findComponent(FilePickerStub).props('modelValue')).toEqual([]);
    expect(wrapper.emitted('update:modelValue')?.slice(-1)[0]).toEqual([[]]);
  });
});
