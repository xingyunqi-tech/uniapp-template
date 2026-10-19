import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { ApiError, ConsentType } from '@/api';
import { DEFAULT_AGREEMENT_CONTENT } from '@/constants/agreement';

const api = vi.hoisted(() => ({ getConfig: vi.fn() }));
const page = vi.hoisted(() => ({ onLoad: null as ((query?: Record<string, string>) => void) | null }));
const consent = vi.hoisted(() => ({ versions: {} as Record<string, string> }));

vi.mock('@/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@/api')>()),
  ...api,
}));

vi.mock('@dcloudio/uni-app', () => ({
  onLoad: (callback: (query?: Record<string, string>) => void) => {
    page.onLoad = callback;
  },
}));

vi.mock('@/store/modules/global', () => ({ useGlobalStore: () => ({ themeClass: '' }) }));

vi.mock('@/store/modules/consent', () => ({
  useConsentStore: () => ({ currentVersion: (type: string) => consent.versions[type] ?? null }),
}));

const USkeletonStub = defineComponent({
  setup: () => () => h('div', { class: 'skeleton' }),
});

const MpHtmlStub = defineComponent({
  props: { content: { type: String, default: '' } },
  setup: props => () => h('div', { class: 'mp-html', innerHTML: props.content }),
});

const setNavigationBarTitle = vi.fn();

const { default: AgreementPage } = await import('@/pages/agreement/index.vue');
const { default: UAgreementContent } = await import('@/components/UAgreementContent/index.vue');
const { invalidateAgreementContent } = await import('@/composables/useAgreementContent');

function configOf(key: string, html: string) {
  return { key, value: { value: html }, isPublic: true, createdAt: null, updatedAt: null };
}

function openPage(query?: Record<string, string>) {
  const wrapper = mount(AgreementPage, {
    global: { components: { UAgreementContent }, stubs: { USkeleton: USkeletonStub, 'mp-html': MpHtmlStub } },
  });
  page.onLoad?.(query);
  return wrapper;
}

beforeEach(() => {
  page.onLoad = null;
  consent.versions = {};
  setNavigationBarTitle.mockReset();
  (uni as unknown as { setNavigationBarTitle: typeof setNavigationBarTitle }).setNavigationBarTitle =
    setNavigationBarTitle;
  Object.values(ConsentType).forEach(invalidateAgreementContent);
  api.getConfig.mockReset();
  api.getConfig.mockImplementation((key: string) => Promise.resolve(configOf(key, `<p>${key}</p>`)));
});

describe('协议详情页', () => {
  it.each([
    ['user', '用户协议', 'agreement.userAgreement'],
    ['privacy', '隐私政策', 'agreement.privacyPolicy'],
    ['ai', 'AI 服务声明', 'agreement.aiService'],
  ])('type=%s 展示%s配置正文', async (type, title, key) => {
    const wrapper = openPage({ type });
    await flushPromises();

    expect(setNavigationBarTitle).toHaveBeenCalledWith({ title });
    expect(wrapper.find('.mp-html').html()).toContain(`<p>${key}</p>`);
  });

  it('未知 type 按用户协议展示', async () => {
    const wrapper = openPage({ type: 'other' });
    await flushPromises();

    expect(setNavigationBarTitle).toHaveBeenCalledWith({ title: '用户协议' });
    expect(wrapper.find('.mp-html').html()).toContain('<p>agreement.userAgreement</p>');
  });

  it('加载中显示骨架屏', async () => {
    api.getConfig.mockReturnValue(new Promise(() => {}));
    const wrapper = openPage({ type: 'user' });
    await flushPromises();

    expect(wrapper.find('.skeleton').exists()).toBe(true);
  });

  it('未配置（404）时展示内置正文', async () => {
    api.getConfig.mockRejectedValue(new ApiError('configNotFound', 404));
    const wrapper = openPage({ type: 'privacy' });
    await flushPromises();

    expect(wrapper.find('.mp-html').element.innerHTML).toBe(DEFAULT_AGREEMENT_CONTENT.PRIVACY_POLICY);
  });

  it('网络失败时显示重试，点击后重新加载', async () => {
    api.getConfig.mockRejectedValueOnce(new Error('network'));
    const wrapper = openPage({ type: 'user' });
    await flushPromises();
    expect(wrapper.text()).toContain('加载失败，点击重试');

    await wrapper.find('.u-agreement-content__error').trigger('click');
    await flushPromises();

    expect(wrapper.find('.mp-html').html()).toContain('<p>agreement.userAgreement</p>');
  });

  it('协议版本更新后重新进入页面展示新版正文', async () => {
    consent.versions.USER_AGREEMENT = '1.0';
    api.getConfig.mockResolvedValueOnce(configOf('agreement.userAgreement', '<p>旧版</p>'));
    api.getConfig.mockResolvedValueOnce(configOf('agreement.userAgreement', '<p>新版</p>'));
    openPage({ type: 'user' });
    await flushPromises();

    consent.versions.USER_AGREEMENT = '2.0';
    const wrapper = openPage({ type: 'user' });
    await flushPromises();

    expect(wrapper.find('.mp-html').html()).toContain('<p>新版</p>');
  });
});
