<template>
  <view class="wrong-page" :class="globalStore.themeClass">
    <view class="wrong-summary">
      <view class="wrong-summary__item">
        <text class="wrong-summary__value">{{ summary?.activeCount ?? '-' }}</text>
        <text class="wrong-summary__label">错题总数</text>
      </view>
      <view class="wrong-summary__item">
        <text class="wrong-summary__value">{{ summary?.weeklyAdded ?? '-' }}</text>
        <text class="wrong-summary__label">本周新增</text>
      </view>
      <view class="wrong-summary__item">
        <text class="wrong-summary__value">{{ summary?.weeklyMastered ?? '-' }}</text>
        <text class="wrong-summary__label">本周消灭</text>
      </view>
    </view>

    <view class="wrong-filters">
      <UTabs v-model="statusTab" :tabs="STATUS_TABS" />
      <UTabs v-if="subjectTabs.length > 1" v-model="subjectTab" :tabs="subjectTabs" scrollable />
      <view class="wrong-filters__chips">
        <view
          class="wrong-chip"
          :class="{ 'wrong-chip--active': !!filter.knowledgePointId }"
          @click="openKnowledgePicker"
        >
          <text class="wrong-chip__text">{{ knowledgeLabel }}</text>
          <UIcon name="down" size="20rpx" color="inherit" />
        </view>
        <view class="wrong-chip" :class="{ 'wrong-chip--active': filter.count !== 'all' }" @click="chooseCount">
          <text class="wrong-chip__text">{{ optionLabel(WRONG_COUNT_OPTIONS, filter.count) }}</text>
          <UIcon name="down" size="20rpx" color="inherit" />
        </view>
        <view class="wrong-chip" :class="{ 'wrong-chip--active': filter.time !== 'all' }" @click="chooseTime">
          <text class="wrong-chip__text">{{ optionLabel(WRONG_TIME_OPTIONS, filter.time) }}</text>
          <UIcon name="down" size="20rpx" color="inherit" />
        </view>
        <view class="wrong-chip" @click="chooseSort">
          <text class="wrong-chip__text">{{ optionLabel(WRONG_SORT_OPTIONS, filter.sort) }}</text>
          <UIcon name="down" size="20rpx" color="inherit" />
        </view>
      </view>
    </view>

    <UList
      class="wrong-list"
      :empty="list.length === 0"
      :loading="wrongBookStore.loading"
      :finished="!wrongBookStore.hasMore"
      :error="wrongBookStore.error"
      :empty-text="isActive ? '暂无错题，继续保持' : '还没有移出的错题'"
      @retry="reload"
    >
      <UCard v-for="item in list" :key="item.questionId" class="wrong-card" clickable @click="openDetail(item)">
        <view class="wrong-card__header">
          <UTag
            v-if="item.question"
            :text="QUESTION_TYPE_LABELS[item.question.type]"
            type="primary"
            size="small"
            plain
          />
          <UTag v-if="item.isOffline" text="已下架" type="default" size="small" />
          <text class="wrong-card__subject">{{ subjectName(item.subjectId) }}</text>
          <text
            v-if="aiEnabled && !item.hiddenReason"
            class="wrong-card__action"
            @click.stop="askAi({ questionId: item.questionId })"
          >
            问 AI
          </text>
          <text class="wrong-card__action" @click.stop="changeStatus(item)">{{ isActive ? '移出' : '恢复' }}</text>
        </view>
        <text v-if="item.hiddenReason" class="wrong-card__notice">{{ HIDDEN_REASON_TEXT[item.hiddenReason] }}</text>
        <text v-else class="wrong-card__stem">{{ stemPreview(item) }}</text>
        <view class="wrong-card__meta">
          <text>错 {{ item.wrongCount }} 次</text>
          <text>最近 {{ formatTime(item.lastWrongAt) }}</text>
          <text v-if="isActive && item.consecutiveCorrect">已连续答对 {{ item.consecutiveCorrect }} 次</text>
          <text v-if="!isActive && item.masteredAt">{{ formatTime(item.masteredAt) }} 移出</text>
        </view>
      </UCard>
    </UList>

    <UFixedButton
      v-if="isActive && (summary?.activeCount ?? 0) > 0"
      text="错题重做"
      :loading="launching"
      loading-text="正在组题..."
      @click="redo"
    />

    <UPopup v-model="redoPickerVisible" type="bottom" title="选择重做科目" :body-padding="false">
      <scroll-view scroll-y class="knowledge-picker">
        <view
          v-for="item in redoCandidates"
          :key="item.subjectId"
          class="knowledge-picker__row"
          @click="startRedo(item.subjectId)"
        >
          <text class="knowledge-picker__name">{{ item.name }}</text>
          <text class="knowledge-picker__count">{{ item.activeCount }} 题</text>
        </view>
      </scroll-view>
    </UPopup>

    <UPopup v-model="knowledgeVisible" type="bottom" title="选择知识点" :body-padding="false">
      <scroll-view scroll-y class="knowledge-picker">
        <view
          class="knowledge-picker__row"
          :class="{ 'knowledge-picker__row--active': !filter.knowledgePointId }"
          @click="selectKnowledge('')"
        >
          <text class="knowledge-picker__name">全部知识点</text>
        </view>
        <view
          v-for="row in knowledgeRows"
          :key="row.node.id"
          class="knowledge-picker__row"
          :class="{ 'knowledge-picker__row--active': filter.knowledgePointId === row.node.id }"
          :style="{ paddingLeft: `${32 + row.depth * 40}rpx` }"
          @click="selectKnowledge(row.node.id)"
        >
          <text class="knowledge-picker__name">{{ row.node.name }}</text>
          <text v-if="knowledgeCounts[row.node.id]" class="knowledge-picker__count">
            {{ knowledgeCounts[row.node.id] }}
          </text>
        </view>
        <view v-if="knowledgeLoading" class="knowledge-picker__state">加载中…</view>
      </scroll-view>
    </UPopup>
  </view>
</template>

<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: '错题本',
    enablePullDownRefresh: true,
  },
});

import { computed, ref } from 'vue';
import { onLoad, onPullDownRefresh, onReachBottom, onShow } from '@dcloudio/uni-app';
import {
  PracticeMode,
  WrongQuestionStatus,
  getSubjectKnowledgePoints,
  type PublicKnowledgePointTreeNodeDto,
  type WrongQuestionDto,
} from '@/api';
import type { TabItem, TabValue } from '@/components/UTabs/index.vue';
import { useRouter } from '@/composables';
import { useAskAi } from '@/composables/useAiAccess';
import { usePracticeLauncher } from '@/composables/usePracticeLauncher';
import { useStudySubjects } from '@/composables/useStudySubjects';
import { PAGES, QUESTION_TYPE_LABELS } from '@/constants';
import { useExamStore } from '@/store/modules/exam';
import { useGlobalStore } from '@/store/modules/global';
import { useWrongBookStore } from '@/store/modules/wrong-book';
import { formatDateTime } from '@/utils/datetime';
import { flattenKnowledgeTree } from '@/utils/knowledge-tree';
import { confirm } from '@/utils/modal';
import { HIDDEN_REASON_TEXT } from '@/utils/practice-card';
import { showToast } from '@/utils/toast';
import {
  optionLabel,
  previewText,
  WRONG_COUNT_OPTIONS,
  WRONG_SORT_OPTIONS,
  WRONG_TIME_OPTIONS,
  type FilterOption,
  type WrongBookFilter,
} from '@/utils/wrong-book';

const STATUS_TABS: TabItem[] = [
  { label: '待复习', value: WrongQuestionStatus.ACTIVE },
  { label: '已移出', value: WrongQuestionStatus.MASTERED },
];

const globalStore = useGlobalStore();
const examStore = useExamStore();
const wrongBookStore = useWrongBookStore();
const router = useRouter();
const { launching, launch } = usePracticeLauncher();
const { aiEnabled, askAi } = useAskAi();

const knowledgeVisible = ref(false);
const knowledgeLoading = ref(false);
const redoPickerVisible = ref(false);
const knowledgeTrees = ref<Record<string, PublicKnowledgePointTreeNodeDto[]>>({});
let loaded = false;

const filter = computed(() => wrongBookStore.filter);
const summary = computed(() => wrongBookStore.summary);
const list = computed(() => wrongBookStore.list);
const isActive = computed(() => filter.value.status === WrongQuestionStatus.ACTIVE);

const { subjectTabs, subjectName, watchSubjectFilter, loadSubjects } = useStudySubjects();

const statusTab = computed<TabValue>({
  get: () => filter.value.status,
  set: value => applyFilter({ status: value as WrongQuestionStatus }),
});
const subjectTab = computed<TabValue>({
  get: () => filter.value.subjectId,
  set: value => applyFilter({ subjectId: String(value) }),
});

const currentTree = computed(() => knowledgeTrees.value[filter.value.subjectId] ?? []);
const knowledgeRows = computed(() => {
  const ids = new Set<string>();
  const collect = (nodes: PublicKnowledgePointTreeNodeDto[]) =>
    nodes.forEach(node => {
      ids.add(node.id);
      collect(node.children);
    });
  collect(currentTree.value);
  return flattenKnowledgeTree(currentTree.value, ids);
});
const knowledgeCounts = computed(() =>
  Object.fromEntries((summary.value?.byKnowledgePoint ?? []).map(item => [item.knowledgePointId, item.activeCount])),
);
const knowledgeLabel = computed(() => {
  const id = filter.value.knowledgePointId;
  if (!id) return '全部知识点';
  return knowledgeRows.value.find(row => row.node.id === id)?.node.name ?? '已选知识点';
});

function formatTime(value: string): string {
  return formatDateTime(value, 'MM-DD HH:mm');
}

function stemPreview(item: WrongQuestionDto): string {
  const question = item.question;
  if (!question) return '题目内容暂不可用';
  return previewText(question.stem) || previewText(question.material) || '（无题干）';
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

async function chooseOption<K extends 'count' | 'time' | 'sort'>(key: K, options: FilterOption<WrongBookFilter[K]>[]) {
  const index = await chooseAction(options.map(option => option.label));
  const option = index === null ? undefined : options[index];
  if (option && option.value !== filter.value[key]) applyFilter({ [key]: option.value } as Partial<WrongBookFilter>);
}

function chooseCount() {
  chooseOption('count', WRONG_COUNT_OPTIONS);
}

function chooseTime() {
  chooseOption('time', WRONG_TIME_OPTIONS);
}

function chooseSort() {
  chooseOption('sort', WRONG_SORT_OPTIONS);
}

async function loadKnowledgeTree(subjectId: string) {
  if (knowledgeTrees.value[subjectId]) return;
  knowledgeLoading.value = true;
  try {
    const nodes = await getSubjectKnowledgePoints(subjectId);
    knowledgeTrees.value = { ...knowledgeTrees.value, [subjectId]: nodes };
  } catch (error) {
    console.error('加载知识点失败:', error);
  } finally {
    knowledgeLoading.value = false;
  }
}

function openKnowledgePicker() {
  const subjectId = filter.value.subjectId;
  if (!subjectId) {
    showToast('请先选择科目');
    return;
  }
  knowledgeVisible.value = true;
  loadKnowledgeTree(subjectId);
}

function selectKnowledge(id: string) {
  knowledgeVisible.value = false;
  if (id !== filter.value.knowledgePointId) applyFilter({ knowledgePointId: id });
}

async function reloadList() {
  try {
    await wrongBookStore.fetchList(true);
  } catch (error) {
    console.error('加载错题失败:', error);
  }
}

async function reloadSummary() {
  try {
    await wrongBookStore.fetchSummary();
  } catch (error) {
    console.error('加载错题汇总失败:', error);
  }
}

function reload() {
  return Promise.all([reloadList(), reloadSummary()]);
}

function applyFilter(patch: Partial<WrongBookFilter>) {
  const subjectChanged = patch.subjectId !== undefined && patch.subjectId !== filter.value.subjectId;
  wrongBookStore.setFilter(patch);
  reloadList();
  if (subjectChanged) reloadSummary();
}

function openDetail(item: WrongQuestionDto) {
  router.push(PAGES.STUDY_QUESTION, { questionId: item.questionId, ...(item.isOffline ? { offline: '1' } : {}) });
}

async function changeStatus(item: WrongQuestionDto) {
  try {
    if (isActive.value) {
      if (!(await confirm({ content: '移出后该题不再出现在错题重做中，可在「已移出」中恢复', confirmText: '移出' }))) {
        return;
      }
      await wrongBookStore.master(item.questionId);
      showToast('已移出');
    } else {
      await wrongBookStore.restore(item.questionId);
      showToast('已恢复到待复习');
    }
  } catch (error) {
    console.error('更新错题状态失败:', error);
  }
}

const redoCandidates = computed(() => {
  const counts = new Map((summary.value?.bySubject ?? []).map(item => [item.subjectId, item.activeCount]));
  return examStore.currentSubjects
    .map(subject => ({ subjectId: subject.id, name: subject.name, activeCount: counts.get(subject.id) ?? 0 }))
    .filter(item => item.activeCount > 0);
});

async function startRedo(subjectId: string) {
  redoPickerVisible.value = false;
  if (await launch({ mode: PracticeMode.WRONG, subjectId })) wrongBookStore.markDirty();
}

function redo() {
  if (filter.value.subjectId) {
    startRedo(filter.value.subjectId);
    return;
  }
  const candidates = redoCandidates.value;
  if (candidates.length === 0) showToast('当前考试暂无可重做的错题');
  else if (candidates.length === 1) startRedo(candidates[0].subjectId);
  else redoPickerVisible.value = true;
}

watchSubjectFilter(
  () => filter.value.subjectId,
  () => applyFilter({ subjectId: '' }),
);

onLoad(() => {
  loadSubjects();
});

onShow(() => {
  if (!loaded || wrongBookStore.dirty) reload();
  loaded = true;
});

onPullDownRefresh(async () => {
  await reload();
  uni.stopPullDownRefresh();
});

onReachBottom(() => {
  if (!loaded || !wrongBookStore.hasMore) return;
  wrongBookStore.fetchList().catch(error => console.error('加载错题失败:', error));
});
</script>

<style scoped lang="scss">
.wrong-page {
  min-height: 100vh;
  background: var(--color-bg-grey);
}

.wrong-summary {
  display: flex;
  padding: 32rpx 24rpx;
  background: var(--color-bg);

  &__item {
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    gap: 8rpx;
  }

  &__value {
    color: var(--color-primary);
    font-size: 48rpx;
    font-weight: 700;
  }

  &__label {
    color: var(--color-text-secondary);
    font-size: 24rpx;
  }
}

.wrong-filters {
  display: flex;
  flex-direction: column;
  margin-top: 20rpx;
  padding-bottom: 20rpx;
  background: var(--color-bg);
  gap: 12rpx;

  &__chips {
    display: flex;
    flex-wrap: wrap;
    padding: 0 24rpx;
    gap: 16rpx;
  }
}

.wrong-chip {
  display: flex;
  align-items: center;
  padding: 8rpx 20rpx;
  border-radius: var(--radius-full);
  background: var(--color-bg-grey);
  color: var(--color-text);
  font-size: 24rpx;
  gap: 6rpx;

  &--active {
    background: var(--color-primary-bg);
    color: var(--color-primary);
  }

  &__text {
    max-width: 240rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.wrong-list {
  padding: 20rpx 24rpx;
}

.wrong-card {
  margin-bottom: 20rpx;

  &__header {
    display: flex;
    align-items: center;
    gap: 12rpx;
  }

  &__subject {
    flex: 1;
    min-width: 0;
    color: var(--color-text-secondary);
    font-size: 24rpx;
  }

  &__action {
    flex-shrink: 0;
    padding: 4rpx 16rpx;
    border: 1rpx solid var(--color-primary);
    border-radius: var(--radius-full);
    color: var(--color-primary);
    font-size: 22rpx;
  }

  &__stem,
  &__notice {
    display: block;
    margin-top: 16rpx;
    color: var(--color-text);
    font-size: 28rpx;
    line-height: 1.6;
  }

  &__notice {
    color: var(--color-warning);
    font-size: 26rpx;
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

.knowledge-picker {
  max-height: 60vh;

  &__row {
    display: flex;
    align-items: center;
    padding: 24rpx 32rpx;
    border-bottom: 1rpx solid var(--color-border);
    color: var(--color-text);
    gap: 12rpx;

    &--active {
      color: var(--color-primary);
    }
  }

  &__name {
    flex: 1;
    min-width: 0;
    font-size: 28rpx;
  }

  &__count {
    color: var(--color-text-secondary);
    font-size: 24rpx;
  }

  &__state {
    padding: 32rpx;
    color: var(--color-text-secondary);
    font-size: 26rpx;
    text-align: center;
  }
}
</style>
