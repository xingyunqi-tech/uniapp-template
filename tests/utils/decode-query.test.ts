import { describe, expect, it } from 'vitest';
import { decodeQueryValue } from '@/utils/router';

describe('decodeQueryValue', () => {
  it('解码小程序原始参数', () => {
    expect(decodeQueryValue('%E6%94%AF%E4%BB%98')).toBe('支付');
  });

  it('编码格式错误时返回原值', () => {
    expect(decodeQueryValue('100%off')).toBe('100%off');
  });
});
