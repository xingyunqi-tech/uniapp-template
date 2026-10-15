<template>
  <view class="contact-page" :class="globalStore.themeClass">
    <!-- 顶部图标区域 -->
    <view class="header-section">
      <view class="header-icon">
        <uni-icons type="headphones" size="48" color="var(--color-primary)" />
      </view>
      <text class="header-title">我们随时为您服务</text>
      <text class="header-desc">工作日 9:00-18:00</text>
    </view>

    <!-- 联系方式卡片 -->
    <view class="contact-list">
      <UMenuGroup>
        <!-- 客服热线 -->
        <UMenuItem icon="phone" title="客服热线" :right-text="phoneNumber" show-arrow @click="handleCall" />

        <!-- 在线咨询 -->
        <!-- #ifdef MP-WEIXIN -->
        <UMenuItem icon="chat" title="在线咨询" :border="false" show-arrow is-contact />
        <!-- #endif -->
        <!-- #ifndef MP-WEIXIN -->
        <UMenuItem icon="chat" title="在线咨询" :border="false" show-arrow @click="handleOnlineChat" />
        <!-- #endif -->
      </UMenuGroup>
    </view>

    <!-- 底部提示 -->
    <view class="footer-tips">
      <text class="tips-text">如遇紧急问题，请直接拨打客服热线</text>
    </view>
  </view>
</template>

<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: '联系客服',
  },
});

import { useGlobalStore } from '@/store/modules/global';

const globalStore = useGlobalStore();

// 客服信息配置
const phoneNumber = '400-123-4567';

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
  box-sizing: border-box;
  min-height: 100vh;
  padding-bottom: calc(48rpx + var(--safe-area-inset-bottom));
  background: var(--color-bg-grey);
}

// 顶部图标区域
.header-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 64rpx 32rpx 48rpx;
  background: var(--color-bg);

  .header-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 120rpx;
    height: 120rpx;
    margin-bottom: 24rpx;
    border-radius: 50%;
    background: var(--color-primary-bg);
  }

  .header-title {
    margin-bottom: 8rpx;
    color: var(--color-text);
    font-size: 32rpx;
    font-weight: 500;
  }

  .header-desc {
    color: var(--color-text-secondary);
    font-size: 26rpx;
  }
}

// 联系方式列表
.contact-list {
  padding: 0 24rpx;
}

// 底部提示
.footer-tips {
  padding: 32rpx;
  text-align: center;

  .tips-text {
    color: var(--color-text-placeholder);
    font-size: 24rpx;
  }
}
</style>
