<template>
  <view class="order-detail-page" :class="globalStore.themeClass">
    <ULoading v-if="loading" visible />

    <scroll-view v-else-if="order" scroll-y class="detail-content">
      <!-- 订单状态 -->
      <view class="status-card" :class="getOrderStatusClass(order.status)">
        <view class="status-info">
          <text class="status-text">{{ getOrderStatusText(order.status) }}</text>
          <text class="status-time">{{ formatTime(order.createdAt) }}</text>
        </view>
      </view>

      <!-- 订单信息 -->
      <view class="info-card">
        <view class="info-row">
          <text class="label">订单号</text>
          <view class="value-row">
            <text class="value">{{ order.orderNo }}</text>
            <text class="copy-btn" @click="handleCopy(order.orderNo)">复制</text>
          </view>
        </view>
        <view class="info-row">
          <text class="label">创建时间</text>
          <text class="value">{{ formatTime(order.createdAt) }}</text>
        </view>
        <view v-if="order.paidAt" class="info-row">
          <text class="label">支付时间</text>
          <text class="value">{{ formatTime(order.paidAt) }}</text>
        </view>
        <view v-if="order.paymentChannel" class="info-row">
          <text class="label">支付渠道</text>
          <text class="value">{{ getPaymentChannelText(order.paymentChannel) }}</text>
        </view>
        <view v-if="order.transactionId" class="info-row">
          <text class="label">交易号</text>
          <view class="value-row">
            <text class="value">{{ order.transactionId }}</text>
            <text class="copy-btn" @click="handleCopy(order.transactionId)">复制</text>
          </view>
        </view>
        <view v-if="order.refundedAt" class="info-row">
          <text class="label">退款时间</text>
          <text class="value">{{ formatTime(order.refundedAt) }}</text>
        </view>
        <view v-if="order.closedAt" class="info-row">
          <text class="label">关闭时间</text>
          <text class="value">{{ formatTime(order.closedAt) }}</text>
        </view>
      </view>

      <!-- 金额明细 -->
      <view class="amount-card">
        <view class="card-title">金额明细</view>
        <view class="amount-row">
          <text class="label">订单总额</text>
          <text class="value">¥{{ formatAmount(order.totalAmount) }}</text>
        </view>
        <view v-if="order.paidAmount" class="amount-row total">
          <text class="label">实付金额</text>
          <text class="value">¥{{ formatAmount(order.paidAmount) }}</text>
        </view>
      </view>

      <!-- 元数据 -->
      <view v-if="order.metadata && Object.keys(order.metadata).length > 0" class="metadata-card">
        <view class="card-title">附加信息</view>
        <view v-for="(value, key) in order.metadata" :key="key" class="info-row">
          <text class="label">{{ key }}</text>
          <text class="value">{{ value }}</text>
        </view>
      </view>
    </scroll-view>

    <!-- 底部操作栏 -->
    <view v-if="order && (canCancel || canPay)" class="footer-actions">
      <button v-if="canCancel" class="action-btn cancel" @click="handleCancel">取消订单</button>
      <button v-if="canPay" class="action-btn primary" @click="handlePay">立即支付</button>
    </view>
  </view>
</template>

<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: '订单详情',
  },
});

import { ref, computed, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useGlobalStore, useOrderStore } from '@/store';
import { OrderStatus, getOrderStatusText, getOrderStatusClass } from '@/constants';
import { confirm } from '@/utils';
import { formatDateTime } from '@/utils/datetime';
import type { OrderPaymentChannel } from '@/api';

const globalStore = useGlobalStore();
const orderStore = useOrderStore();

const orderId = ref('');
const loading = ref(false);

const order = computed(() => orderStore.currentOrder);

// 是否可以取消
const canCancel = computed(() => order.value?.status === OrderStatus.UNPAID);

// 是否可以支付
const canPay = computed(() => order.value?.status === OrderStatus.UNPAID);

onLoad(options => {
  if (options?.id) {
    orderId.value = options.id as string;
  }
});

onMounted(() => {
  loadOrderDetail();
});

// 加载订单详情
async function loadOrderDetail() {
  if (!orderId.value) return;
  loading.value = true;
  try {
    await orderStore.fetchOrderDetail(orderId.value);
  } finally {
    loading.value = false;
  }
}

// 格式化时间
function formatTime(time: string): string {
  return formatDateTime(time);
}

// 格式化金额（分转元）
function formatAmount(amount: number): string {
  return (amount / 100).toFixed(2);
}

// 获取支付渠道文本
function getPaymentChannelText(channel: OrderPaymentChannel): string {
  const channelMap: Record<string, string> = {
    wechat: '微信支付',
    alipay: '支付宝',
  };
  return channelMap[channel] || channel;
}

// 复制订单号
function handleCopy(text: string) {
  uni.setClipboardData({
    data: text,
    success: () => {
      uni.showToast({ title: '已复制', icon: 'success' });
    },
  });
}

// 取消订单
async function handleCancel() {
  const confirmed = await confirm({
    title: '提示',
    content: '确定要取消该订单吗？',
  });

  if (confirmed) {
    try {
      await orderStore.cancel(orderId.value);
      uni.showToast({ title: '订单已取消', icon: 'success' });
      loadOrderDetail();
    } catch (error) {
      console.error('取消订单失败:', error);
    }
  }
}

// 立即支付
function handlePay() {
  uni.showToast({
    title: '跳转支付页面',
    icon: 'none',
  });
  // TODO: 跳转到支付页面
}
</script>

<style scoped lang="scss">
.order-detail-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--color-bg-grey);
}

.detail-content {
  flex: 1;
  padding: 24rpx;
}

// 状态卡片
.status-card {
  margin-bottom: 24rpx;
  padding: 32rpx 24rpx;
  border-radius: var(--radius-lg);
  background: var(--color-bg);
  box-shadow: var(--shadow-sm);

  &.warning {
    border-left: 6rpx solid var(--color-warning);
  }

  &.info {
    border-left: 6rpx solid var(--color-primary);
  }

  &.primary {
    border-left: 6rpx solid var(--color-primary);
  }

  &.success {
    border-left: 6rpx solid var(--color-success);
  }

  &.disabled {
    border-left: 6rpx solid var(--color-text-disabled);
  }

  .status-info {
    display: flex;
    flex-direction: column;
    gap: 8rpx;

    .status-text {
      color: var(--color-text);
      font-size: 32rpx;
      font-weight: 600;
    }

    .status-time {
      color: var(--color-text-secondary);
      font-size: 24rpx;
    }
  }
}

// 信息卡片
.info-card,
.amount-card,
.metadata-card {
  margin-bottom: 24rpx;
  padding: 24rpx;
  border-radius: var(--radius-lg);
  background: var(--color-bg);
  box-shadow: var(--shadow-sm);
}

.card-title {
  margin-bottom: 20rpx;
  color: var(--color-text);
  font-size: 28rpx;
  font-weight: 600;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 0;

  &:not(:last-child) {
    border-bottom: 1px solid var(--color-border-light);
  }

  .label {
    color: var(--color-text-secondary);
    font-size: 26rpx;
  }

  .value {
    color: var(--color-text);
    font-size: 26rpx;
  }

  .value-row {
    display: flex;
    align-items: center;
    gap: 16rpx;

    .copy-btn {
      color: var(--color-primary);
      font-size: 24rpx;
    }
  }
}

// 金额明细
.amount-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 0;

  .label {
    color: var(--color-text-secondary);
    font-size: 26rpx;
  }

  .value {
    color: var(--color-text);
    font-size: 26rpx;
  }

  &.total {
    padding-top: 20rpx;
    border-top: 1px solid var(--color-border-light);

    .label {
      color: var(--color-text);
      font-size: 28rpx;
      font-weight: 600;
    }

    .value {
      color: var(--color-error);
      font-size: 32rpx;
      font-weight: 600;
    }
  }
}

// 底部操作栏
.footer-actions {
  display: flex;
  gap: 16rpx;
  padding: 24rpx;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg);
  box-shadow: var(--shadow-top);

  .action-btn {
    flex: 1;
    height: 80rpx;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-base);
    background: var(--color-bg);
    color: var(--color-text);
    font-size: 28rpx;
    line-height: 78rpx;

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
</style>
