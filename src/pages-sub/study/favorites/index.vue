<template>
  <view class="favorites-page" :class="globalStore.themeClass">
    <view class="favorites-tabs">
      <UTabs v-model="typeTab" :tabs="TYPE_TABS" />
      <UTabs v-if="subjectTabs.length > 1" v-model="subjectTab" :tabs="subjectTabs" scrollable />
    </view>
    <UList
      class="favorites-list"
      :empty="list.length === 0"
      :loading="store.favoritesLoading"
      :finished="!store.favoritesHasMore"
      :error="store.favoritesError"
      empty-icon="star"
      :empty-text="isQuestion ? '还没有收藏题目，答题后可在解析处收藏' : '还没有收藏试卷'"
      @retry="reload"
    >
      <UCard v-for="item in list" :key="item.id" class="favorite-card" clickable @click="openDetail(item)">
        <view class="favorite-card__header">
          <UTag v-if="item.targetOffline" text="已下架" type="default" size="small" />
          <text class="favorite-card__subject">{{ subjectName(item.subjectId) }}</text>
          <view class="favorite-card__action" @click.stop="unfavorite(item)">
            <UIcon name="star-filled" size="32rpx" color="var(--color-warning)" />
          </view>
        </view>
        <text class="favorite-card__title">{{ previewText(item.title) || '（无标题）' }}</text>
        <text class="favorite-card__time">收藏于 {{ formatDateTime(item.createdAt, 'YYYY-MM-DD HH:mm') }}</text>
      </UCard>
    </UList>
  </view>
</template>

<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: '我的收藏',
    enablePullDownRefresh: true,
  },
});

import { computed } from 'vue';
import { onLoad, onPullDownRefresh, onReachBottom, onShow } from '@dcloudio/uni-app';
import { CreateFavoriteDtoTargetType, type FavoriteItemDto } from '@/api';
import type { TabItem, TabValue } from '@/components/UTabs/index.vue';
import { useRouter } from '@/composables';
import { useStudySubjects } from '@/composables/useStudySubjects';
import { PAGES } from '@/constants';
import { useGlobalStore } from '@/store/modules/global';
import { useQuestionCollectionStore, type FavoriteTab } from '@/store/modules/question-collection';
import { formatDateTime } from '@/utils/datetime';
import { confirm } from '@/utils/modal';
import { showToast } from '@/utils/toast';
import { previewText } from '@/utils/wrong-book';

const TYPE_TABS: TabItem[] = [
  { label: '题目', value: CreateFavoriteDtoTargetType.question },
  { label: '试卷', value: CreateFavoriteDtoTargetType.paper },
];

const globalStore = useGlobalStore();
const store = useQuestionCollectionStore();
const router = useRouter();
const { subjectTabs, subjectName, watchSubjectFilter, loadSubjects } = useStudySubjects();

const list = computed(() => store.favorites);
const isQuestion = computed(() => store.favoriteType === CreateFavoriteDtoTargetType.question);

function applyFilter(filter: { type?: FavoriteTab; subjectId?: string }) {
  store.setFavoriteFilter(filter).catch(error => console.error('加载收藏失败:', error));
}

const typeTab = computed<TabValue>({
  get: () => store.favoriteType,
  set: value => applyFilter({ type: value as FavoriteTab }),
});
const subjectTab = computed<TabValue>({
  get: () => store.favoriteSubjectId,
  set: value => applyFilter({ subjectId: String(value) }),
});

async function reload() {
  try {
    await store.fetchFavorites(true);
  } catch (error) {
    console.error('加载收藏失败:', error);
  }
}

function openDetail(item: FavoriteItemDto) {
  if (item.targetType === CreateFavoriteDtoTargetType.paper) {
    router.push(PAGES.EXAM_PAPER, { paperId: item.targetId });
    return;
  }
  router.push(PAGES.STUDY_QUESTION, { questionId: item.targetId, ...(item.targetOffline ? { offline: '1' } : {}) });
}

async function unfavorite(item: FavoriteItemDto) {
  const target = item.targetType === CreateFavoriteDtoTargetType.paper ? '这份试卷' : '这道题';
  if (!(await confirm({ content: `确定取消收藏${target}吗？`, confirmText: '取消收藏' }))) return;
  try {
    await store.removeFavorite(item);
    showToast('已取消收藏');
  } catch (error) {
    console.error('取消收藏失败:', error);
  }
}

watchSubjectFilter(
  () => store.favoriteSubjectId,
  () => applyFilter({ subjectId: '' }),
);

onLoad(() => {
  loadSubjects();
  reload();
});

onShow(() => {
  if (store.favoritesDirty) reload();
});

onPullDownRefresh(async () => {
  await reload();
  uni.stopPullDownRefresh();
});

onReachBottom(() => {
  if (store.favoritesHasMore) store.fetchFavorites().catch(error => console.error('加载收藏失败:', error));
});
</script>

<style scoped lang="scss">
.favorites-page {
  min-height: 100vh;
  background: var(--color-bg-grey);
}

.favorites-tabs {
  display: flex;
  flex-direction: column;
  padding-bottom: 12rpx;
  background: var(--color-bg);
  gap: 12rpx;
}

.favorites-list {
  padding: 20rpx 24rpx;
}

.favorite-card {
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
    padding: 4rpx;
  }

  &__title {
    display: block;
    margin-top: 12rpx;
    color: var(--color-text);
    font-size: 28rpx;
    line-height: 1.6;
  }

  &__time {
    display: block;
    margin-top: 12rpx;
    color: var(--color-text-secondary);
    font-size: 24rpx;
  }
}
</style>
