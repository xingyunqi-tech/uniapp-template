<template>
  <view class="home-page" :class="globalStore.themeClass">
    <!-- 自定义导航栏 -->
    <UNavBar title="首页" :show-back="false">
      <template #left>
        <view class="nav-left-icon">
          <UIcon name="home" size="44rpx" color="var(--color-text)" />
        </view>
      </template>
    </UNavBar>

    <!-- Banner 轮播 -->
    <UBanner :list="bannerList" :height="300" @click="handleBannerClick" />

    <!-- 分类网格 -->
    <view class="category-section">
      <view class="category-grid">
        <view v-for="item in categoryList" :key="item.id" class="category-item" @click="handleCategoryClick(item)">
          <view class="category-icon">
            <UIcon :name="item.icon" size="56rpx" color="var(--color-primary)" />
          </view>
          <text class="category-name">{{ item.name }}</text>
        </view>
      </view>
    </view>

    <!-- 示例文章列表 -->
    <UList
      class="news-list"
      :empty="newsList.length === 0"
      :loading="loading"
      :finished="noMore"
      :error="loadError"
      @retry="loadNews"
    >
      <UCard v-for="item in newsList" :key="item.id" class="news-item" clickable @click="handleNewsClick(item)">
        <view class="news-content">
          <text class="news-title">{{ item.title }}</text>
          <text class="news-summary">{{ item.summary }}</text>
          <view class="news-meta">
            <text class="news-source">{{ item.source }}</text>
            <text class="news-time">{{ item.time }}</text>
            <text v-if="item.tag" class="news-tag">{{ item.tag }}</text>
          </view>
        </view>
        <image v-if="item.image" class="news-image" :src="item.image" mode="aspectFill" />
      </UCard>
    </UList>
  </view>
</template>

<script setup lang="ts">
definePage({
  style: {
    navigationStyle: 'custom',
    enablePullDownRefresh: true,
  },
});

import { ref } from 'vue';
import { onLoad, onShow, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import { useList } from '@/composables';
import { useGlobalStore } from '@/store/modules/global';
import type { IconName } from '@/components';

const globalStore = useGlobalStore();

// Banner 数据类型
interface BannerItem {
  id: number;
  image: string;
  link?: string;
}

// 分类数据类型
interface CategoryItem {
  id: number;
  name: string;
  icon: IconName;
}

// 示例文章数据类型
interface NewsItem {
  id: number;
  title: string;
  summary: string;
  source: string;
  time: string;
  image?: string;
  tag?: string;
}

// Banner 数据 - 使用 mock 网络图片
const bannerList = ref<BannerItem[]>([
  { id: 1, image: 'https://picsum.photos/750/500?random=1' },
  { id: 2, image: 'https://picsum.photos/750/500?random=2' },
  { id: 3, image: 'https://picsum.photos/750/500?random=3' },
]);

// 示例分类，接入业务时替换为实际入口
const categoryList = ref<CategoryItem[]>([
  { id: 1, name: '推荐', icon: 'star' },
  { id: 2, name: '热门', icon: 'fire' },
  { id: 3, name: '新品', icon: 'gift' },
  { id: 4, name: '活动', icon: 'calendar' },
  { id: 5, name: '会员', icon: 'vip' },
  { id: 6, name: '钱包', icon: 'wallet' },
  { id: 7, name: '消息', icon: 'chatbubble' },
  { id: 8, name: '帮助', icon: 'help' },
  { id: 9, name: '设置', icon: 'gear' },
  { id: 10, name: '更多', icon: 'more-filled' },
]);

// 示例文章数据，接入业务时替换为接口请求
const mockTitles = [
  '快速上手：从模板创建第一个页面',
  '多端适配：H5、微信与支付宝小程序的差异处理',
  '接口层实践：Orval 生成的 API 如何扩展',
  '主题系统：用 CSS 变量实现深浅色切换',
  '分包策略：控制小程序主包体积',
  '组件约定：easycom 自动注册与命名规范',
  '状态管理：Pinia Store 的组织方式',
  '路由守卫：登录拦截与页面权限',
  '测试实践：为组合式函数编写单元测试',
  '发布流程：小程序上传与 H5 部署',
];
const mockSources = ['示例作者 A', '示例作者 B', '示例作者 C'];
const mockTags = ['推荐', '教程', undefined];

// 使用 useList 管理示例文章列表
const {
  list: newsList,
  loading,
  noMore,
  error: loadError,
  loadData,
  refresh,
} = useList<NewsItem>({
  pageSize: 10,
  fetchData: async ({ page, pageSize }) => {
    // 模拟接口请求延迟
    await new Promise(resolve => setTimeout(resolve, 500));

    // 模拟最多 3 页数据
    if (page > 3) return [];

    const baseId = (page - 1) * pageSize;
    return Array.from({ length: pageSize }, (_, index) => ({
      id: baseId + index + 1,
      title: mockTitles[index % mockTitles.length],
      summary: '这是一段示例摘要，用于展示列表卡片的标题、摘要、作者与标签布局。',
      source: mockSources[index % mockSources.length],
      time: `${Math.floor(Math.random() * 23) + 1}小时前`,
      image: index % 3 === 0 ? `https://picsum.photos/200/150?random=${baseId + index + 1}` : undefined,
      tag: mockTags[index % mockTags.length],
    }));
  },
  hasMore: (data, page) => data.length > 0 && page < 3,
});

// 加载文章列表，失败由列表显示重试
async function loadNews() {
  try {
    await loadData();
  } catch (error) {
    console.error('加载文章失败:', error);
  }
}

// Banner 点击
function handleBannerClick(item: Record<string, any>, index: number) {
  console.log('点击 Banner:', item, index);
  uni.showToast({ title: `点击 Banner ${item.id}`, icon: 'none' });
}

// 分类点击
function handleCategoryClick(item: CategoryItem) {
  uni.showToast({ title: item.name, icon: 'none' });
}

// 文章点击
function handleNewsClick(item: NewsItem) {
  uni.showToast({ title: item.title, icon: 'none' });
}

// 页面加载
onLoad(() => {
  loadNews();
});

// 页面显示
onShow(() => {
  console.log('首页显示');
});

// 下拉刷新
onPullDownRefresh(async () => {
  try {
    await refresh();
  } catch (error) {
    console.error('刷新失败:', error);
  } finally {
    uni.stopPullDownRefresh();
  }
});

// 上拉加载更多
onReachBottom(() => {
  if (!noMore.value) {
    loadNews();
  }
});
</script>

<style scoped lang="scss">
.home-page {
  min-height: 100vh;
  background: var(--color-bg-grey);
}

// 导航栏左侧图标
.nav-left-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8rpx;

  &:active {
    opacity: 0.7;
  }
}

// 分类网格
.category-section {
  padding: 24rpx;
  background: var(--color-bg);

  .category-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 24rpx 0;

    .category-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12rpx;

      &:active {
        opacity: 0.7;
      }

      .category-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 96rpx;
        height: 96rpx;
        border-radius: 50%;
        background: var(--color-primary-bg);
      }

      .category-name {
        color: var(--color-text);
        font-size: 24rpx;
      }
    }
  }
}

// 示例文章列表
.news-list {
  padding: 20rpx;

  .news-item {
    display: flex;
    margin-bottom: 20rpx;
    gap: 20rpx;

    .news-content {
      flex: 1;
      min-width: 0;

      .news-title {
        display: -webkit-box;
        margin-bottom: 12rpx;
        overflow: hidden;
        color: var(--color-text);
        font-size: 30rpx;
        font-weight: 500;
        line-height: 1.4;
        text-overflow: ellipsis;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
      }

      .news-summary {
        display: -webkit-box;
        margin-bottom: 16rpx;
        overflow: hidden;
        color: var(--color-text-secondary);
        font-size: 26rpx;
        line-height: 1.5;
        text-overflow: ellipsis;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
      }

      .news-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 16rpx;
        align-items: center;

        .news-source {
          color: var(--color-primary);
          font-size: 24rpx;
        }

        .news-time {
          color: var(--color-text-placeholder);
          font-size: 24rpx;
        }

        .news-tag {
          padding: 4rpx 12rpx;
          border-radius: 4rpx;
          background: var(--color-primary-bg);
          color: var(--color-primary);
          font-size: 22rpx;
        }
      }
    }

    .news-image {
      flex-shrink: 0;
      width: 200rpx;
      height: 150rpx;
      border-radius: var(--radius-base);
    }
  }
}
</style>
