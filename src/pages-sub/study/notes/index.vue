<template>
  <view class="notes-page" :class="globalStore.themeClass">
    <view v-if="subjectTabs.length > 1" class="notes-tabs">
      <UTabs v-model="subjectTab" :tabs="subjectTabs" scrollable />
    </view>
    <UList
      class="notes-list"
      :empty="list.length === 0"
      :loading="store.notesLoading"
      :finished="!store.notesHasMore"
      :error="store.notesError"
      empty-icon="compose"
      empty-text="还没有笔记，答题后可在解析处记录"
      @retry="reload"
    >
      <UCard v-for="item in list" :key="item.questionId" class="note-card" clickable @click="openDetail(item)">
        <view class="note-card__header">
          <UTag
            v-if="item.question"
            :text="QUESTION_TYPE_LABELS[questionTypeOf(item)]"
            type="primary"
            size="small"
            plain
          />
          <text class="note-card__subject">{{ subjectName(item.subjectId) }}</text>
          <view class="note-card__action" @click.stop="removeNote(item)">
            <UIcon name="trash" size="30rpx" color="var(--color-text-secondary)" />
          </view>
        </view>
        <text class="note-card__question">{{ questionPreview(item) }}</text>
        <text class="note-card__content">{{ previewText(item.content, 120) }}</text>
        <text class="note-card__time">更新于 {{ formatDateTime(item.updatedAt, 'YYYY-MM-DD HH:mm') }}</text>
      </UCard>
    </UList>
  </view>
</template>

<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: '我的笔记',
    enablePullDownRefresh: true,
  },
});

import { computed } from 'vue';
import { onLoad, onPullDownRefresh, onReachBottom, onShow } from '@dcloudio/uni-app';
import { QuestionType, type QuestionNoteItemDto } from '@/api';
import type { TabValue } from '@/components/UTabs/index.vue';
import { useRouter } from '@/composables';
import { useStudySubjects } from '@/composables/useStudySubjects';
import { PAGES, QUESTION_TYPE_LABELS } from '@/constants';
import { useGlobalStore } from '@/store/modules/global';
import { useQuestionCollectionStore } from '@/store/modules/question-collection';
import { formatDateTime } from '@/utils/datetime';
import { confirm } from '@/utils/modal';
import { showToast } from '@/utils/toast';
import { previewText } from '@/utils/wrong-book';

const globalStore = useGlobalStore();
const store = useQuestionCollectionStore();
const router = useRouter();
const { subjectTabs, subjectName, watchSubjectFilter, loadSubjects } = useStudySubjects();

const list = computed(() => store.noteList);
const subjectTab = computed<TabValue>({
  get: () => store.noteSubjectId,
  set: value => {
    store.setNoteSubject(String(value)).catch(error => console.error('加载笔记失败:', error));
  },
});

function targetOf(item: QuestionNoteItemDto) {
  const question = item.question;
  if (!question || question.type !== QuestionType.MATERIAL) return question;
  return question.children?.find(child => child.id === item.questionId) ?? question;
}

function questionTypeOf(item: QuestionNoteItemDto): QuestionType {
  return targetOf(item)?.type ?? QuestionType.SINGLE;
}

function questionPreview(item: QuestionNoteItemDto): string {
  const question = item.question;
  if (!question) return '题目内容暂不可用';
  return previewText(targetOf(item)?.stem, 60) || previewText(question.material, 60) || '（无题干）';
}

async function reload() {
  try {
    await store.fetchNotes(true);
  } catch (error) {
    console.error('加载笔记失败:', error);
  }
}

function openDetail(item: QuestionNoteItemDto) {
  router.push(PAGES.STUDY_QUESTION, { questionId: item.questionId });
}

async function removeNote(item: QuestionNoteItemDto) {
  if (!(await confirm({ content: '确定删除这条笔记吗？', confirmText: '删除' }))) return;
  try {
    await store.deleteNote(item.questionId);
    showToast('笔记已删除');
  } catch (error) {
    console.error('删除笔记失败:', error);
  }
}

watchSubjectFilter(
  () => store.noteSubjectId,
  () => {
    store.setNoteSubject('').catch(error => console.error('加载笔记失败:', error));
  },
);

onLoad(() => {
  loadSubjects();
  reload();
});

onShow(() => {
  if (store.notesDirty) reload();
});

onPullDownRefresh(async () => {
  await reload();
  uni.stopPullDownRefresh();
});

onReachBottom(() => {
  if (store.notesHasMore) store.fetchNotes().catch(error => console.error('加载笔记失败:', error));
});
</script>

<style scoped lang="scss">
.notes-page {
  min-height: 100vh;
  background: var(--color-bg-grey);
}

.notes-tabs {
  padding-bottom: 12rpx;
  background: var(--color-bg);
}

.notes-list {
  padding: 20rpx 24rpx;
}

.note-card {
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

  &__question {
    display: block;
    margin-top: 12rpx;
    color: var(--color-text-secondary);
    font-size: 26rpx;
    line-height: 1.6;
  }

  &__content {
    display: block;
    margin-top: 12rpx;
    color: var(--color-text);
    font-size: 28rpx;
    line-height: 1.6;
    word-break: break-all;
  }

  &__time {
    display: block;
    margin-top: 12rpx;
    color: var(--color-text-secondary);
    font-size: 24rpx;
  }
}
</style>
