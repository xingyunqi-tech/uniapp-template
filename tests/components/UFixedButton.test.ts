import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import UFixedButton from '@/components/UFixedButton/index.vue';

const UButtonStub = defineComponent({
  name: 'UButton',
  props: {
    type: { type: String, default: '' },
    block: Boolean,
    text: { type: String, default: '' },
    loading: Boolean,
    disabled: Boolean,
  },
  emits: ['click'],
  setup(props, { emit }) {
    return () => h('button', { class: 'btn', onClick: () => emit('click') }, props.text);
  },
});

const global = { stubs: { UButton: UButtonStub } };

let barHeight = 0;
const createSelectorQuery = vi.fn(() => {
  const query = {
    in: () => query,
    select: () => query,
    boundingClientRect: (callback: (rect: { height: number }) => void) => {
      callback({ height: barHeight });
      return query;
    },
    exec: vi.fn(),
  };
  return query;
});

beforeEach(() => {
  barHeight = 0;
  createSelectorQuery.mockClear();
  (uni as unknown as { createSelectorQuery: typeof createSelectorQuery }).createSelectorQuery = createSelectorQuery;
});

describe('UFixedButton', () => {
  it('默认渲染撑满的主色按钮与默认文字', () => {
    const wrapper = mount(UFixedButton, { global });

    expect(wrapper.findComponent(UButtonStub).props()).toMatchObject({ type: 'primary', block: true, text: '确定' });
  });

  it('加载中显示加载文字并透传 loading', () => {
    const wrapper = mount(UFixedButton, { props: { loading: true, loadingText: '保存中' }, global });

    expect(wrapper.findComponent(UButtonStub).props()).toMatchObject({ text: '保存中', loading: true });
  });

  it('点击按钮触发 click', async () => {
    const wrapper = mount(UFixedButton, { global });

    await wrapper.find('.btn').trigger('click');

    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('禁用或加载中时点击不触发 click', async () => {
    const disabled = mount(UFixedButton, { props: { disabled: true }, global });
    const loading = mount(UFixedButton, { props: { loading: true }, global });

    await disabled.find('.btn').trigger('click');
    await loading.find('.btn').trigger('click');

    expect(disabled.emitted('click')).toBeUndefined();
    expect(loading.emitted('click')).toBeUndefined();
  });

  it('默认渲染占位元素，高度取固定按钮区实际高度', async () => {
    barHeight = 80;
    const wrapper = mount(UFixedButton, { global });
    await flushPromises();

    expect((wrapper.find('.u-fixed-button__placeholder').element as HTMLElement).style.height).toBe('80px');
  });

  it('按钮区内容更新后重新测量占位高度', async () => {
    barHeight = 80;
    const wrapper = mount(UFixedButton, { props: { text: '提交' }, global });
    await flushPromises();

    barHeight = 120;
    await wrapper.setProps({ text: '再次提交' });
    await flushPromises();

    expect((wrapper.find('.u-fixed-button__placeholder').element as HTMLElement).style.height).toBe('120px');
  });

  it('首次未取到高度时重试测量', async () => {
    vi.useFakeTimers();
    const wrapper = mount(UFixedButton, { global });
    await flushPromises();
    expect((wrapper.find('.u-fixed-button__placeholder').element as HTMLElement).style.height).toBe('');

    barHeight = 90;
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect((wrapper.find('.u-fixed-button__placeholder').element as HTMLElement).style.height).toBe('90px');
  });

  it('placeholder 为 false 时不渲染占位元素也不测量', async () => {
    const wrapper = mount(UFixedButton, { props: { placeholder: false }, global });
    await flushPromises();

    expect(wrapper.find('.u-fixed-button__placeholder').exists()).toBe(false);
    expect(createSelectorQuery).not.toHaveBeenCalled();
  });

  it('默认插槽替换按钮区内容', () => {
    const wrapper = mount(UFixedButton, { slots: { default: '<view class="custom">自定义</view>' }, global });

    expect(wrapper.find('.u-fixed-button__bar .custom').text()).toBe('自定义');
    expect(wrapper.findComponent(UButtonStub).exists()).toBe(false);
  });
});
