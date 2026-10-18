<template>
  <view class="answer-page" :class="globalStore.themeClass">
    <UPageState :loading="loading" :error="loadError" full-height @retry="load">
      <view class="answer-bar">
        <text class="answer-bar__mode">{{ modeLabel }}</text>
        <text class="answer-bar__progress">{{ currentIndex + 1 }} / {{ total }}</text>
        <text
          v-if="practiceStore.remaining !== null"
          class="answer-bar__timer"
          :class="{ 'answer-bar__timer--warn': practiceStore.remaining <= 300 }"
        >
          {{ formatClock(practiceStore.remaining) }}
        </text>
        <view class="answer-bar__spacer" />
        <view v-if="practiceStore.canAnswer && currentCard" class="answer-bar__mark" @click="handleMark">
          <UIcon
            :name="currentCard.markedForReview ? 'star-filled' : 'star'"
            size="36rpx"
            :color="currentCard.markedForReview ? 'var(--color-warning)' : 'var(--color-text-secondary)'"
          />
          <text>{{ currentCard.markedForReview ? '已标记' : '标记' }}</text>
        </view>
      </view>

      <view v-if="banner" class="answer-banner">{{ banner }}</view>

      <swiper class="answer-swiper" :current="swiperCurrent" circular :duration="200" @change="handleSwiperChange">
        <swiper-item v-for="(questionIndex, slot) in slots" :key="slot">
          <scroll-view scroll-y class="answer-slide">
            <view v-if="questionIndex < 0" class="answer-slide__edge">
              <text>{{ questionIndex < 0 && slot === nextSlot ? '已经是最后一题' : '已经是第一题' }}</text>
            </view>
            <view v-else-if="!items[questionIndex]" class="answer-slide__state">
              <UPageState :loading="!segmentError" :error="segmentError" @retry="loadItems(currentIndex, true)" />
            </view>
            <view v-else class="answer-slide__body">
              <view class="answer-slide__type">
                <UTag
                  :text="QUESTION_TYPE_LABELS[items[questionIndex].question.type]"
                  type="primary"
                  size="small"
                  plain
                />
              </view>
              <UQuestionContent
                :ref="(instance: unknown) => setContentRef(slot, instance)"
                :question="pageQuestionOf(items[questionIndex])"
                :start-index="questionIndex + 1"
                :selected-keys="selectedKeys"
                :selectable="canChoose(items[questionIndex])"
                :option-states="optionStates"
                @option-click="handleOptionClick"
              >
                <template #extra="{ question }">
                  <view v-if="question.type === QuestionType.FILL" class="answer-fill">
                    <UInput
                      v-for="blankIndex in question.blankCount ?? 0"
                      :key="blankIndex"
                      :model-value="draftOfId(question.id).blanks?.[blankIndex - 1] ?? ''"
                      :placeholder="`第 ${blankIndex} 空`"
                      :maxlength="MAX_BLANK_LENGTH"
                      :disabled="isLockedId(question.id)"
                      @update:model-value="handleBlankInput(question, blankIndex - 1, $event)"
                    />
                  </view>

                  <view v-if="isSubjectiveType(question.type)" class="answer-text">
                    <UTextarea
                      :model-value="draftOfId(question.id).text ?? ''"
                      placeholder="请输入你的作答"
                      :maxlength="MAX_TEXT_LENGTH"
                      :height="240"
                      :disabled="isLockedId(question.id)"
                      @update:model-value="handleTextInput(question, $event)"
                    />
                  </view>

                  <view v-if="needsSubmitButton(question)" class="answer-submit">
                    <UButton
                      text="提交答案"
                      type="primary"
                      block
                      :loading="savingId === question.id"
                      @click="submitAnswer(question)"
                    />
                  </view>

                  <view v-if="feedbacks[question.id]" class="answer-feedback">
                    <view
                      v-if="feedbacks[question.id]!.status"
                      class="answer-feedback__result"
                      :class="`answer-feedback__result--${feedbacks[question.id]!.status}`"
                    >
                      {{ CARD_STATUS_TEXT[feedbacks[question.id]!.status!] }}
                    </view>
                    <text v-if="feedbacks[question.id]!.notice" class="answer-feedback__notice">
                      {{ feedbacks[question.id]!.notice }}
                    </text>
                    <template v-if="feedbacks[question.id]!.solution">
                      <view v-if="feedbacks[question.id]!.solution!.answer" class="answer-feedback__block">
                        <text class="answer-feedback__label">
                          {{ isSubjectiveType(question.type) ? '参考答案' : '正确答案' }}
                        </text>
                        <UQuestionContent
                          v-if="isSubjectiveType(question.type)"
                          :content="feedbacks[question.id]!.solution!.answer"
                        />
                        <text v-else class="answer-feedback__answer">{{
                          feedbacks[question.id]!.solution!.answer
                        }}</text>
                      </view>
                      <view v-if="feedbacks[question.id]!.solution!.points.length > 0" class="answer-feedback__block">
                        <text class="answer-feedback__label">要点</text>
                        <text
                          v-for="(point, pointIndex) in feedbacks[question.id]!.solution!.points"
                          :key="pointIndex"
                          class="answer-feedback__point"
                        >
                          {{ pointIndex + 1 }}. {{ point }}
                        </text>
                      </view>
                      <view v-if="feedbacks[question.id]!.analysis" class="answer-feedback__block">
                        <text class="answer-feedback__label">解析</text>
                        <UQuestionContent :content="feedbacks[question.id]!.analysis" />
                      </view>
                    </template>
                    <view v-if="feedbacks[question.id]!.selfAssess" class="answer-self">
                      <text class="answer-self__title">对照参考答案，你掌握了吗？</text>
                      <view class="answer-self__actions">
                        <UButton
                          text="不会"
                          plain
                          size="small"
                          :loading="assessingId === question.id"
                          @click="handleSelfAssess(question, SelfAssessment.UNKNOWN)"
                        />
                        <UButton
                          text="会"
                          type="primary"
                          size="small"
                          :loading="assessingId === question.id"
                          @click="handleSelfAssess(question, SelfAssessment.KNOWN)"
                        />
                      </view>
                    </view>
                    <text v-else-if="feedbacks[question.id]!.selfResult" class="answer-feedback__notice">
                      自评：{{ feedbacks[question.id]!.selfResult }}
                    </text>
                  </view>
                </template>
              </UQuestionContent>
            </view>
          </scroll-view>
        </swiper-item>
      </swiper>

      <view class="answer-footer">
        <UButton text="上一题" size="small" plain :disabled="currentIndex <= 0" @click="step(-1)" />
        <UButton text="答题卡" size="small" plain @click="cardVisible = true" />
        <UButton
          v-if="finishText"
          :text="finishText"
          size="small"
          type="primary"
          :loading="finishing"
          @click="handleFinish"
        />
        <UButton text="下一题" size="small" plain :disabled="currentIndex >= total - 1" @click="step(1)" />
      </view>

      <UPopup v-model="cardVisible" type="bottom" title="答题卡">
        <view class="answer-card">
          <view class="answer-card__legend">
            <view v-for="status in legend" :key="status" class="answer-card__legend-item">
              <view class="answer-card__dot" :class="`answer-card__cell--${status}`" />
              <text>{{ CARD_STATUS_TEXT[status] }}</text>
            </view>
            <view class="answer-card__legend-item">
              <view class="answer-card__dot answer-card__dot--marked" />
              <text>标记</text>
            </view>
          </view>
          <scroll-view scroll-y class="answer-card__scroll">
            <view class="answer-card__grid">
              <view
                v-for="entry in practiceStore.card"
                :key="entry.questionId"
                class="answer-card__cell"
                :class="[
                  `answer-card__cell--${practiceStore.statusOf(entry.index)}`,
                  {
                    'answer-card__cell--current': entry.index === currentIndex,
                    'answer-card__cell--marked': entry.markedForReview,
                  },
                ]"
                @click="jumpTo(entry.index)"
              >
                {{ entry.index + 1 }}
              </view>
            </view>
          </scroll-view>
          <UButton
            v-if="finishText"
            :text="finishText"
            type="primary"
            block
            :loading="finishing"
            @click="handleFinish"
          />
        </view>
      </UPopup>
    </UPageState>
  </view>
</template>

<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: '答题',
  },
});

import { computed, nextTick, ref, watch } from 'vue';
import { onHide, onLoad, onShow, onUnload } from '@dcloudio/uni-app';
import { PracticeMode, PracticeSessionStatus, QuestionType, SelfAssessment } from '@/api';
import { useRouter } from '@/composables';
import { PAGES, PRACTICE_MODE_LABELS, QUESTION_TYPE_LABELS } from '@/constants';
import { usePracticeStore } from '@/store/modules/practice';
import { useGlobalStore } from '@/store/modules/global';
import { alert, confirm } from '@/utils/modal';
import { onNetworkChange } from '@/utils/network';
import { CARD_STATUS_TEXT, HIDDEN_REASON_TEXT, type CardStatus } from '@/utils/practice-card';
import { formatClock } from '@/utils/practice-clock';
import { pageQuestionOf, slotIndexes, swipeDirection, type PracticeItem } from '@/utils/practice-segment';
import {
  correctOptionKeys,
  isObjectiveType,
  isSubjectiveType,
  optionStatesOf,
  solutionViewOf,
  toggleOptionKey,
  type DraftAnswer,
  type OptionState,
  type SolutionView,
} from '@/utils/question-answer';
import type { QuestionOption, QuestionView } from '@/utils/question-content';
import { safeBack } from '@/utils/router';
import { showToast } from '@/utils/toast';

const MAX_BLANK_LENGTH = 200;
const MAX_TEXT_LENGTH = 5000;
const DRAFT_DEBOUNCE_MS = 500;

interface Feedback {
  status: CardStatus | null;
  notice: string;
  solution: SolutionView | null;
  analysis: string | null;
  selfAssess: boolean;
  selfResult: string;
}

const globalStore = useGlobalStore();
const practiceStore = usePracticeStore();
const router = useRouter();

const sessionId = ref('');
const loading = ref(true);
const loadError = ref(false);
const segmentError = ref(false);
const currentIndex = ref(0);
const swiperCurrent = ref(0);
const cardVisible = ref(false);
const finishing = ref(false);
const savingId = ref('');
const assessingId = ref('');
const timeUpHandled = ref(false);
const timeUpAlerting = ref(false);
const elapsed: Record<string, number> = {};
const contentRefs = new Map<number, { pause: () => void }>();
const draftTimers = new Map<string, { timer: ReturnType<typeof setTimeout>; answeredAt: number }>();
let viewStartedAt = Date.now();
let initialIndex: number | null = null;
let stopNetworkListener: (() => void) | null = null;

const items = computed(() => practiceStore.items);
const total = computed(() => practiceStore.total);
const session = computed(() => practiceStore.session);
const modeLabel = computed(() => (practiceStore.mode ? PRACTICE_MODE_LABELS[practiceStore.mode] : ''));
const slots = computed(() => slotIndexes(currentIndex.value, swiperCurrent.value, total.value));
const nextSlot = computed(() => (swiperCurrent.value + 1) % 3);
const currentCard = computed(() => practiceStore.cardByIndex.get(currentIndex.value) ?? null);
const slotItems = computed(() =>
  slots.value.flatMap(index => (index >= 0 && items.value[index] ? [items.value[index]] : [])),
);

const selectedKeys = computed(() =>
  Object.fromEntries(slotItems.value.map(item => [item.question.id, practiceStore.draftOf(item).keys ?? []])),
);

const optionStates = computed(() => {
  const states: Record<string, Record<string, OptionState>> = {};
  for (const item of slotItems.value) {
    const { type } = item.question;
    if (!item.solution || !isObjectiveType(type) || type === QuestionType.FILL) continue;
    const correct = correctOptionKeys(type, item.solution.answer);
    const selected = practiceStore.isMemorize ? correct : (practiceStore.draftOf(item).keys ?? []);
    states[item.question.id] = optionStatesOf(selected, correct);
  }
  return states;
});

const legend = computed<CardStatus[]>(() =>
  practiceStore.revealed ? ['correct', 'wrong', 'partial', 'pendingSelf', 'unanswered'] : ['answered', 'unanswered'],
);

const finishText = computed(() => {
  const current = session.value;
  if (!current || practiceStore.endReason) return '';
  if (practiceStore.inProgress) {
    if (current.mode === PracticeMode.MOCK) return '交卷';
    if (current.mode === PracticeMode.DAILY || current.mode === PracticeMode.MEMORIZE) return '';
    return '结束练习';
  }
  return current.status === PracticeSessionStatus.SUBMITTED && current.mode !== PracticeMode.MEMORIZE ? '查看报告' : '';
});

const banner = computed(() => {
  if (practiceStore.timeUp && practiceStore.pendingCount > 0) return '考试时间到，作答正在补交，请保持网络连接';
  if (practiceStore.timeUp) return '考试时间到，已停止作答';
  if (practiceStore.syncError && practiceStore.pendingCount > 0) return '网络异常，作答已保存在本地，恢复后自动同步';
  if (session.value?.status === PracticeSessionStatus.ABANDONED) return '该练习已放弃，仅可查看';
  return '';
});

function setContentRef(slot: number, instance: unknown) {
  if (instance && typeof instance === 'object' && 'pause' in instance) {
    contentRefs.set(slot, instance as { pause: () => void });
  } else {
    contentRefs.delete(slot);
  }
}

function pauseAudio() {
  contentRefs.forEach(content => content.pause());
}

function itemById(questionId: string): PracticeItem | undefined {
  return practiceStore.itemOf(questionId);
}

function draftOfId(questionId: string): DraftAnswer {
  const item = itemById(questionId);
  return item ? practiceStore.draftOf(item) : {};
}

function isLockedId(questionId: string): boolean {
  const item = itemById(questionId);
  return !item || practiceStore.isAnswerLocked(item);
}

function canChoose(item: PracticeItem): boolean {
  return !practiceStore.isAnswerLocked(item);
}

function needsSubmitButton(question: QuestionView): boolean {
  if (practiceStore.isMock || isLockedId(question.id)) return false;
  return (
    question.type === QuestionType.MULTIPLE || question.type === QuestionType.FILL || isSubjectiveType(question.type)
  );
}

function durationOf(questionId: string): number {
  const extra = items.value[currentIndex.value]?.question.id === questionId ? Date.now() - viewStartedAt : 0;
  return ((elapsed[questionId] ?? 0) + extra) / 1000;
}

const feedbacks = computed<Record<string, Feedback | null>>(() =>
  Object.fromEntries(slotItems.value.map(item => [item.question.id, feedbackOf(item.question)])),
);

function feedbackOf(question: QuestionView): Feedback | null {
  const item = itemById(question.id);
  if (!item) return null;
  const entry = practiceStore.cardByQuestion.get(question.id);
  if (item.hiddenReason) {
    return {
      status: null,
      notice: HIDDEN_REASON_TEXT[item.hiddenReason],
      solution: null,
      analysis: null,
      selfAssess: false,
      selfResult: '',
    };
  }
  const status = entry ? practiceStore.statusOf(entry.index) : null;
  const pending =
    !practiceStore.isMock && practiceStore.isAnswerLocked(item) && !item.answerState?.answer && entry?.answered;
  if (!item.solution) {
    if (pending) {
      return {
        status: null,
        notice: '作答已保存，联网后判分',
        solution: null,
        analysis: null,
        selfAssess: false,
        selfResult: '',
      };
    }
    if (!practiceStore.inProgress && entry && !entry.answered && !practiceStore.isMemorize) {
      return { status: 'unanswered', notice: '', solution: null, analysis: null, selfAssess: false, selfResult: '' };
    }
    return null;
  }
  const subjective = isSubjectiveType(question.type);
  const selfAssessment = item.answerState?.selfAssessment ?? null;
  const showStatus = !practiceStore.isMemorize && status && status !== 'answered' ? status : null;
  return {
    status: showStatus,
    notice: '',
    solution: solutionViewOf(question.type, item.solution.answer),
    analysis: item.solution.analysis,
    selfAssess: subjective && practiceStore.canSelfAssess && !!item.answerState?.answer && selfAssessment === null,
    selfResult:
      selfAssessment === SelfAssessment.KNOWN ? '会' : selfAssessment === SelfAssessment.UNKNOWN ? '不会' : '',
  };
}

function saveDraftNow(questionId: string, answeredAt?: number) {
  return practiceStore.saveAnswer(questionId, { durationSec: durationOf(questionId), answeredAt });
}

function flushDraftTimers() {
  draftTimers.forEach(({ timer, answeredAt }, questionId) => {
    clearTimeout(timer);
    saveDraftNow(questionId, answeredAt);
  });
  draftTimers.clear();
}

function updateDraft(questionId: string, draft: DraftAnswer) {
  practiceStore.setDraft(questionId, draft);
  if (!practiceStore.isMock) return;
  const previous = draftTimers.get(questionId);
  if (previous) clearTimeout(previous.timer);
  const answeredAt = Date.now();
  const timer = setTimeout(() => {
    draftTimers.delete(questionId);
    saveDraftNow(questionId, answeredAt);
  }, DRAFT_DEBOUNCE_MS);
  draftTimers.set(questionId, { timer, answeredAt });
}

async function submitAnswer(question: QuestionView) {
  savingId.value = question.id;
  try {
    await saveDraftNow(question.id);
  } catch (error) {
    console.error('提交作答失败:', error);
  } finally {
    savingId.value = '';
  }
}

function handleOptionClick(question: QuestionView, option: QuestionOption) {
  const item = itemById(question.id);
  if (!item || practiceStore.isAnswerLocked(item)) return;
  const current = practiceStore.draftOf(item);
  practiceStore.setDraft(question.id, { ...current, keys: toggleOptionKey(question.type, current.keys, option.key) });
  if (practiceStore.isMock || question.type !== QuestionType.MULTIPLE) submitAnswer(question);
}

function handleBlankInput(question: QuestionView, index: number, value: string | number) {
  const current = draftOfId(question.id);
  const blanks = [...(current.blanks ?? Array(question.blankCount ?? 0).fill(''))];
  blanks[index] = String(value);
  updateDraft(question.id, { ...current, blanks });
}

function handleTextInput(question: QuestionView, value: string) {
  updateDraft(question.id, { ...draftOfId(question.id), text: value });
}

async function handleSelfAssess(question: QuestionView, value: SelfAssessment) {
  assessingId.value = question.id;
  try {
    await practiceStore.selfAssess(question.id, value);
  } catch (error) {
    console.error('自评失败:', error);
  } finally {
    assessingId.value = '';
  }
}

async function handleMark() {
  const entry = currentCard.value;
  if (!entry) return;
  try {
    await practiceStore.toggleMark(entry.questionId);
  } catch (error) {
    console.error('标记失败:', error);
  }
}

async function loadItems(index: number, retry = false) {
  if (retry) segmentError.value = false;
  try {
    await practiceStore.ensureItems(index);
    segmentError.value = false;
  } catch (error) {
    if (!items.value[index]) segmentError.value = true;
    console.error('加载题目失败:', error);
  }
}

function leaveQuestion(index: number) {
  const id = items.value[index]?.question.id;
  if (id) elapsed[id] = (elapsed[id] ?? 0) + Date.now() - viewStartedAt;
  viewStartedAt = Date.now();
}

function step(direction: -1 | 1) {
  const target = currentIndex.value + direction;
  if (target < 0 || target >= total.value) return;
  swiperCurrent.value = (swiperCurrent.value + direction + 3) % 3;
  currentIndex.value = target;
}

function jumpTo(index: number) {
  cardVisible.value = false;
  if (index !== currentIndex.value) currentIndex.value = index;
}

function handleSwiperChange(event: { detail: { current: number } }) {
  const next = event.detail.current;
  const previous = swiperCurrent.value;
  const direction = swipeDirection(previous, next);
  if (direction === 0) return;
  const target = currentIndex.value + direction;
  if (target < 0 || target >= total.value) {
    swiperCurrent.value = next;
    nextTick(() => {
      swiperCurrent.value = previous;
    });
    return;
  }
  swiperCurrent.value = next;
  currentIndex.value = target;
}

watch(currentIndex, (index, previous) => {
  pauseAudio();
  flushDraftTimers();
  leaveQuestion(previous);
  if (practiceStore.isMock && practiceStore.pendingCount > 0) practiceStore.flush().catch(() => undefined);
  practiceStore.updateProgress(index);
  loadItems(index);
});

function goReport(replace = true) {
  const id = session.value?.id;
  if (!id) return;
  if (replace) router.replace(PAGES.EXAM_REPORT, { sessionId: id });
  else router.push(PAGES.EXAM_REPORT, { sessionId: id });
}

async function submitSession() {
  if (finishing.value) return;
  finishing.value = true;
  flushDraftTimers();
  try {
    await practiceStore.submit();
    goReport();
  } catch (error) {
    if (practiceStore.endReason === null) showToast((error as Error)?.message || '提交失败');
    console.error('交卷失败:', error);
  } finally {
    finishing.value = false;
  }
}

async function handleFinish() {
  cardVisible.value = false;
  const current = session.value;
  if (!current) return;
  if (!practiceStore.inProgress) {
    goReport(false);
    return;
  }
  flushDraftTimers();
  const unanswered = practiceStore.unansweredCount;
  const isMock = current.mode === PracticeMode.MOCK;
  const content = isMock
    ? unanswered > 0
      ? `还有 ${unanswered} 题未作答，确定交卷吗？`
      : '确定交卷吗？交卷后不能修改答案'
    : unanswered > 0
      ? `还有 ${unanswered} 题未作答，确定结束练习吗？`
      : '确定结束练习吗？';
  if (await confirm({ content, confirmText: isMock ? '交卷' : '结束' })) await submitSession();
}

async function handleTimeUp() {
  if (timeUpHandled.value) return;
  timeUpHandled.value = true;
  pauseAudio();
  cardVisible.value = false;
  flushDraftTimers();
  timeUpAlerting.value = true;
  await alert('考试时间到，将自动交卷');
  timeUpAlerting.value = false;
  await submitSession();
}

watch(
  () => practiceStore.timeUp,
  value => {
    if (value && !loading.value) handleTimeUp();
  },
);

watch(
  () => practiceStore.pendingCount,
  count => {
    if (count === 0 && timeUpHandled.value && !timeUpAlerting.value && practiceStore.inProgress) submitSession();
  },
);

async function handleEnd(reason: 'takenOver' | 'closed') {
  pauseAudio();
  cardVisible.value = false;
  if (reason === 'takenOver') {
    await alert('考试已在其他设备继续，本设备已退出答题');
    safeBack(PAGES.HOME);
    return;
  }
  try {
    const detail = await practiceStore.refresh();
    if (detail?.status === PracticeSessionStatus.SUBMITTED && detail.mode !== PracticeMode.MEMORIZE) {
      showToast('已交卷');
      goReport();
      return;
    }
  } catch (error) {
    console.error('刷新练习失败:', error);
  }
  await alert('练习已结束');
  safeBack(PAGES.HOME);
}

watch(
  () => practiceStore.endReason,
  reason => {
    if (reason) handleEnd(reason);
  },
);

async function load() {
  if (!sessionId.value) {
    loadError.value = true;
    loading.value = false;
    return;
  }
  loading.value = true;
  loadError.value = false;
  try {
    const detail = await practiceStore.open(sessionId.value);
    const last = Math.max(0, detail.questionCount - 1);
    currentIndex.value = Math.min(Math.max(initialIndex ?? detail.lastIndex, 0), last);
    swiperCurrent.value = 0;
    viewStartedAt = Date.now();
    await loadItems(currentIndex.value);
    if (practiceStore.inProgress) practiceStore.startAutoSync();
    if (practiceStore.pendingCount > 0) practiceStore.flush().catch(() => undefined);
  } catch (error) {
    loadError.value = true;
    console.error('加载练习失败:', error);
  } finally {
    loading.value = false;
  }
  if (practiceStore.timeUp) handleTimeUp();
}

onLoad(options => {
  sessionId.value = options?.sessionId ?? '';
  const index = Number(options?.index);
  initialIndex = Number.isInteger(index) && index >= 0 ? index : null;
  stopNetworkListener = onNetworkChange(connected => {
    if (connected && practiceStore.pendingCount > 0) practiceStore.flush().catch(() => undefined);
  });
  load();
});

onShow(() => {
  if (!loading.value && practiceStore.inProgress && practiceStore.session?.id === sessionId.value) {
    viewStartedAt = Date.now();
    practiceStore.startAutoSync();
    if (practiceStore.isMock) practiceStore.refresh().catch(() => undefined);
  }
});

onHide(() => {
  pauseAudio();
  flushDraftTimers();
  leaveQuestion(currentIndex.value);
  practiceStore.stopAutoSync();
  if (practiceStore.pendingCount > 0) practiceStore.flush().catch(() => undefined);
});

onUnload(() => {
  stopNetworkListener?.();
  flushDraftTimers();
  leaveQuestion(currentIndex.value);
  practiceStore.stopAutoSync();
  if (practiceStore.pendingCount > 0) practiceStore.flush().catch(() => undefined);
});
</script>

<style scoped lang="scss">
.answer-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--color-bg-grey);
}

.answer-bar {
  display: flex;
  align-items: center;
  padding: 16rpx 24rpx;
  background: var(--color-bg);
  gap: 20rpx;

  &__mode {
    color: var(--color-text);
    font-size: 28rpx;
    font-weight: 600;
  }

  &__progress {
    color: var(--color-text-secondary);
    font-size: 26rpx;
  }

  &__timer {
    color: var(--color-primary);
    font-size: 30rpx;
    font-variant-numeric: tabular-nums;
    font-weight: 600;

    &--warn {
      color: var(--color-error);
    }
  }

  &__spacer {
    flex: 1;
  }

  &__mark {
    display: flex;
    align-items: center;
    color: var(--color-text-secondary);
    font-size: 24rpx;
    gap: 6rpx;
  }
}

.answer-banner {
  padding: 12rpx 24rpx;
  background: var(--color-warning-bg);
  color: var(--color-warning);
  font-size: 24rpx;
}

.answer-swiper {
  flex: 1;
  min-height: 0;
}

.answer-slide {
  box-sizing: border-box;
  height: 100%;

  &__edge,
  &__state {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 600rpx;
    color: var(--color-text-secondary);
    font-size: 28rpx;
  }

  &__body {
    margin: 24rpx;
    padding: 24rpx;
    border-radius: var(--radius-lg);
    background: var(--color-bg);
  }

  &__type {
    margin-bottom: 16rpx;
  }
}

.answer-fill,
.answer-text {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.answer-submit {
  margin-top: 24rpx;
}

.answer-feedback {
  display: flex;
  flex-direction: column;
  margin-top: 24rpx;
  gap: 20rpx;

  &__result {
    padding: 12rpx 20rpx;
    border-radius: var(--radius-base);
    font-size: 28rpx;
    font-weight: 600;

    &--correct {
      background: var(--color-success-bg);
      color: var(--color-success);
    }

    &--wrong {
      background: var(--color-error-bg);
      color: var(--color-error);
    }

    &--partial,
    &--pendingSelf {
      background: var(--color-warning-bg);
      color: var(--color-warning);
    }

    &--unanswered {
      background: var(--color-info-bg);
      color: var(--color-info);
    }
  }

  &__notice {
    color: var(--color-text-secondary);
    font-size: 26rpx;
  }

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

.answer-self {
  display: flex;
  flex-direction: column;
  padding: 20rpx;
  border-radius: var(--radius-lg);
  background: var(--color-bg-grey);
  gap: 16rpx;

  &__title {
    color: var(--color-text);
    font-size: 28rpx;
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: 20rpx;
  }
}

.answer-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 24rpx calc(env(safe-area-inset-bottom) + 16rpx);
  background: var(--color-bg);
  gap: 16rpx;
}

.answer-card {
  display: flex;
  flex-direction: column;
  gap: 24rpx;

  &__legend {
    display: flex;
    flex-wrap: wrap;
    gap: 24rpx;
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
    border-radius: 50%;

    &--marked {
      border: 4rpx solid var(--color-warning);
    }
  }

  &__scroll {
    max-height: 50vh;
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

    &--answered {
      border-color: var(--color-primary);
      background: var(--color-primary-bg);
      color: var(--color-primary);
    }

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
    }

    &--marked {
      box-shadow: 0 0 0 4rpx var(--color-warning);
    }

    &--current {
      font-weight: 700;
    }
  }
}
</style>
