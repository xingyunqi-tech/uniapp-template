import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { AiMessageStatus, ApiError, type AiMessageDto } from '@/api';
import { useChatStream, type UseChatStreamOptions } from '@/composables/useChatStream';
import {
  fetchStreamTransport,
  type StreamCallbacks,
  type StreamRequest,
  type StreamResult,
  type StreamTransport,
} from '@/utils/chat-transport';

const api = vi.hoisted(() => ({
  getAiMessage: vi.fn(),
  resolveRequestHeaders: vi.fn(),
  recoverUnauthorized: vi.fn(),
}));

vi.mock('@/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@/api')>()),
  ...api,
}));

interface Connection {
  request: StreamRequest;
  callbacks: StreamCallbacks;
  aborted: boolean;
  finish(result?: Partial<StreamResult>): void;
  fail(error?: Error): void;
  /** 以事件流响应头开始 */
  open(status?: number, contentType?: string): void;
  send(text: string | Uint8Array): void;
}

const encoder = new TextEncoder();

function createTransport() {
  const connections: Connection[] = [];
  const transport: StreamTransport = (request, callbacks) => {
    let resolve!: (result: StreamResult) => void;
    let reject!: (error: Error) => void;
    const done = new Promise<StreamResult>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    const connection: Connection = {
      request,
      callbacks,
      aborted: false,
      finish: (result = {}) => resolve({ status: 200, ...result }),
      fail: (error = new Error('request:fail')) => reject(error),
      open: (status = 200, contentType = 'text/event-stream; charset=utf-8') =>
        callbacks.onHeaders(status, { 'content-type': contentType }),
      send: text => callbacks.onChunk(typeof text === 'string' ? encoder.encode(text) : text),
    };
    connections.push(connection);
    return {
      done,
      abort: () => {
        connection.aborted = true;
        reject(new Error('request:fail abort'));
      },
    };
  };
  async function connection(index: number): Promise<Connection> {
    await vi.waitFor(() => expect(connections[index]).toBeDefined());
    return connections[index];
  }
  return { transport, connections, connection };
}

function sse(event: string, data: unknown, id?: string): string {
  return `${id ? `id: ${id}\n` : ''}event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function snapshot(patch: Partial<AiMessageDto> = {}): AiMessageDto {
  return {
    id: 'm1',
    conversationId: 'c1',
    role: 'ASSISTANT',
    content: '',
    reasoning: null,
    suggestions: null,
    status: AiMessageStatus.STREAMING,
    feedback: null,
    lastEventId: null,
    createdAt: '2026-10-18T00:00:00.000Z',
    updatedAt: '2026-10-18T00:00:00.000Z',
    ...patch,
  };
}

function setup(options: UseChatStreamOptions = {}) {
  const fake = createTransport();
  const stream = useChatStream({
    transport: fake.transport,
    flushInterval: 0,
    idleTimeout: 0,
    reconnectDelay: () => 0,
    ...options,
  });
  return { ...fake, stream };
}

beforeEach(() => {
  Object.values(api).forEach(fn => fn.mockReset());
  api.resolveRequestHeaders.mockResolvedValue({ Authorization: 'Bearer t1', 'Accept-Language': 'zh' });
  api.recoverUnauthorized.mockResolvedValue(false);
});

describe('useChatStream 发送', () => {
  it('发送消息并按事件更新回答', async () => {
    const onStart = vi.fn();
    const { stream, connection } = setup({ onStart });
    const pending = stream.send('c1', { content: '为什么选 A？', sessionId: 's1' });
    const conn = await connection(0);

    expect(conn.request).toMatchObject({
      url: '/api/v1/ai/conversations/c1/messages',
      method: 'POST',
      body: { content: '为什么选 A？', sessionId: 's1' },
      headers: {
        Authorization: 'Bearer t1',
        'Accept-Language': 'zh',
        Accept: 'text/event-stream',
        'Content-Type': 'application/json',
      },
    });
    expect(stream.streaming.value).toBe(true);

    conn.open();
    conn.send(sse('message.start', { messageId: 'm1' }, '1-0'));
    expect(onStart).toHaveBeenCalledWith(
      expect.objectContaining({ messageId: 'm1', status: AiMessageStatus.STREAMING }),
    );
    conn.send(sse('reasoning.delta', { text: '先看题干' }, '2-0'));
    conn.send(sse('answer.delta', { text: '选 A。' }, '3-0'));
    conn.send(': ping\n\n');
    conn.send(sse('suggestions', { items: ['B 为什么错？', 1] }, '4-0'));
    conn.send(sse('message.done', { status: 'DONE', usage: null }, '5-0'));
    conn.finish();

    const outcome = await pending;
    expect(outcome.type).toBe('finished');
    expect(stream.draft.value).toEqual({
      messageId: 'm1',
      content: '选 A。',
      reasoning: '先看题干',
      suggestions: ['B 为什么错？'],
      status: AiMessageStatus.DONE,
      lastEventId: '5-0',
    });
    expect(stream.streaming.value).toBe(false);
    expect(conn.aborted).toBe(true);
  });

  it('事件与多字节字符跨数据块截断时完整拼接', async () => {
    const { stream, connection } = setup();
    const pending = stream.send('c1', { content: 'q' });
    const conn = await connection(0);
    const bytes = encoder.encode(
      sse('message.start', { messageId: 'm1' }, '1-0') +
        sse('answer.delta', { text: '函数 f(x)=x² 的导数' }, '2-0') +
        sse('message.done', { status: 'DONE' }, '3-0'),
    );
    conn.open();
    const cut = [7, 50, 61, 62, 63, 90];
    let start = 0;
    for (const position of [...cut, bytes.length]) {
      conn.send(bytes.slice(start, position));
      start = position;
    }
    conn.finish();

    await expect(pending).resolves.toMatchObject({ type: 'finished' });
    expect(stream.draft.value?.content).toBe('函数 f(x)=x² 的导数');
  });

  it('按间隔合并增量，结束时立即写入', async () => {
    const { stream, connection } = setup({ flushInterval: 30 });
    const pending = stream.send('c1', { content: 'q' });
    const conn = await connection(0);
    conn.open();
    conn.send(sse('message.start', { messageId: 'm1' }));
    conn.send(sse('answer.delta', { text: '一' }));
    conn.send(sse('answer.delta', { text: '二' }));

    expect(stream.draft.value?.content).toBe('');
    await vi.waitFor(() => expect(stream.draft.value?.content).toBe('一二'));

    conn.send(sse('answer.delta', { text: '三' }));
    conn.send(sse('message.done', { status: 'STOPPED' }));
    conn.finish();
    await pending;
    expect(stream.draft.value).toMatchObject({ content: '一二三', status: AiMessageStatus.STOPPED });
  });

  it('error 事件结束并带出错误码与提示', async () => {
    const { stream, connection } = setup();
    const pending = stream.send('c1', { content: 'q' });
    const conn = await connection(0);
    conn.open();
    conn.send(sse('message.start', { messageId: 'm1' }, '1-0'));
    conn.send(sse('answer.delta', { text: '部分' }, '2-0'));
    conn.send(sse('error', { code: 'aiGenerationFailed', message: 'AI 回答生成失败' }));
    conn.finish();

    const outcome = await pending;
    expect(outcome.type).toBe('failed');
    if (outcome.type !== 'failed') return;
    expect(outcome.error.code).toBe('aiGenerationFailed');
    expect(outcome.error.message).toBe('AI 回答生成失败');
    expect(stream.draft.value).toMatchObject({ content: '部分', status: AiMessageStatus.FAILED });
  });

  it('error 事件未带提示时使用本地文案', async () => {
    const { stream, connection } = setup();
    const pending = stream.send('c1', { content: 'q' });
    const conn = await connection(0);
    conn.open();
    conn.send(sse('message.start', { messageId: 'm1' }));
    conn.send(sse('error', { code: 'internalServerError' }));
    conn.finish();

    const outcome = await pending;
    expect(outcome.type === 'failed' && outcome.error.message).toBe('AI 服务异常，请稍后再试');
    expect(stream.draft.value?.status).toBe(AiMessageStatus.STREAMING);
  });

  it('请求被拒绝时抛出带错误键与详情的 ApiError', async () => {
    const { stream, connection } = setup();
    const pending = stream.send('c1', { content: 'q' });
    const conn = await connection(0);
    conn.open(429, 'application/json');
    conn.send(
      JSON.stringify({ code: 429, message: '请求过于频繁', data: { errorKey: 'aiRateLimited', retryAfter: 12 } }),
    );
    conn.finish({ status: 429 });

    const error = await pending.catch(err => err);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 429,
      errorKey: 'aiRateLimited',
      details: { retryAfter: 12, errorKey: 'aiRateLimited' },
    });
    expect(stream.streaming.value).toBe(false);
  });

  it('无错误键的拒绝使用服务端提示，响应体在结束时给出也可解析', async () => {
    const { stream, connection } = setup();
    const pending = stream.send('c1', { content: 'q' });
    const conn = await connection(0);
    conn.finish({ status: 409, data: JSON.stringify({ code: 409, message: '上一条回答仍在生成中', data: null }) });

    await expect(pending).rejects.toMatchObject({ status: 409, message: '上一条回答仍在生成中', errorKey: undefined });
  });

  it('401 时刷新登录态后重发一次', async () => {
    api.recoverUnauthorized.mockResolvedValue(true);
    const { stream, connection } = setup();
    const pending = stream.send('c1', { content: 'q' });
    const first = await connection(0);
    first.open(401, 'application/json');
    first.send('{"code":401,"message":"Unauthorized"}');
    first.finish({ status: 401 });
    const second = await connection(1);
    second.open();
    second.send(sse('message.start', { messageId: 'm1' }) + sse('message.done', { status: 'DONE' }));
    second.finish();

    await expect(pending).resolves.toMatchObject({ type: 'finished' });
    expect(api.recoverUnauthorized).toHaveBeenCalledWith('Bearer t1');
  });

  it('发出前网络失败时抛出 ApiError', async () => {
    const { stream, connection } = setup({ maxReconnects: 0 });
    const pending = stream.send('c1', { content: 'q' });
    (await connection(0)).fail();

    await expect(pending).rejects.toBeInstanceOf(ApiError);
  });
});

describe('useChatStream 中断与恢复', () => {
  it('abort 中断连接并保留已收到的内容', async () => {
    const { stream, connection } = setup();
    const pending = stream.send('c1', { content: 'q' });
    const conn = await connection(0);
    conn.open();
    conn.send(sse('message.start', { messageId: 'm1' }, '1-0') + sse('answer.delta', { text: '已收到' }, '2-0'));
    stream.abort();

    await expect(pending).resolves.toMatchObject({ type: 'aborted' });
    expect(conn.aborted).toBe(true);
    expect(stream.streaming.value).toBe(false);
    expect(stream.draft.value).toMatchObject({ content: '已收到', lastEventId: '2-0' });
  });

  it('按最后事件 id 续读并接着拼接', async () => {
    const { stream, connection } = setup();
    const sending = stream.send('c1', { content: 'q' });
    const first = await connection(0);
    first.open();
    first.send(sse('message.start', { messageId: 'm1' }, '1-0') + sse('answer.delta', { text: '前半' }, '2-0'));
    stream.abort();
    await sending;

    const resuming = stream.resume('m1', stream.draft.value!.lastEventId);
    const second = await connection(1);
    expect(second.request).toMatchObject({ url: '/api/v1/ai/messages/m1/events?after=2-0', method: 'GET' });
    expect(second.request.headers['Content-Type']).toBeUndefined();
    second.open();
    second.send(sse('answer.delta', { text: '后半' }, '3-0') + sse('message.done', { status: 'DONE' }, '4-0'));
    second.finish();

    await expect(resuming).resolves.toMatchObject({ type: 'finished' });
    expect(stream.draft.value).toMatchObject({ content: '前半后半', lastEventId: '4-0' });
  });

  it('未给出事件 id 时先取快照，再从快照位置续读', async () => {
    api.getAiMessage.mockResolvedValue(snapshot({ content: '快照内容', reasoning: '思考', lastEventId: '7-0' }));
    const { stream, connection } = setup();
    const resuming = stream.resume('m1');
    const conn = await connection(0);

    expect(api.getAiMessage).toHaveBeenCalledWith('m1', { showError: false });
    expect(conn.request.url).toBe('/api/v1/ai/messages/m1/events?after=7-0');
    conn.open();
    conn.send(sse('answer.delta', { text: '，继续' }, '8-0') + sse('message.done', { status: 'DONE' }, '9-0'));
    conn.finish();

    await expect(resuming).resolves.toMatchObject({ type: 'finished' });
    expect(stream.draft.value).toMatchObject({ content: '快照内容，继续', reasoning: '思考', status: 'DONE' });
  });

  it('快照尚无事件时从头读取并以 message.start 重置内容', async () => {
    api.getAiMessage.mockResolvedValue(snapshot({ content: '', lastEventId: null }));
    const { stream, connection } = setup();
    const resuming = stream.resume('m1');
    const conn = await connection(0);

    expect(conn.request.url).toBe('/api/v1/ai/messages/m1/events?after=0');
    conn.open();
    conn.send(
      sse('message.start', { messageId: 'm1' }, '1-0') +
        sse('answer.delta', { text: '完整' }, '2-0') +
        sse('message.done', { status: 'DONE' }, '3-0'),
    );
    conn.finish();

    await resuming;
    expect(stream.draft.value?.content).toBe('完整');
  });

  it('快照已结束时直接返回结果', async () => {
    const { stream, connections } = setup();
    api.getAiMessage.mockResolvedValueOnce(
      snapshot({ content: '答案', status: AiMessageStatus.STOPPED, suggestions: ['追问'] }),
    );

    await expect(stream.resume('m1')).resolves.toMatchObject({
      type: 'finished',
      draft: { content: '答案', status: 'STOPPED', suggestions: ['追问'] },
    });

    api.getAiMessage.mockResolvedValueOnce(snapshot({ status: AiMessageStatus.FAILED }));
    const failed = await stream.resume('m1');
    expect(failed.type === 'failed' && failed.error.code).toBe('aiGenerationFailed');
    expect(connections).toHaveLength(0);
  });

  it.each(['aiStreamExpired', 'aiGenerationInterrupted', 'aiStreamTimeout'])(
    '收到 %s 时改取快照，已结束则按快照返回',
    async code => {
      api.getAiMessage.mockResolvedValue(snapshot({ content: '最终回答', status: AiMessageStatus.DONE }));
      const { stream, connection } = setup();
      const pending = stream.send('c1', { content: 'q' });
      const conn = await connection(0);
      conn.open();
      conn.send(sse('message.start', { messageId: 'm1' }, '1-0') + sse('error', { code }));
      conn.finish();

      await expect(pending).resolves.toMatchObject({ type: 'finished', draft: { content: '最终回答' } });
      expect(api.getAiMessage).toHaveBeenCalledWith('m1', { showError: false });
    },
  );

  it('快照仍在生成时返回该错误并带出快照内容', async () => {
    api.getAiMessage.mockResolvedValue(snapshot({ content: '已生成部分', lastEventId: '9-0' }));
    const { stream, connection } = setup();
    const pending = stream.send('c1', { content: 'q' });
    const conn = await connection(0);
    conn.open();
    conn.send(sse('message.start', { messageId: 'm1' }, '1-0') + sse('error', { code: 'aiStreamTimeout' }));
    conn.finish();

    const outcome = await pending;
    expect(outcome.type === 'failed' && outcome.error.code).toBe('aiStreamTimeout');
    expect(stream.draft.value).toMatchObject({ content: '已生成部分', lastEventId: '9-0' });
  });

  it('续读时 draft 为空或不是该消息则先取快照', async () => {
    api.getAiMessage.mockResolvedValue(snapshot({ id: 'm2', content: '快照', lastEventId: '5-0' }));
    const { stream, connection } = setup();
    const resuming = stream.resume('m2', '1-0');
    const conn = await connection(0);

    expect(api.getAiMessage).toHaveBeenCalledWith('m2', { showError: false });
    expect(conn.request.url).toBe('/api/v1/ai/messages/m2/events?after=5-0');
    conn.open();
    conn.send(sse('message.done', { status: 'DONE' }, '6-0'));
    conn.finish();
    await expect(resuming).resolves.toMatchObject({ type: 'finished', draft: { messageId: 'm2', content: '快照' } });
  });

  it('开始新的接收前写入尚未合并的增量', async () => {
    const { stream, connection } = setup({ flushInterval: 10_000 });
    const sending = stream.send('c1', { content: 'q' });
    const first = await connection(0);
    first.open();
    first.send(sse('message.start', { messageId: 'm1' }, '1-0') + sse('answer.delta', { text: '未合并' }, '2-0'));
    expect(stream.draft.value?.content).toBe('');

    const resuming = stream.resume('m1', '2-0');
    expect(stream.draft.value?.content).toBe('未合并');
    await expect(sending).resolves.toMatchObject({ type: 'aborted' });
    const second = await connection(1);
    expect(second.request.url).toBe('/api/v1/ai/messages/m1/events?after=2-0');
    stream.reset();
    await resuming;
  });

  it('重连时请求被拒绝（非瞬时错误）直接抛出', async () => {
    const { stream, connection } = setup();
    const pending = stream.send('c1', { content: 'q' });
    const first = await connection(0);
    first.open();
    first.send(sse('message.start', { messageId: 'm1' }, '1-0'));
    first.fail();
    const second = await connection(1);
    second.open(403, 'application/json');
    second.send(JSON.stringify({ code: 403, message: '暂不能查看答案', data: { errorKey: 'answerHidden' } }));
    second.finish({ status: 403 });

    await expect(pending).rejects.toMatchObject({ status: 403, errorKey: 'answerHidden' });
  });

  it('重连遇到服务端 5xx 时继续重试', async () => {
    const { stream, connection } = setup();
    const pending = stream.send('c1', { content: 'q' });
    const first = await connection(0);
    first.open();
    first.send(sse('message.start', { messageId: 'm1' }, '1-0'));
    first.fail();
    const second = await connection(1);
    second.finish({ status: 502, data: '' });
    const third = await connection(2);
    third.open();
    third.send(sse('message.done', { status: 'DONE' }, '2-0'));
    third.finish();

    await expect(pending).resolves.toMatchObject({ type: 'finished' });
  });

  it('传输不支持分块时不启用无数据超时', async () => {
    const fake = createTransport();
    const transport: StreamTransport = (request, callbacks) => ({
      ...fake.transport(request, callbacks),
      chunked: false,
    });
    const stream = useChatStream({ transport, flushInterval: 0, idleTimeout: 20, reconnectDelay: () => 0 });
    const pending = stream.send('c1', { content: 'q' });
    const conn = await fake.connection(0);
    await new Promise(resolve => setTimeout(resolve, 60));

    expect(conn.aborted).toBe(false);
    conn.finish({
      data: sse('message.start', { messageId: 'm1' }, '1-0') + sse('message.done', { status: 'DONE' }, '2-0'),
    });
    await expect(pending).resolves.toMatchObject({ type: 'finished' });
  });

  it('连接意外结束时按最后事件 id 自动重连', async () => {
    const { stream, connection } = setup();
    const pending = stream.send('c1', { content: 'q' });
    const first = await connection(0);
    first.open();
    first.send(sse('message.start', { messageId: 'm1' }, '1-0') + sse('answer.delta', { text: 'A' }, '2-0'));
    first.fail();

    const second = await connection(1);
    expect(second.request.url).toBe('/api/v1/ai/messages/m1/events?after=2-0');
    second.open();
    second.send(sse('answer.delta', { text: 'B' }, '3-0') + sse('message.done', { status: 'DONE' }, '4-0'));
    second.finish();

    await expect(pending).resolves.toMatchObject({ type: 'finished', draft: { content: 'AB' } });
  });

  it('重连次数用尽后返回 disconnected', async () => {
    const { stream, connection } = setup({ maxReconnects: 1 });
    const pending = stream.send('c1', { content: 'q' });
    const first = await connection(0);
    first.open();
    first.send(sse('message.start', { messageId: 'm1' }, '1-0'));
    first.finish();
    (await connection(1)).fail();

    await expect(pending).resolves.toMatchObject({ type: 'disconnected', draft: { messageId: 'm1' } });
  });

  it('长时间未收到数据（含心跳）视为断线并重连', async () => {
    const { stream, connection } = setup({ idleTimeout: 300 });
    const pending = stream.send('c1', { content: 'q' });
    const first = await connection(0);
    first.open();
    first.send(sse('message.start', { messageId: 'm1' }, '1-0'));

    const second = await connection(1);
    expect(first.aborted).toBe(true);
    second.open();
    second.send(sse('message.done', { status: 'DONE' }, '2-0'));
    second.finish();

    await expect(pending).resolves.toMatchObject({ type: 'finished' });
  });

  it('新的接收开始时中断旧连接，reset 清空回答', async () => {
    api.getAiMessage.mockResolvedValue(snapshot({ lastEventId: '1-0' }));
    const { stream, connection } = setup();
    const first = stream.resume('m1', '1-0');
    const firstConn = await connection(0);
    const second = stream.resume('m1', '1-0');
    await connection(1);

    await expect(first).resolves.toMatchObject({ type: 'aborted' });
    expect(firstConn.aborted).toBe(true);

    stream.reset();
    await expect(second).resolves.toMatchObject({ type: 'aborted' });
    expect(stream.draft.value).toBeNull();
    await flushPromises();
  });
});

describe('useChatStream 平台传输', () => {
  it('H5 经 fetch 携带鉴权头与语言头并逐块更新回答', async () => {
    const encoderOf = new TextEncoder();
    let push!: (text: string) => void;
    let close!: () => void;
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        push = text => controller.enqueue(encoderOf.encode(text));
        close = () => controller.close();
      },
    });
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(body, { status: 200, headers: { 'Content-Type': 'text/event-stream' } }));
    const originalFetch = globalThis.fetch;
    globalThis.fetch = fetchMock;
    try {
      const stream = useChatStream({ transport: fetchStreamTransport, flushInterval: 0, idleTimeout: 0 });
      const pending = stream.send('c1', { content: 'q' });
      await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/v1/ai/conversations/c1/messages',
        expect.objectContaining({
          method: 'POST',
          body: '{"content":"q"}',
          headers: {
            Authorization: 'Bearer t1',
            'Accept-Language': 'zh',
            Accept: 'text/event-stream',
            'Content-Type': 'application/json',
          },
        }),
      );
      expect(stream.chunked.value).toBe(true);

      push(sse('message.start', { messageId: 'm1' }, '1-0'));
      push(sse('answer.delta', { text: '选 A' }, '2-0'));
      await vi.waitFor(() => expect(stream.draft.value?.content).toBe('选 A'));
      expect(stream.draft.value?.status).toBe(AiMessageStatus.STREAMING);

      push(sse('message.done', { status: 'DONE' }, '3-0'));
      close();
      await expect(pending).resolves.toMatchObject({
        type: 'finished',
        draft: { messageId: 'm1', content: '选 A', status: AiMessageStatus.DONE },
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  function wholeBodySetup() {
    const fake = createTransport();
    const transport: StreamTransport = (request, callbacks) => ({
      ...fake.transport(request, callbacks),
      chunked: false,
    });
    const stream = useChatStream({ transport, flushInterval: 80, idleTimeout: 20, reconnectDelay: () => 0 });
    return { ...fake, stream };
  }

  it('整段返回时一次解析出完整回答、思考、追问建议与结束状态', async () => {
    const { stream, connection } = wholeBodySetup();
    const pending = stream.send('c1', { content: 'q' });
    const conn = await connection(0);
    expect(stream.chunked.value).toBe(false);
    expect(stream.draft.value).toBeNull();

    conn.finish({
      data:
        sse('message.start', { messageId: 'm1' }, '1-0') +
        sse('reasoning.delta', { text: '先看' }, '2-0') +
        sse('reasoning.delta', { text: '题干' }, '3-0') +
        sse('answer.delta', { text: '选 A，' }, '4-0') +
        ': ping\n\n' +
        sse('answer.delta', { text: '因为……' }, '5-0') +
        sse('suggestions', { items: ['B 为什么错？'] }, '6-0') +
        sse('message.done', { status: 'DONE' }, '7-0'),
    });

    await expect(pending).resolves.toMatchObject({ type: 'finished' });
    expect(stream.draft.value).toEqual({
      messageId: 'm1',
      content: '选 A，因为……',
      reasoning: '先看题干',
      suggestions: ['B 为什么错？'],
      status: AiMessageStatus.DONE,
      lastEventId: '7-0',
    });
    expect(stream.streaming.value).toBe(false);
  });

  it('整段返回的 error 事件带出错误与已生成内容', async () => {
    const { stream, connection } = wholeBodySetup();
    const pending = stream.send('c1', { content: 'q' });
    const conn = await connection(0);
    conn.finish({
      data:
        sse('message.start', { messageId: 'm1' }, '1-0') +
        sse('answer.delta', { text: '部分' }, '2-0') +
        sse('error', { code: 'aiGenerationFailed' }, '3-0'),
    });

    const outcome = await pending;
    expect(outcome).toMatchObject({ type: 'failed', draft: { content: '部分', status: AiMessageStatus.FAILED } });
    expect(outcome.type === 'failed' && outcome.error.code).toBe('aiGenerationFailed');
  });

  it('整段返回的拒绝响应抛出 phoneBindingRequired', async () => {
    const { stream, connection } = wholeBodySetup();
    const pending = stream.send('c1', { content: 'q' });
    const conn = await connection(0);
    conn.finish({
      status: 403,
      data: JSON.stringify({ code: 403, message: 'forbidden', data: { errorKey: 'phoneBindingRequired' } }),
    });

    await expect(pending).rejects.toMatchObject({
      status: 403,
      errorKey: 'phoneBindingRequired',
      message: '请使用手机号登录后使用 AI 助教',
    });
  });
});
