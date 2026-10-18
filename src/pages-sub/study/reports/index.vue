<template>
  <view class="reports-page" :class="globalStore.themeClass">
    <view class="reports-tabs">
      <UTabs v-model="statusTab" :tabs="STATUS_TABS" />
    </view>
    <UList
      class="reports-list"
      :empty="list.length === 0"
      :loading="store.loading"
      :finished="!store.hasMore"
      :error="store.error"
      empty-icon="info"
      empty-text="还没有纠错记录，答题或查看解析时可提交纠错"
      @retry="reload"
    >
      <UCard
        v-for="item in list"
        :key="item.id"
        class="report-card"
        :clickable="!!item.question"
        @click="openDetail(item)"
      >
        <view class="report-card__header">
          <UTag v-if="item.reason" :text="REPORT_REASON_LABELS[item.reason]" type="primary" size="small" plain />
          <text class="report-card__time">{{ formatDateTime(item.createdAt, 'YYYY-MM-DD HH:mm') }}</text>
          <UTag :text="REPORT_STATUS_LABELS[item.status]" :type="REPORT_STATUS_TAG_TYPES[item.status]" size="small" />
        </view>
        <text class="report-card__question">{{ questionPreview(item) }}</text>
        <text v-if="item.content" class="report-card__content">{{ item.content }}</text>
        <view v-if="item.reply" class="report-card__reply">
          <text class="report-card__reply-label">官方回复</text>
          <text class="report-card__reply-content">{{ item.reply }}</text>
        </view>
      </UCard>
    </UList>
  </view>
</template>

<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: '我的纠错',
    enablePullDownRefresh: true,
  },
});

import { computed } from 'vue';
import { onLoad, onPullDownRefresh, onReachBottom, onShow } from '@dcloudio/uni-app';
import type { QuestionReportItemDto } from '@/api';
import type { TabItem, TabValue } from '@/components/UTabs/index.vue';
import { useRouter } from '@/composables';
import { PAGES } from '@/constants';
import { useGlobalStore } from '@/store/modules/global';
import { useQuestionReportStore } from '@/store/modules/question-report';
import { formatDateTime } from '@/utils/datetime';
import {
  REPORT_REASON_LABELS,
  REPORT_STATUS_LABELS,
  REPORT_STATUS_TAG_TYPES,
  reportTargetOf,
  type ReportStatus,
} from '@/utils/question-report';
import { previewText } from '@/utils/wrong-book';

const STATUS_TABS: TabItem[] = [
  { label: '全部', value: '' },
  ...(Object.keys(REPORT_STATUS_LABELS) as ReportStatus[]).map(value => ({
    label: REPORT_STATUS_LABELS[value],
    value,
  })),
];

const globalStore = useGlobalStore();
const store = useQuestionReportStore();
const router = useRouter();

const list = computed(() => store.reports);
const statusTab = computed<TabValue>({
  get: () => store.status,
  set: value => {
    store.setStatus(value as ReportStatus | '').catch(error => console.error('加载纠错记录失败:', error));
  },
});

function questionPreview(item: QuestionReportItemDto): string {
  const question = item.question;
  if (!question) return '题目内容暂不可用';
  return previewText(reportTargetOf(item)?.stem, 60) || previewText(question.material, 60) || '（无题干）';
}

async function reload() {
  try {
    await store.fetchReports(true);
  } catch (error) {
    console.error('加载纠错记录失败:', error);
  }
}

function openDetail(item: QuestionReportItemDto) {
  if (!item.question || !item.questionId) return;
  router.push(PAGES.STUDY_QUESTION, { questionId: item.questionId });
}

onLoad(() => {
  reload();
});

onShow(() => {
  if (store.dirty) reload();
});

onPullDownRefresh(async () => {
  await reload();
  uni.stopPullDownRefresh();
});

onReachBottom(() => {
  if (store.hasMore) store.fetchReports().catch(error => console.error('加载纠错记录失败:', error));
});
</script>

<style scoped lang="scss">
.reports-page {
  min-height: 100vh;
  background: var(--color-bg-grey);
}

.reports-tabs {
  background: var(--color-bg);
}

.reports-list {
  padding: 20rpx 24rpx;
}

.report-card {
  margin-bottom: 20rpx;

  &__header {
    display: flex;
    align-items: center;
    gap: 12rpx;
  }

  &__time {
    flex: 1;
    min-width: 0;
    color: var(--color-text-secondary);
    font-size: 24rpx;
  }

  &__question {
    display: block;
    margin-top: 12rpx;
    color: var(--color-text);
    font-size: 28rpx;
    line-height: 1.6;
  }

  &__content {
    display: block;
    margin-top: 12rpx;
    color: var(--color-text-secondary);
    font-size: 26rpx;
    line-height: 1.6;
    word-break: break-all;
  }

  &__reply {
    display: flex;
    flex-direction: column;
    margin-top: 16rpx;
    padding: 16rpx 20rpx;
    border-radius: var(--radius-base);
    background: var(--color-bg-grey);
    gap: 8rpx;
  }

  &__reply-label {
    color: var(--color-primary);
    font-size: 24rpx;
    font-weight: 600;
  }

  &__reply-content {
    color: var(--color-text);
    font-size: 26rpx;
    line-height: 1.6;
    word-break: break-all;
    white-space: pre-wrap;
  }
}
</style>
