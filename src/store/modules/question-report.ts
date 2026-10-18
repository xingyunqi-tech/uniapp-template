import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import {
  createQuestionReport,
  getMyQuestionReports,
  type GetMyQuestionReportsParams,
  type QuestionReportItemDto,
} from '@/api';
import { toReportDto, validateReportForm, type ReportForm, type ReportStatus } from '@/utils/question-report';
import { createPagedList } from '../helpers/paged-list';
import { useUserStore } from './user';

export const useQuestionReportStore = defineStore('questionReport', () => {
  const userStore = useUserStore();

  /** 空字符串表示全部状态 */
  const status = ref<ReportStatus | ''>('');
  const submitting = ref(false);
  /** 列表外有新提交的纠错时为 true */
  const dirty = ref(false);

  const pager = createPagedList<QuestionReportItemDto, Pick<GetMyQuestionReportsParams, 'status'>>({
    fetchPage: params => getMyQuestionReports(params),
  });

  function fetchReports(refresh = false): Promise<QuestionReportItemDto[]> {
    if (refresh) dirty.value = false;
    return pager.load(status.value ? { status: status.value } : {}, refresh);
  }

  function setStatus(value: ReportStatus | ''): Promise<QuestionReportItemDto[]> {
    status.value = value;
    pager.reset();
    return fetchReports(true);
  }

  /** 校验并提交纠错，校验不通过时抛出带提示文案的错误 */
  async function submit(questionId: string, form: ReportForm): Promise<void> {
    const message = validateReportForm(form);
    if (message) throw new Error(message);
    submitting.value = true;
    try {
      await createQuestionReport(questionId, toReportDto(form));
      dirty.value = true;
    } finally {
      submitting.value = false;
    }
  }

  function reset() {
    pager.reset();
    status.value = '';
    submitting.value = false;
    dirty.value = false;
  }

  watch(
    () => userStore.token,
    (token, previous) => {
      if (!token !== !previous) reset();
    },
  );

  return {
    status,
    submitting,
    dirty,
    reports: pager.list,
    loading: pager.loading,
    error: pager.error,
    hasMore: pager.hasMore,
    fetchReports,
    setStatus,
    submit,
    reset,
  };
});
