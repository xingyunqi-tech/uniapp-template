<route lang="json5">
{
  style: {
    navigationBarTitleText: '设置',
  },
}
</route>

<template>
  <view class="settings-page">
    <!-- 设置菜单 -->
    <view class="settings-section">
      <view class="section-title">账号设置</view>
      <view class="menu-group">
        <view class="menu-item" @click="handleMenuClick('profile')">
          <text class="i-carbon-user-avatar menu-icon" />
          <text class="menu-text">个人资料</text>
          <text class="i-carbon-chevron-right menu-arrow" />
        </view>

        <view class="menu-item" @click="handleMenuClick('security')">
          <text class="i-carbon-locked menu-icon" />
          <text class="menu-text">账号安全</text>
          <text class="i-carbon-chevron-right menu-arrow" />
        </view>

        <view class="menu-item" @click="handleMenuClick('bindPhone')">
          <text class="i-carbon-phone menu-icon" />
          <text class="menu-text">绑定手机</text>
          <view class="menu-extra">
            <text class="extra-text">{{ userInfo?.phone || '未绑定' }}</text>
            <text class="i-carbon-chevron-right menu-arrow" />
          </view>
        </view>
      </view>
    </view>

    <view class="settings-section">
      <view class="section-title">通用设置</view>
      <view class="menu-group">
        <view class="menu-item" @click="handleMenuClick('notification')">
          <text class="i-carbon-notification menu-icon" />
          <text class="menu-text">消息通知</text>
          <switch :checked="notificationEnabled" color="#07c160" @change="handleNotificationChange" />
        </view>

        <view class="menu-item" @click="handleClearCache">
          <text class="i-carbon-clean menu-icon" />
          <text class="menu-text">清除缓存</text>
          <view class="menu-extra">
            <text class="extra-text">{{ cacheSize }}</text>
            <text class="i-carbon-chevron-right menu-arrow" />
          </view>
        </view>

        <view class="menu-item" @click="handleMenuClick('about')">
          <text class="i-carbon-information menu-icon" />
          <text class="menu-text">关于我们</text>
          <view class="menu-extra">
            <text class="extra-text">v{{ version }}</text>
            <text class="i-carbon-chevron-right menu-arrow" />
          </view>
        </view>
      </view>
    </view>

    <view class="settings-section">
      <view class="section-title">其他</view>
      <view class="menu-group">
        <view class="menu-item" @click="handleMenuClick('feedback')">
          <text class="i-carbon-chat menu-icon" />
          <text class="menu-text">意见反馈</text>
          <text class="i-carbon-chevron-right menu-arrow" />
        </view>

        <view class="menu-item" @click="handleMenuClick('agreement')">
          <text class="i-carbon-document menu-icon" />
          <text class="menu-text">用户协议</text>
          <text class="i-carbon-chevron-right menu-arrow" />
        </view>

        <view class="menu-item" @click="handleMenuClick('privacy')">
          <text class="i-carbon-security menu-icon" />
          <text class="menu-text">隐私政策</text>
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
import { ref, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useUserStore } from '@/store/modules/user';

const userStore = useUserStore();

// 计算属性
const isLoggedIn = computed(() => userStore.isLoggedIn);
const userInfo = computed(() => userStore.userInfo);

// 设置状态
const notificationEnabled = ref(true);
const cacheSize = ref('0 MB');
const version = ref('1.0.0');

onShow(() => {
  calculateCacheSize();
});

// 计算缓存大小
function calculateCacheSize() {
  // TODO: 实际计算缓存大小
  cacheSize.value = '12.5 MB';
}

// 通知开关变化
function handleNotificationChange(e: { detail: { value: boolean } }) {
  notificationEnabled.value = e.detail.value;
  uni.showToast({
    title: notificationEnabled.value ? '已开启通知' : '已关闭通知',
    icon: 'none',
  });
}

// 清除缓存
function handleClearCache() {
  uni.showModal({
    title: '提示',
    content: '确定要清除缓存吗？',
    success: res => {
      if (res.confirm) {
        uni.showLoading({ title: '清除中...' });
        setTimeout(() => {
          uni.hideLoading();
          cacheSize.value = '0 MB';
          uni.showToast({
            title: '清除成功',
            icon: 'success',
          });
        }, 1000);
      }
    },
  });
}

// 点击菜单项
function handleMenuClick(type: string) {
  uni.showToast({
    title: '功能开发中',
    icon: 'none',
  });
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
        setTimeout(() => {
          uni.switchTab({
            url: '/pages/index/index',
          });
        }, 1500);
      }
    },
  });
}
</script>

<style scoped lang="scss">
.settings-page {
  min-height: 100vh;
  padding-bottom: calc($uni-safe-area-inset-bottom + 48rpx);
  background: $uni-bg-color-grey;
}

// 设置分组
.settings-section {
  padding: 24rpx;

  .section-title {
    margin-bottom: 16rpx;
    padding-left: 8rpx;
    color: $uni-text-color-secondary;
    font-size: 26rpx;
  }

  .menu-group {
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

      .menu-extra {
        display: flex;
        gap: 8rpx;
        align-items: center;

        .extra-text {
          color: $uni-text-color-secondary;
          font-size: 26rpx;
        }
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
