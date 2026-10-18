<template>
  <view class="bank-page" :class="globalStore.themeClass">
    <UPageState v-if="!examStore.currentProfile && profilesPending" loading />

    <view v-else-if="!examStore.currentProfile" class="bank-page__empty">
      <UEmpty text="还没有选择目标考试">
        <UButton text="选择考试" type="primary" size="small" @click="goSelectExam" />
      </UEmpty>
    </view>

    <template v-else>
      <view class="bank-header">
        <text class="bank-header__name">{{ examStore.currentExam?.name || '当前考试' }}</text>
        <text class="bank-header__switch" @click="goSelectExam">切换考试</text>
      </view>

      <UPageState
        :loading="!subjectsLoaded && !subjectsError"
        :error="subjectsError"
        :empty="subjects.length === 0"
        empty-text="该考试暂无科目"
        @retry="loadSubjects()"
      >
        <view class="bank-tabs">
          <UTabs v-model="subjectTab" :tabs="subjectTabs" scrollable />
        </view>

        <view class="practice-modes">
          <view
            v-for="entry in PRACTICE_ENTRIES"
            :key="entry.key"
            class="practice-mode"
            @click="handlePracticeEntry(entry.key)"
          >
            <view class="practice-mode__icon">
              <UIcon :name="entry.icon" size="40rpx" color="var(--color-primary)" />
            </view>
            <text class="practice-mode__label">{{ entry.label }}</text>
          </view>
        </view>

        <view class="bank-tabs bank-tabs--section">
          <UTabs v-model="section" :tabs="SECTION_TABS" type="card" />
        </view>

        <view v-if="section === 'knowledge' && weakPoints.length > 0" class="weak-points">
          <view class="weak-points__header">
            <text class="weak-points__title">薄弱知识点</text>
            <text class="weak-points__desc">掌握度低于 {{ WEAK_MASTERY_THRESHOLD }}%</text>
          </view>
          <view v-for="point in weakPoints" :key="point.knowledgePointId" class="weak-point">
            <text class="weak-point__name">{{ point.name }}</text>
            <text class="weak-point__mastery">{{ formatMastery(point.mastery) }}</text>
            <text class="weak-point__practice" @click="practiceWeakPoint(point)">练习</text>
          </view>
        </view>

        <view v-if="section === 'knowledge'" class="knowledge">
          <UPageState
            :loading="treeLoading"
            :error="treeError"
            :empty="tree.length === 0"
            empty-text="暂无知识点"
            @retry="loadTree"
          >
            <view
              v-for="row in rows"
              :key="row.node.id"
              class="knowledge-row"
              :style="{ paddingLeft: `${24 + row.depth * 40}rpx` }"
              @click="toggleNode(row)"
            >
              <view class="knowledge-row__arrow">
                <UIcon
                  v-if="row.hasChildren"
                  :name="row.expanded ? 'down' : 'right'"
                  size="28rpx"
                  color="var(--color-text-secondary)"
                />
              </view>
              <text class="knowledge-row__name" :class="{ 'knowledge-row__name--root': row.depth === 0 }">
                {{ row.node.name }}
              </text>
              <view v-if="row.node.progress" class="knowledge-row__stats">
                <text class="knowledge-row__progress">{{ knowledgeProgressText(row.node) }}</text>
                <text
                  class="knowledge-row__mastery"
                  :class="`knowledge-row__mastery--${masteryLevel(row.node.progress.mastery)}`"
                >
                  {{ knowledgeMasteryText(row.node) }}
                </text>
              </view>
              <text v-else class="knowledge-row__count">{{ row.node.questionCount }} 题</text>
              <text
                v-if="row.node.questionCount > 0"
                class="knowledge-row__practice"
                @click.stop="openKnowledgeActions(row.node)"
              >
                练习
              </text>
            </view>
          </UPageState>
        </view>

        <view v-else class="papers">
          <UTabs v-model="paperType" :tabs="PAPER_TABS" />
          <UList
            class="papers__list"
            :empty="papersEmpty"
            :loading="papersLoading"
            :finished="!papersHasMore"
            :error="papersError"
            empty-text="暂无试卷"
            @retry="retryPapers"
          >
            <UCard v-for="paper in papers" :key="paper.id" class="paper-card" clickable @click="goPaper(paper)">
              <view class="paper-card__header">
                <UTag :text="PAPER_TYPE_LABELS[paper.type]" type="primary" size="small" plain />
                <text class="paper-card__title">{{ paper.title }}</text>
              </view>
              <view class="paper-card__meta">
                <text v-if="paper.year">{{ paper.year }} 年</text>
                <text>{{ paper.questionCount }} 题</text>
                <text>{{ paper.durationMin }} 分钟</text>
                <text>{{ paper.attemptCount }} 人参考</text>
              </view>
              <view v-if="paper.lastScore !== null || paper.bestScore !== null" class="paper-card__score">
                <text v-if="paper.lastScore !== null">最近 {{ paper.lastScore }} 分</text>
                <text v-if="paper.bestScore !== null">最高 {{ paper.bestScore }} 分</text>
              </view>
            </UCard>
          </UList>
        </view>
      </UPageState>
    </template>
  </view>
</template>

<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: '题库',
    enablePullDownRefresh: true,
  },
});

import { computed, ref, watch } from 'vue';
import { onPullDownRefresh, onReachBottom, onShow } from '@dcloudio/uni-app';
import {
  PracticeMode,
  getSubjectKnowledgePoints,
  getSubjectPapers,
  type PaperType,
  type PublicKnowledgePointTreeNodeDto,
  type PublicPaperDto,
  type QuestionType,
  type WeakPointDto,
} from '@/api';
import type { IconName } from '@/components/UIcon/index.vue';
import type { TabItem, TabValue } from '@/components/UTabs/index.vue';
import { useList, useRouter } from '@/composables';
import { usePracticeLauncher } from '@/composables/usePracticeLauncher';
import { PAGES, PAPER_TYPE_LABELS, PRACTICE_QUESTION_TYPES, QUESTION_TYPE_LABELS } from '@/constants';
import { useExamStore } from '@/store/modules/exam';
import { useGlobalStore } from '@/store/modules/global';
import { useStudyStore } from '@/store/modules/study';
import { useUserStore } from '@/store/modules/user';
import {
  flattenKnowledgeTree,
  knowledgeMasteryText,
  knowledgeProgressText,
  type KnowledgeTreeRow,
} from '@/utils/knowledge-tree';
import { formatMastery, masteryLevel, WEAK_MASTERY_THRESHOLD } from '@/utils/study-stats';

interface PaperQuery {
  subjectId: string;
  type: string;
}

type PracticeEntryKey = 'daily' | 'random' | 'type' | 'smart' | 'memorize' | 'generate' | 'history';

const PRACTICE_ENTRIES: { key: PracticeEntryKey; label: string; icon: IconName }[] = [
  { key: 'daily', label: '每日一练', icon: 'calendar' },
  { key: 'random', label: '随机练习', icon: 'refreshempty' },
  { key: 'type', label: '题型专项', icon: 'bars' },
  { key: 'smart', label: '智能练习', icon: 'fire' },
  { key: 'memorize', label: '背题模式', icon: 'eye' },
  { key: 'generate', label: '按规则组卷', icon: 'paperplane' },
  { key: 'history', label: '练习历史', icon: 'list' },
];

const WEAK_POINT_LIMIT = 5;

const SECTION_TABS: TabItem[] = [
  { label: '知识点', value: 'knowledge' },
  { label: '试卷', value: 'papers' },
];
const PAPER_TABS: TabItem[] = [
  { label: '全部', value: '' },
  { label: PAPER_TYPE_LABELS.REAL, value: 'REAL' },
  { label: PAPER_TYPE_LABELS.MOCK, value: 'MOCK' },
  { label: PAPER_TYPE_LABELS.SPECIAL, value: 'SPECIAL' },
];

const globalStore = useGlobalStore();
const examStore = useExamStore();
const userStore = useUserStore();
const studyStore = useStudyStore();
const router = useRouter();
const { launch, requireLogin } = usePracticeLauncher();

const section = ref<TabValue>('knowledge');
const paperType = ref<TabValue>('');
const profilesPending = ref(true);

const examId = computed(() => examStore.currentProfile?.examId ?? '');
const subjectsError = ref(false);
const subjectsLoaded = computed(() => !!examId.value && examStore.subjectsByExam[examId.value] !== undefined);
const subjects = computed(() => examStore.currentSubjects);
const subjectTabs = computed<TabItem[]>(() => subjects.value.map(item => ({ label: item.name, value: item.id })));
const subjectId = computed<string>(() => examStore.currentSubject?.id ?? '');
const subjectTab = computed<TabValue>({
  get: () => subjectId.value,
  set: value => {
    if (examId.value) examStore.selectSubject(examId.value, String(value));
  },
});

const tree = ref<PublicKnowledgePointTreeNodeDto[]>([]);
const treeLoading = ref(false);
const treeError = ref(false);
const expandedIds = ref(new Set<string>());
const rows = computed(() => flattenKnowledgeTree(tree.value, expandedIds.value));
const weakPoints = computed<WeakPointDto[]>(() =>
  userStore.isLoggedIn ? (studyStore.weakPoints[subjectId.value] ?? []).slice(0, WEAK_POINT_LIMIT) : [],
);
let treeRequest = 0;
let shown = false;

const {
  list: papers,
  loading: papersLoading,
  error: papersError,
  hasMore: papersHasMore,
  isEmpty: papersEmpty,
  refresh: refreshPapers,
  loadMore: loadMorePapers,
  retry: retryPaperList,
  reset: resetPapers,
} = useList<PublicPaperDto, PaperQuery>({
  fetchPage: ({ subjectId: id, type, page, limit }) =>
    getSubjectPapers(id, { page, limit, ...(type ? { type: type as PaperType } : {}) }),
});

function goSelectExam() {
  router.push(PAGES.EXAM_SELECT);
}

function goPaper(paper: PublicPaperDto) {
  router.push(PAGES.EXAM_PAPER, { paperId: paper.id });
}

function chooseAction(itemList: string[]): Promise<number | null> {
  return new Promise(resolve => {
    uni.showActionSheet({
      itemList,
      success: result => resolve(result.tapIndex),
      fail: () => resolve(null),
    });
  });
}

async function chooseQuestionType(): Promise<QuestionType | null> {
  const index = await chooseAction(PRACTICE_QUESTION_TYPES.map(type => QUESTION_TYPE_LABELS[type]));
  return index === null ? null : (PRACTICE_QUESTION_TYPES[index] ?? null);
}

async function openKnowledgeActions(node: PublicKnowledgePointTreeNodeDto) {
  const id = subjectId.value;
  if (!id) return;
  const index = await chooseAction(['章节练习', '背题模式']);
  if (index === null) return;
  launch({
    mode: index === 0 ? PracticeMode.CHAPTER : PracticeMode.MEMORIZE,
    subjectId: id,
    scope: { knowledgePointId: node.id },
  });
}

function practiceWeakPoint(point: WeakPointDto) {
  const id = subjectId.value;
  if (id) launch({ mode: PracticeMode.CHAPTER, subjectId: id, scope: { knowledgePointId: point.knowledgePointId } });
}

async function loadWeakPoints() {
  const id = subjectId.value;
  if (!id || !userStore.isLoggedIn) return;
  try {
    await studyStore.fetchWeakPoints(id, { showError: false });
  } catch (error) {
    console.error('加载薄弱知识点失败:', error);
  }
}

async function handlePracticeEntry(key: PracticeEntryKey) {
  const id = subjectId.value;
  if (!id) return;
  switch (key) {
    case 'daily':
      if (userStore.isLoggedIn) launch({ mode: PracticeMode.DAILY, subjectId: id });
      else router.push(PAGES.EXAM_TRIAL, { subjectId: id });
      return;
    case 'random':
      launch({ mode: PracticeMode.RANDOM, subjectId: id });
      return;
    case 'smart':
      launch({ mode: PracticeMode.SMART, subjectId: id });
      return;
    case 'type':
    case 'memorize': {
      if (!requireLogin()) return;
      const questionType = await chooseQuestionType();
      if (!questionType) return;
      launch({
        mode: key === 'type' ? PracticeMode.TYPE : PracticeMode.MEMORIZE,
        subjectId: id,
        scope: { questionType },
      });
      return;
    }
    case 'generate':
      if (requireLogin()) router.push(PAGES.EXAM_PAPER_RULES, { subjectId: id });
      return;
    case 'history':
      if (requireLogin()) router.push(PAGES.EXAM_HISTORY);
      return;
  }
}

async function loadSubjects(force = false) {
  if (!examId.value) return;
  subjectsError.value = false;
  try {
    await examStore.fetchSubjects(examId.value, force);
  } catch (error) {
    subjectsError.value = true;
    console.error('加载科目失败:', error);
  }
}

async function loadTree() {
  const id = subjectId.value;
  if (!id) return;
  const request = ++treeRequest;
  treeLoading.value = tree.value.length === 0;
  treeError.value = false;
  try {
    const nodes = await getSubjectKnowledgePoints(id);
    if (request === treeRequest) tree.value = nodes;
  } catch (error) {
    if (request === treeRequest) treeError.value = true;
    console.error('加载知识点失败:', error);
  } finally {
    if (request === treeRequest) treeLoading.value = false;
  }
}

function toggleNode(row: KnowledgeTreeRow) {
  if (!row.hasChildren) return;
  const next = new Set(expandedIds.value);
  if (next.has(row.node.id)) next.delete(row.node.id);
  else next.add(row.node.id);
  expandedIds.value = next;
}

async function reloadPapers() {
  if (!subjectId.value) return;
  try {
    await refreshPapers({ subjectId: subjectId.value, type: String(paperType.value) });
  } catch (error) {
    console.error('加载试卷失败:', error);
  }
}

async function retryPapers() {
  try {
    await retryPaperList();
  } catch (error) {
    console.error('加载试卷失败:', error);
  }
}

async function loadSection() {
  if (section.value === 'knowledge') await Promise.all([loadTree(), loadWeakPoints()]);
  else await reloadPapers();
}

watch(
  examId,
  value => {
    if (value) loadSubjects();
  },
  { immediate: true },
);

watch(
  subjectId,
  value => {
    tree.value = [];
    treeError.value = false;
    expandedIds.value = new Set();
    resetPapers();
    if (value) loadSection();
  },
  { immediate: true },
);

watch(
  () => userStore.isLoggedIn,
  () => {
    tree.value = [];
    treeError.value = false;
    if (subjectId.value && section.value === 'knowledge') loadSection();
  },
);

watch(paperType, () => {
  resetPapers();
  reloadPapers();
});

watch(section, value => {
  if (value === 'knowledge' && tree.value.length === 0) loadTree();
  if (value === 'papers' && papers.value.length === 0) reloadPapers();
});

onShow(() => {
  if (shown && section.value === 'knowledge' && subjectId.value && userStore.isLoggedIn) {
    loadTree();
    loadWeakPoints();
  }
  shown = true;
  examStore
    .ensureProfiles()
    .catch(() => undefined)
    .finally(() => {
      profilesPending.value = false;
    });
});

onPullDownRefresh(async () => {
  try {
    await examStore.ensureProfiles(true);
    await loadSubjects(true);
    await loadSection();
  } catch (error) {
    console.error('刷新题库失败:', error);
  } finally {
    uni.stopPullDownRefresh();
  }
});

onReachBottom(() => {
  if (section.value === 'papers' && papersHasMore.value) {
    loadMorePapers().catch(error => console.error('加载试卷失败:', error));
  }
});
</script>

<style scoped lang="scss">
.bank-page {
  min-height: 100vh;
  background: var(--color-bg-grey);

  &__empty {
    padding-top: 160rpx;
  }
}

.bank-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx;
  background: var(--color-bg);

  &__name {
    color: var(--color-text);
    font-size: 34rpx;
    font-weight: 600;
  }

  &__switch {
    color: var(--color-primary);
    font-size: 26rpx;
  }
}

.bank-tabs {
  display: flex;
  flex-direction: column;
  padding-bottom: 16rpx;
  background: var(--color-bg);
  gap: 16rpx;

  &--section {
    padding-top: 16rpx;
  }
}

.practice-modes {
  display: flex;
  flex-wrap: wrap;
  margin-top: 20rpx;
  padding: 24rpx 0 8rpx;
  background: var(--color-bg);
}

.practice-mode {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 25%;
  margin-bottom: 20rpx;
  gap: 8rpx;

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    background: var(--color-primary-bg);
  }

  &__label {
    color: var(--color-text);
    font-size: 24rpx;
  }
}

.knowledge {
  margin-top: 20rpx;
  background: var(--color-bg);
}

.knowledge-row {
  display: flex;
  align-items: center;
  padding: 24rpx;
  border-bottom: 1rpx solid var(--color-border);
  gap: 12rpx;

  &__arrow {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32rpx;
  }

  &__name {
    flex: 1;
    min-width: 0;
    color: var(--color-text);
    font-size: 28rpx;

    &--root {
      font-weight: 600;
    }
  }

  &__progress,
  &__count {
    flex-shrink: 0;
    color: var(--color-text-secondary);
    font-size: 24rpx;
  }

  &__practice {
    flex-shrink: 0;
    padding: 4rpx 16rpx;
    border: 1rpx solid var(--color-primary);
    border-radius: var(--radius-full);
    color: var(--color-primary);
    font-size: 22rpx;
  }

  &__stats {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    align-items: flex-end;
    gap: 4rpx;
  }

  &__mastery {
    font-size: 22rpx;

    &--none {
      color: var(--color-text-placeholder);
    }

    &--weak {
      color: var(--color-error);
    }

    &--fair {
      color: var(--color-warning);
    }

    &--good {
      color: var(--color-success);
    }
  }
}

.weak-points {
  margin-top: 20rpx;
  padding: 8rpx 24rpx;
  background: var(--color-bg);

  &__header {
    display: flex;
    align-items: baseline;
    padding: 16rpx 0;
    gap: 12rpx;
  }

  &__title {
    color: var(--color-text);
    font-size: 30rpx;
    font-weight: 600;
  }

  &__desc {
    color: var(--color-text-secondary);
    font-size: 24rpx;
  }
}

.weak-point {
  display: flex;
  align-items: center;
  padding: 16rpx 0;
  border-top: 1rpx solid var(--color-border);
  gap: 16rpx;

  &__name {
    flex: 1;
    min-width: 0;
    color: var(--color-text);
    font-size: 28rpx;
  }

  &__mastery {
    flex-shrink: 0;
    color: var(--color-error);
    font-size: 24rpx;
  }

  &__practice {
    flex-shrink: 0;
    padding: 4rpx 16rpx;
    border: 1rpx solid var(--color-primary);
    border-radius: var(--radius-full);
    color: var(--color-primary);
    font-size: 22rpx;
  }
}

.papers {
  margin-top: 20rpx;

  &__list {
    padding: 20rpx 24rpx;
  }
}

.paper-card {
  margin-bottom: 20rpx;

  &__header {
    display: flex;
    align-items: center;
    gap: 12rpx;
  }

  &__title {
    flex: 1;
    min-width: 0;
    color: var(--color-text);
    font-size: 30rpx;
    font-weight: 500;
  }

  &__meta,
  &__score {
    display: flex;
    flex-wrap: wrap;
    margin-top: 12rpx;
    color: var(--color-text-secondary);
    font-size: 24rpx;
    gap: 24rpx;
  }

  &__score {
    color: var(--color-primary);
  }
}
</style>
