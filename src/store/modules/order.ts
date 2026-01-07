/**
 * 订单状态管理
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { ORDER_STATUS, type OrderStatusType } from '@/constants';

// TODO: 等待后端 OpenAPI 文档生成后，使用 Orval 自动生成以下 API
// import {
//   getOrderList,
//   getOrderDetail,
//   createOrder,
//   cancelOrder,
//   confirmOrder,
//   deleteOrder,
//   getOrderStats,
//   type Order,
//   type OrderListParams,
//   type CreateOrderParams,
//   type OrderStats,
// } from '@/api';

// 临时类型定义（等待 Orval 生成后删除）
export interface OrderItem {
  id: string;
  name: string;
  image?: string;
  spec?: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNo: string;
  status: OrderStatusType;
  type: string;
  title: string;
  items: OrderItem[];
  totalAmount: number;
  paidAmount: number;
  discountAmount?: number;
  remark?: string;
  createdAt: string;
  paidAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  extra?: Record<string, any>;
}

export interface OrderListParams {
  status?: OrderStatusType | 'all';
  type?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateOrderParams {
  type: string;
  title: string;
  items: Omit<OrderItem, 'id' | 'subtotal'>[];
  remark?: string;
  extra?: Record<string, any>;
}

export interface OrderStats {
  pendingCount: number;
  processingCount: number;
  completedCount: number;
}

export const useOrderStore = defineStore('order', () => {
  // ==================== State ====================
  const orderList = ref<Order[]>([]);
  const currentOrder = ref<Order | null>(null);
  const stats = ref<OrderStats>({
    pendingCount: 0,
    processingCount: 0,
    completedCount: 0,
  });
  const loading = ref(false);
  const total = ref(0);

  // ==================== Getters ====================
  const pendingOrders = computed(() => orderList.value.filter(order => order.status === ORDER_STATUS.PENDING));

  const processingOrders = computed(() =>
    orderList.value.filter(order => order.status === ORDER_STATUS.PAID || order.status === ORDER_STATUS.SHIPPED),
  );

  const completedOrders = computed(() => orderList.value.filter(order => order.status === ORDER_STATUS.COMPLETED));

  // ==================== Actions ====================

  /**
   * 获取订单列表
   */
  async function fetchOrderList(params: OrderListParams = {}) {
    loading.value = true;
    try {
      // TODO: 等待 Orval 生成 API 后替换
      // const response = await getOrderList(params);
      // orderList.value = response.list;
      // total.value = response.total;
      // return response;

      // 临时模拟数据
      await new Promise(resolve => setTimeout(resolve, 500));
      const mockResponse = {
        list: [] as Order[],
        total: 0,
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 10,
      };
      orderList.value = mockResponse.list;
      total.value = mockResponse.total;
      return mockResponse;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 获取订单详情
   */
  async function fetchOrderDetail(orderId: string) {
    loading.value = true;
    try {
      // TODO: 等待 Orval 生成 API 后替换
      // const order = await getOrderDetail(orderId);
      // currentOrder.value = order;
      // return order;

      // 临时模拟数据
      await new Promise(resolve => setTimeout(resolve, 500));
      const mockOrder: Order = {
        id: orderId,
        orderNo: '202401010001',
        status: ORDER_STATUS.PENDING,
        type: 'service',
        title: '示例订单',
        items: [],
        totalAmount: 0,
        paidAmount: 0,
        createdAt: new Date().toISOString(),
      };
      currentOrder.value = mockOrder;
      return mockOrder;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 创建订单
   */
  async function create(params: CreateOrderParams) {
    // TODO: 等待 Orval 生成 API 后替换
    // const order = await createOrder(params);
    // orderList.value.unshift(order);
    // total.value++;
    // return order;

    // 临时模拟数据
    const mockOrder: Order = {
      id: Date.now().toString(),
      orderNo: `ORD${Date.now()}`,
      status: ORDER_STATUS.PENDING,
      type: params.type,
      title: params.title,
      items: params.items.map((item, index) => ({
        ...item,
        id: `item-${index}`,
        subtotal: item.price * item.quantity,
      })),
      totalAmount: params.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      paidAmount: params.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      remark: params.remark,
      createdAt: new Date().toISOString(),
      extra: params.extra,
    };
    orderList.value.unshift(mockOrder);
    total.value++;
    return mockOrder;
  }

  /**
   * 取消订单
   */
  async function cancel(orderId: string, reason?: string) {
    // TODO: 等待 Orval 生成 API 后替换
    // await cancelOrder(orderId, reason);
    console.log('取消订单:', orderId, reason);

    // 更新列表中的订单状态
    const order = orderList.value.find(o => o.id === orderId);
    if (order) {
      order.status = ORDER_STATUS.CANCELLED;
      order.cancelledAt = new Date().toISOString();
    }
    // 更新当前订单
    if (currentOrder.value?.id === orderId) {
      currentOrder.value.status = ORDER_STATUS.CANCELLED;
      currentOrder.value.cancelledAt = new Date().toISOString();
    }
    // 刷新统计
    await fetchStats();
  }

  /**
   * 确认完成订单
   */
  async function confirm(orderId: string) {
    // TODO: 等待 Orval 生成 API 后替换
    // await confirmOrder(orderId);
    console.log('确认订单:', orderId);

    // 更新列表中的订单状态
    const order = orderList.value.find(o => o.id === orderId);
    if (order) {
      order.status = ORDER_STATUS.COMPLETED;
      order.completedAt = new Date().toISOString();
    }
    // 更新当前订单
    if (currentOrder.value?.id === orderId) {
      currentOrder.value.status = ORDER_STATUS.COMPLETED;
      currentOrder.value.completedAt = new Date().toISOString();
    }
    // 刷新统计
    await fetchStats();
  }

  /**
   * 删除订单
   */
  async function remove(orderId: string) {
    // TODO: 等待 Orval 生成 API 后替换
    // await deleteOrder(orderId);
    console.log('删除订单:', orderId);

    // 从列表中移除
    const index = orderList.value.findIndex(o => o.id === orderId);
    if (index > -1) {
      orderList.value.splice(index, 1);
      total.value--;
    }
    // 清空当前订单
    if (currentOrder.value?.id === orderId) {
      currentOrder.value = null;
    }
  }

  /**
   * 获取订单统计
   */
  async function fetchStats() {
    // TODO: 等待 Orval 生成 API 后替换
    // const data = await getOrderStats();
    // stats.value = data;
    // return data;

    // 临时模拟数据
    const mockStats: OrderStats = {
      pendingCount: 0,
      processingCount: 0,
      completedCount: 0,
    };
    stats.value = mockStats;
    return mockStats;
  }

  /**
   * 清空订单列表
   */
  function clearOrderList() {
    orderList.value = [];
    total.value = 0;
  }

  /**
   * 清空当前订单
   */
  function clearCurrentOrder() {
    currentOrder.value = null;
  }

  return {
    // State
    orderList,
    currentOrder,
    stats,
    loading,
    total,
    // Getters
    pendingOrders,
    processingOrders,
    completedOrders,
    // Actions
    fetchOrderList,
    fetchOrderDetail,
    create,
    cancel,
    confirm,
    remove,
    fetchStats,
    clearOrderList,
    clearCurrentOrder,
  };
});
