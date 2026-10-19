import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  STREAM_TIMEOUT,
  defaultStreamTransport,
  fetchStreamTransport,
  uniStreamTransport,
  type StreamCallbacks,
} from '@/utils/chat-transport';

const platform = vi.hoisted(() => ({ h5: true, weixin: true, alipay: false }));

vi.mock('@/utils/platform', async importOriginal => ({
  ...(await importOriginal<typeof import('@/utils/platform')>()),
  isH5: () => platform.h5,
  isWeixin: () => platform.weixin,
  isAlipay: () => platform.alipay,
}));

function callbacks(): StreamCallbacks & { chunks: unknown[]; headers: unknown[] } {
  const chunks: unknown[] = [];
  const headers: unknown[] = [];
  return {
    chunks,
    headers,
    onHeaders: (status, value) => headers.push([status, value]),
    onChunk: chunk => chunks.push(chunk),
  };
}

interface FakeTask {
  abort: ReturnType<typeof vi.fn>;
  onHeadersReceived: (callback: (result: unknown) => void) => void;
  onChunkReceived: (callback: (result: { data: ArrayBuffer }) => void) => void;
  emitHeaders?: (result: unknown) => void;
  emitChunk?: (result: { data: ArrayBuffer }) => void;
}

function mockUniRequest() {
  const task: FakeTask = {
    abort: vi.fn(),
    onHeadersReceived(callback) {
      task.emitHeaders = callback;
    },
    onChunkReceived(callback) {
      task.emitChunk = callback;
    },
  };
  let options: UniApp.RequestOptions | null = null;
  vi.mocked(uni.request).mockImplementation(((value: UniApp.RequestOptions) => {
    options = value;
    return task;
  }) as unknown as typeof uni.request);
  return { task, options: () => options! };
}

const originalFetch = globalThis.fetch;

afterEach(() => {
  platform.h5 = true;
  platform.weixin = true;
  platform.alipay = false;
  vi.mocked(uni.request).mockReset();
  globalThis.fetch = originalFetch;
});

describe('uniStreamTransport', () => {
  it('开启分块接收并转发响应头与数据块', async () => {
    const { task, options } = mockUniRequest();
    const cb = callbacks();
    const handle = uniStreamTransport(
      { url: '/stream', method: 'POST', headers: { Authorization: 'Bearer t' }, body: { content: 'q' } },
      cb,
    );

    expect(options()).toMatchObject({
      url: '/stream',
      method: 'POST',
      header: { Authorization: 'Bearer t' },
      data: { content: 'q' },
      enableChunked: true,
      responseType: 'arraybuffer',
      dataType: 'text',
      timeout: STREAM_TIMEOUT,
    });
    const chunk = new ArrayBuffer(2);
    task.emitHeaders!({ statusCode: 200, header: { 'Content-Type': 'text/event-stream' } });
    task.emitChunk!({ data: chunk });
    options().success!({ statusCode: 200, data: new ArrayBuffer(0), header: {}, cookies: [] });

    await expect(handle.done).resolves.toEqual({ status: 200, data: undefined });
    expect(handle.chunked).toBe(true);
    expect(cb.headers).toEqual([[200, { 'content-type': 'text/event-stream' }]]);
    expect(cb.chunks).toEqual([chunk]);
  });

  it('支付宝端不传 responseType，按文本接收', () => {
    platform.alipay = true;
    platform.weixin = false;
    const { options } = mockUniRequest();
    uniStreamTransport({ url: '/stream', method: 'POST', headers: {} }, callbacks());

    expect(options()).not.toHaveProperty('responseType');
    expect(options()).toMatchObject({ dataType: 'text' });
  });

  it('没有分块回调时在结束时返回完整响应体', async () => {
    const { options } = mockUniRequest();
    const handle = uniStreamTransport({ url: '/x', method: 'GET', headers: {} }, callbacks());
    options().success!({ statusCode: 429, data: '{"code":429}', header: {}, cookies: [] });

    await expect(handle.done).resolves.toEqual({ status: 429, data: '{"code":429}' });
  });

  it('非微信平台不分块，结束时以文本给出完整事件流', async () => {
    platform.weixin = false;
    const { options } = mockUniRequest();
    const cb = callbacks();
    const handle = uniStreamTransport({ url: '/stream', method: 'POST', headers: {}, body: { content: 'q' } }, cb);
    const body = 'event: message.start\ndata: {"messageId":"m1"}\n\n';
    options().success!({ statusCode: 200, data: body, header: {}, cookies: [] });

    expect(handle.chunked).toBe(false);
    await expect(handle.done).resolves.toEqual({ status: 200, data: body });
    expect(cb.chunks).toEqual([]);
  });

  it('支付宝 HTTP 错误走 fail 且带状态码时按响应返回', async () => {
    platform.weixin = false;
    platform.alipay = true;
    const { options } = mockUniRequest();
    const handle = uniStreamTransport({ url: '/x', method: 'POST', headers: {} }, callbacks());
    const body = '{"code":403,"data":{"errorKey":"phoneBindingRequired"}}';
    options().fail!({ errMsg: 'request:fail 19', statusCode: 403, data: body } as UniApp.GeneralCallbackResult);

    await expect(handle.done).resolves.toEqual({ status: 403, data: body });
  });

  it('支付宝 fail 带非错误状态码时按请求失败处理', async () => {
    platform.weixin = false;
    platform.alipay = true;
    const { options } = mockUniRequest();
    const handle = uniStreamTransport({ url: '/x', method: 'POST', headers: {} }, callbacks());
    options().fail!({ errMsg: 'request:fail', statusCode: 302, data: '' } as UniApp.GeneralCallbackResult);

    await expect(handle.done).rejects.toThrow('request:fail');
  });

  it('非支付宝平台 fail 带状态码时仍按请求失败处理', async () => {
    const { options } = mockUniRequest();
    const handle = uniStreamTransport({ url: '/x', method: 'POST', headers: {} }, callbacks());
    options().fail!({ errMsg: 'request:fail 19', statusCode: 403, data: '{}' } as UniApp.GeneralCallbackResult);

    await expect(handle.done).rejects.toThrow('request:fail 19');
  });

  it('请求失败时 reject，abort 中断请求任务', async () => {
    const { task, options } = mockUniRequest();
    const handle = uniStreamTransport({ url: '/x', method: 'GET', headers: {} }, callbacks());
    handle.abort();
    options().fail!({ errMsg: 'request:fail abort' });

    expect(task.abort).toHaveBeenCalled();
    await expect(handle.done).rejects.toThrow('request:fail abort');
  });
});

function streamOf(parts: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      parts.forEach(part => controller.enqueue(encoder.encode(part)));
      controller.close();
    },
  });
}

describe('fetchStreamTransport', () => {
  it('逐块读取响应体', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(streamOf(['event: a\n', 'data: {}\n\n']), {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      }),
    );
    globalThis.fetch = fetchMock;
    const cb = callbacks();

    const result = await fetchStreamTransport(
      { url: '/stream', method: 'POST', headers: { A: '1' }, body: { content: 'q' } },
      cb,
    ).done;

    expect(fetchMock).toHaveBeenCalledWith(
      '/stream',
      expect.objectContaining({ method: 'POST', headers: { A: '1' }, body: '{"content":"q"}' }),
    );
    expect(result).toEqual({ status: 200 });
    expect(cb.headers).toEqual([[200, { 'content-type': 'text/event-stream' }]]);
    expect(cb.chunks.map(chunk => new TextDecoder().decode(chunk as Uint8Array))).toEqual([
      'event: a\n',
      'data: {}\n\n',
    ]);
  });

  it('响应没有可读流时返回文本', async () => {
    const response = { status: 403, headers: new Headers(), body: null, text: () => Promise.resolve('{}') };
    globalThis.fetch = vi.fn().mockResolvedValue(response);

    await expect(fetchStreamTransport({ url: '/x', method: 'GET', headers: {} }, callbacks()).done).resolves.toEqual({
      status: 403,
      data: '{}',
    });
  });

  it('abort 取消请求', async () => {
    globalThis.fetch = vi.fn((_url: string | URL | Request, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        init!.signal!.addEventListener('abort', () => reject(new Error('aborted')));
      });
    });
    const handle = fetchStreamTransport({ url: '/x', method: 'GET', headers: {} }, callbacks());
    handle.abort();

    await expect(handle.done).rejects.toThrow('aborted');
  });
});

describe('defaultStreamTransport', () => {
  it('H5 使用 fetch 流式读取', () => {
    expect(defaultStreamTransport()).toBe(fetchStreamTransport);
  });

  it('小程序使用 uni.request', () => {
    platform.h5 = false;
    expect(defaultStreamTransport()).toBe(uniStreamTransport);
  });
});
