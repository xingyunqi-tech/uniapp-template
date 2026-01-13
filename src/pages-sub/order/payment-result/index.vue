<route lang="json5">
{
  style: {
    navigationBarTitleText: '支付结果',
  },
}
</route>

<template>
  <view class="payment-result-page">
    <!-- 结果图标 -->
    <view class="result-icon">
      <uni-icons
        :type="isSuccess ? 'checkmarkempty' : 'closeempty'"
        :size="80"
        :color="isSuccess ? '#07c160' : '#ee0a24'"
      />
    </view>

    <!-- 结果标题 -->
    <view class="result-title">
      {{ isSuccess ? '支付成功' : '支付失败' }}
    </view>

    <!-- 结果描述 -->
    <view class="result-desc">
      {{ message }}
    </view>

    <!-- 订单信息 -->
    <view v-if="outTradeNo" class="order-info">
      <view class="info-item">
        <text class="info-label">订单号</text>
        <text class="info-value">{{ outTradeNo }}</text>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="actions">
      <button v-if="!isSuccess" class="btn-primary" @tap="handleRetry">重新支付</button>
      <button class="btn-default" @tap="handleViewOrder">查看订单</button>
      <button class="btn-default" @tap="handleBackHome">返回首页</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

// ==================== 状态 ====================
const isSuccess = ref(false);
const message = ref('');
const outTradeNo = ref('');

// ==================== 生命周期 ====================
onLoad(options => {
  isSuccess.value = options?.success === 'true';
  message.value = options?.message || '';
  outTradeNo.value = options?.outTradeNo || '';
});

// ==================== 方法 ====================

/**
 * 重新支付
 */
function handleRetry() {
  uni.navigateBack();
}

/**
 * 查看订单
 */
function handleViewOrder() {
  uni.redirectTo({
    url: '/pages-sub/order/list/index',
  });
}

/**
 * 返回首页
 */
function handleBackHome() {
  uni.switchTab({
    url: '/pages/index/index',
  });
}
</script>

<style lang="scss" scoped>
.payment-result-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  padding: 120rpx 64rpx;
  background: var(--color-bg);
}

.result-icon {
  margin-bottom: 48rpx;
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

  button {
    width: 100%;
    height: 88rpx;
    border: none;
    border-radius: 16rpx;
    font-size: 32rpx;

    &.btn-primary {
      background: var(--color-primary);
      color: #fff;
    }

    &.btn-default {
      background: var(--color-bg-grey);
      color: var(--color-text);
    }
  }
}
</style>
