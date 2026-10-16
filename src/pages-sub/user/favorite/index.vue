<template>
  <view class="favorite-page" :class="globalStore.themeClass">
    <UList
      class="favorite-list"
      :empty="list.length === 0"
      :loading="loading"
      :finished="!favoriteStore.hasMore"
      :error="loadError"
      empty-icon="star"
      empty-text="暂无收藏内容"
      @retry="fetchList(list.length === 0)"
    >
      <UCard v-for="item in list" :key="item.id" class="favorite-item" clickable @click="handleItemClick(item)">
        <image class="item-cover" :src="item.image || '/static/images/default-cover.png'" mode="aspectFill" />
        <view class="item-info">
          <text class="item-title">{{ item.title || '未命名' }}</text>
          <text class="item-desc">{{ item.targetType }}</text>
          <view class="item-meta">
            <text class="item-time">{{ formatRelativeTime(item.createdAt) }}</text>
          </view>
        </view>
        <view class="item-action" @click.stop="handleRemove(item)">
          <UIcon name="closeempty" color="var(--color-text-secondary)" size="28rpx" />
        </view>
      </UCard>
    </UList>

    <UDialog />
  </view>
</template>

<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: '我的收藏',
  },
});

import { computed, ref } from 'vue';
import { onLoad, onReachBottom } from '@dcloudio/uni-app';
import { useDialog } from '@/composables';
import { useGlobalStore } from '@/store/modules/global';
import { useFavoriteStore } from '@/store/modules/favorite';
import { formatRelativeTime } from '@/utils/datetime';
import type { Favorite } from '@/api';

const globalStore = useGlobalStore();
const favoriteStore = useFavoriteStore();
const dialog = useDialog();

// 使用 store 的状态
const loading = computed(() => favoriteStore.loading);
const list = computed(() => favoriteStore.favoriteList);

const loadError = ref(false);

onLoad(() => {
  fetchList(true);
});

onReachBottom(() => {
  fetchList();
});

// 获取收藏列表
async function fetchList(refresh = false) {
  loadError.value = false;
  try {
    await favoriteStore.fetchFavoriteList(undefined, refresh);
  } catch (error) {
    loadError.value = true;
    console.error('获取收藏列表失败:', error);
  }
}

// 点击收藏项
function handleItemClick(item: Favorite) {
  console.log('点击收藏项:', item);
  // 根据 targetType 跳转到对应的详情页
  // 例如：router.push(`/pages/detail?id=${item.targetId}&type=${item.targetType}`)
}

// 移除收藏
async function handleRemove(item: Favorite) {
  const confirmed = await dialog.confirm({
    title: '提示',
    content: '确定要取消收藏吗？',
  });
  if (!confirmed) return;

  try {
    await favoriteStore.removeFavorite(item.id);
    if (favoriteStore.hasMore) fetchList(true);
    uni.showToast({
      title: '已取消收藏',
      icon: 'success',
    });
  } catch (error) {
    console.error('取消收藏失败:', error);
  }
}
</script>

<style scoped lang="scss">
.favorite-page {
  box-sizing: border-box;
  min-height: 100vh;
  padding: 24rpx;
  background: var(--color-bg-grey);
}

// 收藏列表
.favorite-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.favorite-item {
  display: flex;
  gap: 24rpx;
  align-items: center;

  .item-cover {
    flex-shrink: 0;
    width: 160rpx;
    height: 160rpx;
    border-radius: var(--radius-base);
    object-fit: cover;
  }

  .item-info {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 12rpx;
    min-width: 0;

    .item-title {
      overflow: hidden;
      color: var(--color-text);
      font-size: 30rpx;
      font-weight: 500;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .item-desc {
      display: -webkit-box;
      overflow: hidden;
      color: var(--color-text-secondary);
      font-size: 26rpx;
      text-overflow: ellipsis;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .item-meta {
      display: flex;
      align-items: center;

      .item-time {
        color: var(--color-text-placeholder);
        font-size: 24rpx;
      }
    }
  }

  .item-action {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 56rpx;
    height: 56rpx;
    border-radius: 50%;
    background: var(--color-bg-grey);
  }
}
</style>
