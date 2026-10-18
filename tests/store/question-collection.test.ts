import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { nextTick } from 'vue';
import type { FavoriteItemDto, QuestionNoteItemDto } from '@/api';

const api = vi.hoisted(() => ({
  checkFavorite: vi.fn(),
  toggleFavorite: vi.fn(),
  getFavorites: vi.fn(),
  getMyQuestionNotes: vi.fn(),
  saveQuestionNote: vi.fn(),
  deleteQuestionNote: vi.fn(),
  deleteFavorite: vi.fn(),
}));

vi.mock('@/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@/api')>()),
  ...api,
}));

const { NOTE_MAX_LENGTH, useQuestionCollectionStore } = await import('@/store/modules/question-collection');
const { useUserStore } = await import('@/store/modules/user');

function favorite(targetId: string): FavoriteItemDto {
  return {
    id: Number(targetId.replace(/\D/g, '')) || 1,
    userId: 1,
    targetType: 'question',
    targetId,
    title: `题目 ${targetId}`,
    subjectId: 's1',
    createdAt: '2026-10-16T00:00:00.000Z',
    targetOffline: false,
  };
}

function noteItem(questionId: string, content = '笔记'): QuestionNoteItemDto {
  return {
    questionId,
    subjectId: 's1',
    content,
    createdAt: '2026-10-16T00:00:00.000Z',
    updatedAt: '2026-10-16T00:00:00.000Z',
    question: null,
  };
}

function page<T>(list: T[]) {
  return { list, total: list.length, page: 1, limit: 20, totalPages: 1 };
}

beforeEach(() => {
  setActivePinia(createPinia());
  Object.values(api).forEach(fn => fn.mockReset());
  useUserStore().token = 'token';
});

describe('question-collection store 收藏', () => {
  it('查询收藏状态后缓存，force 时重新查询', async () => {
    const store = useQuestionCollectionStore();
    api.checkFavorite.mockResolvedValue({ isFavorited: true });

    expect(await store.isFavorited('q1')).toBe(true);
    await store.isFavorited('q1');
    await store.isFavorited('q1', true);

    expect(api.checkFavorite).toHaveBeenCalledTimes(2);
    expect(api.checkFavorite).toHaveBeenCalledWith({ targetType: 'question', targetId: 'q1' }, { showError: false });
  });

  it('列表按题目类型与科目请求，并写入收藏状态', async () => {
    const store = useQuestionCollectionStore();
    api.getFavorites.mockResolvedValueOnce(page([favorite('q1')]));

    await store.setFavoriteFilter({ subjectId: 's1' });

    expect(api.getFavorites).toHaveBeenCalledWith(
      expect.objectContaining({ targetType: 'question', subjectId: 's1', page: 1 }),
    );
    expect(store.favoriteOf('q1')).toBe(true);
  });

  it('切换到试卷收藏时按试卷类型请求，不写入题目收藏状态', async () => {
    const store = useQuestionCollectionStore();
    api.getFavorites.mockResolvedValueOnce(page([{ ...favorite('p1'), targetType: 'paper' }]));

    await store.setFavoriteFilter({ type: 'paper' });

    expect(api.getFavorites).toHaveBeenCalledWith(expect.objectContaining({ targetType: 'paper', page: 1 }));
    expect(store.favoriteOf('p1')).toBeUndefined();
  });

  it('按收藏记录删除后从列表移除并把状态置为未收藏', async () => {
    const store = useQuestionCollectionStore();
    api.getFavorites.mockResolvedValueOnce(page([favorite('q1'), favorite('q2')]));
    api.deleteFavorite.mockResolvedValueOnce(undefined);
    await store.fetchFavorites(true);

    await store.removeFavorite(store.favorites[0]);

    expect(api.deleteFavorite).toHaveBeenCalledWith(1);
    expect(store.favorites.map(item => item.targetId)).toEqual(['q2']);
    expect(store.favoriteOf('q1')).toBe(false);
  });

  it('题目 id 不区分大小写', async () => {
    const store = useQuestionCollectionStore();
    api.checkFavorite.mockResolvedValueOnce({ isFavorited: true });

    await store.isFavorited('ABC');

    expect(await store.isFavorited('abc')).toBe(true);
    expect(store.favoriteOf('Abc')).toBe(true);
    expect(api.checkFavorite).toHaveBeenCalledTimes(1);
  });

  it('退出登录时未返回的收藏请求不写入缓存', async () => {
    const store = useQuestionCollectionStore();
    let resolveCheck: (value: { isFavorited: boolean }) => void = () => undefined;
    let resolveToggle: (value: { isFavorited: boolean }) => void = () => undefined;
    api.checkFavorite.mockReturnValueOnce(new Promise(resolve => (resolveCheck = resolve)));
    api.toggleFavorite.mockReturnValueOnce(new Promise(resolve => (resolveToggle = resolve)));

    const checking = store.isFavorited('q1');
    const toggling = store.toggle('q2');
    useUserStore().token = '';
    await nextTick();
    resolveCheck({ isFavorited: true });
    resolveToggle({ isFavorited: true });
    await Promise.all([checking, toggling]);

    expect(store.favoriteStatus).toEqual({});
    expect(store.favoritesDirty).toBe(false);
  });

  it('取消收藏时从列表移除', async () => {
    const store = useQuestionCollectionStore();
    api.getFavorites.mockResolvedValueOnce(page([favorite('q1'), favorite('q2')]));
    api.toggleFavorite.mockResolvedValueOnce({ isFavorited: false });
    await store.fetchFavorites(true);

    expect(await store.toggle('q1')).toBe(false);

    expect(api.toggleFavorite).toHaveBeenCalledWith({ targetType: 'question', targetId: 'q1' });
    expect(store.favorites.map(item => item.targetId)).toEqual(['q2']);
    expect(store.favoriteOf('q1')).toBe(false);
  });

  it('新增收藏后标记列表待刷新，刷新后清除标记', async () => {
    const store = useQuestionCollectionStore();
    api.toggleFavorite.mockResolvedValueOnce({ isFavorited: true });
    api.getFavorites.mockResolvedValueOnce(page([favorite('q1')]));

    await store.toggle('q1');
    expect(store.favoritesDirty).toBe(true);
    await store.fetchFavorites(true);

    expect(store.favoritesDirty).toBe(false);
  });
});

describe('question-collection store 笔记', () => {
  it('按题目查询笔记并缓存，没有笔记时缓存为 null', async () => {
    const store = useQuestionCollectionStore();
    api.getMyQuestionNotes.mockResolvedValueOnce(page([noteItem('q1', '易错')])).mockResolvedValueOnce(page([]));

    expect((await store.fetchNote('q1'))?.content).toBe('易错');
    expect(await store.fetchNote('q2')).toBeNull();
    await store.fetchNote('q2');

    expect(api.getMyQuestionNotes).toHaveBeenCalledWith({ questionId: 'q1', limit: 1 }, { showError: false });
    expect(api.getMyQuestionNotes).toHaveBeenCalledTimes(2);
    expect(store.notes.q2).toBeNull();
  });

  it('保存时去除首尾空白并更新列表中的笔记', async () => {
    const store = useQuestionCollectionStore();
    api.getMyQuestionNotes.mockResolvedValueOnce(page([noteItem('q1', '旧')]));
    api.saveQuestionNote.mockResolvedValueOnce({ ...noteItem('q1', '新'), question: undefined });
    await store.fetchNotes(true);

    await store.saveNote('q1', '  新  ');

    expect(api.saveQuestionNote).toHaveBeenCalledWith('q1', { content: '新' });
    expect(store.noteList[0].content).toBe('新');
    expect(store.notes.q1?.content).toBe('新');
  });

  it('列表外新增笔记时标记列表待刷新', async () => {
    const store = useQuestionCollectionStore();
    api.saveQuestionNote.mockResolvedValueOnce(noteItem('q1'));

    await store.saveNote('q1', '思路');

    expect(store.notesDirty).toBe(true);
  });

  it('内容为空时删除已有笔记', async () => {
    const store = useQuestionCollectionStore();
    api.getMyQuestionNotes.mockResolvedValueOnce(page([noteItem('q1')]));
    api.deleteQuestionNote.mockResolvedValueOnce(undefined);
    await store.fetchNotes(true);

    expect(await store.saveNote('q1', '   ')).toBeNull();

    expect(api.saveQuestionNote).not.toHaveBeenCalled();
    expect(api.deleteQuestionNote).toHaveBeenCalledWith('q1');
    expect(store.noteList).toHaveLength(0);
    expect(store.notes.q1).toBeNull();
  });

  it('内容为空且没有笔记时不发请求', async () => {
    const store = useQuestionCollectionStore();

    await store.saveNote('q1', '');

    expect(api.deleteQuestionNote).not.toHaveBeenCalled();
  });

  it('超过字数上限时不发请求并抛错', async () => {
    const store = useQuestionCollectionStore();

    await expect(store.saveNote('q1', 'a'.repeat(NOTE_MAX_LENGTH + 1))).rejects.toThrow();
    expect(api.saveQuestionNote).not.toHaveBeenCalled();
  });

  it('列表按科目请求', async () => {
    const store = useQuestionCollectionStore();
    api.getMyQuestionNotes.mockResolvedValueOnce(page([]));

    await store.setNoteSubject('s2');

    expect(api.getMyQuestionNotes).toHaveBeenCalledWith(expect.objectContaining({ subjectId: 's2', page: 1 }));
  });

  it('退出登录时未返回的笔记请求不写入缓存', async () => {
    const store = useQuestionCollectionStore();
    let resolveNote: (value: unknown) => void = () => undefined;
    let resolveSave: (value: unknown) => void = () => undefined;
    api.getMyQuestionNotes.mockReturnValueOnce(new Promise(resolve => (resolveNote = resolve)));
    api.saveQuestionNote.mockReturnValueOnce(new Promise(resolve => (resolveSave = resolve)));

    const fetching = store.fetchNote('q1');
    const saving = store.saveNote('q2', '思路');
    useUserStore().token = '';
    await nextTick();
    resolveNote(page([noteItem('q1')]));
    resolveSave(noteItem('q2', '思路'));
    await Promise.all([fetching, saving]);

    expect(store.notes).toEqual({});
    expect(store.notesDirty).toBe(false);
  });

  it('退出登录后清空收藏状态与笔记', async () => {
    const store = useQuestionCollectionStore();
    api.checkFavorite.mockResolvedValueOnce({ isFavorited: true });
    await store.isFavorited('q1');

    useUserStore().token = '';
    await nextTick();

    expect(store.favoriteStatus).toEqual({});
    expect(store.notes).toEqual({});
  });
});
