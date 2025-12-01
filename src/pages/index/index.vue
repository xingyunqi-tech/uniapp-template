<route lang="json5" type="home">
{
  style: {
    navigationBarTitleText: '首页',
    enablePullDownRefresh: true,
  },
}
</route>

<template>
  <view class="home-page">
    <!-- Banner 轮播 -->
    <swiper
      class="banner-swiper"
      :indicator-dots="true"
      :autoplay="true"
      :interval="3000"
      :duration="500"
      indicator-color="rgba(255, 255, 255, 0.5)"
      indicator-active-color="#ffffff"
      circular
    >
      <swiper-item v-for="item in bannerList" :key="item.id" @click="handleBannerClick(item)">
        <image class="banner-image" :src="item.image" mode="aspectFill" />
      </swiper-item>
    </swiper>

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
    <view class="load-more">
      <text v-if="loading" class="load-text">加载中...</text>
      <text v-else-if="noMore" class="load-text">没有更多了</text>
      <text v-else class="load-text">上拉加载更多</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad, onShow, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';

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
  { id: 1, image: 'https://via.placeholder.com/750x300/1989fa/ffffff?text=时政热点' },
  { id: 2, image: 'https://via.placeholder.com/750x300/07c160/ffffff?text=备考指南' },
  { id: 3, image: 'https://via.placeholder.com/750x300/ff976a/ffffff?text=每日一练' },
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

// 时政新闻列表数据
const newsList = ref<NewsItem[]>([]);

// 加载状态
const loading = ref(false);
const noMore = ref(false);
const page = ref(1);

// 生成模拟数据
function generateMockNews(pageNum: number): NewsItem[] {
  const baseId = (pageNum - 1) * 10;
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

  return Array.from({ length: 10 }, (_, index) => ({
    id: baseId + index + 1,
    title: mockTitles[index % mockTitles.length],
    summary: '这是一段时政新闻摘要，概述了新闻的主要内容和核心观点，帮助用户快速了解时政动态...',
    source: mockSources[index % mockSources.length],
    time: `${Math.floor(Math.random() * 24)}小时前`,
    image: index % 3 === 0 ? `https://via.placeholder.com/200x150/${['1989fa', '07c160', 'ff976a'][index % 3]}/ffffff?text=时政${baseId + index + 1}` : undefined,
    questionCount: Math.random() > 0.5 ? Math.floor(Math.random() * 20) + 5 : undefined,
  }));
}

// 加载数据
async function loadData(isRefresh = false) {
  if (loading.value) return;

  if (isRefresh) {
    page.value = 1;
    noMore.value = false;
  }

  loading.value = true;

  try {
    // 模拟接口请求延迟
    await new Promise(resolve => setTimeout(resolve, 500));

    const newData = generateMockNews(page.value);

    if (isRefresh) {
      newsList.value = newData;
    } else {
      newsList.value.push(...newData);
    }

    // 模拟最多加载 3 页
    if (page.value >= 3) {
      noMore.value = true;
    } else {
      page.value++;
    }
  } finally {
    loading.value = false;
  }
}

// Banner 点击
function handleBannerClick(item: BannerItem) {
  console.log('点击 Banner:', item);
  uni.showToast({ title: `点击 Banner ${item.id}`, icon: 'none' });
}

// 分类点击
function handleCategoryClick(item: CategoryItem) {
  activeCategory.value = item.id;
  // 切换分类时重新加载数据
  loadData(true);
}

// 时政新闻点击
function handleNewsClick(item: NewsItem) {
  console.log('点击新闻:', item);
  uni.showToast({ title: item.title, icon: 'none' });
}

// 页面加载
onLoad(() => {
  loadData(true);
});

// 页面显示
onShow(() => {
  console.log('首页显示');
});

// 下拉刷新
onPullDownRefresh(async () => {
  await loadData(true);
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
  background: $uni-bg-color-grey;
}

// Banner 轮播
.banner-swiper {
  width: 100%;
  height: 300rpx;

  .banner-image {
    width: 100%;
    height: 100%;
  }
}

// 分类标签
.category-scroll {
  width: 100%;
  background: $uni-bg-color;
  white-space: nowrap;

  .category-list {
    display: inline-flex;
    gap: 8rpx;
    padding: 24rpx 32rpx;

    .category-item {
      flex-shrink: 0;
      padding: 16rpx 32rpx;
      transition: all $uni-duration-fast;
      border-radius: 32rpx;
      background: $uni-bg-color-grey;

      &.active {
        background: $uni-color-primary;

        .category-name {
          color: #fff;
        }
      }

      .category-name {
        color: $uni-text-color;
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
    transition: all $uni-duration-fast;
    border-radius: $uni-border-radius-lg;
    background: $uni-bg-color;
    box-shadow: $uni-shadow-sm;
    gap: 20rpx;

    &:active {
      background: $uni-bg-color-hover;
    }

    .news-content {
      flex: 1;
      min-width: 0;

      .news-title {
        display: -webkit-box;
        margin-bottom: 12rpx;
        overflow: hidden;
        color: $uni-text-color;
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
        color: $uni-text-color-secondary;
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
          color: $uni-color-primary;
          font-size: 24rpx;
        }

        .news-time {
          color: $uni-text-color-placeholder;
          font-size: 24rpx;
        }

        .news-questions {
          padding: 4rpx 12rpx;
          border-radius: 4rpx;
          background: rgb(25 137 250 / 0.1);
          color: $uni-color-primary;
          font-size: 22rpx;
        }
      }
    }

    .news-image {
      flex-shrink: 0;
      width: 200rpx;
      height: 150rpx;
      border-radius: $uni-border-radius-base;
    }
  }
}

// 加载更多
.load-more {
  padding: 32rpx;
  text-align: center;

  .load-text {
    color: $uni-text-color-placeholder;
    font-size: 26rpx;
  }
}
</style>
