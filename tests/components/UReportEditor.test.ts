import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { defineComponent, h } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import UReportEditor from '@/components/UReportEditor/index.vue';
import { showToast } from '@/utils/toast';

const api = vi.hoisted(() => ({ createQuestionReport: vi.fn() }));

vi.mock('@/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@/api')>()),
  ...api,
}));

vi.mock('@/utils/toast', () => ({ showToast: vi.fn() }));

const UPopupStub = defineComponent({
  props: { modelValue: Boolean },
  setup(props, { slots }) {
    return () => (props.modelValue ? h('div', { class: 'popup' }, slots.default?.()) : null);
  },
});

const URadioGroupStub = defineComponent({
  props: { modelValue: { type: String, default: '' }, options: { type: Array, default: () => [] } },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () =>
      h(
        'div',
        (props.options as { label: string; value: string }[]).map(option =>
          h(
            'span',
            {
              class: ['radio', { checked: option.value === props.modelValue }],
              onClick: () => emit('update:modelValue', option.value),
            },
            option.label,
          ),
        ),
      );
  },
});

const UTextareaStub = defineComponent({
  props: { modelValue: { type: String, default: '' }, placeholder: { type: String, default: '' } },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () =>
      h('textarea', {
        value: props.modelValue,
        placeholder: props.placeholder,
        onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLTextAreaElement).value),
      });
  },
});

const UButtonStub = defineComponent({
  props: { text: { type: String, default: '' } },
  emits: ['click'],
  setup(props, { emit }) {
    return () => h('button', { onClick: () => emit('click') }, props.text);
  },
});

const global = {
  stubs: { UPopup: UPopupStub, URadioGroup: URadioGroupStub, UTextarea: UTextareaStub, UButton: UButtonStub },
};

function mountEditor(questionId = 'q1') {
  return mount(UReportEditor, { props: { modelValue: true, questionId }, global });
}

async function chooseReason(wrapper: ReturnType<typeof mountEditor>, label: string) {
  await wrapper
    .findAll('.radio')
    .find(item => item.text() === label)!
    .trigger('click');
}

beforeEach(() => {
  setActivePinia(createPinia());
  api.createQuestionReport.mockReset();
  vi.mocked(showToast).mockReset();
});

describe('UReportEditor', () => {
  it('展示四种纠错原因', () => {
    const wrapper = mountEditor();

    expect(wrapper.findAll('.radio').map(item => item.text())).toEqual(['答案错误', '解析错误', '题干错别字', '其他']);
  });

  it('未选择原因时提示且不提交', async () => {
    const wrapper = mountEditor();

    await wrapper.find('button').trigger('click');
    await flushPromises();

    expect(showToast).toHaveBeenCalledWith('请选择纠错原因');
    expect(api.createQuestionReport).not.toHaveBeenCalled();
  });

  it('选择其他时说明必填', async () => {
    const wrapper = mountEditor();

    await chooseReason(wrapper, '其他');
    expect(wrapper.find('textarea').attributes('placeholder')).toContain('必填');
    await wrapper.find('button').trigger('click');
    await flushPromises();

    expect(showToast).toHaveBeenCalledWith('请填写问题说明');
    expect(api.createQuestionReport).not.toHaveBeenCalled();
  });

  it('提交成功后提示并关闭弹层', async () => {
    api.createQuestionReport.mockResolvedValueOnce({});
    const wrapper = mountEditor();

    await chooseReason(wrapper, '答案错误');
    await wrapper.find('textarea').setValue('正确答案应为 B');
    await wrapper.find('button').trigger('click');
    await flushPromises();

    expect(api.createQuestionReport).toHaveBeenCalledWith('q1', { reason: 'answer_wrong', content: '正确答案应为 B' });
    expect(showToast).toHaveBeenCalledWith({ title: '提交成功，感谢反馈', icon: 'success' });
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]]);
    expect(wrapper.emitted('submitted')).toEqual([['q1']]);
  });

  it('提交失败时保持弹层打开', async () => {
    api.createQuestionReport.mockRejectedValueOnce(new Error('network'));
    const wrapper = mountEditor();

    await chooseReason(wrapper, '解析错误');
    await wrapper.find('button').trigger('click');
    await flushPromises();

    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });

  it('重新打开时清空表单', async () => {
    const wrapper = mountEditor();
    await chooseReason(wrapper, '其他');
    await wrapper.find('textarea').setValue('说明');

    await wrapper.setProps({ modelValue: false });
    await wrapper.setProps({ modelValue: true });

    expect(wrapper.find('.checked').exists()).toBe(false);
    expect((wrapper.find('textarea').element as HTMLTextAreaElement).value).toBe('');
  });
});
