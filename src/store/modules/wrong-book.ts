import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import {
  getWrongBook,
  getWrongBookSummary,
  masterWrongQuestion,
  restoreWrongQuestion,
  type WrongBookSummaryDto,
  type WrongQuestionDto,
  type WrongQuestionStateDto,
} from '@/api';
import {
  buildWrongBookParams,
  DEFAULT_WRONG_BOOK_FILTER,
  type WrongBookFilter,
  type WrongBookQuery,
} from '@/utils/wrong-book';
import { createPagedList } from '../helpers/paged-list';
import { useUserStore } from './user';

export const useWrongBookStore = defineStore('wrongBook', () => {
  const userStore = useUserStore();

  const filter = ref<WrongBookFilter>({ ...DEFAULT_WRONG_BOOK_FILTER });
  const summary = ref<WrongBookSummaryDto | null>(null);
  /** 列表需要从第 1 页重新加载 */
  const dirty = ref(false);
  const pager = createPagedList<WrongQuestionDto, WrongBookQuery>({
    fetchPage: params => getWrongBook(params),
  });
  let summaryRequest = 0;

  /** 切换科目时清空知识点筛选 */
  function setFilter(patch: Partial<WrongBookFilter>) {
    const next = { ...filter.value, ...patch };
    if (patch.subjectId !== undefined && patch.subjectId !== filter.value.subjectId && !patch.knowledgePointId) {
      next.knowledgePointId = '';
    }
    filter.value = next;
  }

  function markDirty() {
    dirty.value = true;
  }

  function fetchList(refresh = false): Promise<WrongQuestionDto[]> {
    if (refresh) dirty.value = false;
    return pager.load(buildWrongBookParams(filter.value), refresh);
  }

  async function fetchSummary(): Promise<WrongBookSummaryDto> {
    const request = ++summaryRequest;
    const { subjectId } = filter.value;
    const result = await getWrongBookSummary(subjectId ? { subjectId } : undefined);
    if (request === summaryRequest) summary.value = result;
    return result;
  }

  function applyState(state: WrongQuestionStateDto) {
    const index = pager.list.value.findIndex(item => item.questionId === state.questionId);
    if (index === -1) return;
    if (state.status === filter.value.status) {
      pager.list.value.splice(index, 1, { ...pager.list.value[index], ...state });
      return;
    }
    pager.remove(index);
  }

  async function changeStatus(action: (questionId: string) => Promise<WrongQuestionStateDto>, questionId: string) {
    const state = await action(questionId);
    applyState(state);
    dirty.value = true;
    fetchSummary().catch(error => console.error('刷新错题汇总失败:', error));
    return state;
  }

  function master(questionId: string): Promise<WrongQuestionStateDto> {
    return changeStatus(masterWrongQuestion, questionId);
  }

  /** 恢复为待复习，连续答对次数归零 */
  function restore(questionId: string): Promise<WrongQuestionStateDto> {
    return changeStatus(restoreWrongQuestion, questionId);
  }

  function reset() {
    summaryRequest++;
    pager.reset();
    summary.value = null;
    dirty.value = false;
    filter.value = { ...DEFAULT_WRONG_BOOK_FILTER };
  }

  watch(
    () => userStore.token,
    (token, previous) => {
      if (!token !== !previous) reset();
    },
  );

  return {
    filter,
    summary,
    dirty,
    list: pager.list,
    loading: pager.loading,
    error: pager.error,
    hasMore: pager.hasMore,
    total: pager.total,
    page: pager.page,
    setFilter,
    markDirty,
    fetchList,
    fetchSummary,
    master,
    restore,
    reset,
  };
});
