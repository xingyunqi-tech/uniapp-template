<template>
  <view class="notifications-page" :class="globalStore.themeClass">
    <!-- 筛选标签 -->
    <view class="filter-tabs">
      <scroll-view class="tabs-scroll" scroll-x :show-scrollbar="false">
        <view class="tabs-left">
          <view
            v-for="tab in tabs"
            :key="tab.value"
            class="tab-item"
            :class="{ active: activeTab === tab.value }"
            @tap="handleTabChange(tab.value)"
          >
            {{ tab.label }}
          </view>
        </view>
      </scroll-view>

      <!-- 操作按钮 -->
      <view class="tabs-actions">
        <text class="action-text" @tap="handleMarkAllRead">已读</text>
        <view class="action-icon" @tap="navigateToSettings">
          <uni-icons type="gear" size="20" color="var(--color-text-secondary)" />
        </view>
      </view>
    </view>

    <!-- 内容区域 -->
    <view class="notifications-content">
      <!-- 通知列表 -->
      <scroll-view
        class="notification-list"
        scroll-y
        :refresher-enabled="true"
        :refresher-triggered="refreshing"
        @refresherrefresh="onRefresh"
        @scrolltolower="onLoadMore"
      >
        <UList
          class="list-content"
          :empty="notifications.length === 0"
          :loading="loading"
          :finished="!hasMore"
          :error="notificationStore.loadError"
          empty-type="message"
          empty-text="暂无通知"
          @retry="notifications.length === 0 ? loadNotifications() : onLoadMore()"
        >
          <view
            v-for="item in notifications"
            :key="item.id"
            class="notification-item"
            :class="{ unread: !item.isRead }"
            @tap="handleItemClick(item)"
          >
            <!-- 未读标记 -->
            <view v-if="!item.isRead" class="unread-dot"></view>

            <!-- 通知图标 -->
            <view class="notification-icon" :class="`category-${item.category}`">
              <uni-icons :type="getIconType(item.category) as any" size="20" color="var(--color-text-inverse)" />
            </view>

            <!-- 通知内容 -->
            <view class="notification-content">
              <view class="notification-header">
                <text class="notification-title">{{ item.title }}</text>
                <text class="notification-time">{{ formatTime(item.createdAt) }}</text>
              </view>
              <text class="notification-text">{{ item.content }}</text>
            </view>

            <!-- 删除按钮 -->
            <view class="notification-actions" @tap.stop="handleDelete(item)">
              <uni-icons type="trash" size="18" color="var(--color-text-secondary)" />
            </view>
          </view>
        </UList>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: '消息通知',
  },
});

import { ref, computed, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useNotificationStore } from '@/store/modules/notification';
import { useGlobalStore } from '@/store/modules/global';
import { NotificationCategory, type Notification } from '@/api';
import { formatRelativeTime } from '@/utils/datetime';
import { getPathFromUrl, isRouteIntercepted, isTabBarPage, navigateTo, switchTab } from '@/utils/router';
import { PAGES } from '@/constants';

// ==================== Store ====================
const notificationStore = useNotificationStore();
const globalStore = useGlobalStore();

// ==================== 状态 ====================
const activeTab = ref<string>('all');
const refreshing = ref(false);

const tabs = [
  { label: '全部', value: 'all' },
  { label: '系统', value: NotificationCategory.SYSTEM },
  { label: '订单', value: NotificationCategory.ORDER },
  { label: '支付', value: NotificationCategory.PAYMENT },
  { label: '活动', value: NotificationCategory.ACTIVITY },
];

// ==================== 计算属性 ====================
const notifications = computed(() => notificationStore.notifications);
const loading = computed(() => notificationStore.loading);
const hasMore = computed(() => notificationStore.hasMore);

// ==================== 生命周期 ====================
onMounted(() => {
  loadNotifications();
});

onShow(() => {
  // 刷新未读数量
  notificationStore.fetchUnreadCount();
});

// ==================== 方法 ====================

/**
 * 加载通知列表
 */
async function loadNotifications() {
  const params = activeTab.value === 'all' ? {} : { category: activeTab.value as any };
  await notificationStore.refresh(params);
}

/**
 * 下拉刷新
 */
async function onRefresh() {
  refreshing.value = true;
  const params = activeTab.value === 'all' ? {} : { category: activeTab.value as any };
  await notificationStore.refresh(params);
  refreshing.value = false;
}

/**
 * 加载更多
 */
async function onLoadMore() {
  if (!hasMore.value || loading.value) return;
  const params = activeTab.value === 'all' ? {} : { category: activeTab.value as any };
  await notificationStore.loadMore(params);
}

/**
 * 切换标签
 */
async function handleTabChange(value: string) {
  if (activeTab.value === value) return;
  activeTab.value = value;
  await loadNotifications();
}

/**
 * 点击通知项
 */
async function handleItemClick(item: Notification) {
  // 标记为已读
  if (!item.isRead) {
    await notificationStore.markAsRead(String(item.id));
  }

  if (typeof item.metadata?.url === 'string' && item.metadata.url) {
    await openLink(item.metadata.url);
  }
}

/**
 * 打开通知链接：外链走 webview，TabBar 页用 switchTab，其余页面用 navigateTo
 */
async function openLink(url: string) {
  try {
    if (/^https?:\/\//i.test(url)) {
      await navigateTo(PAGES.WEBVIEW, { url });
      return;
    }
    const pagePath = url.startsWith('/') ? url : `/${url}`;
    if (isTabBarPage(pagePath)) {
      await switchTab(getPathFromUrl(pagePath));
    } else {
      await navigateTo(pagePath);
    }
  } catch (error) {
    if (isRouteIntercepted(error)) return;
    console.error('通知跳转失败:', error);
    uni.showToast({ title: '页面无法打开', icon: 'none' });
  }
}

/**
 * 删除通知
 */
function handleDelete(item: Notification) {
  uni.showModal({
    title: '提示',
    content: '确定要删除这条通知吗？',
    success: async res => {
      if (res.confirm) {
        await notificationStore.removeNotification(String(item.id));
      }
    },
  });
}

/**
 * 全部已读
 */
function handleMarkAllRead() {
  if (notificationStore.unreadCount === 0 && notifications.value.every(n => n.isRead)) {
    uni.showToast({ title: '已全部已读', icon: 'none' });
    return;
  }

  uni.showModal({
    title: '提示',
    content: '确定要标记全部通知为已读吗？',
    success: async res => {
      if (res.confirm) {
        await notificationStore.markAllAsRead();
      }
    },
  });
}

/**
 * 跳转到设置页面
 */
function navigateToSettings() {
  uni.navigateTo({ url: PAGES.NOTIFICATION_SETTINGS });
}

/**
 * 获取分类图标
 */
function getIconType(category: string): string {
  const iconMap: Record<string, string> = {
    [NotificationCategory.SYSTEM]: 'notification',
    [NotificationCategory.ORDER]: 'cart',
    [NotificationCategory.PAYMENT]: 'wallet',
    [NotificationCategory.PROMOTION]: 'medal',
    [NotificationCategory.ACTIVITY]: 'gift',
  };
  return iconMap[category] || 'notification';
}

/**
 * 格式化时间
 */
function formatTime(time: string): string {
  return formatRelativeTime(time);
}
</script>

<style lang="scss" scoped>
.notifications-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--color-bg-grey);
}

.notifications-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
}

.filter-tabs {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  padding: 20rpx 32rpx;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg);
  gap: 16rpx;

  .tabs-scroll {
    flex: 1;
    min-width: 0;
    white-space: nowrap;
  }

  .tabs-left {
    display: inline-flex;
    gap: 16rpx;
  }

  .tab-item {
    flex-shrink: 0;
    padding: 12rpx 20rpx;
    transition: all 0.3s;
    border-radius: 8rpx;
    color: var(--color-text-secondary);
    font-size: 28rpx;

    &.active {
      background: var(--color-primary-bg);
      color: var(--color-primary);
    }
  }

  .tabs-actions {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: 16rpx;

    .action-text {
      color: var(--color-primary);
      font-size: 26rpx;
      line-height: 1;
      white-space: nowrap;
    }

    .action-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 26rpx;
      line-height: 1;
    }
  }
}

.notification-list {
  flex: 1;
  height: 0;
  overflow: hidden;
}

.list-content {
  padding: 20rpx 0;
}

.notification-item {
  display: flex;
  position: relative;
  align-items: flex-start;
  margin-bottom: 2rpx;
  padding: 24rpx 32rpx;
  background: var(--color-bg);

  &.unread {
    background: var(--color-primary-bg);
  }

  .unread-dot {
    position: absolute;
    top: 28rpx;
    left: 16rpx;
    width: 12rpx;
    height: 12rpx;
    border-radius: 50%;
    background: var(--color-error);
  }

  .notification-icon {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 72rpx;
    height: 72rpx;
    margin-right: 24rpx;
    border-radius: 50%;

    &.category-SYSTEM {
      background: var(--color-primary);
    }

    &.category-ORDER {
      background: var(--color-warning);
    }

    &.category-ACTIVITY {
      background: var(--color-success);
    }

    &.category-PAYMENT {
      background: var(--color-primary);
    }

    &.category-PROMOTION {
      background: var(--color-error);
    }
  }

  .notification-content {
    flex: 1;
    min-width: 0;

    .notification-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12rpx;

      .notification-title {
        flex: 1;
        overflow: hidden;
        color: var(--color-text);
        font-size: 30rpx;
        font-weight: 500;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .notification-time {
        flex-shrink: 0;
        margin-left: 16rpx;
        color: var(--color-text-secondary);
        font-size: 24rpx;
      }
    }

    .notification-text {
      display: -webkit-box;
      overflow: hidden;
      color: var(--color-text-secondary);
      font-size: 28rpx;
      line-height: 1.6;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
    }
  }

  .notification-actions {
    flex-shrink: 0;
    margin-left: 24rpx;
    padding: 8rpx;
  }
}
</style>
