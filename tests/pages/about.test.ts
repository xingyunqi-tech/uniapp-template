import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { DEFAULT_SITE_PROFILE, PAGES } from '@/constants';
import { useAppProfileStore } from '@/store/modules/app-profile';

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

beforeEach(() => {
  setActivePinia(createPinia());
});

describe('关于我们页', () => {
  it('未配置时显示默认产品名称与版权，版权含公司名称时不重复显示公司名称', () => {
    const wrapper = mountPage();

    expect(wrapper.find('.app-name').text()).toBe(DEFAULT_SITE_PROFILE.appName);
    expect(wrapper.findAll('.copyright-text').map(node => node.text())).toEqual([DEFAULT_SITE_PROFILE.copyright]);
    expect(wrapper.find('.icp-link').text()).toBe(DEFAULT_SITE_PROFILE.icpLicense);
  });

  it('显示后台配置的产品名称、公司名称、版权与备案号', () => {
    useAppProfileStore().remote = {
      appName: '新名称',
      companyName: '新公司',
      copyright: 'Copyright © 2026',
      icpLicense: '京ICP备00000000号',
    };
    const wrapper = mountPage();

    expect(wrapper.find('.app-name').text()).toBe('新名称');
    expect(wrapper.findAll('.copyright-text').map(node => node.text())).toEqual(['新公司', 'Copyright © 2026']);
    expect(wrapper.find('.icp-link').text()).toBe('京ICP备00000000号');
  });

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
