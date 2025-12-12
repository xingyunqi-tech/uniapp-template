import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  getFavorites,
  createFavorite,
  deleteFavorite,
  checkFavorite,
  toggleFavorite,
  type Favorite,
  type CreateFavoriteDto,
  type GetFavoritesParams,
  type CreateFavoriteDtoTargetType,
} from '@/api';

/**
 * 收藏状态管理 Store
 * 管理用户收藏的商品、文章等
 */
export const useFavoriteStore = defineStore('favorite', () => {
  // ==================== State ====================
  /** 收藏列表 */
  const favoriteList = ref<Favorite[]>([]);
  /** 收藏状态缓存 Map<targetType:targetId, boolean> */
  const favoriteStatusCache = ref<Map<string, boolean>>(new Map());
  /** 是否正在加载 */
  const loading = ref(false);
  /** 是否还有更多数据 */
  const hasMore = ref(true);
  /** 当前页码 */
  const currentPage = ref(1);
  /** 当前筛选的目标类型 */
  const currentTargetType = ref<CreateFavoriteDtoTargetType | undefined>(undefined);

  // ==================== Getters ====================
  /** 收藏数量 */
  const favoriteCount = computed(() => favoriteList.value.length);

  // ==================== Actions ====================
  /**
   * 生成缓存 key
   */
  function getCacheKey(targetType: string, targetId: string): string {
    return `${targetType}:${targetId}`;
  }

  /**
   * 获取收藏列表
   * @param targetType 目标类型（可选，用于筛选）
   * @param refresh 是否刷新（从第一页开始）
   */
  async function fetchFavoriteList(targetType?: CreateFavoriteDtoTargetType, refresh = false): Promise<Favorite[]> {
    // 如果切换了类型，重置分页
    if (targetType !== currentTargetType.value) {
      refresh = true;
      currentTargetType.value = targetType;
    }

    if (refresh) {
      currentPage.value = 1;
      hasMore.value = true;
    }

    if (!hasMore.value && !refresh) {
      return favoriteList.value;
    }

    loading.value = true;
    try {
      const params: GetFavoritesParams = {
        page: currentPage.value,
        limit: 20,
        targetType,
      };

      const response = await getFavorites(params);
      const newList = response.data || [];

      if (refresh) {
        favoriteList.value = newList;
      } else {
        favoriteList.value = [...favoriteList.value, ...newList];
      }

      // 更新缓存
      newList.forEach((item: Favorite) => {
        const key = getCacheKey(item.targetType, item.targetId);
        favoriteStatusCache.value.set(key, true);
      });

      hasMore.value = response.hasNextPage ?? false;
      if (hasMore.value) {
        currentPage.value++;
      }

      return favoriteList.value;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 检查是否已收藏
   * @param targetType 目标类型
   * @param targetId 目标ID
   * @param useCache 是否使用缓存
   */
  async function isFavorited(
    targetType: CreateFavoriteDtoTargetType,
    targetId: string,
    useCache = true,
  ): Promise<boolean> {
    const cacheKey = getCacheKey(targetType, targetId);

    // 优先使用缓存
    if (useCache && favoriteStatusCache.value.has(cacheKey)) {
      return favoriteStatusCache.value.get(cacheKey)!;
    }

    // 调用 API 检查
    const response = await checkFavorite({ targetType, targetId });
    favoriteStatusCache.value.set(cacheKey, response.isFavorited);
    return response.isFavorited;
  }

  /**
   * 添加收藏
   */
  async function addFavorite(data: CreateFavoriteDto): Promise<Favorite> {
    const favorite = await createFavorite(data);

    // 添加到列表头部
    favoriteList.value.unshift(favorite);

    // 更新缓存
    const cacheKey = getCacheKey(data.targetType, data.targetId);
    favoriteStatusCache.value.set(cacheKey, true);

    return favorite;
  }

  /**
   * 取消收藏
   */
  async function removeFavorite(id: string): Promise<void> {
    // 先找到要删除的收藏，用于更新缓存
    const favorite = favoriteList.value.find(item => item.id === id);

    await deleteFavorite(id);

    // 从列表中移除
    const index = favoriteList.value.findIndex(item => item.id === id);
    if (index !== -1) {
      favoriteList.value.splice(index, 1);
    }

    // 更新缓存
    if (favorite) {
      const cacheKey = getCacheKey(favorite.targetType, favorite.targetId);
      favoriteStatusCache.value.set(cacheKey, false);
    }
  }

  /**
   * 切换收藏状态
   * @param data 收藏数据
   * @returns 是否已收藏
   */
  async function toggle(data: CreateFavoriteDto): Promise<boolean> {
    const response = await toggleFavorite(data);
    const cacheKey = getCacheKey(data.targetType, data.targetId);
    const isFavorited = response.isFavorited ?? false;

    if (isFavorited && response.favorite) {
      // 添加到列表（使用字符串比较）
      const exists = favoriteList.value.some(item => item.id === response.favorite!.id);
      if (!exists) {
        favoriteList.value.unshift(response.favorite);
      }
    } else {
      // 从列表中移除（使用 targetType 和 targetId 比较）
      const index = favoriteList.value.findIndex(
        item => item.targetType === data.targetType && item.targetId === data.targetId,
      );
      if (index !== -1) {
        favoriteList.value.splice(index, 1);
      }
    }

    // 更新缓存
    favoriteStatusCache.value.set(cacheKey, isFavorited);

    return isFavorited;
  }

  /**
   * 通过目标信息取消收藏
   */
  async function removeFavoriteByTarget(targetType: CreateFavoriteDtoTargetType, targetId: string): Promise<void> {
    const favorite = favoriteList.value.find(item => item.targetType === targetType && item.targetId === targetId);

    if (favorite) {
      await removeFavorite(String(favorite.id));
    }
  }

  /**
   * 清除缓存
   */
  function clearCache() {
    favoriteStatusCache.value.clear();
  }

  /**
   * 重置状态
   */
  function reset() {
    favoriteList.value = [];
    favoriteStatusCache.value.clear();
    loading.value = false;
    hasMore.value = true;
    currentPage.value = 1;
    currentTargetType.value = undefined;
  }

  return {
    // State
    favoriteList,
    favoriteStatusCache,
    loading,
    hasMore,
    currentPage,
    currentTargetType,
    // Getters
    favoriteCount,
    // Actions
    fetchFavoriteList,
    isFavorited,
    addFavorite,
    removeFavorite,
    removeFavoriteByTarget,
    toggle,
    clearCache,
    reset,
  };
});
