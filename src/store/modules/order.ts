/**
 * 订单状态管理
 *
 * 使用 Orval 自动生成的 API 进行订单管理
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  createOrder,
  getOrders,
  getOrder,
  cancelOrder,
  type Order,
  type CreateOrderDto,
  type GetOrdersParams,
  OrderStatus,
} from '@/api';
import { createPagedList, type PageResult, type PagedLoadResult } from '../helpers/paged-list';

/**
 * 订单统计数据
 */
export interface OrderStats {
  unpaidCount: number;
}

type OrderListParams = Omit<GetOrdersParams, 'page' | 'limit'>;

export const useOrderStore = defineStore('order', () => {
  // ==================== State ====================
  const pager = createPagedList<Order, OrderListParams>({
    fetchPage: async params => (await getOrders(params)) as unknown as PageResult<Order>,
    limit: 10,
  });
  const orderList = pager.list;
  const currentOrder = ref<Order | null>(null);
  const stats = ref<OrderStats>({ unpaidCount: 0 });
  const loading = pager.loading;
  const total = pager.total;
  /** 已加载到的页码，0 表示尚未加载 */
  const currentPage = pager.page;
  const hasMore = pager.hasMore;
  /** 当前列表的筛选条件 */
  const listParams = ref<OrderListParams>({});
  let statsRequestId = 0;

  // ==================== Getters ====================
  const unpaidOrders = computed(() => orderList.value.filter(order => order.status === OrderStatus.UNPAID));

  const paidOrders = computed(() => orderList.value.filter(order => order.status === OrderStatus.PAID));

  const refundedOrders = computed(() => orderList.value.filter(order => order.status === OrderStatus.REFUNDED));

  const closedOrders = computed(() => orderList.value.filter(order => order.status === OrderStatus.CLOSED));

  // ==================== Actions ====================

  /**
   * 获取订单列表，refresh 为 true 时从第 1 页重新加载并作废进行中的请求
   * 返回结果的 stale 为 true 时表示请求已被作废，列表未更新
   */
  async function fetchOrderList(params: OrderListParams = {}, refresh = false): Promise<PagedLoadResult<Order>> {
    if (refresh) listParams.value = { ...params };
    return pager.loadPage(params, refresh);
  }

  /** 订单是否符合当前列表的筛选条件 */
  function matchesListParams(order: Order): boolean {
    const { status, paymentChannel } = listParams.value;
    if (status && order.status !== status) return false;
    if (paymentChannel && order.paymentChannel !== paymentChannel) return false;
    return true;
  }

  /**
   * 获取订单详情
   */
  async function fetchOrderDetail(orderId: string, options?: { showError?: boolean }) {
    const order = await getOrder(Number(orderId), options);
    currentOrder.value = order;
    return order;
  }

  /**
   * 创建订单
   */
  async function create(params: CreateOrderDto) {
    const order = await createOrder(params);
    if (currentPage.value > 0 && matchesListParams(order)) {
      pager.prepend(order);
    }
    return order;
  }

  /**
   * 获取订单 ID 字符串
   * OrderId 可能是对象或字符串，统一转为字符串
   */
  function getOrderIdString(id: Order['id']): string {
    if (typeof id === 'string') return id;
    if (typeof id === 'number') return String(id);
    // 对象类型，尝试获取 id 属性或转为 JSON
    if (id && typeof id === 'object') {
      if ('id' in id) return String(id.id);
      return JSON.stringify(id);
    }
    return String(id);
  }

  /**
   * 取消订单
   */
  async function cancel(orderId: string) {
    await cancelOrder(Number(orderId));

    // 更新列表中的订单状态
    const order = orderList.value.find(o => getOrderIdString(o.id) === orderId);
    if (order) {
      order.status = OrderStatus.CLOSED;
      order.closedAt = new Date().toISOString();
    }

    // 更新当前订单
    if (currentOrder.value && getOrderIdString(currentOrder.value.id) === orderId) {
      currentOrder.value.status = OrderStatus.CLOSED;
      currentOrder.value.closedAt = new Date().toISOString();
    }
  }

  /**
   * 重新获取单个订单并更新列表中的对应项，与当前筛选条件不匹配时移出列表
   */
  async function syncOrder(orderId: string) {
    const order = await getOrder(Number(orderId), { showError: false });
    const index = orderList.value.findIndex(o => getOrderIdString(o.id) === orderId);
    if (index > -1) {
      if (matchesListParams(order)) {
        orderList.value[index] = order;
      } else {
        pager.remove(index);
      }
    }
    if (currentOrder.value && getOrderIdString(currentOrder.value.id) === orderId) {
      currentOrder.value = order;
    }
    return order;
  }

  /**
   * 删除订单（从列表中移除）
   */
  function remove(orderId: string) {
    const index = orderList.value.findIndex(o => getOrderIdString(o.id) === orderId);
    pager.remove(index);

    if (currentOrder.value && getOrderIdString(currentOrder.value.id) === orderId) {
      currentOrder.value = null;
    }
  }

  /**
   * 获取订单统计：请求 1 条待付款订单取分页 total；被更新的请求作废时不写入
   */
  async function fetchStats() {
    const id = ++statsRequestId;
    const result = (await getOrders(
      { status: OrderStatus.UNPAID, page: 1, limit: 1 },
      { showError: false },
    )) as unknown as PageResult<Order>;
    if (id !== statsRequestId) return stats.value;

    stats.value = { unpaidCount: result.total ?? 0 };
    return stats.value;
  }

  /**
   * 清空订单列表
   */
  function clearOrderList() {
    pager.reset();
  }

  /**
   * 清空当前订单
   */
  function clearCurrentOrder() {
    currentOrder.value = null;
  }

  /**
   * 重置 Store
   */
  function reset() {
    clearOrderList();
    clearCurrentOrder();
    listParams.value = {};
    statsRequestId++;
    stats.value = { unpaidCount: 0 };
  }

  return {
    // State
    orderList,
    currentOrder,
    stats,
    loading,
    total,
    currentPage,
    hasMore,
    // Getters
    unpaidOrders,
    paidOrders,
    refundedOrders,
    closedOrders,
    // Actions
    fetchOrderList,
    fetchOrderDetail,
    create,
    cancel,
    remove,
    syncOrder,
    fetchStats,
    clearOrderList,
    clearCurrentOrder,
    reset,
    // Utils
    getOrderIdString,
  };
});
