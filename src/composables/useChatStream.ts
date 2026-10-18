/**
 * AI 回答流式接收：发送消息、SSE 解析、中断、断线后按 messageId 与最后事件 id 恢复
 */
import { ref, shallowRef } from 'vue';
import {
  AiMessageStatus,
  API_BASE_URL,
  ApiError,
  getAiMessage,
  isTransientError,
  recoverUnauthorized,
  resolveRequestHeaders,
  type AiMessageDto,
  type SendAiMessageDto,
} from '@/api';
import { getBusinessErrorKey, getBusinessErrorMessage } from '@/utils/business-error';
import {
  defaultStreamTransport,
  type StreamHandle,
  type StreamRequest,
  type StreamResult,
  type StreamTransport,
} from '@/utils/chat-transport';
import { createSseParser, createUtf8Decoder, type SseEvent } from '@/utils/sse';

export const ChatStreamEvent = {
  MESSAGE_START: 'message.start',
  REASONING_DELTA: 'reasoning.delta',
  ANSWER_DELTA: 'answer.delta',
  SUGGESTIONS: 'suggestions',
  MESSAGE_DONE: 'message.done',
  ERROR: 'error',
} as const;

/** 服务端未翻译时使用的流内错误文案 */
export const CHAT_STREAM_ERROR_TEXT: Record<string, string> = {
  aiGenerationFailed: 'AI 回答生成失败，本次不计入额度',
  aiGenerationInterrupted: 'AI 回答未能正常结束，请稍后查看',
  aiStreamExpired: '回答已结束，请刷新查看',
  aiStreamTimeout: '回答仍在生成，请稍后刷新查看',
  internalServerError: 'AI 服务异常，请稍后再试',
};

/** 正在接收的回答 */
export interface ChatStreamDraft {
  messageId: string;
  content: string;
  reasoning: string;
  suggestions: string[];
  status: AiMessageStatus;
  /** 最近一个带 id 的事件，用于续读 */
  lastEventId: string | null;
}

export class ChatStreamError extends Error {
  constructor(
    public readonly code: string,
    message?: string,
  ) {
    super(message || CHAT_STREAM_ERROR_TEXT[code] || code);
    this.name = 'ChatStreamError';
  }
}

export type ChatStreamOutcome =
  /** 收到 message.done，或快照显示已结束 */
  | { type: 'finished'; draft: ChatStreamDraft }
  /** 收到 error 事件 */
  | { type: 'failed'; draft: ChatStreamDraft | null; error: ChatStreamError }
  /** 连接中断且重连失败，可稍后调用 resume */
  | { type: 'disconnected'; draft: ChatStreamDraft | null }
  /** 调用了 abort */
  | { type: 'aborted'; draft: ChatStreamDraft | null };

export interface UseChatStreamOptions {
  transport?: StreamTransport;
  /** 增量合并写入的间隔（毫秒），0 为逐条写入 */
  flushInterval?: number;
  /** 超过该时长未收到任何数据（含心跳）视为断线（毫秒） */
  idleTimeout?: number;
  /** 断线后自动续读的次数 */
  maxReconnects?: number;
  /** 第 n 次重连前的等待（毫秒） */
  reconnectDelay?: (attempt: number) => number;
  /** 收到 message.start */
  onStart?: (draft: ChatStreamDraft) => void;
}

type FollowResult =
  | { type: 'terminal'; outcome: ChatStreamOutcome }
  | { type: 'ended' }
  | { type: 'aborted' }
  | { type: 'http'; error: ApiError };

const STREAM_CONTENT_TYPE = 'text/event-stream';

/** 收到后改取快照的流内错误 */
const SNAPSHOT_ERROR_CODES = new Set(['aiStreamExpired', 'aiGenerationInterrupted', 'aiStreamTimeout']);

function messagesUrl(conversationId: string): string {
  return `${API_BASE_URL}/api/v1/ai/conversations/${conversationId}/messages`;
}

function eventsUrl(messageId: string, after: string): string {
  return `${API_BASE_URL}/api/v1/ai/messages/${messageId}/events?after=${encodeURIComponent(after)}`;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function toApiError(status: number, text: string): ApiError {
  const body = parseJson(text) as { message?: unknown; data?: unknown } | null;
  const errorKey = getBusinessErrorKey(body?.data);
  const message =
    (errorKey && getBusinessErrorMessage(errorKey)) ||
    (typeof body?.message === 'string' && body.message) ||
    `请求失败(${status})`;
  return new ApiError(message, status, undefined, errorKey, body?.data ?? undefined);
}

function draftFromMessage(message: AiMessageDto): ChatStreamDraft {
  return {
    messageId: message.id,
    content: message.content,
    reasoning: message.reasoning ?? '',
    suggestions: message.suggestions ?? [],
    status: message.status,
    lastEventId: message.lastEventId,
  };
}

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** AI 回答流：发送、中断与按 messageId 恢复 */
export function useChatStream(options: UseChatStreamOptions = {}) {
  const {
    transport = defaultStreamTransport(),
    flushInterval = 80,
    idleTimeout = 45_000,
    maxReconnects = 2,
    reconnectDelay = attempt => 1000 * attempt,
    onStart,
  } = options;

  /** 正在接收或最近一次接收的回答 */
  const draft = shallowRef<ChatStreamDraft | null>(null);
  /** 是否有连接在接收 */
  const streaming = ref(false);

  let handle: StreamHandle | null = null;
  let aborted = false;
  let run = 0;
  let pendingAnswer = '';
  let pendingReasoning = '';
  let flushTimer: ReturnType<typeof setTimeout> | null = null;

  function currentDraft(): ChatStreamDraft | null {
    return draft.value;
  }

  function update(patch: Partial<ChatStreamDraft>): void {
    if (draft.value) draft.value = { ...draft.value, ...patch };
  }

  function flush(): void {
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    if (!draft.value || (!pendingAnswer && !pendingReasoning)) return;
    update({
      content: draft.value.content + pendingAnswer,
      reasoning: draft.value.reasoning + pendingReasoning,
    });
    pendingAnswer = '';
    pendingReasoning = '';
  }

  function scheduleFlush(): void {
    if (flushInterval <= 0) {
      flush();
      return;
    }
    if (!flushTimer) flushTimer = setTimeout(flush, flushInterval);
  }

  function dropPending(): void {
    if (flushTimer) clearTimeout(flushTimer);
    flushTimer = null;
    pendingAnswer = '';
    pendingReasoning = '';
  }

  function textOf(data: Record<string, unknown>): string {
    return typeof data.text === 'string' ? data.text : '';
  }

  /** 处理一条事件，结束事件返回结果 */
  function handleEvent(event: SseEvent): ChatStreamOutcome | null {
    const data = (parseJson(event.data) ?? {}) as Record<string, unknown>;
    if (event.event === ChatStreamEvent.MESSAGE_START) {
      dropPending();
      const messageId = typeof data.messageId === 'string' ? data.messageId : (draft.value?.messageId ?? '');
      draft.value = {
        messageId,
        content: '',
        reasoning: '',
        suggestions: [],
        status: AiMessageStatus.STREAMING,
        lastEventId: event.id,
      };
      onStart?.(draft.value);
      return null;
    }
    if (!draft.value) return null;
    if (event.id) draft.value = { ...draft.value, lastEventId: event.id };
    switch (event.event) {
      case ChatStreamEvent.ANSWER_DELTA:
        pendingAnswer += textOf(data);
        scheduleFlush();
        return null;
      case ChatStreamEvent.REASONING_DELTA:
        pendingReasoning += textOf(data);
        scheduleFlush();
        return null;
      case ChatStreamEvent.SUGGESTIONS:
        update({ suggestions: Array.isArray(data.items) ? data.items.filter(item => typeof item === 'string') : [] });
        return null;
      case ChatStreamEvent.MESSAGE_DONE: {
        flush();
        const status = typeof data.status === 'string' ? (data.status as AiMessageStatus) : AiMessageStatus.DONE;
        update({ status });
        return { type: 'finished', draft: draft.value };
      }
      case ChatStreamEvent.ERROR: {
        flush();
        const code = typeof data.code === 'string' ? data.code : 'internalServerError';
        const message = typeof data.message === 'string' && data.message !== code ? data.message : undefined;
        if (code === 'aiGenerationFailed') update({ status: AiMessageStatus.FAILED });
        return { type: 'failed', draft: draft.value, error: new ChatStreamError(code, message) };
      }
      default:
        return null;
    }
  }

  async function openOnce(
    request: Omit<StreamRequest, 'headers'>,
    token: number,
    retryAuth = true,
  ): Promise<FollowResult> {
    const headers: Record<string, string> = {
      ...(await resolveRequestHeaders()),
      Accept: STREAM_CONTENT_TYPE,
      ...(request.body === undefined ? {} : { 'Content-Type': 'application/json' }),
    };
    if (token !== run || aborted) return { type: 'aborted' };

    const decoder = createUtf8Decoder();
    const state: {
      terminal: ChatStreamOutcome | null;
      isEventStream: boolean | null;
      rawBody: string;
      idle: boolean;
      idleTimer: ReturnType<typeof setTimeout> | null;
      current: StreamHandle | null;
      closed: boolean;
    } = {
      terminal: null,
      isEventStream: null,
      rawBody: '',
      idle: false,
      idleTimer: null,
      current: null,
      closed: false,
    };
    const parser = createSseParser(event => {
      if (!state.terminal) state.terminal = handleEvent(event);
    });
    const resetIdle = () => {
      if (state.idleTimer) clearTimeout(state.idleTimer);
      if (idleTimeout <= 0 || state.current?.chunked === false) return;
      state.idleTimer = setTimeout(() => {
        state.idle = true;
        state.current?.abort();
      }, idleTimeout);
    };

    const current = transport(
      { ...request, headers },
      {
        onHeaders(status, responseHeaders) {
          const contentType = responseHeaders['content-type'] ?? '';
          state.isEventStream = (status === undefined || status === 200) && contentType.includes(STREAM_CONTENT_TYPE);
        },
        onChunk(chunk) {
          if (token !== run || state.terminal || state.closed) return;
          resetIdle();
          const text = decoder.decode(chunk);
          if (state.isEventStream !== true) state.rawBody += text;
          if (state.isEventStream !== false) parser.push(text);
          if (state.terminal) state.current?.abort();
        },
      },
    );
    state.current = current;
    handle = current;
    resetIdle();

    let result: StreamResult | null;
    try {
      result = await current.done;
    } catch {
      result = null;
    } finally {
      state.closed = true;
      if (state.idleTimer) clearTimeout(state.idleTimer);
      if (handle === current) handle = null;
    }

    if (token !== run || aborted) return { type: 'aborted' };
    if (state.terminal) return { type: 'terminal', outcome: state.terminal };
    if (state.idle || !result) return { type: 'ended' };

    const tail = decoder.flush();
    const dataText = result.data === undefined ? '' : createUtf8Decoder().decode(result.data);
    if (result.status === 200 && state.isEventStream !== false) {
      parser.push(tail + dataText);
      parser.end();
      return state.terminal ? { type: 'terminal', outcome: state.terminal } : { type: 'ended' };
    }
    const body = state.rawBody + tail + dataText;
    if (result.status === 401 && retryAuth && (await recoverUnauthorized(headers.Authorization).catch(() => false))) {
      return openOnce(request, token, false);
    }
    return { type: 'http', error: toApiError(result.status, body) };
  }

  async function loadSnapshot(messageId: string): Promise<AiMessageDto> {
    const message = await getAiMessage(messageId, { showError: false });
    dropPending();
    draft.value = draftFromMessage(message);
    return message;
  }

  function outcomeOfSnapshot(message: AiMessageDto): ChatStreamOutcome | null {
    if (message.status === AiMessageStatus.STREAMING) return null;
    if (message.status === AiMessageStatus.FAILED) {
      return { type: 'failed', draft: draft.value, error: new ChatStreamError('aiGenerationFailed') };
    }
    return { type: 'finished', draft: draft.value! };
  }

  /** 按快照恢复：已结束直接返回，生成中从快照的事件 id 之后续读 */
  async function resumeFromSnapshot(messageId: string, token: number): Promise<ChatStreamOutcome> {
    const message = await loadSnapshot(messageId);
    if (token !== run || aborted) return { type: 'aborted', draft: draft.value };
    return outcomeOfSnapshot(message) ?? follow(messageId, message.lastEventId ?? '0', token);
  }

  /** 流内错误后取快照：已结束按快照返回，仍在生成时返回该错误 */
  async function settleFromSnapshot(
    messageId: string,
    token: number,
    error: ChatStreamError,
  ): Promise<ChatStreamOutcome> {
    const message = await loadSnapshot(messageId);
    if (token !== run || aborted) return { type: 'aborted', draft: draft.value };
    return outcomeOfSnapshot(message) ?? { type: 'failed', draft: draft.value, error };
  }

  function settle(
    messageId: string,
    token: number,
    outcome: ChatStreamOutcome,
  ): Promise<ChatStreamOutcome> | ChatStreamOutcome {
    return outcome.type === 'failed' && SNAPSHOT_ERROR_CODES.has(outcome.error.code)
      ? settleFromSnapshot(messageId, token, outcome.error)
      : outcome;
  }

  /** 续读事件流；断线时按最后事件 id 重连，事件流已过期时取快照 */
  async function follow(messageId: string, after: string, token: number, attempt = 0): Promise<ChatStreamOutcome> {
    if (draft.value?.messageId !== messageId) return resumeFromSnapshot(messageId, token);
    const result = await openOnce({ url: eventsUrl(messageId, after), method: 'GET' }, token);
    if (result.type === 'aborted') return { type: 'aborted', draft: draft.value };
    if (result.type === 'http') throw result.error;
    if (result.type === 'terminal') {
      return settle(messageId, token, result.outcome);
    }
    return reconnect(messageId, token, attempt);
  }

  async function reconnect(messageId: string, token: number, attempt: number): Promise<ChatStreamOutcome> {
    if (attempt >= maxReconnects) return { type: 'disconnected', draft: draft.value };
    await wait(reconnectDelay(attempt + 1));
    if (token !== run || aborted) return { type: 'aborted', draft: draft.value };
    flush();
    const after = draft.value?.messageId === messageId ? draft.value.lastEventId : null;
    try {
      if (after) return await follow(messageId, after, token, attempt + 1);
      const message = await loadSnapshot(messageId);
      if (token !== run || aborted) return { type: 'aborted', draft: draft.value };
      return outcomeOfSnapshot(message) ?? (await follow(messageId, message.lastEventId ?? '0', token, attempt + 1));
    } catch (error) {
      if (error instanceof ApiError && error.status !== undefined && !isTransientError(error)) throw error;
      return reconnect(messageId, token, attempt + 1);
    }
  }

  async function guard(task: (token: number) => Promise<ChatStreamOutcome>): Promise<ChatStreamOutcome> {
    flush();
    handle?.abort();
    run += 1;
    const token = run;
    aborted = false;
    streaming.value = true;
    try {
      return await task(token);
    } finally {
      if (token === run) {
        flush();
        streaming.value = false;
      }
    }
  }

  /**
   * 发送消息并接收回答
   * @throws ApiError 请求被拒绝（如 aiQuotaExceeded、aiRateLimited、contentBlocked），或发出前网络失败
   */
  function send(conversationId: string, body: SendAiMessageDto): Promise<ChatStreamOutcome> {
    return guard(async token => {
      draft.value = null;
      const result = await openOnce({ url: messagesUrl(conversationId), method: 'POST', body }, token);
      if (result.type === 'aborted') return { type: 'aborted', draft: draft.value };
      if (result.type === 'http') throw result.error;
      const messageId = currentDraft()?.messageId;
      if (result.type === 'terminal') return messageId ? settle(messageId, token, result.outcome) : result.outcome;
      if (!messageId) throw new ApiError('网络请求失败');
      return reconnect(messageId, token, 0);
    });
  }

  /**
   * 恢复接收：传入 after 时从该事件之后续读，否则先拉取快照
   * @throws ApiError 快照或续读请求被拒绝
   */
  function resume(messageId: string, after?: string | null): Promise<ChatStreamOutcome> {
    return guard(token => (after ? follow(messageId, after, token) : resumeFromSnapshot(messageId, token)));
  }

  /** 中断接收，服务端继续生成，之后可调用 resume 恢复 */
  function abort(): void {
    if (!streaming.value) return;
    aborted = true;
    run += 1;
    flush();
    handle?.abort();
    handle = null;
    streaming.value = false;
  }

  function reset(): void {
    abort();
    dropPending();
    draft.value = null;
  }

  return { draft, streaming, send, resume, abort, reset };
}
