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
import { createPagedList, type PageResult } from '../helpers/paged-list';

/**
 * 订单统计数据
 */
export interface OrderStats {
  unpaidCount: number;
  paidCount: number;
  refundedCount: number;
  closedCount: number;
}

export const useOrderStore = defineStore('order', () => {
  // ==================== State ====================
  const pager = createPagedList<Order, Omit<GetOrdersParams, 'page' | 'limit'>>({
    fetchPage: async params => (await getOrders(params)) as unknown as PageResult<Order>,
    limit: 10,
  });
  const orderList = pager.list;
  const currentOrder = ref<Order | null>(null);
  const stats = ref<OrderStats>({
    unpaidCount: 0,
    paidCount: 0,
    refundedCount: 0,
    closedCount: 0,
  });
  const loading = pager.loading;
  const total = pager.total;
  /** 已加载到的页码，0 表示尚未加载 */
  const currentPage = pager.page;
  const hasMore = pager.hasMore;

  // ==================== Getters ====================
  const unpaidOrders = computed(() => orderList.value.filter(order => order.status === OrderStatus.UNPAID));

  const paidOrders = computed(() => orderList.value.filter(order => order.status === OrderStatus.PAID));

  const refundedOrders = computed(() => orderList.value.filter(order => order.status === OrderStatus.REFUNDED));

  const closedOrders = computed(() => orderList.value.filter(order => order.status === OrderStatus.CLOSED));

  // ==================== Actions ====================

  /**
   * 获取订单列表，refresh 为 true 时从第 1 页重新加载并作废进行中的请求
   */
  async function fetchOrderList(
    params: Omit<GetOrdersParams, 'page' | 'limit'> = {},
    refresh = false,
  ): Promise<Order[]> {
    return pager.load(params, refresh);
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
    orderList.value.unshift(order);
    total.value++;
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

    // 刷新统计
    await fetchStats();
  }

  /**
   * 删除订单（从列表中移除）
   */
  function remove(orderId: string) {
    const index = orderList.value.findIndex(o => getOrderIdString(o.id) === orderId);
    if (index > -1) {
      orderList.value.splice(index, 1);
      total.value--;
    }

    if (currentOrder.value && getOrderIdString(currentOrder.value.id) === orderId) {
      currentOrder.value = null;
    }
  }

  /**
   * 获取订单统计
   */
  async function fetchStats() {
    // 基于当前列表计算统计数据
    // 如果后端有专门的统计接口，可以替换为 API 调用
    stats.value = {
      unpaidCount: orderList.value.filter(o => o.status === OrderStatus.UNPAID).length,
      paidCount: orderList.value.filter(o => o.status === OrderStatus.PAID).length,
      refundedCount: orderList.value.filter(o => o.status === OrderStatus.REFUNDED).length,
      closedCount: orderList.value.filter(o => o.status === OrderStatus.CLOSED).length,
    };
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
    stats.value = {
      unpaidCount: 0,
      paidCount: 0,
      refundedCount: 0,
      closedCount: 0,
    };
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
    fetchStats,
    clearOrderList,
    clearCurrentOrder,
    reset,
    // Utils
    getOrderIdString,
  };
});
