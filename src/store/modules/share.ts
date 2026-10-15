import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  createShare,
  getShares,
  getShareByCode,
  getShareById,
  deleteShare,
  getShareStats,
  trackShare,
  type Share,
  type CreateShareDto,
  type ShareStatsDto,
  type TrackShareDtoAction,
  type GetSharesParams,
} from '@/api';

/**
 * 分享状态管理 Store
 * 管理分享记录的创建、查询、追踪等
 */
export const useShareStore = defineStore('share', () => {
  // ==================== State ====================
  /** 当前分享记录 */
  const currentShare = ref<Share | null>(null);
  /** 分享列表 */
  const shareList = ref<Share[]>([]);
  /** 分享统计 */
  const shareStats = ref<ShareStatsDto | null>(null);
  /** 加载状态 */
  const loading = ref(false);
  /** 分享列表分页信息，page 为已加载到的页码，0 表示尚未加载 */
  const pagination = ref({
    page: 0,
    limit: 20,
    total: 0,
    hasMore: true,
  });

  // ==================== Actions ====================
  /**
   * 创建分享记录
   * @param params 分享参数
   * @returns 分享记录（包含 shareCode）
   */
  async function createShareRecord(params: CreateShareDto): Promise<Share> {
    loading.value = true;
    try {
      const share = await createShare(params);
      currentShare.value = share;
      return share;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 通过分享码获取分享内容
   * @param code 分享码
   * @returns 分享记录
   */
  async function fetchShareByCode(code: string): Promise<Share | null> {
    loading.value = true;
    try {
      const share = await getShareByCode(code);
      currentShare.value = share;
      return share;
    } catch (error) {
      console.error('获取分享内容失败:', error);
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 通过 ID 获取分享详情
   * @param id 分享 ID
   * @returns 分享记录
   */
  async function fetchShareById(id: number): Promise<Share | null> {
    loading.value = true;
    try {
      const share = await getShareById(id);
      currentShare.value = share;
      return share;
    } catch (error) {
      console.error('获取分享详情失败:', error);
      return null;
    } finally {
      loading.value = false;
    }
  }

  /** 最近一次列表请求的序号，新请求发出后旧请求的结果被丢弃 */
  let listRequestId = 0;

  /**
   * 获取分享列表
   * @param params 查询参数
   * @param refresh 是否刷新（重置分页）
   */
  async function fetchShareList(params?: GetSharesParams, refresh = false): Promise<Share[]> {
    if (refresh) {
      pagination.value.page = 0;
      pagination.value.hasMore = true;
      shareList.value = [];
    }

    if (!refresh && (loading.value || !pagination.value.hasMore)) {
      return shareList.value;
    }

    const id = ++listRequestId;
    const page = pagination.value.page + 1;
    loading.value = true;
    try {
      const response = await getShares({
        ...params,
        page,
        limit: pagination.value.limit,
      });
      if (id !== listRequestId) return shareList.value;

      const newItems = response.list || [];
      shareList.value = page === 1 ? newItems : [...shareList.value, ...newItems];

      pagination.value.total = response.total || 0;
      pagination.value.hasMore = shareList.value.length < pagination.value.total;
      pagination.value.page = page;

      return shareList.value;
    } catch (error) {
      if (id !== listRequestId) return shareList.value;
      throw error;
    } finally {
      if (id === listRequestId) loading.value = false;
    }
  }

  /**
   * 追踪分享行为
   * @param shareCode 分享码
   * @param action 行为类型 (VIEW/CLICK)
   * @param metadata 额外元数据
   */
  async function trackShareAction(
    shareCode: string,
    action: TrackShareDtoAction,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    try {
      await trackShare(shareCode, {
        action,
        metadata,
      });
    } catch (error) {
      // 追踪失败不影响主流程，仅打印日志
      console.warn('分享追踪失败:', error);
    }
  }

  /**
   * 获取分享统计
   * @param shareId 分享 ID
   */
  async function fetchShareStats(shareId: number): Promise<ShareStatsDto | null> {
    loading.value = true;
    try {
      const stats = await getShareStats(shareId);
      shareStats.value = stats;
      return stats;
    } catch (error) {
      console.error('获取分享统计失败:', error);
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 删除分享记录
   * @param shareId 分享 ID
   */
  async function removeShare(shareId: number): Promise<boolean> {
    loading.value = true;
    try {
      await deleteShare(shareId);
      // 从列表中移除
      shareList.value = shareList.value.filter(item => item.id !== shareId);
      // 如果是当前分享，清空
      if (currentShare.value?.id === shareId) {
        currentShare.value = null;
      }
      return true;
    } catch (error) {
      console.error('删除分享失败:', error);
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 清空状态
   */
  function clearState(): void {
    listRequestId++;
    currentShare.value = null;
    shareList.value = [];
    shareStats.value = null;
    pagination.value = {
      page: 0,
      limit: 20,
      total: 0,
      hasMore: true,
    };
  }

  return {
    // State
    currentShare,
    shareList,
    shareStats,
    loading,
    pagination,
    // Actions
    createShareRecord,
    fetchShareByCode,
    fetchShareById,
    fetchShareList,
    trackShareAction,
    fetchShareStats,
    removeShare,
    clearState,
  };
});
