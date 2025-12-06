<route lang="json5">
{
  meta: {
    isComponent: true,
  },
}
</route>

<template>
  <!--
    USkeleton - 骨架屏组件
    用于数据加载时显示占位效果，提升用户体验
    支持多种预设类型和自定义布局
  -->
  <view v-if="loading" class="u-skeleton" :class="{ 'u-skeleton--animated': animated }">
    <!-- 预设类型 -->
    <template v-if="type !== 'custom'">
      <!-- 列表类型 -->
      <template v-if="type === 'list'">
        <view v-for="i in rows" :key="i" class="u-skeleton__list-item">
          <view v-if="avatar" class="u-skeleton__avatar" :class="`u-skeleton__avatar--${avatarShape}`" />
          <view class="u-skeleton__content">
            <view class="u-skeleton__title" />
            <view class="u-skeleton__paragraph">
              <view v-for="j in paragraphRows" :key="j" class="u-skeleton__row" :style="getRowStyle(j)" />
            </view>
          </view>
        </view>
      </template>

      <!-- 卡片类型 -->
      <template v-else-if="type === 'card'">
        <view v-for="i in rows" :key="i" class="u-skeleton__card">
          <view class="u-skeleton__card-cover" />
          <view class="u-skeleton__card-content">
            <view class="u-skeleton__title" />
            <view class="u-skeleton__row" style="width: 60%" />
          </view>
        </view>
      </template>

      <!-- 表单类型 -->
      <template v-else-if="type === 'form'">
        <view v-for="i in rows" :key="i" class="u-skeleton__form-item">
          <view class="u-skeleton__label" />
          <view class="u-skeleton__input" />
        </view>
      </template>

      <!-- 详情类型 -->
      <template v-else-if="type === 'detail'">
        <view class="u-skeleton__detail">
          <view class="u-skeleton__detail-header">
            <view v-if="avatar" class="u-skeleton__avatar u-skeleton__avatar--large" />
            <view class="u-skeleton__detail-info">
              <view class="u-skeleton__title" style="width: 50%" />
              <view class="u-skeleton__row" style="width: 30%" />
            </view>
          </view>
          <view class="u-skeleton__paragraph">
            <view v-for="i in paragraphRows" :key="i" class="u-skeleton__row" :style="getRowStyle(i)" />
          </view>
        </view>
      </template>
    </template>

    <!-- 自定义内容 -->
    <template v-else>
      <slot />
    </template>
  </view>

  <!-- 真实内容 -->
  <slot v-else name="content" />
</template>

<script setup lang="ts">
defineOptions({
  name: 'USkeleton',
});

// ==================== Types ====================

export type SkeletonType = 'list' | 'card' | 'form' | 'detail' | 'custom';
export type AvatarShape = 'circle' | 'square';

// ==================== Props ====================

interface Props {
  /** 是否显示骨架屏 */
  loading?: boolean;
  /** 骨架屏类型 */
  type?: SkeletonType;
  /** 是否显示动画 */
  animated?: boolean;
  /** 是否显示头像 */
  avatar?: boolean;
  /** 头像形状 */
  avatarShape?: AvatarShape;
  /** 行数 (列表/卡片/表单的重复次数) */
  rows?: number;
  /** 段落行数 */
  paragraphRows?: number;
}

const props = withDefaults(defineProps<Props>(), {
  loading: true,
  type: 'list',
  animated: true,
  avatar: false,
  avatarShape: 'circle',
  rows: 3,
  paragraphRows: 3,
});

// ==================== Methods ====================

/** 获取段落行样式 (最后一行宽度较短) */
function getRowStyle(index: number) {
  if (index === props.paragraphRows) {
    return { width: '60%' };
  }
  return {};
}
</script>

<style scoped lang="scss">
$skeleton-color: var(--color-bg-grey);
$skeleton-highlight: var(--color-bg);

.u-skeleton {
  width: 100%;

  // 动画效果
  &--animated {
    .u-skeleton__avatar,
    .u-skeleton__title,
    .u-skeleton__row,
    .u-skeleton__card-cover,
    .u-skeleton__label,
    .u-skeleton__input {
      animation: skeleton-loading 1.5s infinite;
      background: linear-gradient(90deg, $skeleton-color 25%, $skeleton-highlight 50%, $skeleton-color 75%);
      background-size: 200% 100%;
    }
  }

  // 头像
  &__avatar {
    flex-shrink: 0;
    width: 80rpx;
    height: 80rpx;
    margin-right: 24rpx;
    border-radius: 8rpx;
    background: $skeleton-color;

    &--circle {
      border-radius: 50%;
    }

    &--square {
      border-radius: 8rpx;
    }

    &--large {
      width: 120rpx;
      height: 120rpx;
    }
  }

  // 内容区
  &__content {
    flex: 1;
    min-width: 0;
  }

  // 标题
  &__title {
    width: 40%;
    height: 32rpx;
    margin-bottom: 24rpx;
    border-radius: 4rpx;
    background: $skeleton-color;
  }

  // 段落
  &__paragraph {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
  }

  // 行
  &__row {
    width: 100%;
    height: 28rpx;
    border-radius: 4rpx;
    background: $skeleton-color;
  }

  // 列表项
  &__list-item {
    display: flex;
    padding: 24rpx 0;
    border-bottom: 1rpx solid var(--color-border);

    &:last-child {
      border-bottom: none;
    }
  }

  // 卡片
  &__card {
    margin-bottom: 24rpx;
    overflow: hidden;
    border-radius: 16rpx;
    background: var(--color-bg);
    box-shadow: var(--shadow-sm);

    &:last-child {
      margin-bottom: 0;
    }
  }

  &__card-cover {
    width: 100%;
    height: 300rpx;
    background: $skeleton-color;
  }

  &__card-content {
    padding: 24rpx;
  }

  // 表单项
  &__form-item {
    display: flex;
    align-items: center;
    padding: 24rpx 0;
    border-bottom: 1rpx solid var(--color-border);

    &:last-child {
      border-bottom: none;
    }
  }

  &__label {
    flex-shrink: 0;
    width: 160rpx;
    height: 32rpx;
    margin-right: 24rpx;
    border-radius: 4rpx;
    background: $skeleton-color;
  }

  &__input {
    flex: 1;
    height: 64rpx;
    border-radius: 8rpx;
    background: $skeleton-color;
  }

  // 详情
  &__detail {
    padding: 24rpx;
  }

  &__detail-header {
    display: flex;
    align-items: center;
    margin-bottom: 32rpx;
  }

  &__detail-info {
    flex: 1;
  }
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}
</style>
