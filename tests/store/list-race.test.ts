import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

const server = vi.hoisted(() => {
  type Pending = { params: Record<string, unknown>; resolve: (value: unknown) => void; reject: (e: unknown) => void };
  const pending: Pending[] = [];
  const handler = vi.fn(
    (params: Record<string, unknown>) =>
      new Promise((resolve, reject) => {
        pending.push({ params, resolve, reject });
      }),
  );
  return { pending, handler };
});

vi.mock('@/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@/api')>()),
  getOrders: server.handler,
  getNotifications: server.handler,
}));

const { useOrderStore } = await import('@/store/modules/order');
const { useNotificationStore } = await import('@/store/modules/notification');

const ordersPage = (ids: string[], totalPages = 3) => ({ data: ids.map(id => ({ id })), total: 30, totalPages });
const notificationsPage = (ids: string[], totalPages = 3) => ({ list: ids.map(id => ({ id })), totalPages });

beforeEach(() => {
  setActivePinia(createPinia());
  server.pending.length = 0;
  server.handler.mockClear();
});

describe('订单列表', () => {
  it('切换筛选后先发请求的结果晚返回时被丢弃', async () => {
    const store = useOrderStore();

    const all = store.fetchOrderList({}, true);
    const unpaid = store.fetchOrderList({ status: 'UNPAID' as never }, true);
    server.pending[1].resolve(ordersPage(['unpaid-1']));
    await unpaid;
    server.pending[0].resolve(ordersPage(['all-1']));
    await all;

    expect(store.orderList.map(o => o.id)).toEqual(['unpaid-1']);
    expect(store.currentPage).toBe(2);
    expect(store.loading).toBe(false);
  });

  it('加载更多进行中时不重复请求', async () => {
    const store = useOrderStore();
    const first = store.fetchOrderList({}, true);
    server.pending[0].resolve(ordersPage(['1']));
    await first;

    void store.fetchOrderList();
    await store.fetchOrderList();

    expect(server.handler).toHaveBeenCalledTimes(2);
    expect(server.pending[1].params.page).toBe(2);
  });

  it('切换筛选后刷新失败，再加载时从第 1 页替换列表', async () => {
    const store = useOrderStore();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const first = store.fetchOrderList({}, true);
    server.pending[0].resolve(ordersPage(['all-1']));
    await first;

    const failed = store.fetchOrderList({ status: 'UNPAID' as never }, true);
    server.pending[1].reject(new Error('network'));
    await expect(failed).rejects.toThrow('network');

    const retry = store.fetchOrderList({ status: 'UNPAID' as never });
    expect(server.pending[2].params.page).toBe(1);
    server.pending[2].resolve(ordersPage(['unpaid-1']));
    await retry;
    expect(store.orderList.map(o => o.id)).toEqual(['unpaid-1']);
  });
});

describe('通知列表', () => {
  it('加载更多失败时不推进页码', async () => {
    const store = useNotificationStore();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const first = store.refresh();
    server.pending[0].resolve(notificationsPage(['1']));
    await first;

    const more = store.loadMore();
    server.pending[1].reject(new Error('network'));
    await more;

    expect(store.currentPage).toBe(1);
    const retry = store.loadMore();
    expect(server.pending[2].params.page).toBe(2);
    server.pending[2].resolve(notificationsPage(['2']));
    await retry;
    expect(store.notifications.map(n => n.id)).toEqual(['1', '2']);
  });

  it('加载更多进行中刷新时丢弃加载更多的结果', async () => {
    const store = useNotificationStore();
    const first = store.refresh();
    server.pending[0].resolve(notificationsPage(['1']));
    await first;

    const more = store.loadMore();
    const refreshing = store.refresh();
    server.pending[2].resolve(notificationsPage(['new-1']));
    await refreshing;
    server.pending[1].resolve(notificationsPage(['2']));
    await more;

    expect(store.notifications.map(n => n.id)).toEqual(['new-1']);
    expect(store.currentPage).toBe(1);
  });

  it('首次加载失败后加载更多请求第 1 页', async () => {
    const store = useNotificationStore();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const first = store.refresh();
    server.pending[0].reject(new Error('network'));
    await first;

    const more = store.loadMore();
    expect(server.pending[1].params.page).toBe(1);
    server.pending[1].resolve(notificationsPage(['1']));
    await more;
    expect(store.notifications.map(n => n.id)).toEqual(['1']);
  });
});
