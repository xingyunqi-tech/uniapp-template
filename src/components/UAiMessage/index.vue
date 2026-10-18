<template>
  <!-- UAiMessage - AI 回答：思考过程折叠、Markdown + LaTeX 正文、AI 生成标识、点赞点踩与举报、追问建议 -->
  <view class="u-ai-message">
    <view class="u-ai-message__bubble">
      <view v-if="message.reasoning" class="u-ai-message__reasoning">
        <view class="u-ai-message__reasoning-header" @click="reasoningExpanded = !reasoningExpanded">
          <text>{{ thinking ? '深度思考中…' : '已深度思考' }}</text>
          <UIcon :name="reasoningExpanded ? 'up' : 'down'" size="24rpx" color="var(--color-text-secondary)" />
        </view>
        <text v-if="reasoningExpanded" class="u-ai-message__reasoning-body">{{ message.reasoning }}</text>
      </view>

      <UQuestionContent v-if="message.content" :content="message.content" />
      <view v-else-if="streaming && !message.reasoning" class="u-ai-message__typing">
        <view v-for="dot in 3" :key="dot" class="u-ai-message__dot" />
      </view>

      <text
        v-if="noticeText"
        class="u-ai-message__notice"
        :class="{ 'u-ai-message__notice--error': message.status === AiMessageStatus.FAILED }"
        @click="emit('notice-click')"
      >
        {{ noticeText }}
      </text>

      <view class="u-ai-message__footer">
        <text class="u-ai-message__label">内容由 AI 生成，仅供参考</text>
        <view v-if="actionable" class="u-ai-message__actions">
          <view class="u-ai-message__action" @click="toggleFeedback(AiMessageFeedback.LIKE)">
            <UIcon
              :name="message.feedback === AiMessageFeedback.LIKE ? 'hand-up-filled' : 'hand-up'"
              size="32rpx"
              :color="
                message.feedback === AiMessageFeedback.LIKE ? 'var(--color-primary)' : 'var(--color-text-secondary)'
              "
            />
          </view>
          <view class="u-ai-message__action" @click="toggleFeedback(AiMessageFeedback.DISLIKE)">
            <UIcon
              :name="message.feedback === AiMessageFeedback.DISLIKE ? 'hand-down-filled' : 'hand-down'"
              size="32rpx"
              :color="
                message.feedback === AiMessageFeedback.DISLIKE ? 'var(--color-primary)' : 'var(--color-text-secondary)'
              "
            />
          </view>
          <view class="u-ai-message__action" @click="emit('report')">
            <UIcon name="flag" size="32rpx" color="var(--color-text-secondary)" />
            <text class="u-ai-message__action-text">举报</text>
          </view>
        </view>
      </view>
    </view>

    <view v-if="suggestionsVisible" class="u-ai-message__suggestions">
      <view
        v-for="(item, index) in message.suggestions"
        :key="index"
        class="u-ai-message__suggestion"
        @click="emit('suggestion', item)"
      >
        <text>{{ item }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
definePage({
  meta: {
    isComponent: true,
  },
});

import { computed, ref } from 'vue';
import { AiMessageFeedback, AiMessageStatus } from '@/api';

defineOptions({
  name: 'UAiMessage',
});

/** AI 回答的展示数据 */
export interface AiMessageView {
  id: string;
  content: string;
  reasoning: string;
  suggestions: string[];
  status: AiMessageStatus;
  feedback: AiMessageFeedback | null;
  /** 覆盖按状态生成的提示，如流内错误 */
  notice?: string;
}

export interface UAiMessageProps {
  message: AiMessageView;
  /** 显示追问建议，通常只用于最后一条回答 */
  showSuggestions?: boolean;
}

const props = withDefaults(defineProps<UAiMessageProps>(), {
  showSuggestions: false,
});

const emit = defineEmits<{
  /** 点赞、点踩或再次点击撤销（null） */
  feedback: [value: AiMessageFeedback | null];
  report: [];
  suggestion: [text: string];
  'notice-click': [];
}>();

const STATUS_NOTICE: Partial<Record<AiMessageStatus, string>> = {
  [AiMessageStatus.STOPPED]: '已停止生成',
  [AiMessageStatus.FAILED]: 'AI 回答生成失败，本次不计入额度',
};

const reasoningExpanded = ref(false);

const streaming = computed(() => props.message.status === AiMessageStatus.STREAMING);
const thinking = computed(() => streaming.value && !props.message.content);
const noticeText = computed(() => props.message.notice || STATUS_NOTICE[props.message.status] || '');
const actionable = computed(() => !streaming.value && props.message.status !== AiMessageStatus.FAILED);
const suggestionsVisible = computed(
  () => props.showSuggestions && props.message.status === AiMessageStatus.DONE && props.message.suggestions.length > 0,
);

function toggleFeedback(value: AiMessageFeedback) {
  emit('feedback', props.message.feedback === value ? null : value);
}
</script>

<style scoped lang="scss">
.u-ai-message {
  display: flex;
  flex-direction: column;
  gap: 16rpx;

  &__bubble {
    display: flex;
    flex-direction: column;
    padding: 24rpx;
    border-radius: 8rpx 24rpx 24rpx;
    background: var(--color-bg);
    gap: 16rpx;
  }

  &__reasoning {
    display: flex;
    flex-direction: column;
    padding: 16rpx 20rpx;
    border-radius: var(--radius-base);
    background: var(--color-bg-grey);
    gap: 12rpx;
  }

  &__reasoning-header {
    display: flex;
    align-items: center;
    color: var(--color-text-secondary);
    font-size: 24rpx;
    gap: 8rpx;
  }

  &__reasoning-body {
    color: var(--color-text-secondary);
    font-size: 24rpx;
    line-height: 1.6;
    white-space: pre-wrap;
    overflow-wrap: break-word;
  }

  &__typing {
    display: flex;
    align-items: center;
    height: 40rpx;
    gap: 10rpx;
  }

  &__dot {
    width: 12rpx;
    height: 12rpx;
    animation: u-ai-message-blink 1.2s infinite ease-in-out;
    border-radius: var(--radius-full);
    background: var(--color-text-placeholder);

    &:nth-child(2) {
      animation-delay: 0.2s;
    }

    &:nth-child(3) {
      animation-delay: 0.4s;
    }
  }

  &__notice {
    color: var(--color-text-secondary);
    font-size: 24rpx;

    &--error {
      color: var(--color-error);
    }
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16rpx;
  }

  &__label {
    color: var(--color-text-placeholder);
    font-size: 22rpx;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 28rpx;
  }

  &__action {
    display: flex;
    align-items: center;
    gap: 4rpx;
  }

  &__action-text {
    color: var(--color-text-secondary);
    font-size: 22rpx;
  }

  &__suggestions {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 12rpx;
  }

  &__suggestion {
    padding: 12rpx 24rpx;
    border: 1rpx solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-bg);
    color: var(--color-text);
    font-size: 26rpx;
  }
}

@keyframes u-ai-message-blink {
  0%,
  80%,
  100% {
    opacity: 0.3;
  }

  40% {
    opacity: 1;
  }
}
</style>
