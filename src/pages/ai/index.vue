<template>
  <view class="ai-page" :class="globalStore.themeClass">
    <view v-if="!userStore.isLoggedIn" class="ai-guest">
      <UEmpty icon="chatbubble" text="登录后可针对做过的题目向 AI 提问">
        <UButton text="去登录" type="primary" size="small" @click="goLogin" />
      </UEmpty>
    </view>

    <template v-else>
      <UCard class="ai-intro">
        <view class="ai-intro__header">
          <text class="ai-intro__title">AI 讲题</text>
          <text v-if="quotaText" class="ai-intro__quota">{{ quotaText }}</text>
        </view>
        <text class="ai-intro__desc">在题目解析、成绩报告或错题本中点击「问 AI」，让 AI 讲解题目并回答追问。</text>
        <text v-if="!aiStore.enabled" class="ai-intro__notice">AI 服务暂不可用，请稍后再试</text>
        <view v-else-if="consentDeclined" class="ai-intro__consent">
          <text class="ai-intro__notice">使用 AI 助教前需同意 AI 服务声明</text>
          <UButton text="查看声明" size="small" plain @click="promptConsent" />
        </view>
      </UCard>

      <text class="ai-section-title">讲题记录</text>
      <UList
        class="ai-list"
        :empty="isEmpty"
        :loading="loading"
        :finished="!hasMore"
        :error="error"
        empty-icon="chatbubble"
        empty-text="还没有讲题记录"
        @retry="retryList"
      >
        <USwipeAction
          v-for="item in list"
          :key="item.id"
          class="ai-item"
          :options="SWIPE_OPTIONS"
          @click="handleDelete(item)"
        >
          <view class="ai-item__body" @click="openConversation(item)">
            <UIcon name="chatbubble" size="40rpx" color="var(--color-primary)" />
            <view class="ai-item__main">
              <text class="ai-item__title">{{ item.title || '题目讲解' }}</text>
              <text class="ai-item__time">{{ formatTime(item.updatedAt) }}</text>
            </view>
            <UIcon name="right" size="28rpx" color="var(--color-text-placeholder)" />
          </view>
        </USwipeAction>
      </UList>
    </template>

    <UAiConsentPopup v-model="consentVisible" @result="resolveConsent" />
  </view>
</template>

<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: 'AI 助教',
    enablePullDownRefresh: true,
  },
});

import { computed, ref, watch } from 'vue';
import { onPullDownRefresh, onReachBottom, onShow } from '@dcloudio/uni-app';
import { deleteAiConversation, getAiConversations, type AiConversationDto } from '@/api';
import type { SwipeActionOption } from '@/components';
import { useList, useRouter } from '@/composables';
import { useAiAccess } from '@/composables/useAiAccess';
import { AI_CONVERSATION_PAGE_SIZE, PAGES } from '@/constants';
import { useAiStore } from '@/store/modules/ai';
import { useGlobalStore } from '@/store/modules/global';
import { useUserStore } from '@/store/modules/user';
import { formatDateTime } from '@/utils/datetime';
import { confirm } from '@/utils/modal';
import { showToast } from '@/utils/toast';

const SWIPE_OPTIONS: SwipeActionOption[] = [{ text: '删除', type: 'danger' }];

const globalStore = useGlobalStore();
const userStore = useUserStore();
const aiStore = useAiStore();
const router = useRouter();
const { consentVisible, ensureConsent, resolveConsent } = useAiAccess();

const consentDeclined = ref(false);
let consentPrompted = false;

const { list, loading, error, hasMore, isEmpty, refresh, loadMore, retry, reset } = useList<AiConversationDto>({
  limit: AI_CONVERSATION_PAGE_SIZE,
  fetchPage: ({ page, limit }) => getAiConversations({ page, limit }, { showError: false }),
});

const quotaText = computed(() => {
  const chat = aiStore.quota?.chat;
  return chat ? `今日剩余 ${chat.remaining}/${chat.limit} 次` : '';
});

function formatTime(value: string): string {
  return formatDateTime(value, 'YYYY-MM-DD HH:mm');
}

async function reload() {
  try {
    await refresh();
  } catch (err) {
    console.error('加载讲题记录失败:', err);
  }
}

async function retryList() {
  try {
    await retry();
  } catch (err) {
    console.error('加载讲题记录失败:', err);
  }
}

async function promptConsent() {
  consentPrompted = true;
  consentDeclined.value = !(await ensureConsent());
}

function openConversation(item: AiConversationDto) {
  router.push(PAGES.AI_CHAT, { conversationId: item.id, ...(item.contextId ? { contextId: item.contextId } : {}) });
}

async function handleDelete(item: AiConversationDto) {
  if (!(await confirm({ content: '删除后该讲题记录将无法恢复，确定删除吗？', confirmText: '删除' }))) return;
  try {
    await deleteAiConversation(item.id);
    list.value = list.value.filter(conversation => conversation.id !== item.id);
    aiStore.forgetSession(item.id);
    showToast('已删除');
  } catch (err) {
    console.error('删除讲题记录失败:', err);
  }
}

function goLogin() {
  router.push(PAGES.LOGIN);
}

function refreshAll() {
  if (!userStore.isLoggedIn) return Promise.resolve();
  aiStore.loadEnabled().then(enabled => {
    if (enabled && !consentPrompted && userStore.isLoggedIn) promptConsent();
  });
  aiStore.fetchQuota();
  return reload();
}

watch(
  () => userStore.isLoggedIn,
  loggedIn => {
    reset();
    consentPrompted = false;
    consentDeclined.value = false;
    if (!loggedIn) resolveConsent(false);
  },
);

onShow(() => {
  refreshAll();
});

onPullDownRefresh(async () => {
  await refreshAll();
  uni.stopPullDownRefresh();
});

onReachBottom(() => {
  if (userStore.isLoggedIn && hasMore.value) loadMore().catch(err => console.error('加载讲题记录失败:', err));
});
</script>

<style scoped lang="scss">
.ai-page {
  box-sizing: border-box;
  min-height: 100vh;
  padding: var(--spacing-base);
  background: var(--color-bg-grey);
}

.ai-guest {
  padding-top: 160rpx;
}

.ai-intro {
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12rpx;
  }

  &__title {
    color: var(--color-text);
    font-size: 32rpx;
    font-weight: 600;
  }

  &__quota {
    color: var(--color-primary);
    font-size: 24rpx;
  }

  &__desc {
    color: var(--color-text-secondary);
    font-size: 26rpx;
    line-height: 1.6;
  }

  &__consent {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 16rpx;
    gap: 16rpx;
  }

  &__notice {
    display: block;
    margin-top: 12rpx;
    color: var(--color-warning);
    font-size: 24rpx;
  }
}

.ai-section-title {
  display: block;
  margin: 32rpx 8rpx 16rpx;
  color: var(--color-text);
  font-size: 28rpx;
  font-weight: 600;
}

.ai-item {
  display: block;
  margin-bottom: 16rpx;
  overflow: hidden;
  border-radius: var(--radius-lg);

  &__body {
    display: flex;
    align-items: center;
    padding: 28rpx 24rpx;
    background: var(--color-bg);
    gap: 20rpx;
  }

  &__main {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
    gap: 8rpx;
  }

  &__title {
    overflow: hidden;
    color: var(--color-text);
    font-size: 28rpx;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__time {
    color: var(--color-text-secondary);
    font-size: 22rpx;
  }
}
</style>
