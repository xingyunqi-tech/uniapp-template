<route lang="json5">
{
  style: {
    navigationBarTitleText: '我的',
    navigationStyle: 'custom',
  },
}
</route>

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
        <text class="i-carbon-chevron-right arrow" />
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="menu-section">
      <UMenuGroup>
        <UMenuItem icon="i-carbon-document" title="我的订单" @click="handleMenuClick('order')" />
        <UMenuItem icon="i-carbon-star" title="我的收藏" @click="handleMenuClick('favorite')" />
        <UMenuItem
          icon="i-carbon-notification"
          title="消息通知"
          :badge="unreadCount"
          @click="handleMenuClick('notifications')"
        />
        <UMenuItem icon="i-carbon-location" title="收货地址" :border="false" @click="handleMenuClick('address')" />
      </UMenuGroup>

      <UMenuGroup>
        <!-- #ifdef MP-WEIXIN -->
        <UMenuItem icon="i-carbon-headset" title="在线客服" is-contact />
        <!-- #endif -->

        <!-- #ifndef MP-WEIXIN -->
        <UMenuItem icon="i-carbon-headset" title="联系客服" @click="handleMenuClick('contact')" />
        <!-- #endif -->

        <UMenuItem icon="i-carbon-settings" title="设置" :border="false" @click="handleMenuClick('settings')" />
      </UMenuGroup>
    </view>
  </view>
</template>

<script setup lang="ts">
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
    userStore.getUserInfo();
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
function handleMenuClick(type: string) {
  // 部分功能需要登录
  const needLogin = ['favorite', 'order', 'address', 'notifications'];
  if (needLogin.includes(type) && !isLoggedIn.value) {
    uni.showToast({
      title: '请先登录',
      icon: 'none',
    });
    return;
  }

  // 根据类型跳转到对应页面
  switch (type) {
    case 'order':
      router.push(PAGES.ORDER);
      break;
    case 'favorite':
      router.push(PAGES.FAVORITE);
      break;
    case 'notifications':
      router.push(PAGES.NOTIFICATIONS);
      break;
    case 'address':
      router.push(PAGES.ADDRESS);
      break;
    case 'contact':
      router.push(PAGES.CONTACT);
      break;
    case 'settings':
      router.push(PAGES.SETTINGS);
      break;
  }
}
</script>

<style scoped lang="scss">
.user-page {
  min-height: 100vh;
  padding-bottom: calc(var(--safe-area-inset-bottom) + 120rpx);
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
