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
      <UMenuGroup>
        <UMenuItem title="用户协议" show-arrow @click="handleMenuClick('agreement')" />
        <UMenuItem title="隐私政策" show-arrow @click="handleMenuClick('privacy')" />
        <UMenuItem
          title="检查更新"
          :right-text="hasUpdate ? '有新版本' : ''"
          show-arrow
          :border="false"
          @click="checkUpdate"
        />
      </UMenuGroup>
    </view>

    <!-- 版权信息 -->
    <view class="copyright">
      <text class="copyright-text">{{ COPYRIGHT }}</text>
      <!-- #ifdef H5 -->
      <view class="icp-info">
        <text class="icp-link" @click="handleIcpClick">{{ ICP_LICENSE }}</text>
      </view>
      <!-- #endif -->
    </view>
  </view>
</template>

<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: '关于我们',
  },
});

import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useRouter } from '@/composables';
import { useGlobalStore } from '@/store/modules/global';
import { PAGES } from '@/constants';
import { APP_NAME, COPYRIGHT, ICP_LICENSE, ICP_LINK } from '@/constants/system';

const globalStore = useGlobalStore();
const router = useRouter();

const version = ref('1.0.0');
const hasUpdate = ref(false);

onLoad(() => {
  getVersion();
});

// 获取版本号
function getVersion() {
  const appBaseInfo = uni.getAppBaseInfo();
  version.value = appBaseInfo.appVersion || '1.0.0';
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

// 点击备案号
function handleIcpClick() {
  // #ifdef H5
  window.open(ICP_LINK, '_blank');
  // #endif
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
  padding: 0 24rpx;
}

// 版权信息
.copyright {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding: 48rpx 0;
  padding-bottom: calc(48rpx + var(--safe-area-inset-bottom));
  gap: 16rpx;

  .copyright-text {
    color: var(--color-text-placeholder);
    font-size: 24rpx;
  }

  .icp-info {
    display: flex;
    align-items: center;
    justify-content: center;

    .icp-link {
      transition: color var(--duration-fast);
      color: var(--color-text-placeholder);
      font-size: 24rpx;
      text-decoration: none;
      cursor: pointer;

      &:hover {
        color: var(--color-primary);
      }

      &:active {
        opacity: 0.7;
      }
    }
  }
}
</style>
