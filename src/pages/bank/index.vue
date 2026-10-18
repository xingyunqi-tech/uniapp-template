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
          <UTabs v-model="section" :tabs="SECTION_TABS" type="card" />
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
              <text v-if="knowledgeProgressText(row.node)" class="knowledge-row__progress">
                {{ knowledgeProgressText(row.node) }}
              </text>
              <text class="knowledge-row__count">{{ row.node.questionCount }} 题</text>
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
            <UCard v-for="paper in papers" :key="paper.id" class="paper-card">
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
  getSubjectKnowledgePoints,
  getSubjectPapers,
  type PaperType,
  type PublicKnowledgePointTreeNodeDto,
  type PublicPaperDto,
} from '@/api';
import type { TabItem, TabValue } from '@/components/UTabs/index.vue';
import { useList, useRouter } from '@/composables';
import { PAGES, PAPER_TYPE_LABELS } from '@/constants';
import { useExamStore } from '@/store/modules/exam';
import { useGlobalStore } from '@/store/modules/global';
import { flattenKnowledgeTree, knowledgeProgressText, type KnowledgeTreeRow } from '@/utils/knowledge-tree';

interface PaperQuery {
  subjectId: string;
  type: string;
}

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
const router = useRouter();

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
let treeRequest = 0;

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
  if (section.value === 'knowledge') await loadTree();
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

watch(paperType, () => {
  resetPapers();
  reloadPapers();
});

watch(section, value => {
  if (value === 'knowledge' && tree.value.length === 0) loadTree();
  if (value === 'papers' && papers.value.length === 0) reloadPapers();
});

onShow(() => {
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
