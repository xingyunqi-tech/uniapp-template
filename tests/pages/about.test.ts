import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import { PAGES } from '@/constants';

const router = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('@dcloudio/uni-app', () => ({ onLoad: vi.fn(), onUnload: vi.fn() }));

vi.mock('@/composables', () => ({
  useRouter: () => router,
  useDialog: () => ({ confirm: vi.fn() }),
}));

vi.mock('@/store/modules/global', () => ({ useGlobalStore: () => ({ themeClass: '' }) }));

const UMenuItemStub = defineComponent({
  props: { title: { type: String, default: '' } },
  emits: ['click'],
  setup:
    (props, { emit }) =>
    () =>
      h('button', { class: 'menu-item', onClick: () => emit('click') }, props.title),
});

const PassThrough = defineComponent({
  setup:
    (_, { slots }) =>
    () =>
      h('div', slots.default?.()),
});

const { default: AboutPage } = await import('@/pages-sub/other/about/index.vue');

function mountPage() {
  return mount(AboutPage, {
    global: { stubs: { UMenuItem: UMenuItemStub, UMenuGroup: PassThrough, UDialog: true } },
  });
}

describe('关于我们页', () => {
  it.each([
    ['用户协议', 'user'],
    ['隐私政策', 'privacy'],
    ['AI 服务声明', 'ai'],
  ])('点击「%s」打开对应协议页', async (title, type) => {
    const wrapper = mountPage();
    const item = wrapper.findAll('.menu-item').find(button => button.text() === title);
    await item?.trigger('click');

    expect(router.push).toHaveBeenLastCalledWith(PAGES.AGREEMENT, { type });
  });
});
