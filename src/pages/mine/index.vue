<template>
  <view class="user-page" :class="globalStore.themeClass">
    <!-- 用户信息卡片 -->
    <view class="user-card" :style="{ paddingTop: totalHeight + 10 + 'px' }">
      <view class="user-info" @click="handleUserClick">
        <image class="avatar" :src="userInfo?.avatar || '/static/images/default-avatar.png'" mode="aspectFill" />
        <view class="info">
          <text class="username">{{ userInfo?.username || '未登录' }}</text>
          <text class="desc">{{ isLoggedIn ? userInfo?.phone || '完善个人信息' : '点击登录账号' }}</text>
        </view>
        <view class="arrow">
          <UIcon name="right" />
        </view>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="menu-section">
      <UMenuGroup>
        <UMenuItem icon="flag" title="错题本" @click="handleMenuClick('wrongBook')" />
        <UMenuItem icon="star" title="我的收藏" @click="handleMenuClick('favorites')" />
        <UMenuItem icon="compose" title="我的笔记" @click="handleMenuClick('notes')" />
        <UMenuItem icon="calendar" title="打卡日历" @click="handleMenuClick('checkin')" />
        <UMenuItem icon="info" title="我的纠错" :border="false" @click="handleMenuClick('reports')" />
      </UMenuGroup>

      <UMenuGroup>
        <UMenuItem icon="list" title="我的订单" @click="handleMenuClick('order')" />
        <UMenuItem
          icon="notification"
          title="消息通知"
          :badge="unreadCount"
          :border="false"
          @click="handleMenuClick('notifications')"
        />
      </UMenuGroup>

      <UMenuGroup>
        <!-- #ifdef MP-WEIXIN -->
        <UMenuItem icon="headphones" title="在线客服" is-contact />
        <!-- #endif -->

        <!-- #ifndef MP-WEIXIN -->
        <UMenuItem icon="headphones" title="联系客服" @click="handleMenuClick('contact')" />
        <!-- #endif -->

        <UMenuItem icon="settings" title="设置" :border="false" @click="handleMenuClick('settings')" />
      </UMenuGroup>
    </view>
  </view>
</template>

<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: '我的',
    navigationStyle: 'custom',
  },
});

import { computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useUserStore } from '@/store/modules/user';
import { useNotificationStore } from '@/store/modules/notification';
import { useRouter, useStatusBar } from '@/composables';
import { useGlobalStore } from '@/store/modules/global';
import { PAGES } from '@/constants';

const globalStore = useGlobalStore();
const notificationStore = useNotificationStore();

// 状态栏 + 导航栏高度（避开胶囊按钮）
const { totalHeight } = useStatusBar();

const router = useRouter();
const userStore = useUserStore();

// 计算属性
const isLoggedIn = computed(() => userStore.isLoggedIn);
const userInfo = computed(() => userStore.userInfo);
const unreadCount = computed(() => {
  const count = notificationStore.unreadCount;
  return count > 0 ? (count > 99 ? '99+' : String(count)) : '';
});

onShow(() => {
  // 刷新用户信息
  if (isLoggedIn.value) {
    userStore.getUserInfo().catch(error => console.error('刷新用户信息失败:', error));
    // 刷新未读通知数量
    notificationStore.fetchUnreadCount();
  }
});

// 点击用户信息
function handleUserClick() {
  if (!isLoggedIn.value) {
    router.push(PAGES.LOGIN);
  } else {
    // 已登录，跳转到编辑资料页面
    router.push(PAGES.PROFILE);
  }
}

// 点击菜单项
const MENU_PAGES: Record<string, string> = {
  wrongBook: PAGES.STUDY_WRONG_BOOK,
  favorites: PAGES.STUDY_FAVORITES,
  notes: PAGES.STUDY_NOTES,
  checkin: PAGES.STUDY_CHECKIN,
  reports: PAGES.STUDY_REPORTS,
  order: PAGES.ORDER,
  notifications: PAGES.NOTIFICATIONS,
  contact: PAGES.CONTACT,
  settings: PAGES.SETTINGS,
};
function handleMenuClick(type: string) {
  const page = MENU_PAGES[type];
  if (page) router.push(page);
}
</script>

<style scoped lang="scss">
.user-page {
  min-height: 100vh;
  background: var(--color-bg-grey);
}

// 用户信息卡片
.user-card {
  padding: 0 40rpx 40rpx;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-success) 100%);

  .user-info {
    display: flex;
    gap: 24rpx;
    align-items: center;
    padding: 32rpx;
    border-radius: var(--radius-lg);
    background: var(--color-overlay-light);
    backdrop-filter: blur(10px);

    .avatar {
      flex-shrink: 0;
      width: 120rpx;
      height: 120rpx;
      border: 4rpx solid var(--color-overlay-heavy);
      border-radius: 50%;
    }

    .info {
      display: flex;
      flex: 1;
      flex-direction: column;
      gap: 8rpx;

      .username {
        color: var(--color-text-inverse);
        font-size: 36rpx;
        font-weight: 600;
      }

      .desc {
        color: var(--color-overlay-solid);
        font-size: 26rpx;
      }
    }

    .arrow {
      color: var(--color-overlay-solid);
      font-size: 32rpx;
    }
  }
}

// 功能菜单
.menu-section {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  padding: 24rpx;
}
</style>
