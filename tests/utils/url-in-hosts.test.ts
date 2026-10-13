import { describe, expect, it } from 'vitest';
import { isUrlInHosts } from '@/utils/validator';

const hosts = ['example.com'];

describe('isUrlInHosts', () => {
  it('匹配域名本身及其子域名', () => {
    expect(isUrlInHosts('https://example.com', hosts)).toBe(true);
    expect(isUrlInHosts('https://m.example.com/a?b=1', hosts)).toBe(true);
    expect(isUrlInHosts('http://EXAMPLE.com:8080/#/x', hosts)).toBe(true);
  });

  it('拒绝其他域名', () => {
    expect(isUrlInHosts('https://example.com.evil.com', hosts)).toBe(false);
    expect(isUrlInHosts('https://badexample.com', hosts)).toBe(false);
    expect(isUrlInHosts('https://evil.com/?r=example.com', hosts)).toBe(false);
  });

  it('按 userinfo 之后的真实域名判断', () => {
    expect(isUrlInHosts('https://example.com@evil.com', hosts)).toBe(false);
    expect(isUrlInHosts('https://evil.com\\@example.com', hosts)).toBe(false);
  });

  it('拒绝非 http/https 地址', () => {
    expect(isUrlInHosts('javascript://example.com', hosts)).toBe(false);
    expect(isUrlInHosts('//example.com', hosts)).toBe(false);
  });
});
