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
          <view class="address-detail"> {{ item.province }}{{ item.city }}{{ item.district }}{{ item.detail }} </view>
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
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useRouter } from '@/composables';
import { useGlobalStore } from '@/store/modules/global';
import { UTag, UEmpty } from '@/components';
import { PAGES } from '@/constants';

const globalStore = useGlobalStore();

export interface AddressItem {
  id: number;
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  isDefault: boolean;
}

const router = useRouter();
const addressList = ref<AddressItem[]>([]);

onShow(() => {
  loadAddressList();
});

// 加载地址列表
function loadAddressList() {
  // TODO: 调用实际的 API 获取地址列表
  // 模拟数据
  addressList.value = [
    {
      id: 1,
      name: '张三',
      phone: '13888888888',
      province: '广东省',
      city: '深圳市',
      district: '南山区',
      detail: '科技园南路88号',
      isDefault: true,
    },
    {
      id: 2,
      name: '李四',
      phone: '13999999999',
      province: '广东省',
      city: '深圳市',
      district: '福田区',
      detail: '福田中心区68号',
      isDefault: false,
    },
  ];
}

// 添加地址
function handleAdd() {
  router.push(PAGES.ADDRESS_EDIT);
}

// 编辑地址
function handleEdit(item: AddressItem) {
  router.push(`${PAGES.ADDRESS_EDIT}?id=${item.id}`);
}

// 设置默认地址
function handleSetDefault(item: AddressItem) {
  if (item.isDefault) return;

  // TODO: 调用实际的 API 设置默认地址
  addressList.value.forEach(addr => {
    addr.isDefault = addr.id === item.id;
  });

  uni.showToast({
    title: '设置成功',
    icon: 'success',
  });
}

// 删除地址
function handleDelete(item: AddressItem) {
  uni.showModal({
    title: '提示',
    content: '确定要删除该地址吗？',
    success: res => {
      if (res.confirm) {
        // TODO: 调用实际的 API 删除地址
        addressList.value = addressList.value.filter(addr => addr.id !== item.id);
        uni.showToast({
          title: '删除成功',
          icon: 'success',
        });
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
