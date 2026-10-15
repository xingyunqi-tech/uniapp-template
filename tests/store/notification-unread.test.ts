import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import type { Notification } from '@/api';

const api = vi.hoisted(() => ({
  getUnreadCount: vi.fn(),
  markNotificationAsRead: vi.fn(),
}));

vi.mock('@/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@/api')>()),
  getUnreadCount: api.getUnreadCount,
  markNotificationAsRead: api.markNotificationAsRead,
}));

const { useNotificationStore } = await import('@/store/modules/notification');

function deferred<T>() {
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>(res => {
    resolve = res;
  });
  return { promise, resolve };
}

beforeEach(() => {
  setActivePinia(createPinia());
  api.getUnreadCount.mockReset();
  api.markNotificationAsRead.mockReset().mockResolvedValue({ readAt: '2026-01-01T00:00:00Z' });
});

describe('未读数', () => {
  it('查询进行中本地标记已读时，丢弃旧的查询结果', async () => {
    const store = useNotificationStore();
    store.unreadCount = 3;
    store.notifications = [{ id: 1, isRead: false } as Notification];
    const pending = deferred<number>();
    api.getUnreadCount.mockReturnValue(pending.promise);

    const fetching = store.fetchUnreadCount();
    await store.markAsRead('1');
    pending.resolve(3);
    await fetching;

    expect(store.unreadCount).toBe(2);
  });

  it('后发出的查询结果覆盖先发出的', async () => {
    const store = useNotificationStore();
    const first = deferred<number>();
    const second = deferred<number>();
    api.getUnreadCount.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

    const a = store.fetchUnreadCount();
    const b = store.fetchUnreadCount();
    second.resolve(1);
    first.resolve(5);
    await Promise.all([a, b]);

    expect(store.unreadCount).toBe(1);
  });

  it('标记的通知不在本地列表时重新查询未读数', async () => {
    const store = useNotificationStore();
    store.unreadCount = 3;
    api.getUnreadCount.mockResolvedValue(2);

    await store.markAsRead('9');

    expect(api.getUnreadCount).toHaveBeenCalledTimes(1);
    expect(store.unreadCount).toBe(2);
  });
});
