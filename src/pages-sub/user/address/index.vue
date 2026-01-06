<route lang="json5">
{
  style: {
    navigationBarTitleText: '地址管理',
  },
}
</route>

<template>
  <view class="address-page" :class="globalStore.themeClass">
    <!-- 地址列表 -->
    <view v-if="addressList.length > 0" class="address-list">
      <view v-for="item in addressList" :key="item.id" class="address-item" @click="handleEdit(item)">
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
            <text :class="['i-carbon-checkbox', item.isDefault ? 'checked' : '']" />
            <text class="action-text">默认</text>
          </view>
          <view class="action-item" @click.stop="handleDelete(item)">
            <text class="i-carbon-trash-can" />
            <text class="action-text">删除</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <UEmpty v-else icon="i-carbon-location" text="暂无收货地址" />

    <!-- 添加地址按钮 -->
    <view class="add-btn-wrapper">
      <button class="add-btn" @click="handleAdd">
        <text class="i-carbon-add" />
        <text>添加新地址</text>
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
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

onShow(() => {
  loadAddressList();
});

// 加载地址列表
async function loadAddressList() {
  try {
    await addressStore.fetchAddressList(true);
  } catch (error) {
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
    uni.showToast({
      title: '设置失败',
      icon: 'none',
    });
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
          uni.showToast({
            title: '删除成功',
            icon: 'success',
          });
        } catch (error) {
          console.error('删除地址失败:', error);
          uni.showToast({
            title: '删除失败',
            icon: 'none',
          });
        }
      }
    },
  });
}
</script>

<style scoped lang="scss">
.address-page {
  min-height: 100vh;
  padding-bottom: calc(var(--safe-area-inset-bottom) + 140rpx);
  background: var(--color-bg-grey);
}

// 地址列表
.address-list {
  padding: 24rpx;

  .address-item {
    margin-bottom: 24rpx;
    padding: 32rpx;
    border-radius: var(--radius-lg);
    background: var(--color-bg);
    box-shadow: var(--shadow-sm);

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

        .i-carbon-checkbox {
          font-size: 32rpx;

          &.checked {
            color: var(--color-primary);
          }
        }

        .i-carbon-trash-can {
          font-size: 32rpx;
        }
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
    display: flex;
    gap: 12rpx;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 96rpx;
    border: none;
    border-radius: var(--radius-lg);
    background: var(--color-primary);
    color: var(--color-text-inverse);
    font-size: 32rpx;

    .i-carbon-add {
      font-size: 36rpx;
    }

    &::after {
      display: none;
    }
  }
}
</style>
