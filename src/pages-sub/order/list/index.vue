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
      <view v-if="!loading && orderList.length === 0" class="empty-state">
        <text class="i-carbon-shopping-cart empty-icon" />
        <text class="empty-text">暂无订单</text>
        <button class="empty-btn" @click="handleGoShopping">去逛逛</button>
      </view>

      <!-- 订单卡片 -->
      <view v-for="order in orderList" :key="order.id" class="order-card" @click="handleOrderDetail(order.id)">
        <view class="order-header">
          <text class="order-no">订单号：{{ order.orderNo }}</text>
          <text class="order-status" :class="getOrderStatusClass(order.status)">{{
            getOrderStatusText(order.status)
          }}</text>
        </view>

        <view class="order-goods">
          <view v-for="goods in order.goodsList.slice(0, 2)" :key="goods.id" class="goods-item">
            <image class="goods-image" :src="goods.image" mode="aspectFill" />
            <view class="goods-info">
              <text class="goods-name">{{ goods.name }}</text>
              <text class="goods-spec">{{ goods.spec }}</text>
              <view class="goods-price-row">
                <text class="goods-price">¥{{ goods.price }}</text>
                <text class="goods-count">x{{ goods.count }}</text>
              </view>
            </view>
          </view>
          <view v-if="order.goodsList.length > 2" class="goods-more"> 共 {{ order.goodsList.length }} 件商品 </view>
        </view>

        <view class="order-footer">
          <view class="order-total">
            <text class="total-label">合计：</text>
            <text class="total-price">¥{{ order.totalAmount }}</text>
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
              v-if="order.status === ORDER_STATUS.SHIPPED"
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
      <view v-if="orderList.length > 0" class="load-more">
        <text v-if="loading">加载中...</text>
        <text v-else-if="noMore">没有更多了</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useGlobalStore } from '@/store/modules/global';
import { confirm } from '@/utils';

import { ORDER_STATUS, ORDER_TABS, getOrderStatusText, getOrderStatusClass, type OrderStatusType } from '@/constants';
import UTabs, { type TabItem } from '@/components/UTabs/index.vue';

const globalStore = useGlobalStore();

interface GoodsItem {
  id: string;
  name: string;
  image: string;
  spec: string;
  price: number;
  count: number;
}

interface OrderItem {
  id: string;
  orderNo: string;
  status: OrderStatusType;
  goodsList: GoodsItem[];
  totalAmount: number;
  createTime: string;
}

// 标签配置 - 从常量生成带 badge 的配置
const tabs = ref<TabItem[]>(
  ORDER_TABS.map(tab => ({
    label: tab.label,
    value: tab.value,
    badge: tab.value === ORDER_STATUS.PENDING ? 2 : tab.value === ORDER_STATUS.SHIPPED ? 1 : 0,
  })),
);

const currentTab = ref('all');
const orderList = ref<OrderItem[]>([]);
const loading = ref(false);
const refreshing = ref(false);
const noMore = ref(false);
const page = ref(1);

onShow(() => {
  // 每次显示时刷新
  handleRefresh();
});

// 切换标签
function handleTabChange(_tab: TabItem) {
  page.value = 1;
  noMore.value = false;
  orderList.value = [];
  loadOrders();
}

// 加载订单
async function loadOrders() {
  if (loading.value) return;
  loading.value = true;

  try {
    // TODO: 替换为实际 API 调用
    await new Promise(resolve => setTimeout(resolve, 500));

    // 模拟数据
    const mockOrders: OrderItem[] = [
      {
        id: '1',
        orderNo: '202401010001',
        status: ORDER_STATUS.PENDING,
        goodsList: [
          {
            id: '1',
            name: '商品名称示例',
            image: '/static/images/default-avatar.png',
            spec: '规格：默认',
            price: 99.0,
            count: 1,
          },
        ],
        totalAmount: 99.0,
        createTime: '2024-01-01 12:00:00',
      },
      {
        id: '2',
        orderNo: '202401010002',
        status: ORDER_STATUS.SHIPPED,
        goodsList: [
          {
            id: '2',
            name: '另一个商品',
            image: '/static/images/default-avatar.png',
            spec: '规格：大号',
            price: 199.0,
            count: 2,
          },
        ],
        totalAmount: 398.0,
        createTime: '2024-01-02 14:30:00',
      },
    ];

    if (page.value === 1) {
      orderList.value = mockOrders;
    } else {
      orderList.value.push(...mockOrders);
    }

    // 模拟没有更多数据
    if (page.value >= 2) {
      noMore.value = true;
    }
  } finally {
    loading.value = false;
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
  uni.showToast({
    title: `订单详情 ${id}`,
    icon: 'none',
  });
}

// 取消订单
async function handleCancel(_id: string) {
  const confirmed = await confirm({
    title: '提示',
    content: '确定要取消该订单吗？',
  });

  if (confirmed) {
    // TODO: 调用取消订单 API，使用 _id
    uni.showToast({
      title: '订单已取消',
      icon: 'success',
    });
    handleRefresh();
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
async function handleConfirm(_id: string) {
  const confirmed = await confirm({
    title: '提示',
    content: '确认已收到商品？',
  });

  if (confirmed) {
    // TODO: 调用确认收货 API，使用 _id
    uni.showToast({
      title: '收货成功',
      icon: 'success',
    });
    handleRefresh();
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
  flex: 1;
  padding: 24rpx;
}

// 空状态
.empty-state {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  align-items: center;
  padding: 120rpx 0;

  .empty-icon {
    color: var(--color-text-disabled);
    font-size: 120rpx;
  }

  .empty-text {
    color: var(--color-text-secondary);
    font-size: 28rpx;
  }

  .empty-btn {
    width: 240rpx;
    height: 72rpx;
    margin-top: 16rpx;
    border: none;
    border-radius: $uni-border-radius-base;
    background: var(--color-primary);
    color: var(--color-text-inverse);
    font-size: 28rpx;
    line-height: 72rpx;

    &::after {
      display: none;
    }
  }
}

// 订单卡片
.order-card {
  margin-bottom: 24rpx;
  padding: 24rpx;
  border-radius: $uni-border-radius-lg;
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
        border-radius: $uni-border-radius-base;
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
        border-radius: $uni-border-radius-base;
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

// 加载更多
.load-more {
  padding: 32rpx 0;
  color: var(--color-text-secondary);
  font-size: 26rpx;
  text-align: center;
}
</style>
