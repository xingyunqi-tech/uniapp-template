import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import {
  CreateFavoriteDtoTargetType,
  checkFavorite,
  deleteFavorite,
  deleteQuestionNote,
  getFavorites,
  getMyQuestionNotes,
  saveQuestionNote,
  toggleFavorite,
  type FavoriteItemDto,
  type QuestionNoteDto,
  type QuestionNoteItemDto,
} from '@/api';
import { createPagedList } from '../helpers/paged-list';
import { useUserStore } from './user';

export const NOTE_MAX_LENGTH = 1000;

export type FavoriteTab = typeof CreateFavoriteDtoTargetType.question | typeof CreateFavoriteDtoTargetType.paper;

const QUESTION = CreateFavoriteDtoTargetType.question;
const PAPER = CreateFavoriteDtoTargetType.paper;
const SILENT = { showError: false };

interface SubjectQuery {
  subjectId?: string;
}

function keyOf(questionId: string): string {
  return questionId.toLowerCase();
}

/** 收藏状态的键：题目为小写 id，试卷为 `paper:` 加小写 id */
function statusKey(targetType: FavoriteTab, targetId: string): string {
  return targetType === QUESTION ? keyOf(targetId) : `${targetType}:${keyOf(targetId)}`;
}

function toNote(item: QuestionNoteItemDto): QuestionNoteDto {
  const { questionId, subjectId, content, createdAt, updatedAt } = item;
  return { questionId, subjectId, content, createdAt, updatedAt };
}

function subjectQuery(subjectId: string): SubjectQuery {
  return subjectId ? { subjectId } : {};
}

export const useQuestionCollectionStore = defineStore('questionCollection', () => {
  const userStore = useUserStore();

  /** 键见 statusKey */
  const favoriteStatus = ref<Record<string, boolean>>({});
  /** 键为小写题目 id，null 表示没有笔记 */
  const notes = ref<Record<string, QuestionNoteDto | null>>({});
  const favoriteType = ref<FavoriteTab>(QUESTION);
  const favoriteSubjectId = ref('');
  const noteSubjectId = ref('');
  /** 列表外有新的收藏或笔记时为 true */
  const favoritesDirty = ref(false);
  const notesDirty = ref(false);
  let generation = 0;

  const favoritePager = createPagedList<FavoriteItemDto, SubjectQuery & { targetType: FavoriteTab }>({
    fetchPage: params => getFavorites(params),
    onPageLoaded: items => {
      const next = { ...favoriteStatus.value };
      items.forEach(item => {
        if (item.targetType === QUESTION || item.targetType === PAPER)
          next[statusKey(item.targetType, item.targetId)] = true;
      });
      favoriteStatus.value = next;
    },
  });
  const notePager = createPagedList<QuestionNoteItemDto, SubjectQuery>({
    fetchPage: params => getMyQuestionNotes(params),
    onPageLoaded: items => {
      const next = { ...notes.value };
      items.forEach(item => (next[keyOf(item.questionId)] = toNote(item)));
      notes.value = next;
    },
  });

  function favoriteOf(questionId: string): boolean | undefined {
    return favoriteStatus.value[statusKey(QUESTION, questionId)];
  }

  function paperFavoriteOf(paperId: string): boolean | undefined {
    return favoriteStatus.value[statusKey(PAPER, paperId)];
  }

  /** undefined 表示尚未加载 */
  function noteOf(questionId: string): QuestionNoteDto | null | undefined {
    return notes.value[keyOf(questionId)];
  }

  function setFavorite(key: string, value: boolean) {
    favoriteStatus.value = { ...favoriteStatus.value, [key]: value };
  }

  function setNote(key: string, note: QuestionNoteDto | null) {
    notes.value = { ...notes.value, [key]: note };
  }

  function fetchFavorites(refresh = false): Promise<FavoriteItemDto[]> {
    if (refresh) favoritesDirty.value = false;
    return favoritePager.load({ targetType: favoriteType.value, ...subjectQuery(favoriteSubjectId.value) }, refresh);
  }

  function fetchNotes(refresh = false): Promise<QuestionNoteItemDto[]> {
    if (refresh) notesDirty.value = false;
    return notePager.load(subjectQuery(noteSubjectId.value), refresh);
  }

  function setFavoriteFilter(filter: { type?: FavoriteTab; subjectId?: string }): Promise<FavoriteItemDto[]> {
    if (filter.type !== undefined) favoriteType.value = filter.type;
    if (filter.subjectId !== undefined) favoriteSubjectId.value = filter.subjectId;
    favoritePager.reset();
    return fetchFavorites(true);
  }

  function setNoteSubject(subjectId: string): Promise<QuestionNoteItemDto[]> {
    noteSubjectId.value = subjectId;
    return fetchNotes(true);
  }

  async function checkTarget(targetType: FavoriteTab, targetId: string, force: boolean): Promise<boolean> {
    const key = statusKey(targetType, targetId);
    const cached = favoriteStatus.value[key];
    if (!force && cached !== undefined) return cached;
    const current = generation;
    const { isFavorited: value } = await checkFavorite({ targetType, targetId }, SILENT);
    if (current === generation) setFavorite(key, value);
    return value;
  }

  function isFavorited(questionId: string, force = false): Promise<boolean> {
    return checkTarget(QUESTION, questionId, force);
  }

  function isPaperFavorited(paperId: string, force = false): Promise<boolean> {
    return checkTarget(PAPER, paperId, force);
  }

  function removeFavoriteItem(targetType: FavoriteTab, targetId: string) {
    const key = keyOf(targetId);
    const index = favoritePager.list.value.findIndex(
      item => item.targetType === targetType && keyOf(item.targetId) === key,
    );
    if (index === -1) return;
    favoritePager.remove(index);
  }

  async function toggleTarget(targetType: FavoriteTab, targetId: string): Promise<boolean> {
    const current = generation;
    const response = await toggleFavorite({ targetType, targetId });
    const value = response.isFavorited ?? false;
    if (current !== generation) return value;
    setFavorite(statusKey(targetType, targetId), value);
    if (value) favoritesDirty.value = true;
    else removeFavoriteItem(targetType, targetId);
    return value;
  }

  /** 切换题目收藏，返回切换后是否已收藏 */
  function toggle(questionId: string): Promise<boolean> {
    return toggleTarget(QUESTION, questionId);
  }

  /** 切换试卷收藏，返回切换后是否已收藏 */
  function togglePaper(paperId: string): Promise<boolean> {
    return toggleTarget(PAPER, paperId);
  }

  /** 按收藏记录取消收藏 */
  async function removeFavorite(item: FavoriteItemDto): Promise<void> {
    const current = generation;
    await deleteFavorite(item.id);
    if (current !== generation) return;
    setFavorite(statusKey(item.targetType as FavoriteTab, item.targetId), false);
    removeFavoriteItem(item.targetType as FavoriteTab, item.targetId);
  }

  async function fetchNote(questionId: string, force = false): Promise<QuestionNoteDto | null> {
    const key = keyOf(questionId);
    const cached = notes.value[key];
    if (!force && cached !== undefined) return cached;
    const current = generation;
    const page = await getMyQuestionNotes({ questionId, limit: 1 }, SILENT);
    const item = page.list.find(note => keyOf(note.questionId) === key);
    const note = item ? toNote(item) : null;
    if (current === generation) setNote(key, note);
    return note;
  }

  function removeNoteItem(key: string) {
    const index = notePager.list.value.findIndex(item => keyOf(item.questionId) === key);
    if (index === -1) return;
    notePager.remove(index);
  }

  async function deleteNote(questionId: string): Promise<void> {
    const key = keyOf(questionId);
    const current = generation;
    await deleteQuestionNote(questionId);
    if (current !== generation) return;
    setNote(key, null);
    removeNoteItem(key);
  }

  /** 保存笔记，内容为空时删除 */
  async function saveNote(questionId: string, content: string): Promise<QuestionNoteDto | null> {
    const key = keyOf(questionId);
    const text = content.trim();
    if (!text) {
      if (notes.value[key]) await deleteNote(questionId);
      return null;
    }
    if (text.length > NOTE_MAX_LENGTH) throw new Error(`笔记不能超过 ${NOTE_MAX_LENGTH} 字`);
    const current = generation;
    const note = await saveQuestionNote(questionId, { content: text });
    if (current !== generation) return note;
    setNote(key, note);
    const index = notePager.list.value.findIndex(item => keyOf(item.questionId) === key);
    if (index === -1) notesDirty.value = true;
    else notePager.list.value.splice(index, 1, { ...notePager.list.value[index], ...note });
    return note;
  }

  function reset() {
    generation++;
    favoritePager.reset();
    notePager.reset();
    favoriteStatus.value = {};
    notes.value = {};
    favoriteType.value = QUESTION;
    favoriteSubjectId.value = '';
    noteSubjectId.value = '';
    favoritesDirty.value = false;
    notesDirty.value = false;
  }

  watch(
    () => userStore.token,
    (token, previous) => {
      if (!token !== !previous) reset();
    },
  );

  return {
    favoriteStatus,
    notes,
    favoriteType,
    favoriteSubjectId,
    noteSubjectId,
    favoritesDirty,
    notesDirty,
    favorites: favoritePager.list,
    favoritesLoading: favoritePager.loading,
    favoritesError: favoritePager.error,
    favoritesHasMore: favoritePager.hasMore,
    noteList: notePager.list,
    notesLoading: notePager.loading,
    notesError: notePager.error,
    notesHasMore: notePager.hasMore,
    favoriteOf,
    paperFavoriteOf,
    noteOf,
    fetchFavorites,
    fetchNotes,
    setFavoriteFilter,
    setNoteSubject,
    isFavorited,
    isPaperFavorited,
    toggle,
    togglePaper,
    removeFavorite,
    fetchNote,
    saveNote,
    deleteNote,
    reset,
  };
});
