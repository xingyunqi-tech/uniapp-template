<template>
  <view class="order-detail-page" :class="globalStore.themeClass">
    <ULoading v-if="loading" visible />

    <scroll-view v-else-if="order" scroll-y class="detail-content">
      <!-- 订单状态 -->
      <UCard class="detail-card status-card" :class="getOrderStatusClass(order.status)">
        <view class="status-info">
          <text class="status-text">{{ getOrderStatusText(order.status) }}</text>
          <text class="status-time">{{ formatDateTime(order.createdAt) }}</text>
        </view>
      </UCard>

      <!-- 订单信息 -->
      <UCard class="detail-card">
        <view class="info-row">
          <text class="label">订单号</text>
          <view class="value-row">
            <text class="value">{{ order.orderNo }}</text>
            <text class="copy-btn" @click="handleCopy(order.orderNo)">复制</text>
          </view>
        </view>
        <view class="info-row">
          <text class="label">创建时间</text>
          <text class="value">{{ formatDateTime(order.createdAt) }}</text>
        </view>
        <view v-if="order.paidAt" class="info-row">
          <text class="label">支付时间</text>
          <text class="value">{{ formatDateTime(order.paidAt) }}</text>
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
          <text class="value">{{ formatDateTime(order.refundedAt) }}</text>
        </view>
        <view v-if="order.closedAt" class="info-row">
          <text class="label">关闭时间</text>
          <text class="value">{{ formatDateTime(order.closedAt) }}</text>
        </view>
      </UCard>

      <!-- 金额明细 -->
      <UCard class="detail-card" title="金额明细">
        <view class="amount-row">
          <text class="label">订单总额</text>
          <text class="value">¥{{ formatMoney(order.totalAmount) }}</text>
        </view>
        <view v-if="order.paidAmount" class="amount-row total">
          <text class="label">实付金额</text>
          <text class="value">¥{{ formatMoney(order.paidAmount) }}</text>
        </view>
        <view v-if="order.refundedAmount > 0" class="amount-row">
          <text class="label">已退款</text>
          <text class="value">-¥{{ formatMoney(order.refundedAmount) }}</text>
        </view>
      </UCard>

      <!-- 元数据 -->
      <UCard v-if="order.metadata && Object.keys(order.metadata).length > 0" class="detail-card" title="附加信息">
        <view v-for="(value, key) in order.metadata" :key="key" class="info-row">
          <text class="label">{{ key }}</text>
          <text class="value">{{ value }}</text>
        </view>
      </UCard>
    </scroll-view>

    <!-- 底部操作栏 -->
    <view v-if="order && (canCancel || canPay)" class="footer-actions">
      <UButton v-if="canCancel" class="action-btn" size="medium" text="取消订单" @click="handleCancel" />
      <UButton
        v-if="canPay"
        class="action-btn"
        type="primary"
        size="medium"
        text="立即支付"
        :loading="paying"
        @click="handlePay"
      />
    </view>

    <UPrivacyPopup />
  </view>
</template>

<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: '订单详情',
  },
});

import { ref, computed } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { usePayment } from '@/composables/usePayment';
import { useGlobalStore, useOrderStore } from '@/store';
import { OrderStatus, getOrderStatusText, getOrderStatusClass, getPaymentChannelText } from '@/constants';
import { confirm, formatMoney } from '@/utils';
import { formatDateTime } from '@/utils/datetime';

const globalStore = useGlobalStore();
const orderStore = useOrderStore();

const orderId = ref('');
const loading = ref(false);

const order = computed(() => orderStore.currentOrder);

const { paying, pay, handlePayResult } = usePayment();

// 是否可以取消
const canCancel = computed(() => order.value?.status === OrderStatus.UNPAID);

// 是否可以支付
const canPay = computed(() => order.value?.status === OrderStatus.UNPAID);

onLoad(options => {
  orderStore.clearCurrentOrder();
  if (options?.id) {
    orderId.value = options.id as string;
  }
});

// 每次显示时刷新，支付或取消后返回能看到最新状态
onShow(() => {
  loadOrderDetail();
});

// 加载订单详情
async function loadOrderDetail() {
  if (!orderId.value) return;
  // currentOrder 为各详情页共用，不是本页订单时先清空，避免显示其它订单
  const isCurrent = !!order.value && orderStore.getOrderIdString(order.value.id) === orderId.value;
  if (!isCurrent) orderStore.clearCurrentOrder();
  loading.value = !isCurrent;
  try {
    await orderStore.fetchOrderDetail(orderId.value, { showError: !isCurrent });
  } catch (error) {
    console.error('加载订单详情失败:', error);
  } finally {
    loading.value = false;
  }
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
async function handlePay() {
  if (!order.value) return;
  const target = { id: orderStore.getOrderIdString(order.value.id), orderNo: order.value.orderNo };
  handlePayResult(await pay(target), target.id);
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
  box-sizing: border-box;
  flex: 1;
  padding: 24rpx;
}

.detail-card {
  margin-bottom: 24rpx;
}

// 状态卡片
.status-card {
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
  }
}
</style>
