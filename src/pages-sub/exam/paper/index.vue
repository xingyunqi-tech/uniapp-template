<template>
  <view class="paper-page" :class="globalStore.themeClass">
    <UPageState :loading="loading && !paper" :error="loadError" @retry="load">
      <template v-if="paper">
        <UCard class="paper-info">
          <view class="paper-info__header">
            <UTag :text="PAPER_TYPE_LABELS[paper.type]" type="primary" size="small" plain />
            <text class="paper-info__title">{{ paper.title }}</text>
            <view v-if="paper.type !== PaperType.GENERATED" class="paper-info__favorite" @click="toggleFavorite">
              <UIcon
                :name="favorited ? 'star-filled' : 'star'"
                size="34rpx"
                :color="favorited ? 'var(--color-warning)' : 'var(--color-text-secondary)'"
              />
              <text class="paper-info__favorite-label">{{ favorited ? '已收藏' : '收藏' }}</text>
            </view>
          </view>
          <view class="paper-info__meta">
            <text v-if="paper.year">{{ paper.year }} 年</text>
            <text>{{ paper.questionCount }} 题</text>
            <text>{{ paper.durationMin }} 分钟</text>
            <text>满分 {{ paper.totalScore }}</text>
            <text v-if="paper.type !== PaperType.GENERATED">{{ paper.attemptCount }} 人参考</text>
          </view>
          <view v-if="paper.lastScore !== null || paper.bestScore !== null" class="paper-info__score">
            <text v-if="paper.lastScore !== null">最近 {{ paper.lastScore }} 分</text>
            <text v-if="paper.bestScore !== null">最高 {{ paper.bestScore }} 分</text>
          </view>
          <text v-if="paper.objectiveScore < paper.totalScore" class="paper-info__tip">
            主观题不计入考试得分（客观题满分 {{ paper.objectiveScore }}），交卷后可在成绩报告中自评
          </text>
        </UCard>

        <UCard v-if="paper.sections.length > 0" title="试卷结构" class="paper-sections">
          <view v-for="(section, index) in paper.sections" :key="index" class="paper-section">
            <text class="paper-section__title">{{ section.title }}</text>
            <text class="paper-section__count">
              {{ QUESTION_TYPE_LABELS[section.questionType] }} · {{ section.questionCount }} 题
            </text>
          </view>
        </UCard>

        <UCard title="考试须知" class="paper-rules">
          <text class="paper-rules__item">1. 开考后开始计时，时间到将自动交卷。</text>
          <text class="paper-rules__item">2. 中途退出可回到本页继续考试，计时不会暂停。</text>
          <text class="paper-rules__item">3. 同一时间只能在一台设备上作答，换设备进入后原设备将退出答题。</text>
          <text class="paper-rules__item">4. 断网时作答会保存在本地，恢复网络后自动补交。</text>
        </UCard>
      </template>
    </UPageState>

    <view v-if="paper" class="paper-actions">
      <template v-if="ongoing">
        <view class="paper-actions__item">
          <UButton text="重新开始" plain block :loading="restarting" :disabled="launching" @click="restart" />
        </view>
        <view class="paper-actions__item">
          <UButton text="继续考试" type="primary" block :loading="launching && !restarting" @click="resume(ongoing)" />
        </view>
      </template>
      <view v-else class="paper-actions__item">
        <UButton text="开始考试" type="primary" block :loading="launching" @click="start" />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: '试卷详情',
  },
});

import { computed, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import {
  PaperType,
  PracticeMode,
  abandonPracticeSession,
  getPaper,
  type PracticeSessionDto,
  type PublicPaperDetailDto,
} from '@/api';
import { useRouter } from '@/composables';
import { usePracticeLauncher } from '@/composables/usePracticeLauncher';
import { PAGES, PAPER_TYPE_LABELS, QUESTION_TYPE_LABELS } from '@/constants';
import { useGlobalStore } from '@/store/modules/global';
import { usePracticeStore } from '@/store/modules/practice';
import { useQuestionCollectionStore } from '@/store/modules/question-collection';
import { useUserStore } from '@/store/modules/user';
import { danger } from '@/utils/modal';
import { clearAnswerCache } from '@/utils/practice-cache';
import { getCurrentFullPath } from '@/utils/router';
import { showToast } from '@/utils/toast';

const globalStore = useGlobalStore();
const userStore = useUserStore();
const practiceStore = usePracticeStore();
const collectionStore = useQuestionCollectionStore();
const router = useRouter();
const { launching, launch, resume } = usePracticeLauncher();

const paperId = ref('');
const paper = ref<PublicPaperDetailDto | null>(null);
const ongoing = ref<PracticeSessionDto | null>(null);
const loading = ref(false);
const loadError = ref(false);
const restarting = ref(false);
const toggling = ref(false);
let loaded = false;

const favorited = computed(() => userStore.isLoggedIn && collectionStore.paperFavoriteOf(paperId.value) === true);

function loadFavorite() {
  if (!userStore.isLoggedIn || !paperId.value) return;
  collectionStore.isPaperFavorited(paperId.value).catch(error => console.error('查询收藏状态失败:', error));
}

async function toggleFavorite() {
  if (!userStore.isLoggedIn) {
    router.push(PAGES.LOGIN, { redirect: getCurrentFullPath() });
    return;
  }
  if (toggling.value) return;
  toggling.value = true;
  try {
    const value = await collectionStore.togglePaper(paperId.value);
    showToast(value ? '已收藏' : '已取消收藏');
  } catch (error) {
    console.error('切换收藏失败:', error);
  } finally {
    toggling.value = false;
  }
}

async function loadOngoing() {
  if (!userStore.isLoggedIn) {
    ongoing.value = null;
    return;
  }
  try {
    const list = await practiceStore.fetchOngoing({ excludeModes: [PracticeMode.DAILY] });
    ongoing.value = list.find(item => item.mode === PracticeMode.MOCK && item.paperId === paperId.value) ?? null;
  } catch (error) {
    console.error('加载进行中的考试失败:', error);
  }
}

async function load() {
  if (!paperId.value) {
    loadError.value = true;
    return;
  }
  loading.value = true;
  loadError.value = false;
  try {
    const [detail] = await Promise.all([getPaper(paperId.value), loadOngoing()]);
    paper.value = detail;
    loaded = true;
  } catch (error) {
    if (!paper.value) loadError.value = true;
    console.error('加载试卷失败:', error);
  } finally {
    loading.value = false;
  }
}

function start() {
  const current = paper.value;
  if (!current) return;
  launch({ mode: PracticeMode.MOCK, subjectId: current.subjectId, paperId: current.id });
}

async function restart() {
  const current = ongoing.value;
  if (!current) return;
  const confirmed = await danger({
    content: '重新开始将放弃当前进行中的考试，已作答内容不计成绩，确定重新开始吗？',
    confirmText: '重新开始',
  });
  if (!confirmed) return;
  restarting.value = true;
  try {
    await abandonPracticeSession(current.id);
    clearAnswerCache(current.id);
    ongoing.value = null;
    start();
  } catch (error) {
    console.error('放弃考试失败:', error);
  } finally {
    restarting.value = false;
  }
}

onLoad(options => {
  paperId.value = options?.paperId ?? '';
  load();
});

onShow(() => {
  if (loaded) load();
  loadFavorite();
});
</script>

<style scoped lang="scss">
.paper-page {
  display: flex;
  box-sizing: border-box;
  flex-direction: column;
  min-height: 100vh;
  padding: 24rpx 24rpx calc(env(safe-area-inset-bottom) + 160rpx);
  background: var(--color-bg-grey);
  gap: 24rpx;
}

.paper-info {
  &__header {
    display: flex;
    align-items: center;
    gap: 12rpx;
  }

  &__title {
    flex: 1;
    min-width: 0;
    color: var(--color-text);
    font-size: 34rpx;
    font-weight: 600;
  }

  &__favorite {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: 8rpx;
  }

  &__favorite-label {
    color: var(--color-text-secondary);
    font-size: 26rpx;
  }

  &__meta,
  &__score {
    display: flex;
    flex-wrap: wrap;
    margin-top: 16rpx;
    color: var(--color-text-secondary);
    font-size: 26rpx;
    gap: 24rpx;
  }

  &__score {
    color: var(--color-primary);
  }

  &__tip {
    display: block;
    margin-top: 16rpx;
    color: var(--color-warning);
    font-size: 24rpx;
  }
}

.paper-section {
  display: flex;
  justify-content: space-between;
  padding: 16rpx 0;
  border-bottom: 1rpx solid var(--color-border);
  font-size: 26rpx;

  &:last-child {
    border-bottom: none;
  }

  &__title {
    color: var(--color-text);
  }

  &__count {
    color: var(--color-text-secondary);
  }
}

.paper-rules__item {
  display: block;
  color: var(--color-text-secondary);
  font-size: 26rpx;
  line-height: 1.8;
}

.paper-actions {
  display: flex;
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 20rpx 24rpx calc(env(safe-area-inset-bottom) + 20rpx);
  background: var(--color-bg);
  gap: 20rpx;

  &__item {
    flex: 1;
  }
}
</style>
