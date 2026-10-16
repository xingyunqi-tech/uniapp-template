import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

const api = vi.hoisted(() => ({ getOrders: vi.fn(), getOrder: vi.fn(), createOrder: vi.fn() }));

vi.mock('@/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@/api')>()),
  ...api,
}));

const { useOrderStore } = await import('@/store/modules/order');

const order = (id: number, status = 'UNPAID') => ({ id, status }) as never;

beforeEach(() => {
  setActivePinia(createPinia());
  api.getOrders.mockReset();
  api.getOrder.mockReset();
  api.createOrder.mockReset();
});

describe('fetchStats', () => {
  it('请求 1 条待付款订单并取 total', async () => {
    api.getOrders.mockResolvedValue({ list: [], total: 3 });
    const store = useOrderStore();

    await expect(store.fetchStats()).resolves.toEqual({ unpaidCount: 3 });
    expect(api.getOrders).toHaveBeenCalledTimes(1);
    expect(api.getOrders).toHaveBeenCalledWith({ status: 'UNPAID', page: 1, limit: 1 }, { showError: false });
  });

  it('先发出的统计请求晚返回时不覆盖新结果', async () => {
    const resolvers: ((value: unknown) => void)[] = [];
    api.getOrders.mockImplementation(() => new Promise(resolve => resolvers.push(resolve)));
    const store = useOrderStore();

    const first = store.fetchStats();
    const second = store.fetchStats();
    resolvers[1]({ total: 2 });
    await second;
    resolvers[0]({ total: 9 });
    await first;

    expect(store.stats.unpaidCount).toBe(2);
  });
});

describe('fetchOrderList', () => {
  it('被作废的请求返回 stale', async () => {
    const resolvers: ((value: unknown) => void)[] = [];
    api.getOrders.mockImplementation(() => new Promise(resolve => resolvers.push(resolve)));
    const store = useOrderStore();

    const all = store.fetchOrderList({}, true);
    const unpaid = store.fetchOrderList({ status: 'UNPAID' as never }, true);
    resolvers[1]({ list: [order(2)], total: 1 });
    resolvers[0]({ list: [order(1)], total: 1 });

    await expect(all).resolves.toMatchObject({ stale: true });
    await expect(unpaid).resolves.toMatchObject({ stale: false });
  });
});

describe('create', () => {
  async function loadList(status?: string) {
    api.getOrders.mockResolvedValue({ list: [order(1)], total: 1 });
    const store = useOrderStore();
    await store.fetchOrderList({ status: status as never }, true);
    return store;
  }

  it('新订单符合当前筛选时插入列表头部并更新 total', async () => {
    const store = await loadList('UNPAID');
    api.createOrder.mockResolvedValue(order(2, 'UNPAID'));

    await store.create({} as never);

    expect(store.orderList.map(o => o.id)).toEqual([2, 1]);
    expect(store.total).toBe(2);
  });

  it('新订单不符合当前筛选时不插入', async () => {
    const store = await loadList('PAID');
    api.createOrder.mockResolvedValue(order(2, 'UNPAID'));

    await store.create({} as never);

    expect(store.orderList.map(o => o.id)).toEqual([1]);
    expect(store.total).toBe(1);
  });

  it('列表尚未加载时不插入', async () => {
    const store = useOrderStore();
    api.createOrder.mockResolvedValue(order(2));

    await store.create({} as never);

    expect(store.orderList).toEqual([]);
  });
});

describe('syncOrder', () => {
  it('用最新数据替换列表中的订单', async () => {
    api.getOrders.mockResolvedValue({ list: [order(1, 'UNPAID')], total: 1 });
    const store = useOrderStore();
    await store.fetchOrderList({}, true);
    api.getOrder.mockResolvedValue(order(1, 'PAID'));

    await store.syncOrder('1');

    expect(api.getOrder).toHaveBeenCalledWith(1, { showError: false });
    expect(store.orderList[0].status).toBe('PAID');
  });

  it('订单不再符合筛选条件时移出列表', async () => {
    api.getOrders.mockResolvedValue({ list: [order(1, 'UNPAID')], total: 1 });
    const store = useOrderStore();
    await store.fetchOrderList({ status: 'UNPAID' as never }, true);
    api.getOrder.mockResolvedValue(order(1, 'PAID'));

    await store.syncOrder('1');

    expect(store.orderList).toEqual([]);
    expect(store.total).toBe(0);
  });
});
