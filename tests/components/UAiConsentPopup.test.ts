import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { ApiError, ConsentType } from '@/api';
import { showToast } from '@/utils/toast';

const consent = vi.hoisted(() => ({
  agree: vi.fn(),
  version: '1.0',
  currentVersion: vi.fn(),
}));
const api = vi.hoisted(() => ({ getConfig: vi.fn() }));

vi.mock('@/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@/api')>()),
  ...api,
}));

vi.mock('@/store/modules/consent', () => ({ useConsentStore: () => consent }));

vi.mock('@/utils/toast', () => ({ showToast: vi.fn() }));

const UPopupStub = defineComponent({
  props: { modelValue: Boolean },
  setup(props, { slots }) {
    return () => (props.modelValue ? h('div', { class: 'popup' }, slots.default?.()) : null);
  },
});

const UButtonStub = defineComponent({
  props: { text: { type: String, default: '' }, disabled: Boolean },
  emits: ['click'],
  setup(props, { emit }) {
    return () => h('button', { disabled: props.disabled, onClick: () => emit('click') }, props.text);
  },
});

const USkeletonStub = defineComponent({
  setup: () => () => h('div', { class: 'skeleton' }),
});

const MpHtmlStub = defineComponent({
  props: { content: { type: String, default: '' } },
  setup: props => () => h('div', { class: 'mp-html', innerHTML: props.content }),
});

const { default: UAiConsentPopup } = await import('@/components/UAiConsentPopup/index.vue');
const { default: UAgreementContent } = await import('@/components/UAgreementContent/index.vue');
const { invalidateAgreementContent } = await import('@/composables/useAgreementContent');

function configOf(html: string) {
  return { key: 'agreement.aiService', value: { value: html }, isPublic: true, createdAt: null, updatedAt: null };
}

function mountPopup(modelValue = true) {
  return mount(UAiConsentPopup, {
    props: { modelValue },
    global: {
      components: { UAgreementContent },
      stubs: { UPopup: UPopupStub, UButton: UButtonStub, USkeleton: USkeletonStub, 'mp-html': MpHtmlStub },
    },
  });
}

function agreeButton(wrapper: ReturnType<typeof mountPopup>) {
  return wrapper.findAll('button')[0];
}

beforeEach(() => {
  consent.agree.mockReset();
  consent.version = '1.0';
  consent.currentVersion.mockImplementation(() => consent.version);
  vi.mocked(showToast).mockClear();
  invalidateAgreementContent(ConsentType.AI_SERVICE);
  api.getConfig.mockReset();
  api.getConfig.mockRejectedValue(new ApiError('configNotFound', 404));
});

describe('UAiConsentPopup', () => {
  it('打开时读取 AI 服务声明配置并展示', async () => {
    api.getConfig.mockResolvedValue(configOf('<p>远程 AI 服务声明</p>'));
    const wrapper = mountPopup();
    await flushPromises();

    expect(api.getConfig).toHaveBeenCalledWith('agreement.aiService', expect.anything());
    expect(wrapper.find('.mp-html').html()).toContain('<p>远程 AI 服务声明</p>');
  });

  it('未配置时展示内置声明', async () => {
    const wrapper = mountPopup();
    await flushPromises();

    expect(wrapper.text()).toContain('回答内容由 AI 生成');
    expect(agreeButton(wrapper).attributes('disabled')).toBeUndefined();
  });

  it('正文加载中显示骨架并禁用同意', async () => {
    api.getConfig.mockReturnValue(new Promise(() => {}));
    const wrapper = mountPopup();
    await flushPromises();

    expect(wrapper.find('.skeleton').exists()).toBe(true);
    expect(agreeButton(wrapper).attributes('disabled')).toBeDefined();
  });

  it('网络失败时显示重试并禁用同意，点击重试后恢复', async () => {
    api.getConfig.mockRejectedValueOnce(new Error('network'));
    api.getConfig.mockResolvedValueOnce(configOf('<p>远程 AI 服务声明</p>'));
    const wrapper = mountPopup();
    await flushPromises();

    expect(wrapper.text()).toContain('加载失败，点击重试');
    expect(agreeButton(wrapper).attributes('disabled')).toBeDefined();

    await wrapper.find('.u-agreement-content__error').trigger('click');
    await flushPromises();

    expect(wrapper.find('.mp-html').html()).toContain('<p>远程 AI 服务声明</p>');
    expect(agreeButton(wrapper).attributes('disabled')).toBeUndefined();
  });

  it('未打开时不读取配置，打开后读取', async () => {
    const wrapper = mountPopup(false);
    await flushPromises();
    expect(api.getConfig).not.toHaveBeenCalled();

    await wrapper.setProps({ modelValue: true });
    await flushPromises();
    expect(api.getConfig).toHaveBeenCalledTimes(1);
  });

  it('同意后上报 AI 服务声明并关闭', async () => {
    consent.agree.mockResolvedValue(true);
    const wrapper = mountPopup();
    await flushPromises();
    await agreeButton(wrapper).trigger('click');
    await flushPromises();

    expect(consent.agree).toHaveBeenCalledWith([ConsentType.AI_SERVICE]);
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]]);
    expect(wrapper.emitted('result')).toEqual([[true]]);
  });

  it('声明版本已更新时提示、重新拉取正文并保持打开', async () => {
    api.getConfig.mockResolvedValueOnce(configOf('<p>旧版声明</p>'));
    api.getConfig.mockResolvedValueOnce(configOf('<p>新版声明</p>'));
    consent.agree.mockImplementation(async () => {
      consent.version = '2.0';
      return false;
    });
    const wrapper = mountPopup();
    await flushPromises();
    expect(wrapper.find('.mp-html').html()).toContain('旧版声明');

    await agreeButton(wrapper).trigger('click');
    await flushPromises();

    expect(showToast).toHaveBeenCalled();
    expect(api.getConfig).toHaveBeenCalledTimes(2);
    expect(wrapper.find('.mp-html').html()).toContain('新版声明');
    expect(wrapper.emitted('result')).toBeUndefined();
  });

  it('暂不使用时关闭并返回未同意', async () => {
    const wrapper = mountPopup();
    await wrapper.findAll('button')[1].trigger('click');

    expect(consent.agree).not.toHaveBeenCalled();
    expect(wrapper.emitted('result')).toEqual([[false]]);
  });
});
