<template>
  <view class="report-page" :class="globalStore.themeClass">
    <UPageState :loading="loading && !report" :error="loadError" @retry="load">
      <template v-if="report">
        <UCard class="report-summary">
          <text class="report-summary__mode">{{ PRACTICE_MODE_LABELS[report.session.mode] }}</text>
          <view v-if="report.score !== null" class="report-summary__score">
            <text class="report-summary__value">{{ report.score }}</text>
            <text class="report-summary__unit">/ {{ report.totalScore ?? '-' }} 分</text>
          </view>
          <view v-else class="report-summary__score">
            <text class="report-summary__value">{{ formatPercent(report.accuracy) }}</text>
            <text class="report-summary__unit">正确率</text>
          </view>
          <view class="report-summary__stats">
            <view class="report-stat">
              <text class="report-stat__value">{{ report.correctCount }}/{{ report.questionCount }}</text>
              <text class="report-stat__label">答对</text>
            </view>
            <view class="report-stat">
              <text class="report-stat__value">{{ report.answeredCount }}</text>
              <text class="report-stat__label">已答</text>
            </view>
            <view v-if="report.score !== null" class="report-stat">
              <text class="report-stat__value">{{ formatPercent(report.accuracy) }}</text>
              <text class="report-stat__label">正确率</text>
            </view>
            <view class="report-stat">
              <text class="report-stat__value">{{ formatDuration(report.durationSec) }}</text>
              <text class="report-stat__label">用时</text>
            </view>
          </view>
          <text v-if="percentileText" class="report-summary__percentile">{{ percentileText }}</text>
          <text v-if="report.session.submitType === SubmitType.AUTO_TIMEOUT" class="report-summary__tip">
            考试超时，已自动交卷
          </text>
        </UCard>

        <UCard v-if="report.selfAssessment.pendingQuestionIds.length > 0" class="report-self">
          <view class="report-self__body">
            <text class="report-self__text">
              有 {{ report.selfAssessment.pendingQuestionIds.length }} 道主观题待自评，对照参考答案判断是否掌握
            </text>
            <UButton text="去自评" type="primary" size="small" @click="goSelfAssess" />
          </view>
        </UCard>

        <UCard v-if="report.byType.length > 0" title="分题型" class="report-section">
          <view v-for="row in report.byType" :key="row.type" class="report-row">
            <text class="report-row__name">{{ QUESTION_TYPE_LABELS[row.type] }}</text>
            <text class="report-row__count">{{ row.correct }}/{{ row.total }}</text>
            <text class="report-row__rate">{{ formatPercent(row.accuracy) }}</text>
          </view>
        </UCard>

        <UCard v-if="report.byKnowledgePoint.length > 0" title="分知识点" class="report-section">
          <view v-for="row in report.byKnowledgePoint" :key="row.knowledgePointId" class="report-row">
            <text class="report-row__name">{{ row.name }}</text>
            <text class="report-row__count">{{ row.correct }}/{{ row.total }}</text>
            <text class="report-row__rate">{{ formatPercent(row.accuracy) }}</text>
          </view>
        </UCard>

        <UCard title="答题卡" class="report-section">
          <text v-if="hiddenNotice" class="report-card__notice">{{ hiddenNotice }}</text>
          <view class="report-card__legend">
            <view v-for="status in LEGEND" :key="status" class="report-card__legend-item">
              <view class="report-card__dot" :class="`report-card__cell--${status}`" />
              <text>{{ CARD_STATUS_TEXT[status] }}</text>
            </view>
          </view>
          <view class="report-card__grid">
            <view
              v-for="entry in report.card"
              :key="entry.questionId"
              class="report-card__cell"
              :class="[
                `report-card__cell--${reportCardStatus(entry)}`,
                { 'report-card__cell--marked': entry.markedForReview },
              ]"
              @click="goQuestion(entry.index)"
            >
              {{ entry.index + 1 }}
            </view>
          </view>
        </UCard>

        <view class="report-actions">
          <UButton
            v-if="report.wrongQuestionCount > 0"
            :text="`本次错题重做（${report.wrongQuestionCount}）`"
            type="primary"
            block
            :loading="launching"
            @click="redoWrong"
          />
          <UButton v-if="canRestart" text="重新开始" block plain :loading="launching" @click="restart" />
          <UButton
            v-if="aiEnabled && aiCandidates.length > 0"
            text="错题问 AI"
            block
            plain
            @click="aiPickerVisible = true"
          />
          <UButton text="查看全部解析" block plain @click="goQuestion(0)" />
        </view>
      </template>
    </UPageState>

    <UPopup v-model="aiPickerVisible" type="bottom" title="选择要问 AI 的题目">
      <view class="report-card__grid">
        <view
          v-for="entry in aiCandidates"
          :key="entry.questionId"
          class="report-card__cell"
          :class="`report-card__cell--${reportCardStatus(entry)}`"
          @click="askWrongQuestion(entry.questionId)"
        >
          {{ entry.index + 1 }}
        </view>
      </view>
    </UPopup>
  </view>
</template>

<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: '成绩报告',
  },
});

import { computed, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { PracticeMode, SubmitType, getPracticeSessionReport, type PracticeReportDto } from '@/api';
import { useRouter } from '@/composables';
import { useAskAi } from '@/composables/useAiAccess';
import { usePracticeLauncher } from '@/composables/usePracticeLauncher';
import { PAGES, PRACTICE_MODE_LABELS, QUESTION_TYPE_LABELS } from '@/constants';
import { useGlobalStore } from '@/store/modules/global';
import { confirm } from '@/utils/modal';
import { CARD_STATUS_TEXT, HIDDEN_REASON_TEXT, reportCardStatus, type CardStatus } from '@/utils/practice-card';
import { formatDuration } from '@/utils/practice-clock';

const LEGEND: CardStatus[] = ['correct', 'wrong', 'partial', 'pendingSelf', 'unanswered', 'hidden'];

const globalStore = useGlobalStore();
const router = useRouter();
const { launching, launch } = usePracticeLauncher();
const { aiEnabled, askAi } = useAskAi();

const sessionId = ref('');
const report = ref<PracticeReportDto | null>(null);
const loading = ref(false);
const loadError = ref(false);
let loaded = false;

const percentileText = computed(() => {
  const percentile = report.value?.percentile;
  if (!percentile) return '';
  if (percentile.beatRatio === null) return '暂无其他考生成绩可比较';
  return `超过 ${formatPercent(percentile.beatRatio)} 的考生（${percentile.sampleSize} 人参与比较）`;
});

const hiddenNotice = computed(() => {
  const hidden = report.value?.card.find(entry => entry.hiddenReason);
  return hidden?.hiddenReason ? `部分题目答案暂不可见：${HIDDEN_REASON_TEXT[hidden.hiddenReason]}` : '';
});

const aiPickerVisible = ref(false);
const aiCandidates = computed(() =>
  (report.value?.card ?? []).filter(entry => {
    const status = reportCardStatus(entry);
    return !entry.hiddenReason && (status === 'wrong' || status === 'partial');
  }),
);

const canRestart = computed(() => report.value?.session.mode === PracticeMode.MOCK && !!report.value.session.paperId);

function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 1000) / 10}%`;
}

async function load() {
  if (!sessionId.value) {
    loadError.value = true;
    return;
  }
  loading.value = true;
  loadError.value = false;
  try {
    report.value = await getPracticeSessionReport(sessionId.value);
    loaded = true;
  } catch (error) {
    if (!report.value) loadError.value = true;
    console.error('加载成绩报告失败:', error);
  } finally {
    loading.value = false;
  }
}

function goQuestion(index: number) {
  router.push(PAGES.EXAM_ANSWER, { sessionId: sessionId.value, index });
}

function askWrongQuestion(questionId: string) {
  aiPickerVisible.value = false;
  askAi({ questionId, sessionId: sessionId.value });
}

function goSelfAssess() {
  const firstId = report.value?.selfAssessment.pendingQuestionIds[0];
  const entry = report.value?.card.find(item => item.questionId === firstId);
  goQuestion(entry?.index ?? 0);
}

function redoWrong() {
  const session = report.value?.session;
  if (!session) return;
  launch({ mode: PracticeMode.WRONG, subjectId: session.subjectId, scope: { fromSessionId: session.id } });
}

async function restart() {
  const session = report.value?.session;
  if (!session?.paperId) return;
  if (!(await confirm({ content: '重新开始将按试卷时长重新计时，确定开始吗？', confirmText: '开始' }))) return;
  launch({ mode: PracticeMode.MOCK, subjectId: session.subjectId, paperId: session.paperId });
}

onLoad(options => {
  sessionId.value = options?.sessionId ?? '';
  load();
});

onShow(() => {
  if (loaded) load();
});
</script>

<style scoped lang="scss">
.report-page {
  display: flex;
  box-sizing: border-box;
  flex-direction: column;
  min-height: 100vh;
  padding: 24rpx 24rpx calc(env(safe-area-inset-bottom) + 32rpx);
  background: var(--color-bg-grey);
  gap: 24rpx;
}

.report-summary {
  &__mode {
    display: block;
    color: var(--color-text-secondary);
    font-size: 26rpx;
  }

  &__score {
    display: flex;
    align-items: baseline;
    margin-top: 12rpx;
    gap: 12rpx;
  }

  &__value {
    color: var(--color-primary);
    font-size: 72rpx;
    font-weight: 700;
  }

  &__unit {
    color: var(--color-text-secondary);
    font-size: 26rpx;
  }

  &__stats {
    display: flex;
    flex-wrap: wrap;
    margin-top: 24rpx;
    gap: 24rpx;
  }

  &__percentile,
  &__tip {
    display: block;
    margin-top: 20rpx;
    color: var(--color-text);
    font-size: 26rpx;
  }

  &__tip {
    color: var(--color-warning);
  }
}

.report-stat {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 140rpx;
  gap: 4rpx;

  &__value {
    color: var(--color-text);
    font-size: 30rpx;
    font-weight: 600;
  }

  &__label {
    color: var(--color-text-secondary);
    font-size: 24rpx;
  }
}

.report-self__body {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.report-self__text {
  flex: 1;
  color: var(--color-text);
  font-size: 26rpx;
}

.report-row {
  display: flex;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx solid var(--color-border);
  font-size: 26rpx;
  gap: 20rpx;

  &:last-child {
    border-bottom: none;
  }

  &__name {
    flex: 1;
    min-width: 0;
    color: var(--color-text);
  }

  &__count {
    color: var(--color-text-secondary);
  }

  &__rate {
    width: 120rpx;
    color: var(--color-primary);
    text-align: right;
  }
}

.report-card {
  &__notice {
    display: block;
    margin-bottom: 16rpx;
    color: var(--color-warning);
    font-size: 24rpx;
  }

  &__legend {
    display: flex;
    flex-wrap: wrap;
    margin-bottom: 20rpx;
    gap: 20rpx;
  }

  &__legend-item {
    display: flex;
    align-items: center;
    color: var(--color-text-secondary);
    font-size: 24rpx;
    gap: 8rpx;
  }

  &__dot {
    box-sizing: border-box;
    width: 24rpx;
    height: 24rpx;
    border: 2rpx solid var(--color-border-dark);
    border-radius: 50%;
  }

  &__grid {
    display: flex;
    flex-wrap: wrap;
    gap: 20rpx;
  }

  &__cell {
    box-sizing: border-box;
    width: 80rpx;
    height: 80rpx;
    border: 2rpx solid var(--color-border-dark);
    border-radius: 50%;
    color: var(--color-text);
    font-size: 28rpx;
    line-height: 76rpx;
    text-align: center;

    &--correct {
      border-color: var(--color-success);
      background: var(--color-success-bg);
      color: var(--color-success);
    }

    &--wrong {
      border-color: var(--color-error);
      background: var(--color-error-bg);
      color: var(--color-error);
    }

    &--partial,
    &--pendingSelf {
      border-color: var(--color-warning);
      background: var(--color-warning-bg);
      color: var(--color-warning);
    }

    &--hidden {
      border-style: dashed;
      color: var(--color-text-secondary);
    }

    &--marked {
      box-shadow: 0 0 0 4rpx var(--color-warning);
    }
  }
}

.report-actions {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}
</style>
