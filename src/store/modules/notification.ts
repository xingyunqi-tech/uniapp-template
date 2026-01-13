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
} from '@/api';

export const useNotificationStore = defineStore('notification', () => {
  // ==================== 状态 ====================
  const notifications = ref<Notification[]>([]);
  const unreadCount = ref(0);
  const settings = ref<NotificationSetting[]>([]);
  const loading = ref(false);
  const hasMore = ref(true);
  const currentPage = ref(1);
  const pageSize = ref(20);

  // ==================== 计算属性 ====================
  const unreadNotifications = computed(() => notifications.value.filter(n => !n.isRead));

  // ==================== Actions ====================

  /**
   * 获取通知列表
   */
  async function fetchNotifications(params?: GetNotificationsParams) {
    try {
      loading.value = true;
      const response = await getNotifications({
        page: currentPage.value,
        limit: pageSize.value,
        ...params,
      });

      if (response) {
        const data = response as PaginationNotificationResponseDto;
        if (currentPage.value === 1) {
          notifications.value = data.list;
        } else {
          notifications.value.push(...data.list);
        }
        hasMore.value = currentPage.value < data.totalPages;
      }
    } catch (error) {
      console.error('获取通知列表失败:', error);
      uni.showToast({ title: '获取通知失败', icon: 'none' });
    } finally {
      loading.value = false;
    }
  }

  /**
   * 加载更多通知
   */
  async function loadMore(params?: GetNotificationsParams) {
    if (!hasMore.value || loading.value) return;
    currentPage.value++;
    await fetchNotifications(params);
  }

  /**
   * 刷新通知列表
   */
  async function refresh(params?: GetNotificationsParams) {
    currentPage.value = 1;
    hasMore.value = true;
    await fetchNotifications(params);
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
      uni.showToast({ title: '获取通知详情失败', icon: 'none' });
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
      uni.showToast({ title: '操作失败', icon: 'none' });
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
      uni.showToast({ title: '删除失败', icon: 'none' });
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
    category: string,
    enableInApp: boolean,
    enableEmail: boolean,
    enableSms: boolean,
    enablePush: boolean,
  ) {
    try {
      const result = await updateNotificationSettings({
        category: category as any,
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
      uni.showToast({ title: '更新失败', icon: 'none' });
    }
  }

  /**
   * 重置状态
   */
  function reset() {
    notifications.value = [];
    unreadCount.value = 0;
    settings.value = [];
    loading.value = false;
    hasMore.value = true;
    currentPage.value = 1;
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
