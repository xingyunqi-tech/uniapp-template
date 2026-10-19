/**
 * 流式请求传输层：微信小程序使用 uni.request 分块接收，H5 使用 fetch + ReadableStream，
 * 其他平台（如支付宝小程序）在请求结束时一次给出响应体
 */
import { toHttpFailResponse } from './http-fail-response';
import { isAlipay, isH5, isWeixin } from './platform';
import type { StreamChunk } from './sse';

export interface StreamRequest {
  url: string;
  method: 'GET' | 'POST';
  headers: Record<string, string>;
  body?: unknown;
  /** 整个请求的超时时间（毫秒） */
  timeout?: number;
}

export interface StreamCallbacks {
  /** 收到响应头；部分平台不提供状态码 */
  onHeaders(status: number | undefined, headers: Record<string, string>): void;
  onChunk(chunk: StreamChunk): void;
}

export interface StreamResult {
  status: number;
  /** 未通过分块回调送达的响应体 */
  data?: StreamChunk;
}

export interface StreamHandle {
  /** 响应结束时 resolve，网络失败时 reject；中断后的结果由调用方忽略 */
  done: Promise<StreamResult>;
  abort(): void;
  /** 为 false 时响应体只在结束时一次给出 */
  chunked?: boolean;
}

export type StreamTransport = (request: StreamRequest, callbacks: StreamCallbacks) => StreamHandle;

/** 默认超时：长于服务端单次跟读上限（10 分钟） */
export const STREAM_TIMEOUT = 11 * 60_000;

interface ChunkedRequestTask extends UniApp.RequestTask {
  onChunkReceived?: (callback: (result: { data: ArrayBuffer }) => void) => void;
}

function normalizeHeaders(headers: unknown): Record<string, string> {
  if (!headers || typeof headers !== 'object') return {};
  return Object.fromEntries(
    Object.entries(headers as Record<string, unknown>).map(([key, value]) => [key.toLowerCase(), String(value)]),
  );
}

function isStreamChunk(data: unknown): data is StreamChunk {
  return typeof data === 'string' || data instanceof ArrayBuffer || data instanceof Uint8Array;
}

/** uni.request + enableChunked；不支持分块回调的平台在结束时返回完整响应体 */
export const uniStreamTransport: StreamTransport = (request, callbacks) => {
  let task: ChunkedRequestTask | null = null;
  let chunked = false;
  const done = new Promise<StreamResult>((resolve, reject) => {
    task = uni.request({
      url: request.url,
      method: request.method,
      header: request.headers,
      data: request.body as UniApp.RequestOptions['data'],
      timeout: request.timeout ?? STREAM_TIMEOUT,
      enableChunked: true,
      ...(isAlipay() ? {} : { responseType: 'arraybuffer' as const }),
      dataType: 'text',
      success: result => {
        const data = !chunked && isStreamChunk(result.data) ? result.data : undefined;
        resolve({ status: result.statusCode, data });
      },
      fail: error => {
        const failed = isAlipay() ? toHttpFailResponse(error) : null;
        if (failed) resolve({ status: failed.statusCode, data: isStreamChunk(failed.data) ? failed.data : undefined });
        else reject(new Error(error.errMsg || 'request:fail'));
      },
    }) as ChunkedRequestTask;
    task.onHeadersReceived?.((result: { statusCode?: number; header?: unknown }) => {
      callbacks.onHeaders(result.statusCode, normalizeHeaders(result.header));
    });
    task.onChunkReceived?.(result => {
      chunked = true;
      callbacks.onChunk(result.data);
    });
  });
  return {
    done,
    abort: () => task?.abort(),
    chunked: isWeixin() && typeof (task as ChunkedRequestTask | null)?.onChunkReceived === 'function',
  };
};

export const fetchStreamTransport: StreamTransport = (request, callbacks) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), request.timeout ?? STREAM_TIMEOUT);
  const run = async (): Promise<StreamResult> => {
    const response = await fetch(request.url, {
      method: request.method,
      headers: request.headers,
      body: request.body === undefined ? undefined : JSON.stringify(request.body),
      signal: controller.signal,
    });
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });
    callbacks.onHeaders(response.status, headers);
    const reader = response.body?.getReader();
    if (!reader) return { status: response.status, data: await response.text() };
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) callbacks.onChunk(value);
    }
    return { status: response.status };
  };
  return {
    done: run().finally(() => clearTimeout(timer)),
    abort: () => controller.abort(),
  };
};

/** 当前平台的流式传输实现 */
export function defaultStreamTransport(): StreamTransport {
  return isH5() ? fetchStreamTransport : uniStreamTransport;
}
