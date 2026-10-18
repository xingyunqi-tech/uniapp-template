<template>
  <view class="chat-page" :class="globalStore.themeClass">
    <view class="chat-header">
      <text class="chat-header__label">内容由 AI 生成，仅供参考</text>
      <text v-if="quotaText" class="chat-header__quota">{{ quotaText }}</text>
    </view>

    <UPageState class="chat-state" :loading="initializing" :error="pageError" full-height @retry="initialize">
      <scroll-view
        class="chat-scroll"
        scroll-y
        :scroll-into-view="scrollIntoView"
        :upper-threshold="80"
        :lower-threshold="80"
        @scrolltoupper="loadOlder"
        @scrolltolower="stickToBottom = true"
        @scroll="handleScroll"
      >
        <view class="chat-list">
          <text v-if="hasMore" class="chat-list__more">{{ loadingOlder ? '加载中…' : '上滑查看更早的消息' }}</text>

          <view v-if="messages.length === 0" class="chat-welcome">
            <text class="chat-welcome__title">你好，我是 AI 助教</text>
            <text class="chat-welcome__desc">我会结合题目、答案与解析为你讲解，你可以这样问：</text>
            <view v-for="item in STARTER_QUESTIONS" :key="item" class="chat-welcome__question" @click="sendText(item)">
              <text>{{ item }}</text>
            </view>
          </view>

          <view
            v-for="(message, index) in messages"
            :id="`msg-${message.id}`"
            :key="message.id"
            class="chat-row"
            :class="message.role === AiMessageRole.USER ? 'chat-row--user' : 'chat-row--assistant'"
          >
            <view v-if="message.role === AiMessageRole.USER" class="chat-bubble">
              <text class="chat-bubble__text" user-select>{{ message.content }}</text>
            </view>
            <UAiMessage
              v-else
              class="chat-row__assistant"
              :message="message"
              :show-suggestions="index === messages.length - 1 && !generating"
              @feedback="setFeedback(message, $event)"
              @report="openReport(message)"
              @suggestion="sendText($event)"
              @notice-click="refreshMessage(message)"
            />
          </view>
          <view id="chat-bottom" class="chat-list__bottom" />
        </view>
      </scroll-view>
    </UPageState>

    <view class="chat-input">
      <textarea
        v-model="input"
        class="chat-input__field"
        auto-height
        :maxlength="AI_MESSAGE_MAX_LENGTH"
        :disabled="!ready"
        :show-confirm-bar="false"
        :cursor-spacing="24"
        confirm-type="send"
        placeholder="继续追问这道题…"
        placeholder-class="chat-input__placeholder"
        @confirm="sendText(input)"
      />
      <view v-if="generating" class="chat-input__button chat-input__button--stop" @click="stopGenerating">
        <text>{{ stopping ? '停止中' : '停止' }}</text>
      </view>
      <view
        v-else
        class="chat-input__button"
        :class="{ 'chat-input__button--disabled': !canSend }"
        @click="sendText(input)"
      >
        <text>发送</text>
      </view>
    </view>

    <UPopup v-model="reportVisible" type="bottom" title="举报 AI 回答">
      <view class="chat-report">
        <text class="chat-report__tip">请说明回答存在的问题（选填），我们会尽快核实处理。</text>
        <UTextarea
          v-model="reportContent"
          placeholder="例如：内容错误、含不当信息"
          :maxlength="AI_MESSAGE_MAX_LENGTH"
        />
        <UButton text="提交" type="primary" block :loading="reporting" @click="submitReport" />
      </view>
    </UPopup>

    <UAiConsentPopup v-model="consentVisible" @result="resolveConsent" />
  </view>
</template>

<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: 'AI 讲题',
  },
});

import { computed, nextTick, ref, watch } from 'vue';
import { onHide, onLoad, onShow, onUnload } from '@dcloudio/uni-app';
import {
  AiContextType,
  AiMessageRole,
  AiMessageStatus,
  ApiError,
  createAiConversation,
  getAiMessages,
  reportAiMessage,
  setAiMessageFeedback,
  stopAiMessage,
  type AiMessageDto,
  type AiMessageFeedback,
} from '@/api';
import type { AiMessageView } from '@/components';
import { useAiAccess } from '@/composables/useAiAccess';
import { useChatStream, type ChatStreamDraft, type ChatStreamOutcome } from '@/composables/useChatStream';
import { AI_MESSAGE_MAX_LENGTH, AI_MESSAGE_PAGE_SIZE } from '@/constants';
import { useAiStore } from '@/store/modules/ai';
import { useGlobalStore } from '@/store/modules/global';
import { shouldReloadOnShow } from '@/utils/ai-chat';
import { getBusinessErrorMessage } from '@/utils/business-error';
import { confirm } from '@/utils/modal';
import { onNetworkChange } from '@/utils/network';
import { showToast } from '@/utils/toast';

interface ChatMessage extends AiMessageView {
  role: AiMessageRole;
  lastEventId: string | null;
  /** 本地发送、尚未取得服务端 id 的用户消息 */
  local?: boolean;
}

const STARTER_QUESTIONS = ['这道题的解题思路是什么？', '我错在哪里？', '这道题考查了哪些知识点？'];

const ANSWER_HIDDEN_TEXT = '该题答案当前不可见（如题目正在模考中），交卷或完成作答后再来问 AI 吧。';

const globalStore = useGlobalStore();
const aiStore = useAiStore();
const { consentVisible, ensureConsent, resolveConsent, handleAccessError } = useAiAccess();
const stream = useChatStream();

const conversationId = ref('');
const contextId = ref('');
const sessionId = ref('');
const messages = ref<ChatMessage[]>([]);
const hasMore = ref(false);
const loadingOlder = ref(false);
const initializing = ref(true);
const pageError = ref<string | boolean>(false);
const input = ref('');
const sending = ref(false);
const stopping = ref(false);
const scrollIntoView = ref('');
const stickToBottom = ref(true);
const reportVisible = ref(false);
const reportContent = ref('');
const reportTargetId = ref('');
const reporting = ref(false);
let hidden = false;
let interruptedWhileSending = false;
let scrollTimer: ReturnType<typeof setTimeout> | null = null;

const ready = computed(() => !!conversationId.value && !initializing.value && !pageError.value);
const streamingMessage = computed(() =>
  [...messages.value]
    .reverse()
    .find(message => message.role === AiMessageRole.ASSISTANT && message.status === AiMessageStatus.STREAMING),
);
const generating = computed(
  () => sending.value || stream.streaming.value || (!!streamingMessage.value && !streamingMessage.value.notice),
);
const canSend = computed(() => ready.value && !generating.value && input.value.trim().length > 0);
const quotaText = computed(() => {
  const chat = aiStore.quota?.chat;
  return chat ? `今日剩余 ${chat.remaining}/${chat.limit} 次` : '';
});

function toChatMessage(message: AiMessageDto): ChatMessage {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    reasoning: message.reasoning ?? '',
    suggestions: message.suggestions ?? [],
    status: message.status,
    feedback: message.feedback,
    lastEventId: message.lastEventId,
  };
}

function patchMessage(id: string, patch: Partial<ChatMessage>): void {
  messages.value = messages.value.map(message => (message.id === id ? { ...message, ...patch } : message));
}

function applyDraft(draft: ChatStreamDraft): void {
  const patch = {
    content: draft.content,
    reasoning: draft.reasoning,
    suggestions: draft.suggestions,
    status: draft.status,
    lastEventId: draft.lastEventId,
  };
  if (messages.value.some(message => message.id === draft.messageId)) {
    patchMessage(draft.messageId, patch);
    return;
  }
  messages.value = [
    ...messages.value,
    { id: draft.messageId, role: AiMessageRole.ASSISTANT, feedback: null, ...patch },
  ];
}

function scrollToBottom(): void {
  if (scrollTimer) return;
  scrollTimer = setTimeout(() => {
    scrollTimer = null;
    scrollIntoView.value = '';
    nextTick(() => {
      scrollIntoView.value = 'chat-bottom';
    });
  }, 100);
}

function handleScroll(event: { detail: { deltaY?: number } }): void {
  if ((event.detail.deltaY ?? 0) > 0) stickToBottom.value = false;
}

watch(
  () => stream.draft.value,
  draft => {
    if (!draft) return;
    applyDraft(draft);
    if (stickToBottom.value) scrollToBottom();
  },
);

// ==================== 加载 ====================

function errorText(error: unknown): string {
  if (!(error instanceof ApiError)) return '加载失败，请稍后重试';
  if (error.errorKey === 'answerHidden') return ANSWER_HIDDEN_TEXT;
  if (error.errorKey === 'wechatBindingRequired') return '绑定微信后即可使用 AI 助教';
  return error.message || '加载失败，请稍后重试';
}

async function createConversation(): Promise<boolean> {
  if (!contextId.value) {
    pageError.value = '题目不存在';
    return false;
  }
  try {
    const conversation = await createAiConversation(
      {
        contextType: AiContextType.QUESTION,
        contextId: contextId.value,
        ...(sessionId.value ? { sessionId: sessionId.value } : {}),
      },
      { showError: false },
    );
    conversationId.value = conversation.id;
    aiStore.rememberSession(conversation.id, sessionId.value);
    return true;
  } catch (error) {
    if ((await handleAccessError(error)) === 'retry') return createConversation();
    pageError.value = errorText(error);
    return false;
  }
}

async function loadLatest(): Promise<void> {
  const page = await getAiMessages(conversationId.value, { limit: AI_MESSAGE_PAGE_SIZE }, { showError: false });
  messages.value = page.list.map(toChatMessage);
  hasMore.value = page.hasMore;
  stickToBottom.value = true;
  scrollToBottom();
  resumePending();
}

async function initialize(): Promise<void> {
  initializing.value = true;
  pageError.value = false;
  try {
    if (!(await aiStore.loadEnabled())) {
      pageError.value = getBusinessErrorMessage('aiUnavailable');
      return;
    }
    if (!(await ensureConsent())) {
      pageError.value = '使用 AI 助教前需同意 AI 服务声明';
      return;
    }
    if (!conversationId.value && !(await createConversation())) return;
    await loadLatest();
    aiStore.fetchQuota();
  } catch (error) {
    pageError.value = errorText(error);
    console.error('加载讲题会话失败:', error);
  } finally {
    initializing.value = false;
  }
}

async function loadOlder(): Promise<void> {
  const first = messages.value[0];
  if (!hasMore.value || loadingOlder.value || !first || first.local) return;
  loadingOlder.value = true;
  try {
    const page = await getAiMessages(
      conversationId.value,
      { beforeId: first.id, limit: AI_MESSAGE_PAGE_SIZE },
      { showError: false },
    );
    const known = new Set(messages.value.map(message => message.id));
    messages.value = [...page.list.filter(message => !known.has(message.id)).map(toChatMessage), ...messages.value];
    hasMore.value = page.hasMore;
    scrollIntoView.value = '';
    nextTick(() => {
      scrollIntoView.value = `msg-${first.id}`;
    });
  } catch (error) {
    console.error('加载更早的消息失败:', error);
  } finally {
    loadingOlder.value = false;
  }
}

// ==================== 流式回答 ====================

function handleOutcome(outcome: ChatStreamOutcome): void {
  const id = outcome.draft?.messageId;
  if (outcome.type === 'finished') {
    aiStore.fetchQuota();
    return;
  }
  if (!id) return;
  if (outcome.type === 'failed') {
    patchMessage(id, { notice: outcome.error.message });
    if (outcome.error.code === 'aiGenerationFailed') aiStore.fetchQuota();
  } else if (outcome.type === 'disconnected') {
    patchMessage(id, { notice: '网络连接中断，点击重新获取回答' });
  }
}

async function resumeMessage(id: string, after?: string | null): Promise<void> {
  patchMessage(id, { notice: '' });
  try {
    handleOutcome(await stream.resume(id, after));
  } catch (error) {
    console.error('恢复 AI 回答失败:', error);
    patchMessage(id, { notice: '获取回答失败，点击重试' });
  }
}

/** useLastEvent 为 true 时从最后事件 id 续读 */
function resumePending(useLastEvent = false): void {
  const target = streamingMessage.value;
  if (!target || stream.streaming.value || sending.value || hidden) return;
  resumeMessage(target.id, useLastEvent ? target.lastEventId : undefined);
}

function refreshMessage(message: ChatMessage): void {
  if (!stream.streaming.value && message.status === AiMessageStatus.STREAMING) resumeMessage(message.id);
}

async function restartConversation(content: string): Promise<void> {
  showToast('题目已更新，已为你开启新的讲题');
  conversationId.value = '';
  messages.value = [];
  hasMore.value = false;
  if (await createConversation()) await sendText(content, true);
}

async function handleSendError(error: unknown, content: string, restarted: boolean): Promise<void> {
  const resolution = await handleAccessError(error);
  if (resolution === 'retry') {
    await sendText(content, restarted);
    return;
  }
  if (!input.value) input.value = content;
  if (resolution === 'handled' || !(error instanceof ApiError) || error.status === 401) return;
  switch (error.errorKey) {
    case 'aiConversationOutdated':
      if (restarted) {
        showToast(error.message);
        return;
      }
      input.value = '';
      await restartConversation(content);
      return;
    case 'aiQuotaExceeded':
      showToast('今日 AI 次数已用完，明天再来吧');
      aiStore.fetchQuota();
      return;
    case 'aiRateLimited': {
      const retryAfter = Number((error.details as { retryAfter?: unknown } | undefined)?.retryAfter);
      showToast(retryAfter > 0 ? `提问太频繁了，请 ${retryAfter} 秒后再试` : error.message);
      return;
    }
    case 'answerHidden':
      await confirm({ title: '暂时不能讲解', content: ANSWER_HIDDEN_TEXT, showCancel: false });
      return;
    default:
      break;
  }
  if (error.status === undefined || error.status === 409) {
    showToast(error.status === 409 ? error.message : '网络异常，请稍后重试');
    await loadLatest().catch(err => console.error('刷新消息失败:', err));
    const last = messages.value[messages.value.length - 2];
    if (last?.role === AiMessageRole.USER && last.content === content && input.value === content) input.value = '';
    return;
  }
  showToast(error.message || '发送失败，请稍后重试');
}

async function sendText(raw: string, restarted = false): Promise<void> {
  const content = raw.trim();
  if (!content || !ready.value) return;
  if (generating.value) {
    showToast('请等待当前回答完成');
    return;
  }
  const local: ChatMessage = {
    id: `local-${Date.now()}`,
    role: AiMessageRole.USER,
    content,
    reasoning: '',
    suggestions: [],
    status: AiMessageStatus.DONE,
    feedback: null,
    lastEventId: null,
    local: true,
  };
  if (input.value.trim() === content) input.value = '';
  messages.value = [...messages.value, local];
  stickToBottom.value = true;
  scrollToBottom();
  sending.value = true;
  let failure: unknown = null;
  try {
    handleOutcome(
      await stream.send(conversationId.value, {
        content,
        ...(sessionId.value ? { sessionId: sessionId.value } : {}),
      }),
    );
  } catch (error) {
    failure = error;
    messages.value = messages.value.filter(message => message.id !== local.id);
  } finally {
    sending.value = false;
  }
  if (failure) await handleSendError(failure, content, restarted);
}

async function stopGenerating(): Promise<void> {
  const target = streamingMessage.value;
  if (!target) {
    showToast('正在发送，请稍候');
    return;
  }
  if (stopping.value) return;
  stopping.value = true;
  try {
    await stopAiMessage(target.id);
    if (!stream.streaming.value) await resumeMessage(target.id);
  } catch (error) {
    console.error('停止生成失败:', error);
  } finally {
    stopping.value = false;
  }
}

// ==================== 反馈与举报 ====================

async function setFeedback(message: ChatMessage, feedback: AiMessageFeedback | null): Promise<void> {
  const previous = message.feedback;
  patchMessage(message.id, { feedback });
  try {
    await setAiMessageFeedback(message.id, { feedback });
    if (feedback) showToast('感谢你的反馈');
  } catch (error) {
    patchMessage(message.id, { feedback: previous });
    console.error('提交反馈失败:', error);
  }
}

function openReport(message: ChatMessage): void {
  reportTargetId.value = message.id;
  reportContent.value = '';
  reportVisible.value = true;
}

async function submitReport(): Promise<void> {
  if (!reportTargetId.value || reporting.value) return;
  reporting.value = true;
  try {
    const content = reportContent.value.trim();
    await reportAiMessage(reportTargetId.value, content ? { content } : {});
    reportVisible.value = false;
    showToast({ title: '已提交，我们会尽快处理', icon: 'success' });
  } catch (error) {
    console.error('举报失败:', error);
  } finally {
    reporting.value = false;
  }
}

// ==================== 生命周期 ====================

const offNetworkChange = onNetworkChange(isConnected => {
  if (isConnected && ready.value) resumePending(true);
});

onLoad(options => {
  conversationId.value = options?.conversationId ?? '';
  contextId.value = options?.contextId || options?.questionId || '';
  sessionId.value = options?.sessionId || (conversationId.value ? aiStore.sessionOf(conversationId.value) : '') || '';
  initialize();
});

onShow(async () => {
  if (!hidden) return;
  hidden = false;
  if (!ready.value) return;
  aiStore.fetchQuota();
  if (!shouldReloadOnShow(messages.value, interruptedWhileSending)) {
    resumePending();
    return;
  }
  interruptedWhileSending = false;
  const last = messages.value[messages.value.length - 1];
  const unsent = last?.local ? last.content : '';
  try {
    await loadLatest();
    const delivered = messages.value.some(message => message.role === AiMessageRole.USER && message.content === unsent);
    if (unsent && !delivered && !input.value) input.value = unsent;
  } catch (error) {
    console.error('刷新消息失败:', error);
    showToast('网络异常，请稍后重试');
  }
});

onHide(() => {
  hidden = true;
  if (sending.value) interruptedWhileSending = true;
  stream.abort();
});

onUnload(() => {
  offNetworkChange();
  stream.reset();
  if (scrollTimer) clearTimeout(scrollTimer);
});
</script>

<style scoped lang="scss">
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--color-bg-grey);
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12rpx var(--spacing-base);
  background: var(--color-bg);
  gap: 16rpx;

  &__label {
    color: var(--color-text-secondary);
    font-size: 22rpx;
  }

  &__quota {
    color: var(--color-primary);
    font-size: 22rpx;
  }
}

.chat-state {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.chat-scroll {
  flex: 1;
  height: 0;
}

.chat-list {
  display: flex;
  flex-direction: column;
  padding: var(--spacing-base);
  gap: 32rpx;

  &__more {
    color: var(--color-text-secondary);
    font-size: 24rpx;
    text-align: center;
  }

  &__bottom {
    height: 8rpx;
  }
}

.chat-welcome {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 32rpx 24rpx;
  border-radius: var(--radius-lg);
  background: var(--color-bg);
  gap: 16rpx;

  &__title {
    color: var(--color-text);
    font-size: 32rpx;
    font-weight: 600;
  }

  &__desc {
    color: var(--color-text-secondary);
    font-size: 26rpx;
  }

  &__question {
    padding: 12rpx 24rpx;
    border: 1rpx solid var(--color-border);
    border-radius: var(--radius-lg);
    color: var(--color-primary);
    font-size: 26rpx;
  }
}

.chat-row {
  display: flex;

  &--user {
    justify-content: flex-end;
  }

  &--assistant {
    justify-content: flex-start;
  }

  &__assistant {
    width: 100%;
  }
}

.chat-bubble {
  max-width: 80%;
  padding: 20rpx 24rpx;
  border-radius: 24rpx 8rpx 24rpx 24rpx;
  background: var(--color-primary);

  &__text {
    color: var(--color-text-inverse);
    font-size: 28rpx;
    line-height: 1.6;
    white-space: pre-wrap;
    overflow-wrap: break-word;
  }
}

.chat-input {
  display: flex;
  align-items: flex-end;
  padding: 16rpx var(--spacing-base) calc(16rpx + var(--safe-area-inset-bottom));
  background: var(--color-bg);
  box-shadow: var(--shadow-top);
  gap: 16rpx;

  &__field {
    box-sizing: border-box;
    flex: 1;
    width: auto;
    min-height: 72rpx;
    max-height: 240rpx;
    padding: 16rpx 20rpx;
    border-radius: var(--radius-lg);
    background: var(--color-bg-input);
    color: var(--color-text);
    font-size: 28rpx;
    line-height: 1.5;
  }

  &__button {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 120rpx;
    height: 72rpx;
    border-radius: var(--radius-lg);
    background: var(--color-primary);
    color: var(--color-text-inverse);
    font-size: 28rpx;

    &--disabled {
      opacity: var(--opacity-disabled);
    }

    &--stop {
      border: 1rpx solid var(--color-primary);
      background: var(--color-bg);
      color: var(--color-primary);
    }
  }
}

.chat-report {
  display: flex;
  flex-direction: column;
  gap: 20rpx;

  &__tip {
    color: var(--color-text-secondary);
    font-size: 26rpx;
  }
}
</style>

<style lang="scss">
.chat-input__placeholder {
  color: var(--color-text-placeholder);
}
</style>
