import { beforeAll, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import UImageUpload, { type FileItem, type UploadFn } from '@/components/UImageUpload/index.vue';

const FilePickerStub = defineComponent({
  props: {
    modelValue: { type: Array, default: () => [] },
    limit: { type: Number, default: 9 },
    imageStyles: { type: Object, default: () => ({}) },
    fileExtname: { type: Array, default: undefined },
    autoUpload: { type: Boolean, default: true },
    sizeType: { type: Array, default: undefined },
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

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function selectFiles(wrapper: ReturnType<typeof mount>, names: string[]) {
  wrapper.findComponent(FilePickerStub).vm.$emit('select', {
    tempFilePaths: names.map(name => `/tmp/${name}.png`),
    tempFiles: names.map(file),
  });
}

function pickerFiles(wrapper: ReturnType<typeof mount>) {
  return wrapper.findComponent(FilePickerStub).props('modelValue') as FileItem[];
}

const flush = () => new Promise(resolve => setTimeout(resolve));

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

  it('图片类型默认限制常见图片扩展名', () => {
    const wrapper = mount(UImageUpload, { global });

    expect(wrapper.findComponent(FilePickerStub).props('fileExtname')).toEqual(['png', 'jpg', 'jpeg', 'gif', 'webp']);
  });

  it.each(['video', 'all'] as const)('%s 类型默认不限制扩展名', mediaType => {
    const wrapper = mount(UImageUpload, { props: { mediaType }, global });

    expect(wrapper.findComponent(FilePickerStub).props('fileExtname')).toEqual([]);
  });

  it('sizeType 默认原图与压缩图均可，传入时以传入值为准', () => {
    const uploadFn: UploadFn = async () => '';
    const sizeTypeOf = (props: Record<string, unknown>) =>
      mount(UImageUpload, { props, global }).findComponent(FilePickerStub).props('sizeType');

    expect(sizeTypeOf({})).toEqual(['original', 'compressed']);
    expect(sizeTypeOf({ uploadFn })).toEqual(['original', 'compressed']);
    expect(sizeTypeOf({ sizeType: ['original'], uploadFn })).toEqual(['original']);
  });

  it('传入 fileExtname 时按传入值过滤', () => {
    const wrapper = mount(UImageUpload, { props: { mediaType: 'video', fileExtname: ['mp4'] }, global });

    expect(wrapper.findComponent(FilePickerStub).props('fileExtname')).toEqual(['mp4']);
  });

  it('clear 清空已选图片并同步到 v-model', async () => {
    const wrapper = mount(UImageUpload, { props: { modelValue: [file('a')] }, global });

    (wrapper.vm as unknown as { clear: () => void }).clear();
    await wrapper.vm.$nextTick();

    expect(wrapper.findComponent(FilePickerStub).props('modelValue')).toEqual([]);
    expect(wrapper.emitted('update:modelValue')?.slice(-1)[0]).toEqual([[]]);
  });

  it('未传 uploadFn 时沿用 autoUpload，选择文件不改动列表', async () => {
    const wrapper = mount(UImageUpload, { props: { autoUpload: true }, global });

    selectFiles(wrapper, ['a']);
    await flush();

    expect(wrapper.findComponent(FilePickerStub).props('autoUpload')).toBe(true);
    expect(pickerFiles(wrapper)).toEqual([]);
  });

  it('传入 uploadFn 时关闭自动上传，选择后上传并回写地址与状态', async () => {
    const task = deferred<string>();
    let reportProgress: (percent: number) => void = () => {};
    const uploadFn = vi.fn<UploadFn>((_file, onProgress) => {
      reportProgress = onProgress;
      return task.promise;
    });
    const wrapper = mount(UImageUpload, { props: { autoUpload: true, uploadFn }, global });

    expect(wrapper.findComponent(FilePickerStub).props('autoUpload')).toBe(false);

    selectFiles(wrapper, ['a']);
    await flush();

    expect(uploadFn).toHaveBeenCalledWith(expect.objectContaining({ url: '/tmp/a.png' }), expect.any(Function));
    expect(pickerFiles(wrapper)[0]).toMatchObject({ status: 'uploading', progress: 0 });

    reportProgress(5);
    await flush();
    expect(pickerFiles(wrapper)[0].progress).toBe(0);

    reportProgress(42.4);
    await flush();
    expect(pickerFiles(wrapper)[0].progress).toBe(42);

    task.resolve('https://cdn.example.com/a.png');
    await flush();

    expect(pickerFiles(wrapper)[0]).toMatchObject({
      url: 'https://cdn.example.com/a.png',
      status: 'success',
      progress: 100,
    });
    expect(wrapper.emitted('upload-success')?.[0][0]).toMatchObject({ url: 'https://cdn.example.com/a.png' });
    expect(wrapper.emitted('update:modelValue')?.slice(-1)[0][0]).toEqual(pickerFiles(wrapper));
  });

  it('同时最多上传 3 个文件，完成一个后继续上传排队的文件', async () => {
    const tasks: ReturnType<typeof deferred<string>>[] = [];
    const uploadFn = vi.fn<UploadFn>(() => {
      const task = deferred<string>();
      tasks.push(task);
      return task.promise;
    });
    const wrapper = mount(UImageUpload, { props: { uploadFn }, global });

    selectFiles(wrapper, ['a', 'b', 'c', 'd', 'e']);
    await flush();

    expect(uploadFn).toHaveBeenCalledTimes(3);
    expect(pickerFiles(wrapper).map(item => item.status)).toEqual([
      'uploading',
      'uploading',
      'uploading',
      'ready',
      'ready',
    ]);

    tasks[0].resolve('https://cdn.example.com/a.png');
    await flush();

    expect(uploadFn).toHaveBeenCalledTimes(4);
    expect(uploadFn.mock.calls[3][0].url).toBe('/tmp/d.png');
  });

  it('上传失败时移出列表并触发 upload-fail', async () => {
    const error = new Error('network');
    const uploadFn = vi.fn<UploadFn>(() => Promise.reject(error));
    const wrapper = mount(UImageUpload, { props: { modelValue: [file('x')], uploadFn }, global });

    selectFiles(wrapper, ['a']);
    await flush();

    expect(pickerFiles(wrapper)).toEqual([file('x')]);
    expect(wrapper.emitted('upload-fail')?.[0]).toEqual([
      expect.objectContaining({ url: '/tmp/a.png', status: 'error' }),
      error,
    ]);
    expect(uni.showToast).toHaveBeenCalledWith({ title: '上传失败', icon: 'none' });
  });

  it('组件卸载后不再上传排队中的文件', async () => {
    const tasks: ReturnType<typeof deferred<string>>[] = [];
    const uploadFn = vi.fn<UploadFn>(() => {
      const task = deferred<string>();
      tasks.push(task);
      return task.promise;
    });
    const wrapper = mount(UImageUpload, { props: { uploadFn }, global });

    selectFiles(wrapper, ['a', 'b', 'c', 'd', 'e']);
    await flush();
    wrapper.unmount();
    tasks.forEach(task => task.resolve('https://cdn.example.com/x.png'));
    await flush();

    expect(uploadFn).toHaveBeenCalledTimes(3);
  });

  it('排队中的文件被删除后不再上传', async () => {
    const task = deferred<string>();
    const uploadFn = vi.fn<UploadFn>(() => task.promise);
    const wrapper = mount(UImageUpload, { props: { uploadFn }, global });

    selectFiles(wrapper, ['a', 'b', 'c', 'd']);
    await flush();
    const remaining = pickerFiles(wrapper).filter(item => item.name !== 'd');
    wrapper.findComponent(FilePickerStub).vm.$emit('update:modelValue', remaining);
    await flush();

    task.resolve('https://cdn.example.com/x.png');
    await flush();

    expect(uploadFn).toHaveBeenCalledTimes(3);
  });
});
