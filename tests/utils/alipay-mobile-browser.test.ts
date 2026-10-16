import { afterEach, describe, expect, it, vi } from 'vitest';
import { isMobileBrowser } from '@/utils/alipay-pay';

function mockNavigator(userAgent: string, maxTouchPoints: number) {
  vi.stubGlobal('navigator', { userAgent, maxTouchPoints });
}

const MAC_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';

const originalNavigator = globalThis.navigator;

afterEach(() => {
  vi.stubGlobal('navigator', originalNavigator);
});

describe('isMobileBrowser', () => {
  it('iPhone 与 Android 识别为移动端', () => {
    mockNavigator('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', 5);
    expect(isMobileBrowser()).toBe(true);
    mockNavigator('Mozilla/5.0 (Linux; Android 14; Pixel 8)', 5);
    expect(isMobileBrowser()).toBe(true);
  });

  it('iPadOS 桌面版 UA 带触摸点时识别为移动端', () => {
    mockNavigator(MAC_UA, 5);
    expect(isMobileBrowser()).toBe(true);
  });

  it('Mac 桌面浏览器识别为电脑端', () => {
    mockNavigator(MAC_UA, 0);
    expect(isMobileBrowser()).toBe(false);
  });
});
