<route lang="json5">
{
  style: {
    navigationBarTitleText: '我的收藏',
  },
}
</route>

<template>
  <view class="favorite-page" :class="globalStore.themeClass">
    <!-- 空状态 -->
    <UEmpty v-if="!loading && list.length === 0" icon="i-carbon-star" text="暂无收藏内容" />

    <!-- 收藏列表 -->
    <view v-else class="favorite-list">
      <view v-for="item in list" :key="item.id" class="favorite-item" @click="handleItemClick(item)">
        <image class="item-cover" :src="item.cover" mode="aspectFill" />
        <view class="item-info">
          <text class="item-title">{{ item.title }}</text>
          <text class="item-desc">{{ item.description }}</text>
          <view class="item-meta">
            <text class="item-time">{{ item.time }}</text>
          </view>
        </view>
        <view class="item-action" @click.stop="handleRemove(item)">
          <text class="i-carbon-close" />
        </view>
      </view>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading" class="loading-state">
      <text class="loading-text">加载中...</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useGlobalStore } from '@/store/modules/global';
import { UEmpty } from '@/components';

const globalStore = useGlobalStore();

interface FavoriteItem {
  id: string;
  title: string;
  description: string;
  cover: string;
  time: string;
}

const loading = ref(false);
const list = ref<FavoriteItem[]>([]);

onLoad(() => {
  fetchList();
});

// 获取收藏列表
async function fetchList() {
  loading.value = true;
  try {
    // TODO: 替换为实际 API 调用
    await new Promise(resolve => setTimeout(resolve, 500));
    // 模拟数据
    list.value = [
      {
        id: '1',
        title: '深入学习贯彻党的二十大精神',
        description: '全面学习领会党的二十大精神，深刻把握核心要义和精神实质',
        cover: 'https://via.placeholder.com/200x200/1989fa/ffffff?text=1',
        time: '2小时前',
      },
      {
        id: '2',
        title: '行政能力测试技巧总结',
        description: '归纳总结常见题型解题方法，提升答题效率和准确率',
        cover: 'https://via.placeholder.com/200x200/07c160/ffffff?text=2',
        time: '昨天',
      },
      {
        id: '3',
        title: '申论写作高分模板',
        description: '精选申论写作范文，掌握高分写作技巧和结构框架',
        cover: 'https://via.placeholder.com/200x200/ff976a/ffffff?text=3',
        time: '3天前',
      },
      {
        id: '4',
        title: '公共基础知识速记手册',
        description: '涵盖政治、经济、法律、历史等核心知识点的速记整理',
        cover: 'https://via.placeholder.com/200x200/ee0a24/ffffff?text=4',
        time: '1周前',
      },
    ];
  } finally {
    loading.value = false;
  }
}

// 点击收藏项
function handleItemClick(item: FavoriteItem) {
  console.log('点击收藏项:', item);
  // TODO: 跳转到详情页
}

// 移除收藏
function handleRemove(item: FavoriteItem) {
  uni.showModal({
    title: '提示',
    content: '确定要取消收藏吗？',
    success: res => {
      if (res.confirm) {
        list.value = list.value.filter(i => i.id !== item.id);
        uni.showToast({
          title: '已取消收藏',
          icon: 'success',
        });
      }
    },
  });
}
</script>

<style scoped lang="scss">
.favorite-page {
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
  padding: 24rpx;
  border-radius: var(--radius-lg);
  background: var(--color-bg);
  box-shadow: var(--shadow-sm);

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

    .i-carbon-close {
      color: var(--color-text-secondary);
      font-size: 28rpx;
    }
  }
}

// 加载状态
.loading-state {
  display: flex;
  justify-content: center;
  padding: 48rpx;

  .loading-text {
    color: var(--color-text-secondary);
    font-size: 28rpx;
  }
}
</style>
