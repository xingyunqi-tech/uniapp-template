<template>
  <view class="history-page" :class="globalStore.themeClass">
    <view class="history-tabs">
      <UTabs v-model="modeTab" :tabs="MODE_TABS" scrollable />
    </view>
    <UList
      class="history-list"
      :empty="isEmpty"
      :loading="loading"
      :finished="!hasMore"
      :error="error"
      empty-text="还没有练习记录"
      @retry="retryList"
    >
      <UCard v-for="item in list" :key="item.id" class="history-card" clickable @click="handleOpen(item)">
        <view class="history-card__header">
          <text class="history-card__mode">{{ PRACTICE_MODE_LABELS[item.mode] }}</text>
          <UTag :text="PRACTICE_STATUS_LABELS[item.status]" :type="STATUS_TAG[item.status]" size="small" plain />
        </view>
        <view class="history-card__meta">
          <text>{{ formatTime(item.lastActiveAt) }}</text>
          <text>已答 {{ item.answeredCount }}/{{ item.questionCount }}</text>
          <text v-if="item.score !== null">{{ item.score }}/{{ item.totalScore ?? '-' }} 分</text>
          <text v-else-if="item.mode !== PracticeMode.MEMORIZE && item.status === PracticeSessionStatus.SUBMITTED">
            答对 {{ item.correctCount }} 题
          </text>
        </view>
      </UCard>
    </UList>
  </view>
</template>

<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: '练习历史',
    enablePullDownRefresh: true,
  },
});

import { ref, watch } from 'vue';
import { onLoad, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import { PracticeMode, PracticeSessionStatus, getPracticeSessions, type PracticeSessionDto } from '@/api';
import type { TabItem, TabValue } from '@/components/UTabs/index.vue';
import { useList, useRouter } from '@/composables';
import { usePracticeLauncher } from '@/composables/usePracticeLauncher';
import { PAGES, PRACTICE_MODE_LABELS, PRACTICE_STATUS_LABELS } from '@/constants';
import { useGlobalStore } from '@/store/modules/global';
import { formatDateTime } from '@/utils/datetime';
import { showToast } from '@/utils/toast';

interface HistoryQuery {
  mode: string;
}

const MODE_TABS: TabItem[] = [
  { label: '全部', value: '' },
  ...[
    PracticeMode.MOCK,
    PracticeMode.CHAPTER,
    PracticeMode.RANDOM,
    PracticeMode.TYPE,
    PracticeMode.SMART,
    PracticeMode.DAILY,
    PracticeMode.WRONG,
    PracticeMode.MEMORIZE,
  ].map(mode => ({ label: PRACTICE_MODE_LABELS[mode], value: mode })),
];

const STATUS_TAG: Record<PracticeSessionStatus, 'primary' | 'success' | 'default'> = {
  IN_PROGRESS: 'primary',
  SUBMITTED: 'success',
  ABANDONED: 'default',
};

const globalStore = useGlobalStore();
const router = useRouter();
const { resume } = usePracticeLauncher();
const modeTab = ref<TabValue>('');

const { list, loading, error, hasMore, isEmpty, refresh, loadMore, retry, reset } = useList<
  PracticeSessionDto,
  HistoryQuery
>({
  fetchPage: ({ mode, page, limit }) =>
    getPracticeSessions({ page, limit, ...(mode ? { mode: mode as PracticeMode } : {}) }),
});

function formatTime(value: string): string {
  return formatDateTime(value, 'YYYY-MM-DD HH:mm');
}

async function reload() {
  try {
    await refresh({ mode: String(modeTab.value) });
  } catch (err) {
    console.error('加载练习历史失败:', err);
  }
}

async function retryList() {
  try {
    await retry();
  } catch (err) {
    console.error('加载练习历史失败:', err);
  }
}

function handleOpen(item: PracticeSessionDto) {
  if (item.status === PracticeSessionStatus.IN_PROGRESS) {
    resume(item);
    return;
  }
  if (item.mode === PracticeMode.MEMORIZE || item.status === PracticeSessionStatus.ABANDONED) {
    router.push(PAGES.EXAM_ANSWER, { sessionId: item.id });
    return;
  }
  if (item.status === PracticeSessionStatus.SUBMITTED) {
    router.push(PAGES.EXAM_REPORT, { sessionId: item.id });
    return;
  }
  showToast('该练习暂不可查看');
}

watch(modeTab, () => {
  reset();
  reload();
});

onLoad(() => {
  reload();
});

onPullDownRefresh(async () => {
  await reload();
  uni.stopPullDownRefresh();
});

onReachBottom(() => {
  if (hasMore.value) loadMore().catch(err => console.error('加载练习历史失败:', err));
});
</script>

<style scoped lang="scss">
.history-page {
  min-height: 100vh;
  background: var(--color-bg-grey);
}

.history-tabs {
  background: var(--color-bg);
}

.history-list {
  padding: 20rpx 24rpx;
}

.history-card {
  margin-bottom: 20rpx;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__mode {
    color: var(--color-text);
    font-size: 30rpx;
    font-weight: 500;
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    margin-top: 12rpx;
    color: var(--color-text-secondary);
    font-size: 24rpx;
    gap: 24rpx;
  }
}
</style>
