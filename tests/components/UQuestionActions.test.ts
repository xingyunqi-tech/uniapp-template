import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { flushPromises, mount } from '@vue/test-utils';
import UQuestionActions from '@/components/UQuestionActions/index.vue';

const api = vi.hoisted(() => ({
  checkFavorite: vi.fn(),
  toggleFavorite: vi.fn(),
  getMyQuestionNotes: vi.fn(),
}));

vi.mock('@/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@/api')>()),
  ...api,
}));

function note(questionId: string, content: string) {
  return {
    questionId,
    subjectId: 's1',
    content,
    createdAt: '2026-10-16T00:00:00.000Z',
    updatedAt: '2026-10-16T00:00:00.000Z',
    question: null,
  };
}

async function mountActions(questionId = 'q1') {
  const wrapper = mount(UQuestionActions, { props: { questionId } });
  await flushPromises();
  return wrapper;
}

beforeEach(() => {
  setActivePinia(createPinia());
  Object.values(api).forEach(fn => fn.mockReset());
  api.checkFavorite.mockResolvedValue({ isFavorited: false });
  api.getMyQuestionNotes.mockResolvedValue({ list: [], total: 0, page: 1, limit: 1, totalPages: 0 });
});

describe('UQuestionActions', () => {
  it('挂载后查询收藏状态与笔记', async () => {
    const wrapper = await mountActions();

    expect(api.checkFavorite).toHaveBeenCalledWith({ targetType: 'question', targetId: 'q1' }, { showError: false });
    expect(api.getMyQuestionNotes).toHaveBeenCalledWith({ questionId: 'q1', limit: 1 }, { showError: false });
    expect(wrapper.text()).toContain('收藏');
    expect(wrapper.text()).toContain('写笔记');
  });

  it('已收藏且有笔记时显示已收藏与笔记内容', async () => {
    api.checkFavorite.mockResolvedValue({ isFavorited: true });
    api.getMyQuestionNotes.mockResolvedValue({
      list: [note('q1', '注意单位')],
      total: 1,
      page: 1,
      limit: 1,
      totalPages: 1,
    });

    const wrapper = await mountActions();

    expect(wrapper.text()).toContain('已收藏');
    expect(wrapper.text()).toContain('编辑笔记');
    expect(wrapper.find('.u-question-actions__note-content').text()).toBe('注意单位');
  });

  it('点击收藏切换状态并提示', async () => {
    api.toggleFavorite.mockResolvedValueOnce({ isFavorited: true });
    const wrapper = await mountActions();

    await wrapper.findAll('.u-question-actions__item')[0].trigger('click');
    await flushPromises();

    expect(api.toggleFavorite).toHaveBeenCalledWith({ targetType: 'question', targetId: 'q1' });
    expect(wrapper.text()).toContain('已收藏');
    expect(uni.showToast).toHaveBeenCalledWith(expect.objectContaining({ title: '已收藏' }));
  });

  it('点击笔记按钮触发 edit-note', async () => {
    const wrapper = await mountActions('q9');

    await wrapper.findAll('.u-question-actions__item')[1].trigger('click');

    expect(wrapper.emitted('edit-note')).toEqual([['q9']]);
  });
});
