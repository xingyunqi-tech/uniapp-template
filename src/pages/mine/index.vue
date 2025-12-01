<route lang="json5">
{
  style: {
    navigationBarTitleText: '我的',
    navigationStyle: 'custom',
  },
}
</route>

<template>
  <view class="user-page">
    <!-- 用户信息卡片 -->
    <view class="user-card">
      <view class="user-info" @click="handleUserClick">
        <image class="avatar" :src="userInfo?.avatar || '/static/images/default-avatar.png'" mode="aspectFill" />
        <view class="info">
          <text class="nickname">{{ userInfo?.nickname || '未登录' }}</text>
          <text class="desc">{{ userInfo?.phone || '点击登录账号' }}</text>
        </view>
        <text class="i-carbon-chevron-right arrow" />
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="menu-section">
      <view class="menu-group">
        <view class="menu-item" @click="handleMenuClick('order')">
          <text class="i-carbon-document menu-icon" />
          <text class="menu-text">我的订单</text>
          <text class="i-carbon-chevron-right menu-arrow" />
        </view>

        <view class="menu-item" @click="handleMenuClick('favorite')">
          <text class="i-carbon-star menu-icon" />
          <text class="menu-text">我的收藏</text>
          <text class="i-carbon-chevron-right menu-arrow" />
        </view>

        <view class="menu-item" @click="handleMenuClick('address')">
          <text class="i-carbon-location menu-icon" />
          <text class="menu-text">收货地址</text>
          <text class="i-carbon-chevron-right menu-arrow" />
        </view>
      </view>

      <view class="menu-group">
        <view class="menu-item" @click="handleMenuClick('settings')">
          <text class="i-carbon-settings menu-icon" />
          <text class="menu-text">设置</text>
          <text class="i-carbon-chevron-right menu-arrow" />
        </view>

        <view class="menu-item" @click="handleMenuClick('help')">
          <text class="i-carbon-help menu-icon" />
          <text class="menu-text">帮助中心</text>
          <text class="i-carbon-chevron-right menu-arrow" />
        </view>

        <view class="menu-item" @click="handleMenuClick('about')">
          <text class="i-carbon-information menu-icon" />
          <text class="menu-text">关于我们</text>
          <text class="i-carbon-chevron-right menu-arrow" />
        </view>
      </view>
    </view>

    <!-- 退出登录按钮 -->
    <view v-if="isLoggedIn" class="logout-section">
      <button class="logout-btn" @click="handleLogout">退出登录</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useUserStore } from '@/store/modules/user';
import { useRouter } from '@/composables/useRouter';
import { PAGES } from '@/constants';

const router = useRouter();
const userStore = useUserStore();

// 计算属性
const isLoggedIn = computed(() => userStore.isLoggedIn);
const userInfo = computed(() => userStore.userInfo);

onShow(() => {
  // 刷新用户信息
  if (isLoggedIn.value) {
    userStore.getUserInfo();
  }
});

// 点击用户信息
function handleUserClick() {
  if (!isLoggedIn.value) {
    router.push(PAGES.LOGIN);
  }
}

// 点击菜单项
function handleMenuClick(type: string) {
  if (!isLoggedIn.value) {
    uni.showToast({
      title: '请先登录',
      icon: 'none',
    });
    return;
  }

  // 根据类型跳转到对应页面
  switch (type) {
    case 'address':
      router.push(PAGES.ADDRESS);
      break;
    case 'settings':
      router.push(PAGES.SETTINGS);
      break;
    case 'order':
    case 'favorite':
    case 'help':
    case 'about':
    default:
      uni.showToast({
        title: '功能开发中',
        icon: 'none',
      });
  }
}

// 退出登录
function handleLogout() {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: res => {
      if (res.confirm) {
        userStore.logout();
        uni.showToast({
          title: '已退出登录',
          icon: 'success',
        });
      }
    },
  });
}
</script>

<style scoped lang="scss">
.user-page {
  min-height: 100vh;
  padding-bottom: calc($uni-safe-area-inset-bottom + 120rpx);
  background: $uni-bg-color-grey;
}

// 用户信息卡片
.user-card {
  padding: 40rpx;
  background: linear-gradient(135deg, $uni-color-primary 0%, rgb(7 193 96 / 0.8) 100%);

  .user-info {
    display: flex;
    gap: 24rpx;
    align-items: center;
    padding: 32rpx;
    border-radius: $uni-border-radius-lg;
    background: rgb(255 255 255 / 0.15);
    backdrop-filter: blur(10px);

    .avatar {
      flex-shrink: 0;
      width: 120rpx;
      height: 120rpx;
      border: 4rpx solid rgb(255 255 255 / 0.5);
      border-radius: 50%;
    }

    .info {
      display: flex;
      flex: 1;
      flex-direction: column;
      gap: 8rpx;

      .nickname {
        color: #fff;
        font-size: 36rpx;
        font-weight: 600;
      }

      .desc {
        color: rgb(255 255 255 / 0.8);
        font-size: 26rpx;
      }
    }

    .arrow {
      color: rgb(255 255 255 / 0.8);
      font-size: 32rpx;
    }
  }
}

// 功能菜单
.menu-section {
  padding: 24rpx;

  .menu-group {
    margin-bottom: 24rpx;
    overflow: hidden;
    border-radius: $uni-border-radius-lg;
    background: $uni-bg-color;
    box-shadow: $uni-shadow-sm;

    .menu-item {
      display: flex;
      gap: 24rpx;
      align-items: center;
      padding: 32rpx;
      transition: background $uni-duration-fast;

      &:not(:last-child) {
        border-bottom: 1px solid $uni-border-color-light;
      }

      &:active {
        background: $uni-bg-color-hover;
      }

      .menu-icon {
        color: $uni-color-primary;
        font-size: 40rpx;
      }

      .menu-text {
        flex: 1;
        color: $uni-text-color;
        font-size: 30rpx;
      }

      .menu-arrow {
        color: $uni-text-color-secondary;
        font-size: 28rpx;
      }
    }
  }
}

// 退出登录
.logout-section {
  padding: 48rpx 24rpx;

  .logout-btn {
    width: 100%;
    height: 96rpx;
    border: none;
    border-radius: $uni-border-radius-lg;
    background: $uni-bg-color;
    box-shadow: $uni-shadow-sm;
    color: $uni-color-error;
    font-size: 32rpx;
    line-height: 96rpx;

    &:active {
      opacity: 0.8;
    }

    &::after {
      display: none;
    }
  }
}
</style>
