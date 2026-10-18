import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { defineComponent, h } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import UNoteEditor from '@/components/UNoteEditor/index.vue';
import { useQuestionCollectionStore } from '@/store/modules/question-collection';

const api = vi.hoisted(() => ({
  saveQuestionNote: vi.fn(),
  deleteQuestionNote: vi.fn(),
  getMyQuestionNotes: vi.fn(),
}));

const modal = vi.hoisted(() => ({ confirm: vi.fn() }));

vi.mock('@/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@/api')>()),
  ...api,
}));

vi.mock('@/utils/modal', () => modal);

const UPopupStub = defineComponent({
  props: { modelValue: Boolean },
  setup(props, { slots }) {
    return () => (props.modelValue ? h('div', { class: 'popup' }, slots.default?.()) : null);
  },
});

const UTextareaStub = defineComponent({
  props: { modelValue: { type: String, default: '' } },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () =>
      h('textarea', {
        value: props.modelValue,
        onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLTextAreaElement).value),
      });
  },
});

const UButtonStub = defineComponent({
  props: { text: { type: String, default: '' }, disabled: Boolean },
  emits: ['click'],
  setup(props, { emit }) {
    return () => h('button', { disabled: props.disabled, onClick: () => emit('click') }, props.text);
  },
});

const global = { stubs: { UPopup: UPopupStub, UTextarea: UTextareaStub, UButton: UButtonStub } };

function savedNote(content: string) {
  return {
    questionId: 'q1',
    subjectId: 's1',
    content,
    createdAt: '2026-10-16T00:00:00.000Z',
    updatedAt: '2026-10-16T00:00:00.000Z',
  };
}

function button(wrapper: ReturnType<typeof mount>, text: string) {
  return wrapper.findAll('button').find(item => item.text() === text);
}

beforeEach(() => {
  setActivePinia(createPinia());
  Object.values(api).forEach(fn => fn.mockReset());
  modal.confirm.mockReset();
});

describe('UNoteEditor', () => {
  it('打开时填入已有笔记，未修改时不能保存', async () => {
    useQuestionCollectionStore().notes = { q1: savedNote('旧笔记') };

    const wrapper = mount(UNoteEditor, { props: { modelValue: true, questionId: 'q1' }, global });

    expect((wrapper.find('textarea').element as HTMLTextAreaElement).value).toBe('旧笔记');
    expect(button(wrapper, '保存')?.attributes('disabled')).toBeDefined();
    expect(button(wrapper, '删除')).toBeDefined();
  });

  it('保存后关闭弹层', async () => {
    useQuestionCollectionStore().notes = { q1: null };
    api.saveQuestionNote.mockResolvedValueOnce(savedNote('新笔记'));
    const wrapper = mount(UNoteEditor, { props: { modelValue: true, questionId: 'q1' }, global });

    await wrapper.find('textarea').setValue('新笔记');
    await button(wrapper, '保存')!.trigger('click');
    await flushPromises();

    expect(api.saveQuestionNote).toHaveBeenCalledWith('q1', { content: '新笔记' });
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]]);
    expect(button(wrapper, '删除')).toBeDefined();
  });

  it('确认后删除笔记', async () => {
    useQuestionCollectionStore().notes = { q1: savedNote('旧笔记') };
    modal.confirm.mockResolvedValueOnce(true);
    api.deleteQuestionNote.mockResolvedValueOnce(undefined);
    const wrapper = mount(UNoteEditor, { props: { modelValue: true, questionId: 'q1' }, global });

    await button(wrapper, '删除')!.trigger('click');
    await flushPromises();

    expect(api.deleteQuestionNote).toHaveBeenCalledWith('q1');
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]]);
  });

  it('取消确认时不删除', async () => {
    useQuestionCollectionStore().notes = { q1: savedNote('旧笔记') };
    modal.confirm.mockResolvedValueOnce(false);
    const wrapper = mount(UNoteEditor, { props: { modelValue: true, questionId: 'q1' }, global });

    await button(wrapper, '删除')!.trigger('click');
    await flushPromises();

    expect(api.deleteQuestionNote).not.toHaveBeenCalled();
  });

  it('笔记未加载时加载中禁用保存，返回后回填内容', async () => {
    let resolve: (value: unknown) => void = () => undefined;
    api.getMyQuestionNotes.mockReturnValueOnce(new Promise(r => (resolve = r)));
    const wrapper = mount(UNoteEditor, { props: { modelValue: true, questionId: 'q1' }, global });

    expect(api.getMyQuestionNotes).toHaveBeenCalledWith({ questionId: 'q1', limit: 1 }, { showError: false });
    expect(button(wrapper, '保存')?.attributes('disabled')).toBeDefined();
    resolve({ list: [{ ...savedNote('已有笔记'), question: null }], total: 1, page: 1, limit: 1, totalPages: 1 });
    await flushPromises();

    expect((wrapper.find('textarea').element as HTMLTextAreaElement).value).toBe('已有笔记');
    expect(button(wrapper, '删除')).toBeDefined();
  });

  it('笔记返回前已输入内容时不覆盖输入', async () => {
    let resolve: (value: unknown) => void = () => undefined;
    api.getMyQuestionNotes.mockReturnValueOnce(new Promise(r => (resolve = r)));
    const wrapper = mount(UNoteEditor, { props: { modelValue: true, questionId: 'q1' }, global });

    await wrapper.find('textarea').setValue('新输入');
    resolve({ list: [{ ...savedNote('已有笔记'), question: null }], total: 1, page: 1, limit: 1, totalPages: 1 });
    await flushPromises();

    expect((wrapper.find('textarea').element as HTMLTextAreaElement).value).toBe('新输入');
    expect(button(wrapper, '保存')?.attributes('disabled')).toBeUndefined();
  });

  it('没有笔记时不显示删除按钮', () => {
    useQuestionCollectionStore().notes = { q1: null };
    const wrapper = mount(UNoteEditor, { props: { modelValue: true, questionId: 'q1' }, global });

    expect(button(wrapper, '删除')).toBeUndefined();
  });
});
