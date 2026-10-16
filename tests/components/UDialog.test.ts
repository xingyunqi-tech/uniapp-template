import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils';
import UDialog from '@/components/UDialog/index.vue';
import { useDialog } from '@/composables/useDialog';

const UPopupStub = defineComponent({
  name: 'UPopup',
  props: {
    modelValue: { type: Boolean, default: false },
    type: { type: String, default: '' },
    title: { type: String, default: '' },
    content: { type: String, default: '' },
    dialogType: { type: String, default: '' },
    dialogMode: { type: String, default: '' },
    placeholder: { type: String, default: '' },
    dialogValue: { type: String, default: '' },
    confirmText: { type: String, default: '' },
    cancelText: { type: String, default: '' },
    showCancel: { type: Boolean, default: true },
    beforeConfirm: { type: Function, default: undefined },
  },
  emits: ['confirm', 'close'],
  setup(_, { slots }) {
    return () => h('div', { class: 'popup', 'data-slot': String(!!slots.default) }, slots.default?.());
  },
});

const global = { stubs: { UPopup: UPopupStub } };

enableAutoUnmount(afterEach);

const pageA = { route: 'pages/a' };
const pageB = { route: 'pages/b' };

function setPages(...pages: object[]) {
  vi.mocked(getCurrentPages).mockReturnValue(pages as ReturnType<typeof getCurrentPages>);
}

function popupOf(wrapper: ReturnType<typeof mount>) {
  return wrapper.findComponent(UPopupStub);
}

describe('UDialog', () => {
  beforeEach(() => {
    setPages(pageA);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.mocked(getCurrentPages).mockReturnValue([]);
  });

  it('confirm 打开对话框并传入文案，确认后返回 true', async () => {
    const wrapper = mount(UDialog, { global });
    const result = useDialog().confirm({ title: '提示', content: '确定要取消吗？', confirmText: '取消订单' });
    await nextTick();

    const popup = popupOf(wrapper);
    expect(popup.props()).toMatchObject({
      modelValue: true,
      type: 'dialog',
      title: '提示',
      content: '确定要取消吗？',
      dialogMode: 'base',
      confirmText: '取消订单',
      cancelText: '取消',
    });

    popup.vm.$emit('confirm');
    popup.vm.$emit('close');
    await expect(result).resolves.toBe(true);
  });

  it('取消关闭时返回 false', async () => {
    const wrapper = mount(UDialog, { global });
    const result = useDialog().confirm('确定吗？');
    await nextTick();

    popupOf(wrapper).vm.$emit('close');
    await expect(result).resolves.toBe(false);
  });

  it('beforeConfirm 透传给 UPopup', async () => {
    const wrapper = mount(UDialog, { global });
    const beforeConfirm = vi.fn(() => false);
    useDialog().confirm({ content: '确定吗？', beforeConfirm });
    await nextTick();

    expect(popupOf(wrapper).props('beforeConfirm')).toBe(beforeConfirm);
  });

  it('并发调用按顺序排队，前一个关闭后再弹出下一个', async () => {
    vi.useFakeTimers();
    const wrapper = mount(UDialog, { global });
    const dialog = useDialog();
    const first = dialog.confirm('第一个');
    const second = dialog.confirm('第二个');
    await nextTick();

    expect(wrapper.findAllComponents(UPopupStub)).toHaveLength(1);
    expect(popupOf(wrapper).props('content')).toBe('第一个');

    const firstPopup = popupOf(wrapper).vm;
    firstPopup.$emit('confirm');
    firstPopup.$emit('close');
    await expect(first).resolves.toBe(true);

    vi.advanceTimersByTime(299);
    await flushPromises();
    expect(popupOf(wrapper).props('content')).toBe('第一个');

    vi.advanceTimersByTime(1);
    await flushPromises();
    expect(popupOf(wrapper).props('content')).toBe('第二个');
    expect(popupOf(wrapper).vm).not.toBe(firstPopup);

    popupOf(wrapper).vm.$emit('close');
    await expect(second).resolves.toBe(false);

    vi.advanceTimersByTime(300);
    await nextTick();
    expect(popupOf(wrapper).exists()).toBe(false);
  });

  it('内容相同的调用在前一个未处理完时直接按取消返回，只弹一次', async () => {
    vi.useFakeTimers();
    const wrapper = mount(UDialog, { global });
    const dialog = useDialog();
    const first = dialog.confirm('确定删除吗？');
    const repeated = dialog.confirm('确定删除吗？');
    await nextTick();

    await expect(repeated).resolves.toBe(false);
    popupOf(wrapper).vm.$emit('confirm');
    popupOf(wrapper).vm.$emit('close');
    await expect(first).resolves.toBe(true);

    vi.advanceTimersByTime(300);
    await flushPromises();
    expect(popupOf(wrapper).exists()).toBe(false);

    const again = dialog.confirm('确定删除吗？');
    await nextTick();
    expect(popupOf(wrapper).props('content')).toBe('确定删除吗？');
    popupOf(wrapper).vm.$emit('close');
    await expect(again).resolves.toBe(false);
  });

  it('关闭后切换到下一个调用期间卸载时，下一个调用按取消处理', async () => {
    vi.useFakeTimers();
    const wrapper = mount(UDialog, { global });
    const dialog = useDialog();
    const first = dialog.confirm('第一个');
    const second = dialog.confirm('第二个');
    await nextTick();

    popupOf(wrapper).vm.$emit('close');
    await expect(first).resolves.toBe(false);

    vi.advanceTimersByTime(300);
    wrapper.unmount();
    await expect(second).resolves.toBe(false);
  });

  it('多页面栈下只有栈顶页面的 UDialog 响应组件外的调用', async () => {
    const dialogA = mount(UDialog, { global });
    setPages(pageA, pageB);
    const dialogB = mount(UDialog, { global });

    const result = useDialog().confirm('B 页面的确认');
    await nextTick();

    expect(popupOf(dialogA).exists()).toBe(false);
    expect(popupOf(dialogB).props('content')).toBe('B 页面的确认');

    popupOf(dialogB).vm.$emit('confirm');
    popupOf(dialogB).vm.$emit('close');
    await expect(result).resolves.toBe(true);
  });

  it('组件内的 useDialog 绑定挂载时所在页面，页面被覆盖后仍弹在原页面', async () => {
    let dialog!: ReturnType<typeof useDialog>;
    const PageA = defineComponent({
      setup() {
        dialog = useDialog();
        return () => h(UDialog);
      },
    });
    const pageAWrapper = mount(PageA, { global });

    setPages(pageA, pageB);
    const dialogB = mount(UDialog, { global });

    dialog.confirm('A 页面的确认');
    await nextTick();

    expect(popupOf(pageAWrapper).props('content')).toBe('A 页面的确认');
    expect(popupOf(dialogB).exists()).toBe(false);
  });

  it('按 name 区分同一页面的多个 UDialog', async () => {
    const wrapper = mount(
      defineComponent({
        setup: () => () => [h(UDialog), h(UDialog, { name: 'coupon' })],
      }),
      { global },
    );

    useDialog('coupon').confirm('优惠券');
    await nextTick();

    const popups = wrapper.findAllComponents(UPopupStub);
    expect(popups).toHaveLength(1);
    expect(popups[0].props('content')).toBe('优惠券');
    expect(wrapper.findAll('.u-dialog')[1].findComponent(UPopupStub).exists()).toBe(true);
  });

  it('confirm 显示取消按钮', async () => {
    const wrapper = mount(UDialog, { global });
    useDialog().confirm('确定吗？');
    await nextTick();

    expect(popupOf(wrapper).props('showCancel')).toBe(true);
  });

  it('alert 隐藏取消按钮，确认文字默认「知道了」', async () => {
    const wrapper = mount(UDialog, { global });
    const result = useDialog().alert('操作成功');
    await nextTick();

    expect(popupOf(wrapper).props('showCancel')).toBe(false);
    expect(popupOf(wrapper).props('confirmText')).toBe('知道了');

    popupOf(wrapper).vm.$emit('confirm');
    await expect(result).resolves.toBeUndefined();
  });

  it('prompt 使用输入模式，确认返回输入值，取消返回 null', async () => {
    vi.useFakeTimers();
    const wrapper = mount(UDialog, { global });
    const dialog = useDialog();
    const confirmed = dialog.prompt({ title: '修改昵称', defaultValue: '张三', placeholder: '请输入昵称' });
    await nextTick();

    expect(popupOf(wrapper).props()).toMatchObject({
      title: '修改昵称',
      dialogMode: 'input',
      dialogValue: '张三',
      placeholder: '请输入昵称',
    });
    popupOf(wrapper).vm.$emit('confirm', '李四');
    popupOf(wrapper).vm.$emit('close');
    await expect(confirmed).resolves.toBe('李四');

    vi.advanceTimersByTime(300);
    const cancelled = dialog.prompt('输入备注');
    await nextTick();
    expect(popupOf(wrapper).props('title')).toBe('输入备注');
    popupOf(wrapper).vm.$emit('close');
    await expect(cancelled).resolves.toBeNull();
  });

  it('默认插槽转发给 UPopup，prompt 时不转发', async () => {
    vi.useFakeTimers();
    const wrapper = mount(UDialog, { slots: { default: '<span class="custom">自定义</span>' }, global });
    const dialog = useDialog();

    dialog.confirm({ title: '自定义内容' });
    await nextTick();
    expect(popupOf(wrapper).attributes('data-slot')).toBe('true');
    expect(wrapper.find('.custom').exists()).toBe(true);
    popupOf(wrapper).vm.$emit('close');
    vi.advanceTimersByTime(300);

    dialog.prompt('输入');
    await nextTick();
    expect(popupOf(wrapper).attributes('data-slot')).toBe('false');
  });

  it('卸载时未完成的调用按取消处理并注销', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const showModal = vi.fn((options: UniApp.ShowModalOptions) => options.success?.({ confirm: false } as never));
    (uni as unknown as { showModal: typeof showModal }).showModal = showModal;

    const wrapper = mount(UDialog, { global });
    const dialog = useDialog();
    const first = dialog.confirm('第一个');
    const second = dialog.prompt('第二个');
    await nextTick();

    wrapper.unmount();
    await expect(first).resolves.toBe(false);
    await expect(second).resolves.toBeNull();

    await dialog.confirm('卸载后');
    await flushPromises();
    expect(showModal).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});
