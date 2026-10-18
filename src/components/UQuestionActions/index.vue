<template>
  <!-- UQuestionActions - 题目收藏与笔记入口，只在答案可见时使用 -->
  <view class="u-question-actions">
    <view class="u-question-actions__bar">
      <view class="u-question-actions__item" @click="handleToggle">
        <UIcon
          :name="favorited ? 'star-filled' : 'star'"
          size="34rpx"
          :color="favorited ? 'var(--color-warning)' : 'var(--color-text-secondary)'"
        />
        <text class="u-question-actions__label">{{ favorited ? '已收藏' : '收藏' }}</text>
      </view>
      <view class="u-question-actions__item" @click="emit('edit-note', questionId)">
        <UIcon name="compose" size="34rpx" color="var(--color-text-secondary)" />
        <text class="u-question-actions__label">{{ note ? '编辑笔记' : '写笔记' }}</text>
      </view>
    </view>
    <view v-if="note" class="u-question-actions__note" @click="emit('edit-note', questionId)">
      <text class="u-question-actions__note-title">我的笔记</text>
      <text class="u-question-actions__note-content">{{ note.content }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
definePage({
  meta: {
    isComponent: true,
  },
});

import { computed, ref, watch } from 'vue';
import { useQuestionCollectionStore } from '@/store/modules/question-collection';
import { showToast } from '@/utils/toast';

defineOptions({
  name: 'UQuestionActions',
});

export interface UQuestionActionsProps {
  /** 可作答题目 id（材料题为小题 id） */
  questionId: string;
}

const props = defineProps<UQuestionActionsProps>();

const emit = defineEmits<{
  'edit-note': [questionId: string];
}>();

const store = useQuestionCollectionStore();
const toggling = ref(false);

const favorited = computed(() => store.favoriteOf(props.questionId) === true);
const note = computed(() => store.noteOf(props.questionId) ?? null);

async function handleToggle() {
  if (toggling.value) return;
  toggling.value = true;
  try {
    const value = await store.toggle(props.questionId);
    showToast(value ? '已收藏' : '已取消收藏');
  } catch (error) {
    console.error('切换收藏失败:', error);
  } finally {
    toggling.value = false;
  }
}

watch(
  () => props.questionId,
  id => {
    if (!id) return;
    store.isFavorited(id).catch(error => console.error('查询收藏状态失败:', error));
    store.fetchNote(id).catch(error => console.error('查询笔记失败:', error));
  },
  { immediate: true },
);
</script>

<style scoped lang="scss">
.u-question-actions {
  display: flex;
  flex-direction: column;
  gap: 16rpx;

  &__bar {
    display: flex;
    gap: 40rpx;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 8rpx;
  }

  &__label {
    color: var(--color-text-secondary);
    font-size: 26rpx;
  }

  &__note {
    display: flex;
    flex-direction: column;
    padding: 20rpx;
    border-radius: var(--radius-base);
    background: var(--color-bg-grey);
    gap: 8rpx;
  }

  &__note-title {
    color: var(--color-text);
    font-size: 26rpx;
    font-weight: 600;
  }

  &__note-content {
    color: var(--color-text);
    font-size: 26rpx;
    line-height: 1.6;
    word-break: break-all;
    white-space: pre-wrap;
  }
}
</style>
