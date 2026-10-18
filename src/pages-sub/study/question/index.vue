<template>
  <view class="question-page" :class="globalStore.themeClass">
    <UPageState :loading="loading" :error="loadError" @retry="load">
      <view v-if="view" class="question-body">
        <view class="question-body__tags">
          <UTag :text="QUESTION_TYPE_LABELS[typeOf(view)]" type="primary" size="small" plain />
          <UTag v-if="offline" text="已下架" type="default" size="small" />
          <view class="question-body__spacer" />
          <view v-if="!perChildReport" class="question-body__report" @click="openReport(questionId)">
            <UIcon name="info" size="32rpx" color="var(--color-text-secondary)" />
            <text>纠错</text>
          </view>
        </view>
        <text v-if="hiddenNotice" class="question-body__notice">{{ hiddenNotice }}</text>
        <UQuestionContent :question="view" :option-states="optionStates">
          <template #extra="{ question }">
            <view v-if="perChildReport" class="question-body__child-report" @click="openReport(question.id)">
              <UIcon name="info" size="32rpx" color="var(--color-text-secondary)" />
              <text>纠错本题</text>
            </view>
            <view v-if="solutionViews[question.id]" class="question-solution">
              <view v-if="solutionViews[question.id]!.view.answer" class="question-solution__block">
                <text class="question-solution__label">
                  {{ isSubjectiveType(question.type) ? '参考答案' : '正确答案' }}
                </text>
                <UQuestionContent
                  v-if="isSubjectiveType(question.type)"
                  :content="solutionViews[question.id]!.view.answer"
                />
                <text v-else class="question-solution__answer">{{ solutionViews[question.id]!.view.answer }}</text>
              </view>
              <view v-if="solutionViews[question.id]!.view.points.length > 0" class="question-solution__block">
                <text class="question-solution__label">要点</text>
                <text
                  v-for="(point, pointIndex) in solutionViews[question.id]!.view.points"
                  :key="pointIndex"
                  class="question-solution__point"
                >
                  {{ pointIndex + 1 }}. {{ point }}
                </text>
              </view>
              <view v-if="solutionViews[question.id]!.analysis" class="question-solution__block">
                <text class="question-solution__label">解析</text>
                <UQuestionContent :content="solutionViews[question.id]!.analysis" />
              </view>
              <UQuestionActions :question-id="question.id" @edit-note="openNote" />
            </view>
          </template>
        </UQuestionContent>
      </view>
    </UPageState>

    <UNoteEditor v-model="noteVisible" :question-id="noteQuestionId" />
    <UReportEditor v-model="reportVisible" :question-id="reportQuestionId" />
  </view>
</template>

<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: '题目详情',
  },
});

import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { ApiError, QuestionType, getQuestion, type QuestionContentDto, type QuestionSolutionDto } from '@/api';
import { QUESTION_TYPE_LABELS } from '@/constants';
import { useGlobalStore } from '@/store/modules/global';
import { getBusinessErrorMessage } from '@/utils/business-error';
import { HIDDEN_REASON_TEXT } from '@/utils/practice-card';
import {
  correctOptionKeys,
  isObjectiveType,
  isSubjectiveType,
  optionStatesOf,
  solutionViewOf,
  type OptionState,
  type SolutionView,
} from '@/utils/question-answer';
import { answerableQuestions, toQuestionView, type QuestionView } from '@/utils/question-content';
import { reportsPerChild } from '@/utils/question-report';

interface SolutionEntry {
  view: SolutionView;
  analysis: string | null;
}

const globalStore = useGlobalStore();

const questionId = ref('');
const offline = ref(false);
const detail = ref<QuestionContentDto | null>(null);
const loading = ref(true);
const loadError = ref<string | boolean>(false);
const noteVisible = ref(false);
const noteQuestionId = ref('');
const reportVisible = ref(false);
const reportQuestionId = ref('');

const view = computed<QuestionView | null>(() => {
  const dto = detail.value;
  if (!dto) return null;
  const full = toQuestionView(dto);
  if (full.type !== QuestionType.MATERIAL) return full;
  const target = full.children.filter(child => child.id === questionId.value);
  return target.length > 0 ? { ...full, children: target } : full;
});

const solutions = computed(() => {
  const map = new Map<string, QuestionSolutionDto>();
  const dto = detail.value;
  if (!dto) return map;
  if (dto.solution) map.set(dto.id, dto.solution);
  dto.children?.forEach(child => {
    if (child.solution) map.set(child.id, child.solution);
  });
  return map;
});

const solutionViews = computed<Record<string, SolutionEntry | null>>(() => {
  const result: Record<string, SolutionEntry | null> = {};
  const current = view.value;
  if (!current) return result;
  for (const question of answerableQuestions(current)) {
    const solution = solutions.value.get(question.id);
    result[question.id] = solution
      ? { view: solutionViewOf(question.type, solution.answer), analysis: solution.analysis }
      : null;
  }
  return result;
});

const optionStates = computed(() => {
  const states: Record<string, Record<string, OptionState>> = {};
  const current = view.value;
  if (!current) return states;
  for (const question of answerableQuestions(current)) {
    const solution = solutions.value.get(question.id);
    if (!solution || !isObjectiveType(question.type) || question.type === QuestionType.FILL) continue;
    const correct = correctOptionKeys(question.type, solution.answer);
    states[question.id] = optionStatesOf(correct, correct);
  }
  return states;
});

const hiddenNotice = computed(() => {
  const reason = detail.value?.hiddenReason;
  return reason ? HIDDEN_REASON_TEXT[reason] : '';
});

function typeOf(question: QuestionView): QuestionType {
  return question.type === QuestionType.MATERIAL && question.children.length === 1
    ? question.children[0].type
    : question.type;
}

const perChildReport = computed(() => (view.value ? reportsPerChild(view.value, questionId.value) : false));

function openReport(id: string) {
  reportQuestionId.value = id;
  reportVisible.value = true;
}

function openNote(id: string) {
  noteQuestionId.value = id;
  noteVisible.value = true;
}

async function load() {
  if (!questionId.value) {
    loadError.value = '题目不存在';
    loading.value = false;
    return;
  }
  loading.value = true;
  loadError.value = false;
  try {
    detail.value = await getQuestion(questionId.value, { showError: false });
  } catch (error) {
    const key = error instanceof ApiError ? error.errorKey : undefined;
    loadError.value = key ? getBusinessErrorMessage(key) : true;
    console.error('加载题目失败:', error);
  } finally {
    loading.value = false;
  }
}

onLoad(options => {
  questionId.value = options?.questionId ?? '';
  offline.value = options?.offline === '1';
  load();
});
</script>

<style scoped lang="scss">
.question-page {
  min-height: 100vh;
  background: var(--color-bg-grey);
}

.question-body {
  margin: 24rpx;
  padding: 24rpx;
  border-radius: var(--radius-lg);
  background: var(--color-bg);

  &__tags {
    display: flex;
    align-items: center;
    margin-bottom: 16rpx;
    gap: 12rpx;
  }

  &__spacer {
    flex: 1;
  }

  &__child-report {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin-top: 16rpx;
    color: var(--color-text-secondary);
    font-size: 24rpx;
    gap: 6rpx;
  }

  &__report {
    display: flex;
    align-items: center;
    color: var(--color-text-secondary);
    font-size: 24rpx;
    gap: 6rpx;
  }

  &__notice {
    display: block;
    margin-bottom: 16rpx;
    padding: 12rpx 20rpx;
    border-radius: var(--radius-base);
    background: var(--color-warning-bg);
    color: var(--color-warning);
    font-size: 26rpx;
  }
}

.question-solution {
  display: flex;
  flex-direction: column;
  margin-top: 24rpx;
  gap: 20rpx;

  &__block {
    display: flex;
    flex-direction: column;
    gap: 8rpx;
  }

  &__label {
    color: var(--color-text);
    font-size: 28rpx;
    font-weight: 600;
  }

  &__answer {
    color: var(--color-success);
    font-size: 28rpx;
  }

  &__point {
    color: var(--color-text);
    font-size: 28rpx;
    line-height: 1.6;
  }
}
</style>
