<template>
  <view class="exam-select-page" :class="globalStore.themeClass">
    <view v-if="!userStore.isLoggedIn" class="guest-tip">
      <text>所选考试保存在本机，登录后自动同步到账号</text>
    </view>

    <UPageState :loading="loading" :error="loadError" :empty="isEmpty" empty-text="暂无可选考试" @retry="load">
      <view v-for="group in examStore.examGroups" :key="group.category" class="exam-group">
        <text class="exam-group__title">{{ EXAM_CATEGORY_LABELS[group.category] }}</text>
        <UCard v-for="exam in group.exams" :key="exam.id" class="exam-card">
          <view class="exam-card__header">
            <text class="exam-card__name">{{ exam.name }}</text>
            <UTag v-if="examStore.getProfile(exam.id)?.isCurrent" text="当前" type="primary" size="small" />
            <UTag v-else-if="examStore.getProfile(exam.id)" text="已关注" size="small" plain />
          </view>
          <text v-if="exam.description" class="exam-card__desc">{{ exam.description }}</text>
          <text v-if="examStore.getProfile(exam.id)" class="exam-card__meta">
            考试日期 {{ examStore.getProfile(exam.id)?.examDate || '未设置' }} · 每日目标
            {{ examStore.getProfile(exam.id)?.dailyGoal }} 题
          </text>
          <view class="exam-card__actions">
            <template v-if="examStore.getProfile(exam.id)">
              <UButton text="取消关注" size="small" plain @click="handleUnfollow(exam)" />
              <UButton text="设置" size="small" plain @click="openSettings(exam)" />
              <UButton
                v-if="!examStore.getProfile(exam.id)?.isCurrent"
                text="设为当前"
                type="primary"
                size="small"
                @click="handleSetCurrent(exam)"
              />
            </template>
            <UButton v-else text="关注" type="primary" size="small" @click="openSettings(exam)" />
          </view>
        </UCard>
      </view>
    </UPageState>

    <UPopup v-model="settingsVisible" type="bottom" :title="editingExam?.name">
      <view class="settings">
        <view class="settings__row">
          <text class="settings__label">考试日期</text>
          <view class="settings__field">
            <UDatePicker v-model="draftDate" :start="today" title="考试日期" placeholder="选择考试日期" />
          </view>
        </view>
        <view class="settings__row">
          <text class="settings__label">每日目标（题）</text>
          <UStepper v-model="draftGoal" :min="DAILY_GOAL_MIN" :max="DAILY_GOAL_MAX" :step="5" />
        </view>
        <UButton
          :text="editingFollowed ? '保存' : '关注'"
          type="primary"
          block
          :loading="saving"
          @click="handleSaveSettings"
        />
      </view>
    </UPopup>
  </view>
</template>

<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: '选择考试',
  },
});

import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import type { Exam } from '@/api';
import { DAILY_GOAL_MAX, DAILY_GOAL_MIN, DEFAULT_DAILY_GOAL, EXAM_CATEGORY_LABELS } from '@/constants';
import { useExamStore } from '@/store/modules/exam';
import { useGlobalStore } from '@/store/modules/global';
import { useUserStore } from '@/store/modules/user';
import { shanghaiDate } from '@/utils/exam-date';
import { confirm } from '@/utils/modal';

const globalStore = useGlobalStore();
const userStore = useUserStore();
const examStore = useExamStore();

const loading = ref(false);
const loadError = ref(false);
const isEmpty = computed(() => examStore.examGroups.every(group => group.exams.length === 0));

const settingsVisible = ref(false);
const editingExam = ref<Exam | null>(null);
const editingFollowed = ref(false);
const draftDate = ref('');
const draftGoal = ref(DEFAULT_DAILY_GOAL);
const saving = ref(false);
const today = shanghaiDate();

async function load() {
  loading.value = true;
  loadError.value = false;
  try {
    await Promise.all([examStore.fetchExams(true), examStore.ensureProfiles(true)]);
  } catch (error) {
    loadError.value = true;
    console.error('加载考试失败:', error);
  } finally {
    loading.value = false;
  }
}

function openSettings(exam: Exam) {
  const profile = examStore.getProfile(exam.id);
  editingExam.value = exam;
  editingFollowed.value = !!profile;
  draftDate.value = profile?.examDate ?? '';
  draftGoal.value = profile?.dailyGoal ?? DEFAULT_DAILY_GOAL;
  settingsVisible.value = true;
}

async function handleSaveSettings() {
  const exam = editingExam.value;
  if (!exam || saving.value) return;
  saving.value = true;
  try {
    await examStore.followExam(exam, { examDate: draftDate.value || null, dailyGoal: draftGoal.value });
    settingsVisible.value = false;
    uni.showToast({ title: editingFollowed.value ? '已保存' : '已关注', icon: 'success' });
  } catch (error) {
    console.error('保存目标考试失败:', error);
  } finally {
    saving.value = false;
  }
}

async function handleSetCurrent(exam: Exam) {
  try {
    await examStore.setCurrentExam(exam.id);
    uni.showToast({ title: '已设为当前考试', icon: 'none' });
  } catch (error) {
    console.error('设置当前考试失败:', error);
  }
}

async function handleUnfollow(exam: Exam) {
  if (!(await confirm(`确定取消关注「${exam.name}」吗？`))) return;
  try {
    await examStore.unfollowExam(exam.id);
  } catch (error) {
    console.error('取消关注失败:', error);
  }
}

onLoad(() => {
  load();
});
</script>

<style scoped lang="scss">
.exam-select-page {
  min-height: 100vh;
  padding-bottom: calc(env(safe-area-inset-bottom) + 24rpx);
  background: var(--color-bg-grey);
}

.guest-tip {
  padding: 16rpx 24rpx;
  background: var(--color-primary-bg);
  color: var(--color-primary);
  font-size: 24rpx;
}

.exam-group {
  padding: 24rpx 24rpx 0;

  &__title {
    display: block;
    margin-bottom: 16rpx;
    color: var(--color-text-secondary);
    font-size: 26rpx;
  }
}

.exam-card {
  margin-bottom: 20rpx;

  &__header {
    display: flex;
    align-items: center;
    gap: 12rpx;
  }

  &__name {
    color: var(--color-text);
    font-size: 32rpx;
    font-weight: 600;
  }

  &__desc,
  &__meta {
    display: block;
    margin-top: 8rpx;
    color: var(--color-text-secondary);
    font-size: 24rpx;
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 20rpx;
    gap: 16rpx;
  }
}

.settings {
  display: flex;
  flex-direction: column;
  gap: 32rpx;

  &__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24rpx;
  }

  &__label {
    flex-shrink: 0;
    color: var(--color-text);
    font-size: 28rpx;
  }

  &__field {
    flex: 1;
    min-width: 0;
  }
}
</style>
