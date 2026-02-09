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
      <!-- 空状态 -->
      <UEmpty v-if="!loading && orderList.length === 0" type="cart" text="暂无订单">
        <button class="empty-btn" @click="handleGoShopping">去逛逛</button>
      </UEmpty>

      <!-- 订单卡片 -->
      <view
        v-for="order in orderList"
        :key="orderStore.getOrderIdString(order.id)"
        class="order-card"
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
            <text class="info-value price">¥{{ formatAmount(order.totalAmount) }}</text>
          </view>
          <view v-if="order.paidAmount" class="info-row">
            <text class="info-label">已付金额</text>
            <text class="info-value">¥{{ formatAmount(order.paidAmount) }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">下单时间</text>
            <text class="info-value">{{ formatTime(order.createdAt) }}</text>
          </view>
          <view v-if="order.paymentChannel" class="info-row">
            <text class="info-label">支付渠道</text>
            <text class="info-value">{{ getPaymentChannelText(order.paymentChannel) }}</text>
          </view>
        </view>

        <view class="order-footer">
          <view class="order-actions">
            <button
              v-if="order.status === OrderStatus.UNPAID"
              class="action-btn cancel"
              @click.stop="handleCancel(orderStore.getOrderIdString(order.id))"
            >
              取消订单
            </button>
            <button
              v-if="order.status === OrderStatus.UNPAID"
              class="action-btn primary"
              @click.stop="handlePay(orderStore.getOrderIdString(order.id))"
            >
              立即支付
            </button>
          </view>
        </view>
      </view>

      <!-- 加载更多 -->
      <ULoadMore v-if="orderList.length > 0" :status="loadMoreStatus" />
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: '我的订单',
  },
});

import { ref, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useGlobalStore, useOrderStore } from '@/store';
import { confirm } from '@/utils';
import type { LoadMoreStatus, TabItem } from '@/components';
import { OrderStatus, ORDER_TABS, getOrderStatusText, getOrderStatusClass } from '@/constants';
import { PAGES } from '@/constants';
import type { OrderPaymentChannel } from '@/api';

const globalStore = useGlobalStore();
const orderStore = useOrderStore();

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

// 使用 Store 中的数据
const orderList = computed(() => orderStore.orderList);
const loading = computed(() => orderStore.loading);

// 加载更多状态
const loadMoreStatus = computed<LoadMoreStatus>(() => {
  if (loading.value) return 'loading';
  if (noMore.value) return 'nomore';
  return 'loadmore';
});

onShow(() => {
  // 每次显示时刷新
  handleRefresh();
  // 加载统计数据更新 badge
  loadStats();
});

// 加载统计数据
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
  try {
    const status = currentTab.value === 'all' ? undefined : (currentTab.value as any);
    await orderStore.fetchOrderList({ status, limit: 10 }, refresh);

    // 判断是否还有更多数据
    noMore.value = !orderStore.hasMore;
  } catch (error) {
    console.error('加载订单列表失败:', error);
    uni.showToast({
      title: '加载失败',
      icon: 'none',
    });
  } finally {
    refreshing.value = false;
  }
}

// 下拉刷新
function handleRefresh() {
  noMore.value = false;
  refreshing.value = true;
  loadOrders(true);
}

// 加载更多
function handleLoadMore() {
  if (loading.value || noMore.value) return;
  loadOrders(false);
}

// 订单详情
function handleOrderDetail(id: string) {
  uni.navigateTo({
    url: `${PAGES.ORDER_DETAIL}?id=${id}`,
  });
}

// 取消订单
async function handleCancel(id: string) {
  const confirmed = await confirm({
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
function handlePay(id: string) {
  uni.showToast({
    title: `支付订单 ${id}`,
    icon: 'none',
  });
}

// 去逛逛
function handleGoShopping() {
  uni.switchTab({
    url: PAGES.HOME,
  });
}

// 格式化金额（分转元）
function formatAmount(amount: number): string {
  return (amount / 100).toFixed(2);
}

// 格式化时间
function formatTime(time: string): string {
  const date = new Date(time);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// 获取支付渠道文本
function getPaymentChannelText(channel: OrderPaymentChannel): string {
  const channelMap: Record<string, string> = {
    wechat: '微信支付',
    alipay: '支付宝',
  };
  return channelMap[channel] || channel;
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

// 空状态按钮
.empty-btn {
  width: 240rpx;
  height: 72rpx;
  border: none;
  border-radius: var(--radius-base);
  background: var(--color-primary);
  color: var(--color-text-inverse);
  font-size: 28rpx;
  line-height: 72rpx;

  &::after {
    display: none;
  }
}

// 订单卡片
.order-card {
  margin-bottom: 24rpx;
  padding: 24rpx;
  border-radius: var(--radius-lg);
  background: var(--color-bg);
  box-shadow: var(--shadow-sm);

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

      .action-btn {
        height: 60rpx;
        padding: 0 24rpx;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-base);
        background: var(--color-bg);
        color: var(--color-text);
        font-size: 26rpx;
        line-height: 58rpx;

        &::after {
          display: none;
        }

        &.primary {
          border-color: var(--color-primary);
          background: var(--color-primary);
          color: var(--color-text-inverse);
        }

        &.cancel {
          border-color: var(--color-text-secondary);
          color: var(--color-text-secondary);
        }
      }
    }
  }
}
</style>
