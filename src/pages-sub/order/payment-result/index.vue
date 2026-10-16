<template>
  <view class="payment-result-page" :class="globalStore.themeClass">
    <!-- 结果图标 -->
    <view class="result-icon" :class="{ spinning: state === 'checking' }">
      <UIcon :name="view.icon" size="160rpx" :color="view.color" />
    </view>

    <!-- 结果标题 -->
    <view class="result-title">{{ view.title }}</view>

    <!-- 结果描述 -->
    <view class="result-desc">{{ view.desc }}</view>

    <!-- 订单信息 -->
    <view v-if="orderNo" class="order-info">
      <view class="info-item">
        <text class="info-label">订单号</text>
        <text class="info-value">{{ orderNo }}</text>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="actions">
      <UButton
        v-if="orderId && (state === 'unpaid' || state === 'error')"
        type="primary"
        block
        text="刷新支付结果"
        @click="handleRefresh"
      />
      <UButton v-if="orderId" block text="查看订单" @click="handleViewOrder" />
      <UButton block text="返回首页" @click="handleBackHome" />
    </view>
  </view>
</template>

<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: '支付结果',
  },
});

import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { PAGES } from '@/constants';
import { useGlobalStore } from '@/store/modules/global';
import { useOrderPaymentStatus, type OrderPaymentState } from '@/composables/useOrderPaymentStatus';
import type { IconName } from '@/components';

const globalStore = useGlobalStore();
const { state, orderNo, check } = useOrderPaymentStatus();

const orderId = ref(0);

const STATE_VIEW: Record<OrderPaymentState, { icon: IconName; color: string; title: string; desc: string }> = {
  checking: {
    icon: 'spinner-cycle',
    color: 'var(--color-primary)',
    title: '正在确认支付结果',
    desc: '请稍候…',
  },
  paid: {
    icon: 'checkmarkempty',
    color: 'var(--color-success)',
    title: '支付成功',
    desc: '订单已支付',
  },
  refunded: {
    icon: 'info',
    color: 'var(--color-warning)',
    title: '订单已退款',
    desc: '该订单已退款，款项将原路退回',
  },
  unpaid: {
    icon: 'info',
    color: 'var(--color-warning)',
    title: '支付结果确认中',
    desc: '暂未收到支付结果，如已付款请稍后刷新',
  },
  closed: {
    icon: 'closeempty',
    color: 'var(--color-error)',
    title: '订单已关闭',
    desc: '订单已超时或已取消，如需购买请重新下单',
  },
  error: {
    icon: 'closeempty',
    color: 'var(--color-error)',
    title: '查询失败',
    desc: '暂时无法获取订单状态，请稍后刷新',
  },
};

const view = computed(() => STATE_VIEW[state.value]);

// H5 支付宝网页支付完成后由 return_url 带回 orderId
onLoad(options => {
  orderId.value = Number(options?.orderId) || 0;
  if (orderId.value) {
    check(orderId.value);
  } else {
    state.value = 'error';
  }
});

function handleRefresh() {
  if (orderId.value) check(orderId.value);
}

function handleViewOrder() {
  uni.redirectTo({ url: `${PAGES.ORDER_DETAIL}?id=${orderId.value}` });
}

function handleBackHome() {
  uni.switchTab({ url: PAGES.HOME });
}
</script>

<style lang="scss" scoped>
.payment-result-page {
  display: flex;
  box-sizing: border-box;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  padding: 120rpx 64rpx;
  background: var(--color-bg);
}

.result-icon {
  margin-bottom: 48rpx;

  &.spinning {
    animation: result-icon-spin 1s linear infinite;
  }
}

@keyframes result-icon-spin {
  to {
    transform: rotate(360deg);
  }
}

.result-title {
  margin-bottom: 24rpx;
  color: var(--color-text);
  font-size: 40rpx;
  font-weight: 500;
}

.result-desc {
  margin-bottom: 64rpx;
  color: var(--color-text-secondary);
  font-size: 28rpx;
  line-height: 1.6;
  text-align: center;
}

.order-info {
  width: 100%;
  margin-bottom: 64rpx;
  padding: 32rpx;
  border-radius: 16rpx;
  background: var(--color-bg-grey);

  .info-item {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .info-label {
      color: var(--color-text-secondary);
      font-size: 28rpx;
    }

    .info-value {
      color: var(--color-text);
      font-size: 28rpx;
    }
  }
}

.actions {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 24rpx;
}
</style>
