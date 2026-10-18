import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { ConsentType } from '@/api';
import UAiConsentPopup from '@/components/UAiConsentPopup/index.vue';
import { showToast } from '@/utils/toast';

const consent = vi.hoisted(() => ({ agree: vi.fn() }));

vi.mock('@/store/modules/consent', () => ({ useConsentStore: () => consent }));

vi.mock('@/utils/toast', () => ({ showToast: vi.fn() }));

const UPopupStub = defineComponent({
  props: { modelValue: Boolean },
  setup(props, { slots }) {
    return () => (props.modelValue ? h('div', { class: 'popup' }, slots.default?.()) : null);
  },
});

const UButtonStub = defineComponent({
  props: { text: { type: String, default: '' } },
  emits: ['click'],
  setup(props, { emit }) {
    return () => h('button', { onClick: () => emit('click') }, props.text);
  },
});

function mountPopup() {
  return mount(UAiConsentPopup, {
    props: { modelValue: true },
    global: { stubs: { UPopup: UPopupStub, UButton: UButtonStub } },
  });
}

beforeEach(() => {
  consent.agree.mockReset();
  vi.mocked(showToast).mockClear();
});

describe('UAiConsentPopup', () => {
  it('展示 AI 服务声明', () => {
    expect(mountPopup().text()).toContain('回答内容由 AI 生成');
  });

  it('同意后上报 AI 服务声明并关闭', async () => {
    consent.agree.mockResolvedValue(true);
    const wrapper = mountPopup();
    await wrapper.findAll('button')[0].trigger('click');
    await flushPromises();

    expect(consent.agree).toHaveBeenCalledWith([ConsentType.AI_SERVICE]);
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]]);
    expect(wrapper.emitted('result')).toEqual([[true]]);
  });

  it('声明版本已更新时提示并保持打开', async () => {
    consent.agree.mockResolvedValue(false);
    const wrapper = mountPopup();
    await wrapper.findAll('button')[0].trigger('click');
    await flushPromises();

    expect(showToast).toHaveBeenCalled();
    expect(wrapper.emitted('result')).toBeUndefined();
  });

  it('暂不使用时关闭并返回未同意', async () => {
    const wrapper = mountPopup();
    await wrapper.findAll('button')[1].trigger('click');

    expect(consent.agree).not.toHaveBeenCalled();
    expect(wrapper.emitted('result')).toEqual([[false]]);
  });
});
