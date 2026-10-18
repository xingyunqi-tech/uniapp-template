<template>
  <view class="home-page" :class="globalStore.themeClass">
    <UNavBar title="首页" :show-back="false" />

    <view class="home-body">
      <UCard v-if="!profile" class="exam-card">
        <text class="exam-card__title">选择你的目标考试</text>
        <text class="exam-card__desc">设置考试日期与每日目标，开始备考</text>
        <view class="exam-card__action">
          <UButton text="选择考试" type="primary" size="small" @click="goSelectExam" />
        </view>
      </UCard>

      <template v-else>
        <UCard class="exam-card">
          <view class="exam-card__header">
            <text class="exam-card__title">{{ examStore.currentExam?.name || '当前考试' }}</text>
            <text class="exam-card__link" @click="goSelectExam">切换</text>
          </view>
          <view v-if="daysLeft === null" class="exam-card__countdown" @click="goSelectExam">
            <text class="exam-card__desc">未设置考试日期，</text>
            <text class="exam-card__link">去设置</text>
          </view>
          <view v-else-if="daysLeft > 0" class="exam-card__countdown">
            <text class="exam-card__desc">距考试还有</text>
            <text class="exam-card__days">{{ daysLeft }}</text>
            <text class="exam-card__desc">天</text>
          </view>
          <view v-else class="exam-card__countdown">
            <text class="exam-card__desc">{{ daysLeft === 0 ? '今天考试，加油！' : '考试日期已过，可重新设置' }}</text>
          </view>
          <text class="exam-card__goal">每日目标 {{ profile.dailyGoal }} 题</text>
        </UCard>

        <UCard class="daily-card" title="每日一练" :extra="examStore.currentSubject?.name">
          <text v-if="subjectsLoaded && !examStore.currentSubject" class="daily-card__desc">当前考试暂无科目</text>
          <text v-else-if="dailyError" class="daily-card__desc">每日一练加载失败，下拉刷新重试</text>
          <text v-else-if="!daily" class="daily-card__desc">加载中…</text>
          <text v-else-if="daily.questionCount === 0" class="daily-card__desc">今日暂无题目</text>
          <template v-else>
            <text class="daily-card__desc">{{ daily.date }} · 共 {{ daily.questionCount }} 题</text>
            <view class="daily-card__action">
              <UButton
                :text="userStore.isLoggedIn ? '去试做' : '免费试做'"
                type="primary"
                size="small"
                @click="goTrial"
              />
            </view>
          </template>
        </UCard>
      </template>
    </view>
  </view>
</template>

<script setup lang="ts">
definePage({
  style: {
    navigationStyle: 'custom',
    enablePullDownRefresh: true,
  },
});

import { computed, ref, watch } from 'vue';
import { onPullDownRefresh, onShow } from '@dcloudio/uni-app';
import { getSubjectDaily, type DailySummaryDto } from '@/api';
import { useRouter } from '@/composables';
import { PAGES } from '@/constants';
import { useExamStore } from '@/store/modules/exam';
import { useGlobalStore } from '@/store/modules/global';
import { useUserStore } from '@/store/modules/user';
import { daysUntilExam } from '@/utils/exam-date';
import { confirm } from '@/utils/modal';

const globalStore = useGlobalStore();
const userStore = useUserStore();
const examStore = useExamStore();
const router = useRouter();

const now = ref(Date.now());
const daily = ref<DailySummaryDto | null>(null);
const dailyError = ref(false);
let guided = false;

const profile = computed(() => examStore.currentProfile);
const daysLeft = computed(() => daysUntilExam(profile.value?.examDate, now.value));
const subjectsLoaded = computed(() => {
  const examId = profile.value?.examId;
  return !!examId && examStore.subjectsByExam[examId] !== undefined;
});

function goSelectExam() {
  router.push(PAGES.EXAM_SELECT);
}

function goTrial() {
  const subjectId = examStore.currentSubject?.id;
  if (subjectId) router.push(PAGES.EXAM_TRIAL, { subjectId });
}

async function loadDaily() {
  const subjectId = examStore.currentSubject?.id;
  if (!subjectId) return;
  dailyError.value = false;
  try {
    const summary = await getSubjectDaily(subjectId, { showError: false });
    if (summary.subjectId === examStore.currentSubject?.id) daily.value = summary;
  } catch (error) {
    dailyError.value = true;
    console.error('加载每日一练失败:', error);
  }
}

async function loadHome() {
  now.value = Date.now();
  await examStore.ensureProfiles();
  const examId = profile.value?.examId;
  if (!examId) return;
  const before = examStore.currentSubject?.id;
  try {
    await examStore.fetchSubjects(examId);
  } catch (error) {
    dailyError.value = true;
    throw error;
  }
  if (before && before === examStore.currentSubject?.id) await loadDaily();
}

async function guideToSelectExam() {
  if (guided || !userStore.isLoggedIn || profile.value) return;
  guided = true;
  if (await confirm({ content: '还未设置目标考试，现在去选择吗？', confirmText: '去选择' })) goSelectExam();
}

watch(
  () => examStore.currentSubject?.id,
  (value, previous) => {
    if (value === previous) return;
    daily.value = null;
    loadDaily();
  },
);

onShow(async () => {
  try {
    await loadHome();
    await guideToSelectExam();
  } catch (error) {
    console.error('加载首页失败:', error);
  }
});

onPullDownRefresh(async () => {
  try {
    await examStore.ensureProfiles(true);
    await loadHome();
  } catch (error) {
    console.error('刷新首页失败:', error);
  } finally {
    uni.stopPullDownRefresh();
  }
});
</script>

<style scoped lang="scss">
.home-page {
  min-height: 100vh;
  background: var(--color-bg-grey);
}

.home-body {
  display: flex;
  flex-direction: column;
  padding: 24rpx;
  gap: 24rpx;
}

.exam-card {
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__title {
    display: block;
    color: var(--color-text);
    font-size: 34rpx;
    font-weight: 600;
  }

  &__link {
    color: var(--color-primary);
    font-size: 26rpx;
  }

  &__countdown {
    display: flex;
    align-items: baseline;
    margin-top: 16rpx;
    gap: 8rpx;
  }

  &__desc {
    color: var(--color-text-secondary);
    font-size: 26rpx;
  }

  &__days {
    color: var(--color-primary);
    font-size: 64rpx;
    font-weight: 700;
  }

  &__goal {
    display: block;
    margin-top: 12rpx;
    color: var(--color-text-secondary);
    font-size: 24rpx;
  }

  &__action {
    margin-top: 24rpx;
  }
}

.daily-card {
  &__desc {
    display: block;
    color: var(--color-text-secondary);
    font-size: 26rpx;
  }

  &__action {
    display: flex;
    justify-content: flex-end;
    margin-top: 16rpx;
  }
}
</style>
