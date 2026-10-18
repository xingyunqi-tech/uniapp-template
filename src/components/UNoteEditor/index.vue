<template>
  <!-- UNoteEditor - 题目笔记编辑弹层，放在页面根节点 -->
  <UPopup
    :model-value="modelValue"
    type="bottom"
    title="我的笔记"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <view class="u-note-editor">
      <UTextarea
        v-model="content"
        placeholder="记录解题思路、易错点"
        :maxlength="NOTE_MAX_LENGTH"
        :height="320"
        :focus="modelValue"
      />
      <view class="u-note-editor__actions">
        <UButton v-if="existing" text="删除" type="danger" plain :loading="deleting" @click="handleDelete" />
        <UButton text="保存" type="primary" :loading="saving" :disabled="loadingNote || !dirty" @click="handleSave" />
      </view>
    </view>
  </UPopup>
</template>

<script setup lang="ts">
definePage({
  meta: {
    isComponent: true,
  },
});

import { computed, ref, watch } from 'vue';
import { NOTE_MAX_LENGTH, useQuestionCollectionStore } from '@/store/modules/question-collection';
import { confirm } from '@/utils/modal';
import { showToast } from '@/utils/toast';

defineOptions({
  name: 'UNoteEditor',
});

export interface UNoteEditorProps {
  /** 是否显示，支持 v-model */
  modelValue: boolean;
  questionId: string;
}

const props = defineProps<UNoteEditorProps>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const store = useQuestionCollectionStore();
const content = ref('');
const saving = ref(false);
const deleting = ref(false);
const loadingNote = ref(false);

const existing = computed(() => (props.questionId ? (store.noteOf(props.questionId) ?? null) : null));
const dirty = computed(() => content.value.trim() !== (existing.value?.content ?? ''));

async function loadNote(questionId: string) {
  loadingNote.value = true;
  const initial = content.value;
  try {
    const note = await store.fetchNote(questionId);
    if (props.questionId === questionId && content.value === initial) content.value = note?.content ?? '';
  } catch (error) {
    console.error('加载笔记失败:', error);
  } finally {
    if (props.questionId === questionId) loadingNote.value = false;
  }
}

watch(
  () => [props.modelValue, props.questionId] as const,
  ([visible, questionId]) => {
    if (!visible) return;
    content.value = existing.value?.content ?? '';
    loadingNote.value = false;
    if (questionId && store.noteOf(questionId) === undefined) loadNote(questionId);
  },
  { immediate: true },
);

function close() {
  emit('update:modelValue', false);
}

async function handleSave() {
  if (!props.questionId || saving.value) return;
  saving.value = true;
  try {
    const note = await store.saveNote(props.questionId, content.value);
    showToast(note ? '笔记已保存' : '笔记已删除');
    close();
  } catch (error) {
    console.error('保存笔记失败:', error);
  } finally {
    saving.value = false;
  }
}

async function handleDelete() {
  if (!props.questionId || deleting.value) return;
  if (!(await confirm({ content: '确定删除这条笔记吗？', confirmText: '删除' }))) return;
  deleting.value = true;
  try {
    await store.deleteNote(props.questionId);
    showToast('笔记已删除');
    close();
  } catch (error) {
    console.error('删除笔记失败:', error);
  } finally {
    deleting.value = false;
  }
}
</script>

<style scoped lang="scss">
.u-note-editor {
  display: flex;
  flex-direction: column;
  gap: 24rpx;

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: 20rpx;
  }
}
</style>
