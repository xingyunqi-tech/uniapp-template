import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import USwipeAction from '@/components/USwipeAction/index.vue';

const createGroupStub = () => {
  const closeAll = vi.fn();
  const stub = defineComponent({
    setup(_, { slots, expose }) {
      expose({ closeAll });
      return () => h('div', { class: 'uni-swipe-action' }, slots.default?.());
    },
  });
  return { stub, closeAll };
};

const ItemStub = defineComponent({
  name: 'UniSwipeActionItem',
  props: {
    rightOptions: { type: Array, default: () => [] },
    disabled: { type: Boolean, default: false },
  },
  emits: ['click', 'change'],
  setup(_, { slots }) {
    return () => h('div', { class: 'uni-swipe-action-item' }, slots.default?.());
  },
});

function mountSwipe(props: Record<string, unknown> = {}) {
  const group = createGroupStub();
  const wrapper = mount(USwipeAction, {
    props,
    slots: { default: '<span class="content">内容</span>' },
    global: { stubs: { 'uni-swipe-action': group.stub, 'uni-swipe-action-item': ItemStub } },
  });
  return { wrapper, closeAll: group.closeAll, item: wrapper.findComponent(ItemStub) };
}

function setTopPage(page: object | undefined) {
  vi.mocked(getCurrentPages).mockReturnValue((page ? [page] : []) as unknown as ReturnType<typeof getCurrentPages>);
}

afterEach(() => {
  setTopPage(undefined);
});

describe('USwipeAction', () => {
  it('按钮按 type 使用主题色，自定义 style 覆盖默认值', () => {
    const { item } = mountSwipe({
      options: [
        { text: '删除', type: 'danger' },
        { text: '收藏', type: 'primary' },
        { text: '更多', style: { color: 'var(--color-text)' } },
      ],
    });

    expect(item.props('rightOptions')).toEqual([
      {
        text: '删除',
        style: {
          backgroundColor: 'var(--color-error)',
          color: 'var(--color-text-inverse)',
          fontSize: 'var(--font-size-base)',
        },
      },
      {
        text: '收藏',
        style: {
          backgroundColor: 'var(--color-primary)',
          color: 'var(--color-text-inverse)',
          fontSize: 'var(--font-size-base)',
        },
      },
      {
        text: '更多',
        style: { backgroundColor: 'var(--color-info)', color: 'var(--color-text)', fontSize: 'var(--font-size-base)' },
      },
    ]);
  });

  it('渲染内容插槽并透传 disabled', () => {
    const { wrapper, item } = mountSwipe({ disabled: true });

    expect(wrapper.find('.u-swipe-action__content .content').text()).toBe('内容');
    expect(item.props('disabled')).toBe(true);
  });

  it('点击按钮触发 click 并默认收起', () => {
    const options = [{ text: '删除', type: 'danger' }];
    const { wrapper, item, closeAll } = mountSwipe({ options });

    item.vm.$emit('click', { index: 0, content: {}, position: 'right' });

    expect(wrapper.emitted('click')).toEqual([[{ index: 0, option: options[0] }]]);
    expect(closeAll).toHaveBeenCalledTimes(1);
  });

  it('autoClose 为 false 时点击按钮不收起', () => {
    const { item, closeAll } = mountSwipe({ options: [{ text: '删除' }], autoClose: false });

    item.vm.$emit('click', { index: 0 });

    expect(closeAll).not.toHaveBeenCalled();
  });

  it('展开与收起分别触发 open / close', () => {
    const { wrapper, item } = mountSwipe();

    item.vm.$emit('change', 'right');
    item.vm.$emit('change', 'none');

    expect(wrapper.emitted('open')).toHaveLength(1);
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('展开一个实例时收起其他已展开的实例', () => {
    const first = mountSwipe();
    const second = mountSwipe();

    first.item.vm.$emit('change', 'right');
    second.item.vm.$emit('change', 'right');

    expect(first.closeAll).toHaveBeenCalledTimes(1);
    expect(second.closeAll).not.toHaveBeenCalled();
  });

  it('不同页面各自保留一个展开的实例', () => {
    setTopPage({ route: 'pages/a/index' });
    const first = mountSwipe();
    setTopPage({ route: 'pages/b/index' });
    const second = mountSwipe();

    first.item.vm.$emit('change', 'right');
    second.item.vm.$emit('change', 'right');

    expect(first.closeAll).not.toHaveBeenCalled();
    expect(second.closeAll).not.toHaveBeenCalled();
  });

  it('同一页面展开另一个实例时收起前一个', () => {
    const page = { route: 'pages/a/index' };
    setTopPage(page);
    const first = mountSwipe();
    const second = mountSwipe();
    setTopPage({ route: 'pages/b/index' });

    first.item.vm.$emit('change', 'right');
    second.item.vm.$emit('change', 'right');

    expect(first.closeAll).toHaveBeenCalledTimes(1);
    expect(second.closeAll).not.toHaveBeenCalled();
  });

  it('close 方法收起按钮', () => {
    const { wrapper, closeAll } = mountSwipe();

    (wrapper.vm as unknown as { close: () => void }).close();

    expect(closeAll).toHaveBeenCalledTimes(1);
  });
});
