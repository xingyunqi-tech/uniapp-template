<route lang="json5" type="home">
{
  style: {
    navigationBarTitleText: '首页',
    enablePullDownRefresh: true,
  },
}
</route>

<template>
  <view class="home-page" :class="globalStore.themeClass">
    <!-- Banner 轮播 -->
    <UBanner :list="bannerList" :height="300" @click="handleBannerClick" />

    <!-- 分类标签 -->
    <scroll-view class="category-scroll" scroll-x :show-scrollbar="false">
      <view class="category-list">
        <view
          v-for="item in categoryList"
          :key="item.id"
          class="category-item"
          :class="{ active: activeCategory === item.id }"
          @click="handleCategoryClick(item)"
        >
          <text class="category-name">{{ item.name }}</text>
        </view>
      </view>
    </scroll-view>

    <!-- 时政卡片列表 -->
    <view class="news-list">
      <view v-for="item in newsList" :key="item.id" class="news-item" @click="handleNewsClick(item)">
        <view class="news-content">
          <text class="news-title">{{ item.title }}</text>
          <text class="news-summary">{{ item.summary }}</text>
          <view class="news-meta">
            <text class="news-source">{{ item.source }}</text>
            <text class="news-time">{{ item.time }}</text>
            <text v-if="item.questionCount" class="news-questions">{{ item.questionCount }}道题</text>
          </view>
        </view>
        <image v-if="item.image" class="news-image" :src="item.image" mode="aspectFill" />
      </view>
    </view>

    <!-- 加载更多 -->
    <ULoadMore :status="loadMoreStatus" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onLoad, onShow, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import { useList } from '@/composables';
import { useGlobalStore } from '@/store/modules/global';
import { UBanner, ULoadMore } from '@/components';
import type { LoadMoreStatus } from '@/components';

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
}

// 时政新闻数据类型
interface NewsItem {
  id: number;
  title: string;
  summary: string;
  source: string;
  time: string;
  image?: string;
  questionCount?: number;
}

// Banner 数据
const bannerList = ref<BannerItem[]>([
  { id: 1, image: '/static/images/banner_1.png' },
  { id: 2, image: '/static/images/banner_2.png' },
  { id: 3, image: '/static/images/banner_3.png' },
]);

// 试题分类数据
const categoryList = ref<CategoryItem[]>([
  { id: 0, name: '全部' },
  { id: 1, name: '时事政治' },
  { id: 2, name: '行政能力' },
  { id: 3, name: '申论写作' },
  { id: 4, name: '公共基础' },
  { id: 5, name: '法律常识' },
  { id: 6, name: '经济金融' },
]);

// 当前选中分类
const activeCategory = ref(0);

// 模拟数据
const mockTitles = [
  '深入学习贯彻党的二十大精神，推动高质量发展',
  '国务院常务会议部署推进重点领域改革工作',
  '全国两会热点解读：民生实事如何落地',
  '新时代中国特色社会主义思想学习要点',
  '乡村振兴战略实施取得显著成效',
  '科技创新驱动发展战略深入推进',
  '生态文明建设迈上新台阶',
  '共同富裕示范区建设稳步推进',
  '高水平对外开放持续深化',
  '数字经济发展迎来新机遇',
];
const mockSources = ['新华社', '人民日报', '央视新闻', '光明日报', '经济日报'];

// 使用 useList 管理新闻列表
const {
  list: newsList,
  loading,
  noMore,
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
      summary: '这是一段时政新闻摘要，概述了新闻的主要内容和核心观点，帮助用户快速了解时政动态...',
      source: mockSources[index % mockSources.length],
      time: `${Math.floor(Math.random() * 24)}小时前`,
      image:
        index % 3 === 0
          ? `https://via.placeholder.com/200x150/${['1989fa', '07c160', 'ff976a'][index % 3]}/ffffff?text=时政${baseId + index + 1}`
          : undefined,
      questionCount: Math.random() > 0.5 ? Math.floor(Math.random() * 20) + 5 : undefined,
    }));
  },
  hasMore: (data, page) => data.length > 0 && page < 3,
});

// 加载更多状态
const loadMoreStatus = computed<LoadMoreStatus>(() => {
  if (loading.value) return 'loading';
  if (noMore.value) return 'nomore';
  return 'loadmore';
});

// Banner 点击
function handleBannerClick(item: Record<string, any>, index: number) {
  console.log('点击 Banner:', item, index);
  uni.showToast({ title: `点击 Banner ${item.id}`, icon: 'none' });
}

// 分类点击
function handleCategoryClick(item: CategoryItem) {
  activeCategory.value = item.id;
  // 切换分类时刷新数据
  refresh();
}

// 时政新闻点击
function handleNewsClick(item: NewsItem) {
  console.log('点击新闻:', item);
  uni.showToast({ title: item.title, icon: 'none' });
}

// 页面加载
onLoad(() => {
  loadData();
});

// 页面显示
onShow(() => {
  console.log('首页显示');
});

// 下拉刷新
onPullDownRefresh(async () => {
  await refresh();
  uni.stopPullDownRefresh();
});

// 上拉加载更多
onReachBottom(() => {
  if (!noMore.value) {
    loadData();
  }
});
</script>

<style scoped lang="scss">
.home-page {
  min-height: 100vh;
  padding-bottom: calc(env(safe-area-inset-bottom) + 20rpx);
  background: var(--color-bg-grey);
}

// 分类标签
.category-scroll {
  width: 100%;
  background: var(--color-bg);
  white-space: nowrap;

  .category-list {
    display: inline-flex;
    gap: 8rpx;
    padding: 24rpx 32rpx;

    .category-item {
      flex-shrink: 0;
      padding: 16rpx 32rpx;
      transition: all var(--duration-fast);
      border-radius: 32rpx;
      background: var(--color-bg-grey);

      &.active {
        background: var(--color-primary);

        .category-name {
          color: var(--color-text-inverse);
        }
      }

      .category-name {
        color: var(--color-text);
        font-size: 28rpx;
      }
    }
  }
}

// 时政新闻列表
.news-list {
  padding: 20rpx;

  .news-item {
    display: flex;
    margin-bottom: 20rpx;
    padding: 24rpx;
    transition: all var(--duration-fast);
    border-radius: var(--radius-lg);
    background: var(--color-bg);
    box-shadow: var(--shadow-sm);
    gap: 20rpx;

    &:active {
      background: var(--color-bg-hover);
    }

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

        .news-questions {
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
