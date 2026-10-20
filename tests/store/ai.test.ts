import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { ApiError } from '@/api';
import { AI_SESSION_MEMORY_LIMIT } from '@/constants/ai';
import { useAiStore } from '@/store/modules/ai';

const api = vi.hoisted(() => ({ getAiQuota: vi.fn(), getConfig: vi.fn() }));

vi.mock('@/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@/api')>()),
  ...api,
}));

const QUOTA = { date: '2026-10-18', chat: { limit: 20, used: 3, remaining: 17 } };

beforeEach(() => {
  setActivePinia(createPinia());
  Object.values(api).forEach(fn => fn.mockReset());
});

describe('AI Store', () => {
  it('总开关未取得时视为开启，按远程配置更新', async () => {
    const store = useAiStore();
    expect(store.enabled).toBe(true);

    api.getConfig.mockResolvedValue({ key: 'ai.enabled', value: { value: false } });
    await expect(store.loadEnabled()).resolves.toBe(false);
    expect(api.getConfig).toHaveBeenCalledWith('ai.enabled', expect.anything());
    expect(store.enabled).toBe(false);
  });

  it('拉取今日额度，失败时保留上次结果', async () => {
    const store = useAiStore();
    api.getAiQuota.mockResolvedValueOnce(QUOTA);
    await store.fetchQuota();
    expect(store.quota).toEqual(QUOTA);

    api.getAiQuota.mockRejectedValueOnce(new ApiError('失败', 500));
    await expect(store.fetchQuota()).resolves.toEqual(QUOTA);
    expect(api.getAiQuota).toHaveBeenCalledWith({ showError: false });
  });

  it('记住讲题会话对应的练习会话，只保留最近的若干条', () => {
    const store = useAiStore();
    store.rememberSession('c1', 's1');
    store.rememberSession('c2', null);
    expect(store.sessionOf('c1')).toBe('s1');
    expect(store.sessionOf('c2')).toBeUndefined();

    for (let index = 0; index < AI_SESSION_MEMORY_LIMIT; index += 1) store.rememberSession(`x${index}`, 's');
    expect(store.sessionOf('c1')).toBeUndefined();
    expect(Object.keys(store.conversationSessions)).toHaveLength(AI_SESSION_MEMORY_LIMIT);

    store.forgetSession('x1');
    expect(store.sessionOf('x1')).toBeUndefined();
  });

  it('clear 清空额度与会话记录', async () => {
    const store = useAiStore();
    api.getAiQuota.mockResolvedValue(QUOTA);
    await store.fetchQuota();
    store.rememberSession('c1', 's1');

    store.clear();
    expect(store.quota).toBeNull();
    expect(store.conversationSessions).toEqual({});
  });
});
