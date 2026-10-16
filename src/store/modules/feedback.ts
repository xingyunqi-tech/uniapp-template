import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  createFeedback,
  getFeedbacks,
  getFeedback,
  type Feedback,
  type CreateFeedbackDto,
  type GetFeedbacksParams,
  type CreateFeedbackDtoType,
} from '@/api';
import { createPagedList } from '../helpers/paged-list';

/**
 * 反馈状态管理 Store
 * 管理用户反馈信息
 */
export const useFeedbackStore = defineStore('feedback', () => {
  // ==================== State ====================
  const pager = createPagedList<Feedback, Pick<GetFeedbacksParams, 'type'>>({
    fetchPage: params => getFeedbacks(params),
  });
  /** 反馈列表 */
  const feedbackList = pager.list;
  /** 是否正在加载 */
  const loading = pager.loading;
  /** 是否正在提交 */
  const submitting = ref(false);
  /** 是否还有更多数据 */
  const hasMore = pager.hasMore;
  /** 已加载到的页码，0 表示尚未加载 */
  const currentPage = pager.page;
  /** 当前筛选的类型 */
  const currentType = ref<CreateFeedbackDtoType | undefined>(undefined);

  // ==================== Getters ====================
  /** 反馈数量 */
  const feedbackCount = computed(() => feedbackList.value.length);

  // ==================== Actions ====================
  /**
   * 获取反馈列表，切换筛选类型时从第一页重新加载
   * @param type 反馈类型（可选，用于筛选）
   * @param refresh 是否刷新（从第一页开始）
   */
  async function fetchFeedbackList(type?: CreateFeedbackDtoType, refresh = false): Promise<Feedback[]> {
    if (type !== currentType.value) {
      refresh = true;
      currentType.value = type;
    }
    return pager.load({ type }, refresh);
  }

  /**
   * 获取反馈详情
   */
  async function fetchFeedback(id: string): Promise<Feedback> {
    const feedback = await getFeedback(Number(id));

    // 更新列表中的反馈数据
    const index = feedbackList.value.findIndex(item => String(item.id) === id);
    if (index !== -1) {
      feedbackList.value[index] = feedback;
    }

    return feedback;
  }

  /**
   * 提交反馈
   */
  async function submitFeedback(data: CreateFeedbackDto): Promise<Feedback> {
    submitting.value = true;
    try {
      const feedback = await createFeedback(data);
      if (currentPage.value > 0 && (!currentType.value || feedback.type === currentType.value)) {
        feedbackList.value.unshift(feedback);
        pager.total.value++;
      }

      return feedback;
    } finally {
      submitting.value = false;
    }
  }

  /**
   * 重置状态
   */
  function reset() {
    pager.reset();
    submitting.value = false;
    currentType.value = undefined;
  }

  return {
    // State
    feedbackList,
    loading,
    submitting,
    hasMore,
    currentPage,
    currentType,
    // Getters
    feedbackCount,
    // Actions
    fetchFeedbackList,
    fetchFeedback,
    submitFeedback,
    reset,
  };
});
