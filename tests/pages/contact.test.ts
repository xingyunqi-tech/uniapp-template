import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { DEFAULT_SITE_PROFILE } from '@/constants';
import { useAppProfileStore } from '@/store/modules/app-profile';

vi.mock('@/store/modules/global', () => ({ useGlobalStore: () => ({ themeClass: '' }) }));

const UMenuItemStub = defineComponent({
  props: { title: { type: String, default: '' }, rightText: { type: String, default: '' } },
  emits: ['click'],
  setup:
    (props, { emit }) =>
    () =>
      h('button', { class: 'menu-item', 'data-title': props.title, onClick: () => emit('click') }, props.rightText),
});

const PassThrough = defineComponent({
  setup:
    (_, { slots }) =>
    () =>
      h('div', slots.default?.()),
});

const { default: ContactPage } = await import('@/pages-sub/other/contact/index.vue');

function mountPage() {
  return mount(ContactPage, {
    global: { stubs: { UMenuItem: UMenuItemStub, UMenuGroup: PassThrough, UPrivacyPopup: true } },
  });
}

function findItem(wrapper: ReturnType<typeof mountPage>, title: string) {
  return wrapper.find(`.menu-item[data-title="${title}"]`);
}

beforeEach(() => {
  setActivePinia(createPinia());
  Object.assign(uni, {
    makePhoneCall: vi.fn(),
    setClipboardData: vi.fn(({ success }: { success?: () => void }) => success?.()),
  });
});

describe('联系客服页', () => {
  it('未配置时显示默认客服电话与服务时间，不显示客服邮箱', async () => {
    const wrapper = mountPage();

    expect(wrapper.find('.header-desc').text()).toBe(DEFAULT_SITE_PROFILE.serviceHours);
    expect(findItem(wrapper, '客服热线').text()).toBe(DEFAULT_SITE_PROFILE.servicePhone);
    expect(findItem(wrapper, '客服邮箱').exists()).toBe(false);

    await findItem(wrapper, '客服热线').trigger('click');
    expect(uni.makePhoneCall).toHaveBeenCalledWith(
      expect.objectContaining({ phoneNumber: DEFAULT_SITE_PROFILE.servicePhone }),
    );
  });

  it('使用后台配置的客服电话拨打并显示服务时间', async () => {
    useAppProfileStore().remote = { servicePhone: '4000000000', serviceHours: '全天 24 小时' };
    const wrapper = mountPage();

    expect(wrapper.find('.header-desc').text()).toBe('全天 24 小时');
    await findItem(wrapper, '客服热线').trigger('click');

    expect(uni.makePhoneCall).toHaveBeenCalledWith(expect.objectContaining({ phoneNumber: '4000000000' }));
  });

  it('拨号时去除客服电话中的空格与连字符，展示保持原样', async () => {
    useAppProfileStore().remote = { servicePhone: '400 000-0000' };
    const wrapper = mountPage();

    expect(findItem(wrapper, '客服热线').text()).toBe('400 000-0000');
    await findItem(wrapper, '客服热线').trigger('click');

    expect(uni.makePhoneCall).toHaveBeenCalledWith(expect.objectContaining({ phoneNumber: '4000000000' }));
  });

  it('配置客服邮箱时显示一行，点击复制邮箱', async () => {
    useAppProfileStore().remote = { serviceEmail: 'kf@example.com' };
    const wrapper = mountPage();

    const item = findItem(wrapper, '客服邮箱');
    expect(item.text()).toBe('kf@example.com');
    await item.trigger('click');

    expect(uni.setClipboardData).toHaveBeenCalledWith(expect.objectContaining({ data: 'kf@example.com' }));
  });
});
