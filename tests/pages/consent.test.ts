import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { DEFAULT_SITE_PROFILE } from '@/constants';
import { useAppProfileStore } from '@/store/modules/app-profile';

vi.mock('@dcloudio/uni-app', () => ({ onLoad: vi.fn() }));
vi.mock('@/store/modules/global', () => ({ useGlobalStore: () => ({ themeClass: '' }) }));
vi.mock('@/store/modules/consent', () => ({
  useConsentStore: () => ({ required: [], isUpgrade: () => false, agree: vi.fn() }),
}));
vi.mock('@/composables', () => ({ useRouter: () => ({ push: vi.fn() }) }));

const { default: ConsentPage } = await import('@/pages/consent/index.vue');

function mountPage() {
  return mount(ConsentPage, { global: { stubs: { UNavBar: true, UButton: true } } });
}

beforeEach(() => {
  setActivePinia(createPinia());
});

describe('协议同意页', () => {
  it('欢迎语使用默认产品名称', () => {
    const wrapper = mountPage();

    expect(wrapper.find('.consent-content').text()).toContain(`欢迎使用${DEFAULT_SITE_PROFILE.appName}！`);
  });

  it('欢迎语使用后台配置的产品名称', () => {
    useAppProfileStore().remote = { appName: '新名称' };
    const wrapper = mountPage();

    expect(wrapper.find('.consent-content').text()).toContain('欢迎使用新名称！');
  });
});
