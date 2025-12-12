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

/**
 * 反馈状态管理 Store
 * 管理用户反馈信息
 */
export const useFeedbackStore = defineStore('feedback', () => {
  // ==================== State ====================
  /** 反馈列表 */
  const feedbackList = ref<Feedback[]>([]);
  /** 是否正在加载 */
  const loading = ref(false);
  /** 是否正在提交 */
  const submitting = ref(false);
  /** 是否还有更多数据 */
  const hasMore = ref(true);
  /** 当前页码 */
  const currentPage = ref(1);
  /** 当前筛选的类型 */
  const currentType = ref<CreateFeedbackDtoType | undefined>(undefined);

  // ==================== Getters ====================
  /** 反馈数量 */
  const feedbackCount = computed(() => feedbackList.value.length);

  /** 是否有未读回复 */
  const hasUnreadReply = computed(() => feedbackList.value.some(item => item.reply && item.status === 'resolved'));

  // ==================== Actions ====================
  /**
   * 获取反馈列表
   * @param type 反馈类型（可选，用于筛选）
   * @param refresh 是否刷新（从第一页开始）
   */
  async function fetchFeedbackList(type?: CreateFeedbackDtoType, refresh = false): Promise<Feedback[]> {
    // 如果切换了类型，重置分页
    if (type !== currentType.value) {
      refresh = true;
      currentType.value = type;
    }

    if (refresh) {
      currentPage.value = 1;
      hasMore.value = true;
    }

    if (!hasMore.value && !refresh) {
      return feedbackList.value;
    }

    loading.value = true;
    try {
      const params: GetFeedbacksParams = {
        page: currentPage.value,
        limit: 20,
        type,
      };

      const response = await getFeedbacks(params);
      const newList = response.data || [];

      if (refresh) {
        feedbackList.value = newList;
      } else {
        feedbackList.value = [...feedbackList.value, ...newList];
      }

      hasMore.value = response.hasNextPage ?? false;
      if (hasMore.value) {
        currentPage.value++;
      }

      return feedbackList.value;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 获取反馈详情
   */
  async function fetchFeedback(id: string): Promise<Feedback> {
    const feedback = await getFeedback(id);

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

      // 添加到列表头部
      feedbackList.value.unshift(feedback);

      return feedback;
    } finally {
      submitting.value = false;
    }
  }

  /**
   * 重置状态
   */
  function reset() {
    feedbackList.value = [];
    loading.value = false;
    submitting.value = false;
    hasMore.value = true;
    currentPage.value = 1;
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
    hasUnreadReply,
    // Actions
    fetchFeedbackList,
    fetchFeedback,
    submitFeedback,
    reset,
  };
});
