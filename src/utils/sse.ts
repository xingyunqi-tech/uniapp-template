/**
 * SSE 流式解析：UTF-8 增量解码与按空行分帧
 */

/** 流式数据块：小程序为 ArrayBuffer，fetch 为 Uint8Array，部分平台直接给出字符串 */
export type StreamChunk = ArrayBuffer | Uint8Array | string;

/** UTF-8 增量解码器：跨数据块截断的多字节字符留到下一块拼接 */
export interface Utf8StreamDecoder {
  decode(chunk: StreamChunk): string;
  /** 输出剩余字节，不完整的字符输出为 U+FFFD */
  flush(): string;
}

const REPLACEMENT = 0xfffd;

function toBytes(chunk: ArrayBuffer | Uint8Array): Uint8Array {
  return chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk);
}

function sequenceLength(lead: number): number {
  if (lead >= 0xf0) return 4;
  if (lead >= 0xe0) return 3;
  if (lead >= 0xc0) return 2;
  return 1;
}

/** 末尾不完整字符之前的字节数 */
function completeLength(bytes: Uint8Array): number {
  const length = bytes.length;
  for (let back = 1; back <= Math.min(3, length); back += 1) {
    const byte = bytes[length - back];
    if ((byte & 0xc0) === 0x80) continue;
    return sequenceLength(byte) > back ? length - back : length;
  }
  return length;
}

function pushCodePoint(units: number[], codePoint: number): void {
  if (codePoint < 0x10000) {
    units.push(codePoint);
    return;
  }
  const offset = codePoint - 0x10000;
  units.push(0xd800 + (offset >> 10), 0xdc00 + (offset & 0x3ff));
}

function readCodePoint(bytes: Uint8Array, index: number, end: number): { codePoint: number; size: number } {
  const lead = bytes[index];
  if (lead < 0x80) return { codePoint: lead, size: 1 };
  const size = lead >= 0xc2 && lead <= 0xf4 ? sequenceLength(lead) : 0;
  if (size === 0 || index + size > end) return { codePoint: REPLACEMENT, size: 1 };
  let codePoint = lead & (0xff >> (size + 1));
  for (let offset = 1; offset < size; offset += 1) {
    const byte = bytes[index + offset];
    if ((byte & 0xc0) !== 0x80) return { codePoint: REPLACEMENT, size: 1 };
    codePoint = (codePoint << 6) | (byte & 0x3f);
  }
  const overlong = (size === 3 && codePoint < 0x800) || (size === 4 && codePoint < 0x10000);
  const invalid = codePoint > 0x10ffff || (codePoint >= 0xd800 && codePoint <= 0xdfff);
  return overlong || invalid ? { codePoint: REPLACEMENT, size: 1 } : { codePoint, size };
}

function decodeBytes(bytes: Uint8Array, end: number): string {
  let text = '';
  let units: number[] = [];
  let index = 0;
  while (index < end) {
    const { codePoint, size } = readCodePoint(bytes, index, end);
    pushCodePoint(units, codePoint);
    index += size;
    if (units.length >= 4096) {
      text += String.fromCharCode(...units);
      units = [];
    }
  }
  return text + String.fromCharCode(...units);
}

/** 不依赖 TextDecoder 的 UTF-8 增量解码器 */
export function createFallbackUtf8Decoder(): Utf8StreamDecoder {
  let pending = new Uint8Array(0);
  return {
    decode(chunk) {
      if (typeof chunk === 'string') return chunk;
      const incoming = toBytes(chunk);
      const bytes = new Uint8Array(pending.length + incoming.length);
      bytes.set(pending);
      bytes.set(incoming, pending.length);
      const end = completeLength(bytes);
      pending = bytes.slice(end);
      return decodeBytes(bytes, end);
    },
    flush() {
      const incomplete = pending.length > 0;
      pending = new Uint8Array(0);
      return incomplete ? String.fromCharCode(REPLACEMENT) : '';
    },
  };
}

/** UTF-8 增量解码器：有 TextDecoder 时使用其流式模式，否则使用内置实现 */
export function createUtf8Decoder(): Utf8StreamDecoder {
  if (typeof TextDecoder !== 'function') return createFallbackUtf8Decoder();
  const decoder = new TextDecoder('utf-8');
  return {
    decode(chunk) {
      return typeof chunk === 'string' ? chunk : decoder.decode(toBytes(chunk), { stream: true });
    },
    flush() {
      return decoder.decode();
    },
  };
}

/** 一条 SSE 事件 */
export interface SseEvent {
  /** id 字段，未携带时为 null */
  id: string | null;
  /** event 字段，未携带时为 message */
  event: string;
  /** 多行 data 以换行连接 */
  data: string;
}

export interface SseParser {
  push(text: string): void;
  /** 流结束：丢弃未以空行结束的残余数据 */
  end(): void;
}

function parseBlock(block: string): SseEvent | null {
  let id: string | null = null;
  let event = 'message';
  const data: string[] = [];
  for (const line of block.split('\n')) {
    if (!line || line.startsWith(':')) continue;
    const colon = line.indexOf(':');
    const field = colon < 0 ? line : line.slice(0, colon);
    const raw = colon < 0 ? '' : line.slice(colon + 1);
    const value = raw.startsWith(' ') ? raw.slice(1) : raw;
    if (field === 'data') data.push(value);
    else if (field === 'event') event = value;
    else if (field === 'id') id = value;
  }
  return data.length > 0 ? { id, event, data: data.join('\n') } : null;
}

/** SSE 分帧解析：按空行切分事件，忽略注释行（如心跳 `: ping`），兼容 CRLF 与跨数据块的 CR */
export function createSseParser(onEvent: (event: SseEvent) => void): SseParser {
  let buffer = '';
  let trailingCR = false;
  return {
    push(text) {
      let chunk = trailingCR ? `\r${text}` : text;
      trailingCR = chunk.endsWith('\r');
      if (trailingCR) chunk = chunk.slice(0, -1);
      buffer += chunk.replace(/\r\n?/g, '\n');
      let boundary = buffer.indexOf('\n\n');
      while (boundary >= 0) {
        const event = parseBlock(buffer.slice(0, boundary));
        buffer = buffer.slice(boundary + 2);
        if (event) onEvent(event);
        boundary = buffer.indexOf('\n\n');
      }
    },
    end() {
      buffer = '';
      trailingCR = false;
    },
  };
}
