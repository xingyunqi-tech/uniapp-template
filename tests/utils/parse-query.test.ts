import { describe, expect, it } from 'vitest';
import { parseQuery } from '@/utils/router';

describe('parseQuery', () => {
  it('解析并解码查询参数', () => {
    expect(parseQuery('/pages/a?id=1&name=%E6%94%AF%E4%BB%98')).toEqual({ id: '1', name: '支付' });
  });

  it('没有查询参数时返回空对象', () => {
    expect(parseQuery('/pages/a')).toEqual({});
    expect(parseQuery('/pages/a?')).toEqual({});
  });

  it('值中的 = 保留在值内', () => {
    expect(parseQuery('https://x.com/p?token=YWJj==&id=2')).toEqual({ token: 'YWJj==', id: '2' });
  });

  it('忽略 # 之后的片段', () => {
    expect(parseQuery('https://x.com/p?id=1#section')).toEqual({ id: '1' });
  });

  it('编码格式错误时保留原值', () => {
    expect(parseQuery('https://x.com/p?discount=100%&id=3')).toEqual({ discount: '100%', id: '3' });
  });

  it('没有值的参数解析为空字符串', () => {
    expect(parseQuery('/pages/a?flag&id=1')).toEqual({ flag: '', id: '1' });
  });
});
