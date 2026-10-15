<template>
  <view class="address-page" :class="globalStore.themeClass">
    <!-- 地址列表 -->
    <UList
      class="address-list"
      :empty="addressList.length === 0"
      :loading="addressStore.loading"
      :finished="!addressStore.hasMore"
      :error="loadError"
      empty-icon="location"
      empty-text="暂无收货地址"
      @retry="loadAddressList(addressList.length === 0)"
    >
      <UCard v-for="item in addressList" :key="item.id" class="address-item" clickable @click="handleEdit(item)">
        <view class="address-info">
          <view class="address-header">
            <text class="name">{{ item.name }}</text>
            <text class="phone">{{ item.phone }}</text>
            <UTag v-if="item.isDefault" type="primary" size="small" text="默认" />
          </view>
          <view class="address-detail"> {{ item.province }}{{ item.city }}{{ item.district }}{{ item.address }} </view>
        </view>
        <view class="address-actions">
          <view class="action-item" @click.stop="handleSetDefault(item)">
            <uni-icons type="checkbox" :color="item.isDefault ? 'var(--color-primary)' : 'inherit'" size="32rpx" />
            <text class="action-text">默认</text>
          </view>
          <view class="action-item" @click.stop="handleDelete(item)">
            <uni-icons type="trash" color="inherit" size="32rpx" />
            <text class="action-text">删除</text>
          </view>
        </view>
      </UCard>
    </UList>

    <!-- 添加地址按钮 -->
    <view class="add-btn-wrapper">
      <UButton class="add-btn" type="primary" block @click="handleAdd">
        <uni-icons type="plusempty" color="inherit" size="36rpx" />
        <text>添加新地址</text>
      </UButton>
    </view>
  </view>
</template>

<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: '地址管理',
  },
});

import { computed, ref } from 'vue';
import { onReachBottom, onShow } from '@dcloudio/uni-app';
import { useRouter } from '@/composables';
import { useGlobalStore } from '@/store/modules/global';
import { useAddressStore } from '@/store/modules/address';
import { PAGES } from '@/constants';
import type { Address } from '@/api';

const globalStore = useGlobalStore();
const addressStore = useAddressStore();
const router = useRouter();

// 地址列表
const addressList = computed(() => addressStore.addressList);

const loadError = ref(false);

onShow(() => {
  loadAddressList(true);
});

onReachBottom(() => {
  loadAddressList();
});

// 加载地址列表
async function loadAddressList(refresh = false) {
  loadError.value = false;
  try {
    await addressStore.fetchAddressList(refresh);
  } catch (error) {
    loadError.value = true;
    console.error('加载地址列表失败:', error);
  }
}

// 添加地址
function handleAdd() {
  router.push(PAGES.ADDRESS_EDIT);
}

// 编辑地址
function handleEdit(item: Address) {
  router.push(`${PAGES.ADDRESS_EDIT}?id=${item.id}`);
}

// 设置默认地址
async function handleSetDefault(item: Address) {
  if (item.isDefault) return;

  try {
    await addressStore.setDefault(item.id);
    uni.showToast({
      title: '设置成功',
      icon: 'success',
    });
  } catch (error) {
    console.error('设置默认地址失败:', error);
  }
}

// 删除地址
function handleDelete(item: Address) {
  uni.showModal({
    title: '提示',
    content: '确定要删除该地址吗？',
    success: async res => {
      if (res.confirm) {
        try {
          await addressStore.removeAddress(item.id);
          if (addressStore.hasMore) loadAddressList(true);
          uni.showToast({
            title: '删除成功',
            icon: 'success',
          });
        } catch (error) {
          console.error('删除地址失败:', error);
        }
      }
    },
  });
}
</script>

<style scoped lang="scss">
.address-page {
  box-sizing: border-box;
  min-height: 100vh;
  padding-bottom: calc(var(--safe-area-inset-bottom) + 140rpx);
  background: var(--color-bg-grey);
}

// 地址列表
.address-list {
  padding: 24rpx;

  .address-item {
    margin-bottom: 24rpx;

    .address-info {
      .address-header {
        display: flex;
        gap: 16rpx;
        align-items: center;
        margin-bottom: 16rpx;

        .name {
          color: var(--color-text);
          font-size: 32rpx;
          font-weight: 600;
        }

        .phone {
          color: var(--color-text-secondary);
          font-size: 28rpx;
        }
      }

      .address-detail {
        color: var(--color-text-secondary);
        font-size: 28rpx;
        line-height: 1.5;
      }
    }

    .address-actions {
      display: flex;
      gap: 48rpx;
      justify-content: flex-end;
      margin-top: 24rpx;
      padding-top: 24rpx;
      border-top: 1px solid var(--color-border-light);

      .action-item {
        display: flex;
        gap: 8rpx;
        align-items: center;
        color: var(--color-text-secondary);
        font-size: 26rpx;
      }
    }
  }
}

// 添加按钮
.add-btn-wrapper {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 24rpx;
  padding-bottom: calc(24rpx + var(--safe-area-inset-bottom));
  background: var(--color-bg);
  box-shadow: var(--shadow-light);

  .add-btn {
    gap: 12rpx;
  }
}
</style>
