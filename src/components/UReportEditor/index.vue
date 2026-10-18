<template>
  <!-- UReportEditor - 题目纠错表单弹层，放在页面根节点 -->
  <UPopup
    :model-value="modelValue"
    type="bottom"
    title="题目纠错"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <view class="u-report-editor">
      <text class="u-report-editor__label">纠错原因</text>
      <URadioGroup :model-value="reason" :options="REPORT_REASON_OPTIONS" @update:model-value="selectReason" />
      <text class="u-report-editor__label">
        问题说明<text v-if="contentRequired" class="u-report-editor__required">*</text>
      </text>
      <UTextarea
        v-model="content"
        :placeholder="contentRequired ? '请描述具体问题（必填）' : '补充具体问题，便于我们核实（选填）'"
        :maxlength="REPORT_CONTENT_MAX_LENGTH"
        :height="240"
      />
      <UButton text="提交" type="primary" block :loading="store.submitting" @click="handleSubmit" />
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
import { QuestionReportReason } from '@/api';
import type { RadioValue } from '@/components';
import { useQuestionReportStore } from '@/store/modules/question-report';
import { REPORT_CONTENT_MAX_LENGTH, REPORT_REASON_OPTIONS, validateReportForm } from '@/utils/question-report';
import { showToast } from '@/utils/toast';

defineOptions({
  name: 'UReportEditor',
});

export interface UReportEditorProps {
  /** 是否显示，支持 v-model */
  modelValue: boolean;
  /** 可作答题目 id（材料题为小题 id） */
  questionId: string;
}

const props = defineProps<UReportEditorProps>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  submitted: [questionId: string];
}>();

const store = useQuestionReportStore();
const reason = ref<QuestionReportReason | ''>('');
const content = ref('');

const contentRequired = computed(() => reason.value === QuestionReportReason.other);

function selectReason(value: RadioValue) {
  reason.value = value as QuestionReportReason;
}

watch(
  () => [props.modelValue, props.questionId] as const,
  ([visible]) => {
    if (!visible) return;
    reason.value = '';
    content.value = '';
  },
  { immediate: true },
);

async function handleSubmit() {
  if (!props.questionId || store.submitting) return;
  const form = { reason: reason.value, content: content.value };
  const message = validateReportForm(form);
  if (message) {
    showToast(message);
    return;
  }
  const questionId = props.questionId;
  try {
    await store.submit(questionId, form);
    showToast({ title: '提交成功，感谢反馈', icon: 'success' });
    emit('update:modelValue', false);
    emit('submitted', questionId);
  } catch (error) {
    console.error('提交纠错失败:', error);
  }
}
</script>

<style scoped lang="scss">
.u-report-editor {
  display: flex;
  flex-direction: column;
  gap: 20rpx;

  &__label {
    color: var(--color-text);
    font-size: 28rpx;
    font-weight: 600;
  }

  &__required {
    margin-left: 4rpx;
    color: var(--color-error);
  }
}
</style>
