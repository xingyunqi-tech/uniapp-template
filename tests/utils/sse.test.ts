import { afterEach, describe, expect, it } from 'vitest';
import { createFallbackUtf8Decoder, createSseParser, createUtf8Decoder, type SseEvent } from '@/utils/sse';

const encoder = new TextEncoder();

function splitAt(bytes: Uint8Array, ...positions: number[]): Uint8Array[] {
  const parts: Uint8Array[] = [];
  let start = 0;
  for (const position of [...positions, bytes.length]) {
    parts.push(bytes.slice(start, position));
    start = position;
  }
  return parts;
}

function collect(): { events: SseEvent[]; parser: ReturnType<typeof createSseParser> } {
  const events: SseEvent[] = [];
  return { events, parser: createSseParser(event => events.push(event)) };
}

const originalTextDecoder = globalThis.TextDecoder;

afterEach(() => {
  globalThis.TextDecoder = originalTextDecoder;
});

describe.each([
  ['TextDecoder', createUtf8Decoder],
  ['内置实现', createFallbackUtf8Decoder],
])('UTF-8 增量解码（%s）', (_name, create) => {
  it('多字节字符被拆到两个数据块时拼接后输出', () => {
    const bytes = encoder.encode('讲题：x²');
    const decoder = create();
    const text = splitAt(bytes, 1, 4, 8)
      .map(part => decoder.decode(part))
      .join('');

    expect(text + decoder.flush()).toBe('讲题：x²');
  });

  it('四字节字符逐字节送入时完整输出', () => {
    const bytes = encoder.encode('a😀b');
    const decoder = create();
    const outputs = Array.from(bytes).map(byte => decoder.decode(new Uint8Array([byte])));

    expect(outputs.join('')).toBe('a😀b');
    expect(outputs[1]).toBe('');
  });

  it('接受 ArrayBuffer 与字符串数据块', () => {
    const decoder = create();

    expect(decoder.decode(encoder.encode('你好').buffer as ArrayBuffer)).toBe('你好');
    expect(decoder.decode('ping')).toBe('ping');
  });

  it('流结束时不完整的字符输出为替换字符', () => {
    const decoder = create();
    decoder.decode(encoder.encode('好').slice(0, 2));

    expect(decoder.flush()).toBe('�');
  });
});

describe('UTF-8 内置解码的非法字节', () => {
  it('非法字节与过长编码输出替换字符', () => {
    const decoder = createFallbackUtf8Decoder();

    expect(decoder.decode(new Uint8Array([0x61, 0xff, 0x62]))).toBe('a�b');
    expect(decoder.decode(new Uint8Array([0xe0, 0x80, 0x80]))).toBe('���');
    expect(decoder.decode(new Uint8Array([0xc3, 0x41]))).toBe('�A');
    expect(decoder.decode(new Uint8Array([0xed, 0xa0, 0x80]))).toBe('���');
  });

  it('长文本分批转换为字符串', () => {
    const text = '公式'.repeat(5000);

    expect(createFallbackUtf8Decoder().decode(encoder.encode(text))).toBe(text);
  });

  it('没有 TextDecoder 时使用内置实现', () => {
    (globalThis as { TextDecoder?: unknown }).TextDecoder = undefined;
    const decoder = createUtf8Decoder();
    const [head, tail] = splitAt(encoder.encode('题'), 1);

    expect(decoder.decode(head) + decoder.decode(tail)).toBe('题');
  });
});

describe('SSE 分帧', () => {
  it('解析 id、event 与 data', () => {
    const { events, parser } = collect();
    parser.push('id: 1-0\nevent: answer.delta\ndata: {"text":"你好"}\n\n');

    expect(events).toEqual([{ id: '1-0', event: 'answer.delta', data: '{"text":"你好"}' }]);
  });

  it('事件跨数据块时等到空行再输出', () => {
    const { events, parser } = collect();
    parser.push('event: answer.del');
    parser.push('ta\ndata: {"te');
    expect(events).toHaveLength(0);
    parser.push('xt":"a"}\n');
    expect(events).toHaveLength(0);
    parser.push('\nevent: suggestions\ndata: {"items":[]}\n\n');

    expect(events.map(event => event.event)).toEqual(['answer.delta', 'suggestions']);
  });

  it('忽略心跳注释，不产生事件', () => {
    const { events, parser } = collect();
    parser.push(': ping\n\n: ping\n\nevent: message.done\ndata: {}\n\n');

    expect(events).toEqual([{ id: null, event: 'message.done', data: '{}' }]);
  });

  it('兼容 CRLF，包括跨数据块的 CR', () => {
    const { events, parser } = collect();
    parser.push('event: error\r');
    parser.push('\ndata: {"code":"x"}\r\n\r');
    parser.push('\n');

    expect(events).toEqual([{ id: null, event: 'error', data: '{"code":"x"}' }]);
  });

  it('多行 data 以换行连接，缺省 event 为 message', () => {
    const { events, parser } = collect();
    parser.push('data:第一行\ndata: 第二行\nretry: 10\n\n');

    expect(events).toEqual([{ id: null, event: 'message', data: '第一行\n第二行' }]);
  });

  it('流结束时丢弃未完成的事件', () => {
    const { events, parser } = collect();
    parser.push('event: answer.delta\ndata: {}');
    parser.end();
    parser.push('\n\n');

    expect(events).toHaveLength(0);
  });
});
