import { describe, expect, it } from 'vitest';
import { shouldReloadOnShow } from '@/utils/ai-chat';

describe('shouldReloadOnShow', () => {
  it('发送中被切到后台时需要重新拉取', () => {
    expect(shouldReloadOnShow([{}], true)).toBe(true);
  });

  it('最后一条仍是本地发送的消息时需要重新拉取', () => {
    expect(shouldReloadOnShow([{}, { local: true }], false)).toBe(true);
  });

  it('其余情况不需要重新拉取', () => {
    expect(shouldReloadOnShow([{ local: true }, {}], false)).toBe(false);
    expect(shouldReloadOnShow([], false)).toBe(false);
  });
});
