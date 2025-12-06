<route lang="json5">
{
  style: {
    navigationBarTitleText: '关于我们',
  },
}
</route>

<template>
  <view class="about-page" :class="globalStore.themeClass">
    <!-- Logo 和应用信息 -->
    <view class="app-info">
      <image class="app-logo" src="/static/images/logo.png" mode="aspectFit" />
      <text class="app-name">{{ APP_NAME }}</text>
      <text class="app-version">版本 {{ version }}</text>
    </view>

    <!-- 功能菜单 -->
    <view class="menu-section">
      <view class="menu-item" @click="handleMenuClick('agreement')">
        <text class="menu-text">用户协议</text>
        <text class="i-carbon-chevron-right menu-arrow" />
      </view>
      <view class="menu-item" @click="handleMenuClick('privacy')">
        <text class="menu-text">隐私政策</text>
        <text class="i-carbon-chevron-right menu-arrow" />
      </view>
      <view class="menu-item" @click="checkUpdate">
        <text class="menu-text">检查更新</text>
        <view class="menu-right">
          <text v-if="hasUpdate" class="update-badge">有新版本</text>
          <text class="i-carbon-chevron-right menu-arrow" />
        </view>
      </view>
    </view>

    <!-- 版权信息 -->
    <view class="copyright">
      <text class="copyright-text">{{ COPYRIGHT }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useRouter } from '@/composables';
import { useGlobalStore } from '@/store/modules/global';

import { PAGES } from '@/constants';
import { APP_NAME, COPYRIGHT } from '@/constants/system';

const globalStore = useGlobalStore();
const router = useRouter();

const version = ref('1.0.0');
const hasUpdate = ref(false);

onLoad(() => {
  getVersion();
});

// 获取版本号
function getVersion() {
  const systemInfo = uni.getSystemInfoSync();
  // 从 manifest.json 读取版本号
  version.value = systemInfo.appVersion || '1.0.0';
}

// 菜单点击
function handleMenuClick(type: string) {
  switch (type) {
    case 'agreement':
      router.push(PAGES.AGREEMENT, { type: 'user' });
      break;
    case 'privacy':
      router.push(PAGES.AGREEMENT, { type: 'privacy' });
      break;
  }
}

// 检查更新
function checkUpdate() {
  uni.showLoading({ title: '检查中...' });

  setTimeout(() => {
    uni.hideLoading();

    if (hasUpdate.value) {
      uni.showModal({
        title: '发现新版本',
        content: '是否立即更新到最新版本？',
        success: res => {
          if (res.confirm) {
            // TODO: 执行更新逻辑
            uni.showToast({
              title: '请前往应用商店更新',
              icon: 'none',
            });
          }
        },
      });
    } else {
      uni.showToast({
        title: '已是最新版本',
        icon: 'success',
      });
    }
  }, 1000);
}
</script>

<style scoped lang="scss">
.about-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--color-bg-grey);
}

// 应用信息
.app-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 0 60rpx;
  background: var(--color-bg);

  .app-logo {
    width: 160rpx;
    height: 160rpx;
    margin-bottom: 24rpx;
    border-radius: 32rpx;
  }

  .app-name {
    margin-bottom: 12rpx;
    color: var(--color-text);
    font-size: 36rpx;
    font-weight: 600;
  }

  .app-version {
    color: var(--color-text-secondary);
    font-size: 28rpx;
  }
}

// 菜单
.menu-section {
  margin-top: 24rpx;
  overflow: hidden;
  border-radius: $uni-border-radius-lg;
  background: var(--color-bg);

  .menu-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 32rpx;

    &:not(:last-child) {
      border-bottom: 1px solid var(--color-border-light);
    }

    &:active {
      background: var(--color-bg-hover);
    }

    .menu-text {
      color: var(--color-text);
      font-size: 30rpx;
    }

    .menu-right {
      display: flex;
      gap: 12rpx;
      align-items: center;
    }

    .update-badge {
      padding: 4rpx 12rpx;
      border-radius: 20rpx;
      background: var(--color-error);
      color: var(--color-text-inverse);
      font-size: 22rpx;
    }

    .menu-arrow {
      color: var(--color-text-secondary);
      font-size: 28rpx;
    }
  }
}

// 版权信息
.copyright {
  display: flex;
  flex: 1;
  align-items: flex-end;
  justify-content: center;
  padding: 48rpx 0;
  padding-bottom: calc(48rpx + env(safe-area-inset-bottom));

  .copyright-text {
    color: var(--color-text-placeholder);
    font-size: 24rpx;
  }
}
</style>
