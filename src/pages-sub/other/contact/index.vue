<route lang="json5">
{
  style: {
    navigationBarTitleText: '联系客服',
  },
}
</route>

<template>
  <view class="contact-page" :class="globalStore.themeClass">
    <!-- 客服热线 -->
    <view class="contact-section">
      <view class="section-header">
        <text class="i-carbon-phone section-icon" />
        <text class="section-title">客服热线</text>
      </view>
      <view class="contact-card">
        <view class="contact-info">
          <text class="contact-label">服务时间：{{ serviceTime }}</text>
          <text class="contact-value">{{ phoneNumber }}</text>
        </view>
        <button class="call-btn" @click="handleCall">
          <text class="i-carbon-phone-filled" />
          <text>立即拨打</text>
        </button>
      </view>
    </view>

    <!-- 在线咨询 -->
    <view class="contact-section">
      <view class="section-header">
        <text class="i-carbon-chat section-icon" />
        <text class="section-title">在线咨询</text>
      </view>
      <view class="contact-card">
        <view class="contact-info">
          <text class="contact-label">工作日 {{ onlineTime }}</text>
          <text class="contact-desc">在线客服为您解答问题</text>
        </view>
        <!-- #ifdef MP-WEIXIN -->
        <button class="chat-btn" open-type="contact">
          <text class="i-carbon-chat-bot" />
          <text>在线咨询</text>
        </button>
        <!-- #endif -->
        <!-- #ifndef MP-WEIXIN -->
        <button class="chat-btn" @click="handleOnlineChat">
          <text class="i-carbon-chat-bot" />
          <text>在线咨询</text>
        </button>
        <!-- #endif -->
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useGlobalStore } from '@/store/modules/global';

const globalStore = useGlobalStore();

// 客服信息配置
const phoneNumber = '400-123-4567';
const serviceTime = '工作日 9:00-18:00';
const onlineTime = '9:00-18:00';

// 拨打电话
function handleCall() {
  uni.makePhoneCall({
    phoneNumber,
    fail: () => {
      uni.showToast({
        title: '拨打失败',
        icon: 'none',
      });
    },
  });
}

// 在线咨询（非微信环境）
function handleOnlineChat() {
  uni.showToast({
    title: '请拨打客服热线',
    icon: 'none',
  });
}
</script>

<style scoped lang="scss">
.contact-page {
  min-height: 100vh;
  padding: 24rpx;
  padding-bottom: calc(48rpx + env(safe-area-inset-bottom));
  background: var(--color-bg-grey);
}

.contact-section {
  margin-bottom: 32rpx;

  .section-header {
    display: flex;
    gap: 12rpx;
    align-items: center;
    margin-bottom: 20rpx;
    padding-left: 8rpx;

    .section-icon {
      color: var(--color-primary);
      font-size: 32rpx;
    }

    .section-title {
      color: var(--color-text);
      font-size: 30rpx;
      font-weight: 500;
    }
  }
}

.contact-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  border-radius: var(--radius-lg);
  background: var(--color-bg);
  box-shadow: var(--shadow-sm);

  .contact-info {
    display: flex;
    flex-direction: column;
    gap: 8rpx;

    .contact-label {
      color: var(--color-text-secondary);
      font-size: 24rpx;
    }

    .contact-value {
      color: var(--color-text);
      font-size: 36rpx;
      font-weight: 600;
    }

    .contact-desc {
      color: var(--color-text-secondary);
      font-size: 26rpx;
    }
  }

  .call-btn,
  .chat-btn {
    display: flex;
    gap: 8rpx;
    align-items: center;
    padding: 20rpx 32rpx;
    border: none;
    border-radius: var(--radius-base);
    background: var(--color-primary);
    color: var(--color-text-inverse);
    font-size: 28rpx;

    &::after {
      display: none;
    }

    &:active {
      opacity: 0.8;
    }
  }
}
</style>
