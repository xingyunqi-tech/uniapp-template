<template>
  <view class="notification-settings-page" :class="globalStore.themeClass">
    <!-- 加载中 -->
    <ULoading v-if="loading" visible />

    <!-- 错误状态 -->
    <UEmpty v-else-if="error" type="error" text="加载失败，请重试">
      <UButton type="primary" size="small" text="重试" @click="loadSettings" />
    </UEmpty>

    <!-- 空状态 -->
    <UEmpty v-else-if="settings.length === 0" type="default" text="暂无通知设置" />

    <!-- 设置列表 -->
    <view v-else class="settings-list">
      <view v-for="setting in settings" :key="setting.category" class="setting-group">
        <view class="group-header">
          <text class="group-title">{{ getCategoryName(setting.category) }}</text>
          <text class="group-desc">{{ getCategoryDesc(setting.category) }}</text>
        </view>

        <view class="group-items">
          <view class="setting-item">
            <text class="setting-label">应用内通知</text>
            <switch
              :checked="setting.enableInApp"
              :color="switchColor"
              @change="handleToggle(setting, 'enableInApp', $event)"
            />
          </view>

          <view class="setting-item">
            <text class="setting-label">推送通知</text>
            <switch
              :checked="setting.enablePush"
              :color="switchColor"
              @change="handleToggle(setting, 'enablePush', $event)"
            />
          </view>

          <view class="setting-item">
            <text class="setting-label">邮件通知</text>
            <switch
              :checked="setting.enableEmail"
              :color="switchColor"
              @change="handleToggle(setting, 'enableEmail', $event)"
            />
          </view>

          <view class="setting-item">
            <text class="setting-label">短信通知</text>
            <switch
              :checked="setting.enableSms"
              :color="switchColor"
              @change="handleToggle(setting, 'enableSms', $event)"
            />
          </view>
        </view>
      </view>

      <!-- 说明（只在有数据时显示）-->
      <view class="tips">
        <text class="tips-text">关闭后将不再通过对应渠道接收该类型的通知</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: '通知设置',
  },
});

import { ref, computed, onMounted } from 'vue';
import { useNotificationStore } from '@/store/modules/notification';
import { useGlobalStore } from '@/store/modules/global';
import type { NotificationSetting, NotificationSettingCategory } from '@/api';
import themeConfig from '@/theme.json';

const notificationStore = useNotificationStore();
const globalStore = useGlobalStore();
// 原生 switch 的颜色取主题配置色值
const switchColor = computed(() => (globalStore.isDark ? themeConfig.dark : themeConfig.light).primaryColor);
const loading = ref(false);
const error = ref(false);
const settings = computed(() => notificationStore.settings);

onMounted(() => {
  loadSettings();
});

async function loadSettings() {
  try {
    loading.value = true;
    error.value = false;
    await notificationStore.fetchSettings();
  } catch (err) {
    console.error('加载通知设置失败:', err);
    error.value = true;
  } finally {
    loading.value = false;
  }
}

const CATEGORY_NAMES: Record<NotificationSettingCategory, string> = {
  SYSTEM: '系统通知',
  ORDER: '订单通知',
  PAYMENT: '支付通知',
  ACTIVITY: '活动通知',
  PROMOTION: '推广通知',
};

const CATEGORY_DESCS: Record<NotificationSettingCategory, string> = {
  SYSTEM: '系统维护、更新等重要通知',
  ORDER: '订单状态变更、物流信息等',
  PAYMENT: '支付成功、退款等资金变动',
  ACTIVITY: '优惠活动、促销信息等',
  PROMOTION: '优惠券发放、商品推荐等',
};

function getCategoryName(category: NotificationSettingCategory): string {
  return CATEGORY_NAMES[category] || category;
}

function getCategoryDesc(category: NotificationSettingCategory): string {
  return CATEGORY_DESCS[category] || '';
}

async function handleToggle(
  setting: NotificationSetting,
  field: 'enableInApp' | 'enablePush' | 'enableEmail' | 'enableSms',
  event: any,
) {
  const newValue = event.detail.value;
  await notificationStore.updateSettings(
    setting.category,
    field === 'enableInApp' ? newValue : setting.enableInApp,
    field === 'enableEmail' ? newValue : setting.enableEmail,
    field === 'enableSms' ? newValue : setting.enableSms,
    field === 'enablePush' ? newValue : setting.enablePush,
  );
}
</script>

<style lang="scss" scoped>
.notification-settings-page {
  min-height: 100vh;
  background: var(--color-bg-grey);
}

.settings-list {
  margin-top: 20rpx;
}

.setting-group {
  margin-bottom: 20rpx;
  background: var(--color-bg);

  .group-header {
    padding: 32rpx;
    border-bottom: 1px solid var(--color-border);

    .group-title {
      display: block;
      margin-bottom: 8rpx;
      color: var(--color-text);
      font-size: 32rpx;
      font-weight: 500;
    }

    .group-desc {
      display: block;
      color: var(--color-text-secondary);
      font-size: 24rpx;
      line-height: 1.5;
    }
  }

  .group-items {
    .setting-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 32rpx;
      border-bottom: 1px solid var(--color-border);

      &:last-child {
        border-bottom: none;
      }

      .setting-label {
        color: var(--color-text);
        font-size: 28rpx;
      }
    }
  }
}

.tips {
  padding: 32rpx;

  .tips-text {
    color: var(--color-text-secondary);
    font-size: 24rpx;
    line-height: 1.6;
  }
}
</style>
