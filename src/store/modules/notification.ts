/**
 * 通知 Store
 * 管理通知列表、未读数量、通知设置等状态
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  Notification,
  NotificationSetting,
  GetNotificationsParams,
  PaginationNotificationResponseDto,
} from '@/api';
import {
  getNotifications,
  getUnreadCount,
  getNotification,
  deleteNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationSettings,
  updateNotificationSettings,
  UpdateNotificationSettingsDtoCategory,
} from '@/api';

export const useNotificationStore = defineStore('notification', () => {
  // ==================== 状态 ====================
  const notifications = ref<Notification[]>([]);
  const unreadCount = ref(0);
  const settings = ref<NotificationSetting[]>([]);
  const loading = ref(false);
  const hasMore = ref(true);
  /** 已加载到的页码，0 表示尚未加载 */
  const currentPage = ref(0);
  const pageSize = ref(20);

  // ==================== 计算属性 ====================
  const unreadNotifications = computed(() => notifications.value.filter(n => !n.isRead));

  // ==================== Actions ====================

  /** 最近一次列表请求的序号，新请求发出后旧请求的结果被丢弃 */
  let listRequestId = 0;

  /**
   * 获取指定页的通知列表，第 1 页替换列表，其余页追加；成功后才更新当前页码
   */
  async function fetchNotifications(params?: GetNotificationsParams, page = 1) {
    const id = ++listRequestId;
    loading.value = true;
    try {
      const response = await getNotifications({
        ...params,
        page,
        limit: pageSize.value,
      });

      if (id !== listRequestId || !response) return;

      const data = response as PaginationNotificationResponseDto;
      notifications.value = page === 1 ? data.list : [...notifications.value, ...data.list];
      currentPage.value = page;
      hasMore.value = page < data.totalPages;
    } catch (error) {
      console.error('获取通知列表失败:', error);
    } finally {
      if (id === listRequestId) loading.value = false;
    }
  }

  /**
   * 加载更多通知
   */
  async function loadMore(params?: GetNotificationsParams) {
    if (!hasMore.value || loading.value) return;
    await fetchNotifications(params, currentPage.value + 1);
  }

  /**
   * 刷新通知列表，作废进行中的请求
   */
  async function refresh(params?: GetNotificationsParams) {
    currentPage.value = 0;
    hasMore.value = true;
    await fetchNotifications(params, 1);
  }

  /**
   * 获取未读通知数量
   */
  async function fetchUnreadCount() {
    try {
      const count = await getUnreadCount();
      unreadCount.value = count || 0;
    } catch (error) {
      console.error('获取未读数量失败:', error);
    }
  }

  /**
   * 获取通知详情
   */
  async function fetchNotificationDetail(id: string) {
    try {
      const detail = await getNotification(Number(id));

      // 更新本地列表中的通知
      const index = notifications.value.findIndex(n => n.id === Number(id));
      if (index !== -1 && detail) {
        notifications.value[index] = detail;
      }

      return detail;
    } catch (error) {
      console.error('获取通知详情失败:', error);
    }
  }

  /**
   * 标记通知为已读
   */
  async function markAsRead(id: string) {
    try {
      const result = await markNotificationAsRead(Number(id));

      if (result) {
        // 更新本地状态
        const notification = notifications.value.find(n => n.id === Number(id));
        if (notification && !notification.isRead) {
          notification.isRead = true;
          notification.readAt = result.readAt || new Date().toISOString();
          // 本地递减未读数（不再重复调用 API）
          if (unreadCount.value > 0) {
            unreadCount.value--;
          }
        }
      }
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  }

  /**
   * 标记所有通知为已读
   */
  async function markAllAsRead() {
    try {
      await markAllNotificationsAsRead();

      // 更新本地状态
      notifications.value.forEach(n => {
        n.isRead = true;
        n.readAt = new Date().toISOString();
      });

      unreadCount.value = 0;

      uni.showToast({ title: '已全部标记为已读', icon: 'success' });
    } catch (error) {
      console.error('标记全部已读失败:', error);
    }
  }

  /**
   * 删除通知
   */
  async function removeNotification(id: string) {
    try {
      await deleteNotification(Number(id));

      // 从本地列表中移除，并更新未读数
      const index = notifications.value.findIndex(n => n.id === Number(id));
      if (index !== -1) {
        const notification = notifications.value[index];
        // 如果是未读通知，递减未读数
        if (!notification.isRead && unreadCount.value > 0) {
          unreadCount.value--;
        }
        notifications.value.splice(index, 1);
      }

      uni.showToast({ title: '删除成功', icon: 'success' });
    } catch (error) {
      console.error('删除通知失败:', error);
    }
  }

  /**
   * 获取通知设置
   */
  async function fetchSettings() {
    try {
      const result = await getNotificationSettings();
      if (result) {
        settings.value = result;
      }
    } catch (error) {
      console.error('获取通知设置失败:', error);
      throw error; // 重新抛出错误，让调用方处理
    }
  }

  /**
   * 更新通知设置
   */
  async function updateSettings(
    category: UpdateNotificationSettingsDtoCategory,
    enableInApp: boolean,
    enableEmail: boolean,
    enableSms: boolean,
    enablePush: boolean,
  ) {
    try {
      const result = await updateNotificationSettings({
        category,
        enableInApp,
        enableEmail,
        enableSms,
        enablePush,
      });

      if (result) {
        // 更新本地设置
        const index = settings.value.findIndex(s => s.category === category);
        if (index !== -1) {
          settings.value[index] = result;
        }

        uni.showToast({ title: '设置已更新', icon: 'success' });
      }
    } catch (error) {
      console.error('更新通知设置失败:', error);
    }
  }

  /**
   * 重置状态
   */
  function reset() {
    listRequestId++;
    notifications.value = [];
    unreadCount.value = 0;
    settings.value = [];
    loading.value = false;
    hasMore.value = true;
    currentPage.value = 0;
  }

  return {
    // 状态
    notifications,
    unreadCount,
    settings,
    loading,
    hasMore,
    currentPage,
    pageSize,

    // 计算属性
    unreadNotifications,

    // Actions
    fetchNotifications,
    loadMore,
    refresh,
    fetchUnreadCount,
    fetchNotificationDetail,
    markAsRead,
    markAllAsRead,
    removeNotification,
    fetchSettings,
    updateSettings,
    reset,
  };
});
