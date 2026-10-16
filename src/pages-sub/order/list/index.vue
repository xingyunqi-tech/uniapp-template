<template>
  <view class="order-page" :class="globalStore.themeClass">
    <!-- 订单状态标签栏 -->
    <UTabs v-model="currentTab" :tabs="tabs" scrollable @change="handleTabChange" />

    <!-- 订单列表 -->
    <scroll-view
      scroll-y
      class="order-list"
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="handleRefresh"
      @scrolltolower="handleLoadMore"
    >
      <UList
        :empty="orderList.length === 0"
        :loading="loading"
        :finished="noMore"
        :error="loadError"
        @retry="loadOrders(orderList.length === 0)"
      >
        <template #empty>
          <UEmpty type="cart" text="暂无订单">
            <UButton type="primary" size="small" text="去逛逛" @click="handleGoShopping" />
          </UEmpty>
        </template>

        <!-- 订单卡片 -->
        <UCard
          v-for="order in orderList"
          :key="orderStore.getOrderIdString(order.id)"
          class="order-card"
          clickable
          @click="handleOrderDetail(orderStore.getOrderIdString(order.id))"
        >
          <view class="order-header">
            <text class="order-no">订单号：{{ order.orderNo }}</text>
            <text class="order-status" :class="getOrderStatusClass(order.status)">{{
              getOrderStatusText(order.status)
            }}</text>
          </view>

          <view class="order-info">
            <view class="info-row">
              <text class="info-label">订单金额</text>
              <text class="info-value price">¥{{ formatMoney(order.totalAmount) }}</text>
            </view>
            <view v-if="order.paidAmount" class="info-row">
              <text class="info-label">已付金额</text>
              <text class="info-value">¥{{ formatMoney(order.paidAmount) }}</text>
            </view>
            <view class="info-row">
              <text class="info-label">下单时间</text>
              <text class="info-value">{{ formatDateTime(order.createdAt, 'YYYY-MM-DD HH:mm') }}</text>
            </view>
            <view v-if="order.paymentChannel" class="info-row">
              <text class="info-label">支付渠道</text>
              <text class="info-value">{{ getPaymentChannelText(order.paymentChannel) }}</text>
            </view>
          </view>

          <view v-if="order.status === OrderStatus.UNPAID" class="order-footer">
            <view class="order-actions" @click.stop>
              <UButton size="small" text="取消订单" @click="handleCancel(orderStore.getOrderIdString(order.id))" />
              <UButton type="primary" size="small" text="立即支付" :disabled="paying" @click="handlePay(order)" />
            </view>
          </view>
        </UCard>
      </UList>
    </scroll-view>

    <UDialog />
  </view>
</template>

<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: '我的订单',
  },
});

import { ref, computed } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { useGlobalStore, useOrderStore } from '@/store';
import { formatMoney } from '@/utils';
import { formatDateTime } from '@/utils/datetime';
import { useDialog } from '@/composables';
import { usePayment } from '@/composables/usePayment';
import type { TabItem } from '@/components';
import { OrderStatus, ORDER_TABS, getOrderStatusText, getOrderStatusClass, getPaymentChannelText } from '@/constants';
import { PAGES } from '@/constants';
import type { Order } from '@/api';

const globalStore = useGlobalStore();
const orderStore = useOrderStore();
const { paying, pay, handlePayResult } = usePayment();
const dialog = useDialog();

// 标签配置
const tabs = ref<TabItem[]>(
  ORDER_TABS.map(tab => ({
    label: tab.label,
    value: tab.value,
    badge: 0,
  })),
);

const currentTab = ref('all');
const refreshing = ref(false);
const noMore = ref(false);
const loadError = ref(false);

// 使用 Store 中的数据
const orderList = computed(() => orderStore.orderList);
const loading = computed(() => orderStore.loading);

/** 进入详情的订单，返回列表时静默同步其状态 */
let viewedOrderId = '';

onLoad(() => {
  loadOrders(true);
  loadStats();
});

onShow(() => {
  if (!viewedOrderId) return;
  const id = viewedOrderId;
  viewedOrderId = '';
  syncViewedOrder(id);
});

async function syncViewedOrder(id: string) {
  try {
    await orderStore.syncOrder(id);
  } catch (error) {
    console.error('同步订单状态失败:', error);
  }
  loadStats();
}

async function loadStats() {
  try {
    const stats = await orderStore.fetchStats();
    // 更新 badge
    tabs.value = tabs.value.map(tab => ({
      ...tab,
      badge: tab.value === OrderStatus.UNPAID ? stats.unpaidCount : 0,
    }));
  } catch (error) {
    console.error('加载订单统计失败:', error);
  }
}

// 切换标签
function handleTabChange(_tab: TabItem) {
  noMore.value = false;
  loadOrders(true);
}

// 加载订单
async function loadOrders(refresh = false) {
  loadError.value = false;
  try {
    const status = currentTab.value === 'all' ? undefined : (currentTab.value as any);
    const { stale } = await orderStore.fetchOrderList({ status }, refresh);
    if (stale) return;

    noMore.value = !orderStore.hasMore;
    refreshing.value = false;
  } catch (error) {
    loadError.value = true;
    refreshing.value = false;
    console.error('加载订单列表失败:', error);
  }
}

// 下拉刷新
function handleRefresh() {
  noMore.value = false;
  refreshing.value = true;
  loadOrders(true);
  loadStats();
}

// 加载更多
function handleLoadMore() {
  if (loading.value || noMore.value) return;
  loadOrders(false);
}

// 订单详情
function handleOrderDetail(id: string) {
  viewedOrderId = id;
  uni.navigateTo({
    url: `${PAGES.ORDER_DETAIL}?id=${id}`,
  });
}

// 取消订单
async function handleCancel(id: string) {
  const confirmed = await dialog.confirm({
    title: '提示',
    content: '确定要取消该订单吗？',
  });

  if (confirmed) {
    try {
      await orderStore.cancel(id);
      uni.showToast({
        title: '订单已取消',
        icon: 'success',
      });
      handleRefresh();
    } catch (error) {
      console.error('取消订单失败:', error);
    }
  }
}

// 立即支付
async function handlePay(order: Order) {
  const target = { id: orderStore.getOrderIdString(order.id), orderNo: order.orderNo };
  handlePayResult(await pay(target), target.id);
}

// 去逛逛
function handleGoShopping() {
  uni.switchTab({
    url: PAGES.HOME,
  });
}
</script>

<style scoped lang="scss">
.order-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--color-bg-grey);
}

// 订单列表
.order-list {
  box-sizing: border-box;
  flex: 1;
  width: 100%;
  padding: 24rpx;
}

// 订单卡片
.order-card {
  margin-bottom: 24rpx;

  .order-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 20rpx;
    border-bottom: 1px solid var(--color-border-light);

    .order-no {
      color: var(--color-text-secondary);
      font-size: 24rpx;
    }

    .order-status {
      font-size: 26rpx;
      font-weight: 500;

      &.warning {
        color: var(--color-warning);
      }

      &.info {
        color: var(--color-primary);
      }

      &.primary {
        color: var(--color-primary);
      }

      &.success {
        color: var(--color-success);
      }

      &.disabled {
        color: var(--color-text-disabled);
      }
    }
  }

  .order-info {
    padding: 20rpx 0;

    .info-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12rpx;

      &:last-child {
        margin-bottom: 0;
      }

      .info-label {
        color: var(--color-text-secondary);
        font-size: 26rpx;
      }

      .info-value {
        color: var(--color-text);
        font-size: 26rpx;

        &.price {
          color: var(--color-error);
          font-size: 32rpx;
          font-weight: 600;
        }
      }
    }
  }

  .order-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-top: 20rpx;
    border-top: 1px solid var(--color-border-light);

    .order-actions {
      display: flex;
      gap: 16rpx;
    }
  }
}
</style>
