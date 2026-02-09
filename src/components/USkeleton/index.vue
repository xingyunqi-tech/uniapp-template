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
definePage({
  meta: {
    isComponent: true,
  },
});

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
    margin-right: var(--spacing-base);
    border-radius: var(--radius-base);
    background: $skeleton-color;

    &--circle {
      border-radius: var(--radius-circle);
    }

    &--square {
      border-radius: var(--radius-base);
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
    height: var(--font-size-lg);
    margin-bottom: var(--spacing-base);
    border-radius: var(--radius-sm);
    background: $skeleton-color;
  }

  // 段落
  &__paragraph {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  // 行
  &__row {
    width: 100%;
    height: var(--font-size-base);
    border-radius: var(--radius-sm);
    background: $skeleton-color;
  }

  // 列表项
  &__list-item {
    display: flex;
    padding: var(--spacing-base) 0;
    border-bottom: var(--border-width-base) solid var(--color-border);

    &:last-child {
      border-bottom: none;
    }
  }

  // 卡片
  &__card {
    margin-bottom: var(--spacing-base);
    overflow: hidden;
    border-radius: var(--radius-lg);
    background: var(--color-bg-card);
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
    padding: var(--spacing-base);
  }

  // 表单项
  &__form-item {
    display: flex;
    align-items: center;
    padding: var(--spacing-base) 0;
    border-bottom: var(--border-width-base) solid var(--color-border);

    &:last-child {
      border-bottom: none;
    }
  }

  &__label {
    flex-shrink: 0;
    width: 160rpx;
    height: var(--font-size-lg);
    margin-right: var(--spacing-base);
    border-radius: var(--radius-sm);
    background: $skeleton-color;
  }

  &__input {
    flex: 1;
    height: var(--spacing-xxl);
    border-radius: var(--radius-base);
    background: $skeleton-color;
  }

  // 详情
  &__detail {
    padding: var(--spacing-base);
  }

  &__detail-header {
    display: flex;
    align-items: center;
    margin-bottom: var(--spacing-lg);
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
