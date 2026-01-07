<route lang="json5">
{
  style: {
    navigationBarTitleText: '我的订单',
  },
}
</route>

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
      <view v-for="order in orderList" :key="order.id" class="order-card" @click="handleOrderDetail(order.id)">
        <view class="order-header">
          <text class="order-no">订单号：{{ order.orderNo }}</text>
          <text class="order-status" :class="getOrderStatusClass(order.status)">{{
            getOrderStatusText(order.status)
          }}</text>
        </view>

        <view class="order-goods">
          <view v-for="item in order.items.slice(0, 2)" :key="item.id" class="goods-item">
            <image v-if="item.image" class="goods-image" :src="item.image" mode="aspectFill" />
            <view class="goods-info">
              <text class="goods-name">{{ item.name }}</text>
              <text v-if="item.spec" class="goods-spec">{{ item.spec }}</text>
              <view class="goods-price-row">
                <text class="goods-price">¥{{ item.price }}</text>
                <text class="goods-count">x{{ item.quantity }}</text>
              </view>
            </view>
          </view>
          <view v-if="order.items.length > 2" class="goods-more"> 共 {{ order.items.length }} 件 </view>
        </view>

        <view class="order-footer">
          <view class="order-total">
            <text class="total-label">合计：</text>
            <text class="total-price">¥{{ order.paidAmount }}</text>
          </view>
          <view class="order-actions">
            <button
              v-if="order.status === ORDER_STATUS.PENDING"
              class="action-btn cancel"
              @click.stop="handleCancel(order.id)"
            >
              取消订单
            </button>
            <button
              v-if="order.status === ORDER_STATUS.PENDING"
              class="action-btn primary"
              @click.stop="handlePay(order.id)"
            >
              立即支付
            </button>
            <button
              v-if="order.status === ORDER_STATUS.PAID || order.status === ORDER_STATUS.SHIPPED"
              class="action-btn primary"
              @click.stop="handleConfirm(order.id)"
            >
              确认收货
            </button>
            <button
              v-if="order.status === ORDER_STATUS.COMPLETED"
              class="action-btn"
              @click.stop="handleReview(order.id)"
            >
              评价
            </button>
            <button
              v-if="order.status === ORDER_STATUS.COMPLETED"
              class="action-btn"
              @click.stop="handleBuyAgain(order.id)"
            >
              再次购买
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
import { ref, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useGlobalStore, useOrderStore } from '@/store';
import { confirm } from '@/utils';
import type { LoadMoreStatus, TabItem } from '@/components';
import { ORDER_STATUS, ORDER_TABS, getOrderStatusText, getOrderStatusClass } from '@/constants';
import { PAGES } from '@/constants';

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
const page = ref(1);
const pageSize = ref(10);
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
      badge:
        tab.value === ORDER_STATUS.PENDING
          ? stats.pendingCount
          : tab.value === ORDER_STATUS.SHIPPED
            ? stats.processingCount
            : 0,
    }));
  } catch (error) {
    console.error('加载订单统计失败:', error);
  }
}

// 切换标签
function handleTabChange(_tab: TabItem) {
  page.value = 1;
  noMore.value = false;
  loadOrders();
}

// 加载订单
async function loadOrders() {
  try {
    const response = await orderStore.fetchOrderList({
      status: currentTab.value as any,
      page: page.value,
      pageSize: pageSize.value,
    });

    // 判断是否还有更多数据
    noMore.value = response.list.length < pageSize.value || response.list.length >= response.total;
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
  page.value = 1;
  noMore.value = false;
  refreshing.value = true;
  loadOrders();
}

// 加载更多
function handleLoadMore() {
  if (loading.value || noMore.value) return;
  page.value++;
  loadOrders();
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

// 确认收货
async function handleConfirm(id: string) {
  const confirmed = await confirm({
    title: '提示',
    content: '确认订单已完成？',
  });

  if (confirmed) {
    try {
      await orderStore.confirm(id);
      uni.showToast({
        title: '订单已完成',
        icon: 'success',
      });
      handleRefresh();
    } catch (error) {
      console.error('确认订单失败:', error);
    }
  }
}

// 评价
function handleReview(id: string) {
  uni.showToast({
    title: `评价订单 ${id}`,
    icon: 'none',
  });
}

// 再次购买
function handleBuyAgain(id: string) {
  uni.showToast({
    title: `再次购买 ${id}`,
    icon: 'none',
  });
}

// 去逛逛
function handleGoShopping() {
  uni.switchTab({
    url: '/pages/index/index',
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

  .order-goods {
    padding: 20rpx 0;

    .goods-item {
      display: flex;
      gap: 20rpx;

      &:not(:last-child) {
        margin-bottom: 20rpx;
      }

      .goods-image {
        flex-shrink: 0;
        width: 160rpx;
        height: 160rpx;
        border-radius: var(--radius-base);
        background: var(--color-bg-grey);
      }

      .goods-info {
        display: flex;
        flex: 1;
        flex-direction: column;
        gap: 8rpx;

        .goods-name {
          display: -webkit-box;
          overflow: hidden;
          color: var(--color-text);
          font-size: 28rpx;
          line-height: 1.4;
          text-overflow: ellipsis;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
        }

        .goods-spec {
          color: var(--color-text-secondary);
          font-size: 24rpx;
        }

        .goods-price-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: auto;

          .goods-price {
            color: var(--color-error);
            font-size: 28rpx;
            font-weight: 500;
          }

          .goods-count {
            color: var(--color-text-secondary);
            font-size: 24rpx;
          }
        }
      }
    }

    .goods-more {
      padding-top: 16rpx;
      color: var(--color-text-secondary);
      font-size: 24rpx;
      text-align: center;
    }
  }

  .order-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 20rpx;
    border-top: 1px solid var(--color-border-light);

    .order-total {
      display: flex;
      align-items: baseline;

      .total-label {
        color: var(--color-text-secondary);
        font-size: 26rpx;
      }

      .total-price {
        color: var(--color-error);
        font-size: 32rpx;
        font-weight: 600;
      }
    }

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
