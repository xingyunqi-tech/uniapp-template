<template>
  <view class="trial-page" :class="globalStore.themeClass">
    <UPageState
      :loading="loading"
      :error="loadError"
      :empty="units.length === 0"
      empty-text="今日暂无可试做的题目"
      @retry="load"
    >
      <view class="trial-header">
        <text class="trial-header__title">每日一练 · {{ date }}</text>
        <text class="trial-header__desc">免费试做前 {{ answerableCount }} 题，提交后显示对错，不保存记录</text>
      </view>

      <UCard v-for="(unit, index) in units" :key="unit.id" class="trial-card">
        <UQuestionContent
          :ref="setContentRef"
          :question="unit"
          :start-index="startIndexes[index]"
          :selected-keys="selectedKeys"
          :selectable="!submitted"
          @option-click="handleOptionClick"
        >
          <template #extra="{ question }">
            <view v-if="question.type === QuestionType.FILL" class="trial-fill">
              <UInput
                v-for="blankIndex in question.blankCount ?? 0"
                :key="blankIndex"
                :model-value="answers[question.id]?.blanks?.[blankIndex - 1] ?? ''"
                :placeholder="`第 ${blankIndex} 空`"
                :disabled="submitted"
                @update:model-value="handleBlankInput(question, blankIndex - 1, $event)"
              />
            </view>
            <text v-if="!isObjectiveType(question.type)" class="trial-tip">主观题试做不判分</text>
            <view v-if="submitted" class="trial-result" :class="`trial-result--${resultOf(question)}`">
              {{ RESULT_TEXT[resultOf(question)] }}
            </view>
          </template>
        </UQuestionContent>
      </UCard>

      <view class="trial-actions">
        <UButton v-if="!submitted" text="提交" type="primary" block :loading="submitting" @click="handleSubmit" />
        <template v-else>
          <text class="trial-summary">答对 {{ correctCount }} / {{ gradedCount }} 题</text>
          <UButton text="再做一次" block plain @click="handleRestart" />
          <UButton v-if="!userStore.isLoggedIn" text="登录后练习完整每日一练" type="primary" block @click="goLogin" />
        </template>
      </view>
    </UPageState>
  </view>
</template>

<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: '每日一练试做',
  },
});

import { computed, ref, type ComponentPublicInstance } from 'vue';
import { onHide, onLoad } from '@dcloudio/uni-app';
import { QuestionType, checkSubjectDailyTrial, getSubjectDailyTrial, type TrialAnswerDto } from '@/api';
import { useRouter } from '@/composables';
import { PAGES } from '@/constants';
import { useGlobalStore } from '@/store/modules/global';
import { useUserStore } from '@/store/modules/user';
import {
  buildTrialAnswer,
  isObjectiveType,
  toggleOptionKey,
  trialResultOf,
  type DraftAnswer,
  type TrialResult,
} from '@/utils/question-answer';
import { answerableQuestions, toQuestionView, type QuestionOption, type QuestionView } from '@/utils/question-content';

const RESULT_TEXT: Record<TrialResult, string> = {
  correct: '回答正确',
  wrong: '回答错误',
  skipped: '未作答',
  ungraded: '不判分',
};

const globalStore = useGlobalStore();
const userStore = useUserStore();
const router = useRouter();

const subjectId = ref('');
const date = ref('');
const units = ref<QuestionView[]>([]);
const loading = ref(false);
const loadError = ref(false);
const answers = ref<Record<string, DraftAnswer>>({});
const results = ref<Record<string, boolean | null>>({});
const submitted = ref(false);
const submitting = ref(false);
const contentRefs = new Set<{ pause: () => void }>();

function setContentRef(instance: Element | ComponentPublicInstance | null) {
  if (instance && 'pause' in instance) contentRefs.add(instance as unknown as { pause: () => void });
}

const questions = computed(() => units.value.flatMap(answerableQuestions));
const answerableCount = computed(() => questions.value.length);
const startIndexes = computed(() => {
  let next = 1;
  return units.value.map(unit => {
    const start = next;
    next += answerableQuestions(unit).length;
    return start;
  });
});
const selectedKeys = computed(() =>
  Object.fromEntries(Object.entries(answers.value).map(([id, answer]) => [id, answer.keys ?? []])),
);
const correctCount = computed(() => Object.values(results.value).filter(value => value === true).length);
const gradedCount = computed(() => questions.value.filter(question => isObjectiveType(question.type)).length);

async function load() {
  if (!subjectId.value) {
    loadError.value = true;
    return;
  }
  loading.value = true;
  loadError.value = false;
  try {
    const trial = await getSubjectDailyTrial(subjectId.value);
    date.value = trial.date;
    contentRefs.clear();
    units.value = trial.questions.map(unit => toQuestionView(unit));
    handleRestart();
  } catch (error) {
    loadError.value = true;
    console.error('加载试做题目失败:', error);
  } finally {
    loading.value = false;
  }
}

function handleOptionClick(question: QuestionView, option: QuestionOption) {
  const current = answers.value[question.id] ?? {};
  answers.value = {
    ...answers.value,
    [question.id]: { ...current, keys: toggleOptionKey(question.type, current.keys, option.key) },
  };
}

function handleBlankInput(question: QuestionView, index: number, value: string | number) {
  const blanks = [...(answers.value[question.id]?.blanks ?? Array(question.blankCount ?? 0).fill(''))];
  blanks[index] = String(value);
  answers.value = { ...answers.value, [question.id]: { ...answers.value[question.id], blanks } };
}

function resultOf(question: QuestionView): TrialResult {
  return trialResultOf(question.type, results.value[question.id]);
}

async function handleSubmit() {
  const payload: TrialAnswerDto[] = questions.value.flatMap(question => {
    const answer = buildTrialAnswer(question.type, answers.value[question.id]);
    return answer ? [{ questionId: question.id, answer }] : [];
  });
  if (payload.length === 0) {
    uni.showToast({ title: '请先作答', icon: 'none' });
    return;
  }
  submitting.value = true;
  try {
    const { results: list } = await checkSubjectDailyTrial(subjectId.value, { date: date.value, answers: payload });
    results.value = Object.fromEntries(list.map(item => [item.questionId, item.isCorrect]));
    submitted.value = true;
  } catch (error) {
    console.error('提交试做失败:', error);
  } finally {
    submitting.value = false;
  }
}

function handleRestart() {
  answers.value = {};
  results.value = {};
  submitted.value = false;
}

function goLogin() {
  router.push(PAGES.LOGIN, { redirect: `${PAGES.EXAM_TRIAL}?subjectId=${subjectId.value}` });
}

onHide(() => {
  contentRefs.forEach(content => content.pause());
});

onLoad(options => {
  subjectId.value = options?.subjectId ?? '';
  load();
});
</script>

<style scoped lang="scss">
.trial-page {
  min-height: 100vh;
  padding-bottom: calc(env(safe-area-inset-bottom) + 32rpx);
  background: var(--color-bg-grey);
}

.trial-header {
  display: flex;
  flex-direction: column;
  padding: 24rpx;
  gap: 8rpx;

  &__title {
    color: var(--color-text);
    font-size: 34rpx;
    font-weight: 600;
  }

  &__desc {
    color: var(--color-text-secondary);
    font-size: 24rpx;
  }
}

.trial-card {
  margin: 0 24rpx 24rpx;
}

.trial-fill {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.trial-tip {
  display: block;
  color: var(--color-text-secondary);
  font-size: 24rpx;
}

.trial-result {
  margin-top: 16rpx;
  padding: 12rpx 20rpx;
  border-radius: var(--radius-base);
  font-size: 26rpx;

  &--correct {
    background: var(--color-success-bg);
    color: var(--color-success);
  }

  &--wrong {
    background: var(--color-error-bg);
    color: var(--color-error);
  }

  &--skipped,
  &--ungraded {
    background: var(--color-info-bg);
    color: var(--color-info);
  }
}

.trial-actions {
  display: flex;
  flex-direction: column;
  padding: 0 24rpx;
  gap: 20rpx;
}

.trial-summary {
  color: var(--color-text);
  font-size: 30rpx;
  font-weight: 600;
  text-align: center;
}
</style>
