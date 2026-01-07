<route lang="json5">
{
  style: {
    navigationBarTitleText: '订单详情',
  },
}
</route>

<template>
  <view class="order-detail-page" :class="globalStore.themeClass">
    <ULoading v-if="loading" />

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
          <text class="label">订单类型</text>
          <text class="value">{{ order.type }}</text>
        </view>
        <view class="info-row">
          <text class="label">创建时间</text>
          <text class="value">{{ formatTime(order.createdAt) }}</text>
        </view>
        <view v-if="order.paidAt" class="info-row">
          <text class="label">支付时间</text>
          <text class="value">{{ formatTime(order.paidAt) }}</text>
        </view>
        <view v-if="order.completedAt" class="info-row">
          <text class="label">完成时间</text>
          <text class="value">{{ formatTime(order.completedAt) }}</text>
        </view>
      </view>

      <!-- 订单项列表 -->
      <view class="items-card">
        <view class="card-title">订单项</view>
        <view v-for="item in order.items" :key="item.id" class="item-row">
          <image v-if="item.image" class="item-image" :src="item.image" mode="aspectFill" />
          <view class="item-info">
            <text class="item-name">{{ item.name }}</text>
            <text v-if="item.spec" class="item-spec">{{ item.spec }}</text>
            <view class="item-price-row">
              <text class="item-price">¥{{ item.price }}</text>
              <text class="item-quantity">x{{ item.quantity }}</text>
            </view>
          </view>
          <text class="item-subtotal">¥{{ item.subtotal }}</text>
        </view>
      </view>

      <!-- 金额明细 -->
      <view class="amount-card">
        <view class="amount-row">
          <text class="label">订单总额</text>
          <text class="value">¥{{ order.totalAmount }}</text>
        </view>
        <view v-if="order.discountAmount" class="amount-row">
          <text class="label">优惠金额</text>
          <text class="value discount">-¥{{ order.discountAmount }}</text>
        </view>
        <view class="amount-row total">
          <text class="label">实付金额</text>
          <text class="value">¥{{ order.paidAmount }}</text>
        </view>
      </view>

      <!-- 备注 -->
      <view v-if="order.remark" class="remark-card">
        <view class="card-title">备注</view>
        <text class="remark-text">{{ order.remark }}</text>
      </view>
    </scroll-view>

    <!-- 底部操作栏 -->
    <view v-if="order" class="footer-actions">
      <button v-if="canCancel" class="action-btn cancel" @click="handleCancel">取消订单</button>
      <button v-if="canPay" class="action-btn primary" @click="handlePay">立即支付</button>
      <button v-if="canConfirm" class="action-btn primary" @click="handleConfirm">确认完成</button>
      <button v-if="canDelete" class="action-btn" @click="handleDelete">删除订单</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useGlobalStore, useOrderStore } from '@/store';
import { ORDER_STATUS, getOrderStatusText, getOrderStatusClass } from '@/constants';
import { confirm } from '@/utils';
import { formatDateTime } from '@/utils/datetime';

const globalStore = useGlobalStore();
const orderStore = useOrderStore();

const orderId = ref('');
const loading = ref(false);

const order = computed(() => orderStore.currentOrder);

// 是否可以取消
const canCancel = computed(() => order.value?.status === ORDER_STATUS.PENDING);

// 是否可以支付
const canPay = computed(() => order.value?.status === ORDER_STATUS.PENDING);

// 是否可以确认完成
const canConfirm = computed(
  () => order.value?.status === ORDER_STATUS.PAID || order.value?.status === ORDER_STATUS.SHIPPED,
);

// 是否可以删除
const canDelete = computed(
  () => order.value?.status === ORDER_STATUS.COMPLETED || order.value?.status === ORDER_STATUS.CANCELLED,
);

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

// 确认完成
async function handleConfirm() {
  const confirmed = await confirm({
    title: '提示',
    content: '确认订单已完成？',
  });

  if (confirmed) {
    try {
      await orderStore.confirm(orderId.value);
      uni.showToast({ title: '订单已完成', icon: 'success' });
      loadOrderDetail();
    } catch (error) {
      console.error('确认订单失败:', error);
    }
  }
}

// 删除订单
async function handleDelete() {
  const confirmed = await confirm({
    title: '提示',
    content: '确定要删除该订单吗？删除后无法恢复。',
  });

  if (confirmed) {
    try {
      await orderStore.remove(orderId.value);
      uni.showToast({ title: '订单已删除', icon: 'success' });
      uni.navigateBack();
    } catch (error) {
      console.error('删除订单失败:', error);
    }
  }
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
.items-card,
.amount-card,
.remark-card {
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

// 订单项
.item-row {
  display: flex;
  gap: 20rpx;
  padding: 20rpx 0;

  &:not(:last-child) {
    border-bottom: 1px solid var(--color-border-light);
  }

  .item-image {
    flex-shrink: 0;
    width: 120rpx;
    height: 120rpx;
    border-radius: var(--radius-base);
    background: var(--color-bg-grey);
  }

  .item-info {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 8rpx;

    .item-name {
      color: var(--color-text);
      font-size: 28rpx;
    }

    .item-spec {
      color: var(--color-text-secondary);
      font-size: 24rpx;
    }

    .item-price-row {
      display: flex;
      align-items: center;
      gap: 16rpx;

      .item-price {
        color: var(--color-error);
        font-size: 26rpx;
      }

      .item-quantity {
        color: var(--color-text-secondary);
        font-size: 24rpx;
      }
    }
  }

  .item-subtotal {
    flex-shrink: 0;
    color: var(--color-text);
    font-size: 28rpx;
    font-weight: 500;
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

    &.discount {
      color: var(--color-error);
    }
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

// 备注
.remark-text {
  color: var(--color-text-secondary);
  font-size: 26rpx;
  line-height: 1.6;
}

// 底部操作栏
.footer-actions {
  display: flex;
  gap: 16rpx;
  padding: 24rpx;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg);
  box-shadow: 0 -4rpx 16rpx rgb(0 0 0 / 0.05);

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
