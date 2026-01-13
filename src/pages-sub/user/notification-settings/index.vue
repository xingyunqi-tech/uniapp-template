<route lang="json5">
{
  style: {
    navigationBarTitleText: '通知设置',
  },
}
</route>

<template>
  <view class="notification-settings-page">
    <!-- 加载中 -->
    <ULoading v-if="loading" />

    <!-- 错误状态 -->
    <UEmpty v-else-if="error" type="error" text="加载失败，请重试">
      <button class="retry-button" @click="loadSettings">重试</button>
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
              color="#1989fa"
              @change="handleToggle(setting, 'enableInApp', $event)"
            />
          </view>

          <view class="setting-item">
            <text class="setting-label">推送通知</text>
            <switch
              :checked="setting.enablePush"
              color="#1989fa"
              @change="handleToggle(setting, 'enablePush', $event)"
            />
          </view>

          <view class="setting-item">
            <text class="setting-label">邮件通知</text>
            <switch
              :checked="setting.enableEmail"
              color="#1989fa"
              @change="handleToggle(setting, 'enableEmail', $event)"
            />
          </view>

          <view class="setting-item">
            <text class="setting-label">短信通知</text>
            <switch :checked="setting.enableSms" color="#1989fa" @change="handleToggle(setting, 'enableSms', $event)" />
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
import { ref, computed, onMounted } from 'vue';
import { useNotificationStore } from '@/store/modules/notification';
import type { NotificationSetting } from '@/api';

const notificationStore = useNotificationStore();
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

function getCategoryName(category: string): string {
  const nameMap: Record<string, string> = {
    SYSTEM: '系统通知',
    ORDER: '订单通知',
    ACTIVITY: '活动通知',
    ANNOUNCEMENT: '公告通知',
  };
  return nameMap[category] || category;
}

function getCategoryDesc(category: string): string {
  const descMap: Record<string, string> = {
    SYSTEM: '系统维护、更新等重要通知',
    ORDER: '订单状态变更、物流信息等',
    ACTIVITY: '优惠活动、促销信息等',
    ANNOUNCEMENT: '平台公告、政策变更等',
  };
  return descMap[category] || '';
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
    border-bottom: 1rpx solid var(--color-border);

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
      border-bottom: 1rpx solid var(--color-border);

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

.retry-button {
  padding: 16rpx 48rpx;
  border: none;
  border-radius: 8rpx;
  background: var(--color-primary);
  color: var(--color-bg);
  font-size: 28rpx;

  &::after {
    border: none;
  }
}
</style>
