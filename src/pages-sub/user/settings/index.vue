<route lang="json5">
{
  style: {
    navigationBarTitleText: '设置',
  },
}
</route>

<template>
  <view class="settings-page" :class="globalStore.themeClass">
    <!-- 设置菜单 -->
    <view class="settings-section">
      <UMenuGroup title="账号设置">
        <UMenuItem icon="i-carbon-user-avatar" title="个人资料" show-arrow @click="handleMenuClick('profile')" />
        <UMenuItem icon="i-carbon-locked" title="账号安全" show-arrow @click="handleMenuClick('security')" />
        <UMenuItem
          icon="i-carbon-location"
          title="收货地址"
          show-arrow
          :border="false"
          @click="handleMenuClick('address')"
        />
      </UMenuGroup>
    </view>

    <view class="settings-section">
      <UMenuGroup title="通用设置">
        <UMenuItem icon="i-carbon-clean" title="清除缓存" :right-text="cacheSize" @click="handleClearCache" />
        <UMenuItem
          icon="i-carbon-information"
          title="关于我们"
          :right-text="`v${version}`"
          show-arrow
          :border="!showDevOptions"
          @click="handleAboutClick"
        />
        <!-- 连续点击版本号 5 次显示 -->
        <UMenuItem
          v-if="showDevOptions"
          icon="i-carbon-sun"
          title="主题模式"
          :right-text="isDarkMode ? '深色' : '浅色'"
          show-switch
          :switch-checked="isDarkMode"
          @switch-change="handleToggleTheme"
        />
        <UMenuItem
          v-if="showDevOptions"
          icon="i-carbon-translate"
          title="国际化"
          :right-text="isEnglish ? 'English' : '中文'"
          :border="false"
          show-switch
          :switch-checked="isEnglish"
          @switch-change="handleToggleLocale"
        />
      </UMenuGroup>
    </view>

    <!-- 账号注销 -->
    <view v-if="isLoggedIn" class="settings-section">
      <UMenuGroup title="账号管理">
        <UMenuItem icon="i-carbon-trash-can" title="注销账号" danger :border="false" @click="handleDeleteAccount" />
      </UMenuGroup>
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
import { useGlobalStore } from '@/store/modules/global';
import { useRouter } from '@/composables';

import { PAGES, THEME_TYPE, LOCALE_TYPE } from '@/constants';
import { UMenuGroup, UMenuItem } from '@/components';

const router = useRouter();
const userStore = useUserStore();
const globalStore = useGlobalStore();

// 计算属性
const isLoggedIn = computed(() => userStore.isLoggedIn);

// 设置状态
const cacheSize = ref('0 MB');
const version = ref('1.0.0');

// ==================== 隐藏开发者选项 ====================
const devModeClickCount = ref(0);
const showDevOptions = ref(false);
let devModeTimer: ReturnType<typeof setTimeout> | null = null;

// 主题和语言状态
const isDarkMode = computed(() => globalStore.currentTheme === THEME_TYPE.DARK);
const isEnglish = computed(() => globalStore.currentLocale === LOCALE_TYPE.EN_US);

onShow(() => {
  calculateCacheSize();
});

// 计算缓存大小
function calculateCacheSize() {
  // TODO: 实际计算缓存大小
  cacheSize.value = '12.5 MB';
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
  // 部分功能需要登录
  const needLogin = ['address'];
  if (needLogin.includes(type) && !isLoggedIn.value) {
    uni.showToast({
      title: '请先登录',
      icon: 'none',
    });
    return;
  }

  switch (type) {
    case 'profile':
      router.push(PAGES.PROFILE);
      break;
    case 'security':
      router.push(PAGES.PASSWORD);
      break;
    case 'address':
      router.push(PAGES.ADDRESS);
      break;
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
        setTimeout(() => {
          uni.switchTab({
            url: '/pages/index/index',
          });
        }, 1500);
      }
    },
  });
}

// ==================== 隐藏开发者选项功能 ====================
/**
 * 点击关于我们：连续点击 5 次触发开发者选项，否则跳转关于页面
 */
function handleAboutClick() {
  devModeClickCount.value++;

  // 清除之前的定时器
  if (devModeTimer) {
    clearTimeout(devModeTimer);
  }

  // 500ms 内未达到次数则重置并跳转
  devModeTimer = setTimeout(() => {
    if (devModeClickCount.value < 5) {
      router.push(PAGES.ABOUT);
    }
    devModeClickCount.value = 0;
  }, 500);

  // 达到 5 次点击
  if (devModeClickCount.value >= 5) {
    if (devModeTimer) {
      clearTimeout(devModeTimer);
    }
    devModeClickCount.value = 0;
    showDevOptions.value = !showDevOptions.value;
    uni.showToast({
      title: showDevOptions.value ? '已开启开发者选项' : '已关闭开发者选项',
      icon: 'none',
    });
  }
}

/**
 * 切换主题
 */
function handleToggleTheme(checked: boolean) {
  globalStore.setTheme(checked ? THEME_TYPE.DARK : THEME_TYPE.LIGHT);
}

/**
 * 切换语言
 */
function handleToggleLocale(checked: boolean) {
  globalStore.setLocale(checked ? LOCALE_TYPE.EN_US : LOCALE_TYPE.ZH_CN);
}

// 账号注销
function handleDeleteAccount() {
  uni.showModal({
    title: '注销账号',
    content: '注销后，您的账号数据将被永久删除且无法恢复，确定要注销吗？',
    confirmColor: '#ee0a24',
    confirmText: '确定注销',
    success: res => {
      if (res.confirm) {
        // 二次确认
        uni.showModal({
          title: '再次确认',
          content: '账号注销后将无法恢复，请再次确认',
          confirmColor: '#ee0a24',
          confirmText: '确定',
          success: async secondRes => {
            if (secondRes.confirm) {
              uni.showLoading({ title: '处理中...' });
              try {
                // TODO: 调用注销 API
                await new Promise(resolve => setTimeout(resolve, 1500));

                uni.hideLoading();
                userStore.logout();
                uni.showToast({
                  title: '账号已注销',
                  icon: 'success',
                });
                setTimeout(() => {
                  uni.switchTab({
                    url: '/pages/index/index',
                  });
                }, 1500);
              } catch {
                uni.hideLoading();
                uni.showToast({
                  title: '注销失败，请重试',
                  icon: 'none',
                });
              }
            }
          },
        });
      }
    },
  });
}
</script>

<style scoped lang="scss">
.settings-page {
  min-height: 100vh;
  padding-bottom: calc(var(--safe-area-inset-bottom) + 48rpx);
  background: var(--color-bg-grey);
}

// 设置分组
.settings-section {
  padding: 24rpx;
}

// 退出登录
.logout-section {
  padding: 48rpx 24rpx;

  .logout-btn {
    width: 100%;
    height: 96rpx;
    border: none;
    border-radius: var(--radius-lg);
    background: var(--color-bg);
    box-shadow: var(--shadow-sm);
    color: var(--color-error);
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
