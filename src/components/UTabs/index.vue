<route lang="json5">
{
  meta: {
    isComponent: true,
  },
}
</route>

<template>
  <view class="u-tabs" :class="{ 'u-tabs--scrollable': scrollable }">
    <scroll-view v-if="scrollable" scroll-x class="u-tabs__scroll">
      <view class="u-tabs__list">
        <view
          v-for="tab in tabs"
          :key="tab.value"
          class="u-tabs__item"
          :class="{ 'u-tabs__item--active': modelValue === tab.value }"
          @click="handleTabClick(tab)"
        >
          <text class="u-tabs__text">{{ tab.label }}</text>
          <view v-if="tab.badge && tab.badge > 0" class="u-tabs__badge">
            {{ tab.badge > 99 ? '99+' : tab.badge }}
          </view>
        </view>
      </view>
    </scroll-view>
    <view v-else class="u-tabs__list u-tabs__list--flex">
      <view
        v-for="tab in tabs"
        :key="tab.value"
        class="u-tabs__item"
        :class="{ 'u-tabs__item--active': modelValue === tab.value }"
        @click="handleTabClick(tab)"
      >
        <text class="u-tabs__text">{{ tab.label }}</text>
        <view v-if="tab.badge && tab.badge > 0" class="u-tabs__badge">
          {{ tab.badge > 99 ? '99+' : tab.badge }}
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
export interface TabItem {
  /** 标签文本 */
  label: string;
  /** 标签值 */
  value: string | number;
  /** 角标数量 */
  badge?: number;
  /** 是否禁用 */
  disabled?: boolean;
}

interface Props {
  /** 当前选中值 */
  modelValue: string | number;
  /** 标签列表 */
  tabs: TabItem[];
  /** 是否可滚动 */
  scrollable?: boolean;
  /** 标签类型: line 下划线 | card 卡片 */
  type?: 'line' | 'card';
}

const props = withDefaults(defineProps<Props>(), {
  scrollable: false,
  type: 'line',
});

const emit = defineEmits<{
  'update:modelValue': [value: string | number];
  change: [tab: TabItem];
}>();

function handleTabClick(tab: TabItem) {
  if (tab.disabled) return;
  emit('update:modelValue', tab.value);
  emit('change', tab);
}
</script>

<style scoped lang="scss">
.u-tabs {
  background: $uni-bg-color;
  box-shadow: $uni-shadow-sm;

  &__scroll {
    white-space: nowrap;
  }

  &__list {
    display: inline-flex;
    padding: 0 16rpx;

    &--flex {
      display: flex;
      width: 100%;
      padding: 0;
    }
  }

  &__item {
    display: inline-flex;
    position: relative;
    flex: 1;
    align-items: center;
    justify-content: center;
    height: 96rpx;
    padding: 0 32rpx;
    cursor: pointer;

    &--active {
      .u-tabs__text {
        color: $uni-color-primary;
        font-weight: 500;
      }

      &::after {
        content: '';
        position: absolute;
        right: 32rpx;
        bottom: 0;
        left: 32rpx;
        height: 4rpx;
        border-radius: 2rpx;
        background: $uni-color-primary;
      }
    }
  }

  &__text {
    transition: color $uni-duration-fast;
    color: $uni-text-color-secondary;
    font-size: 28rpx;
  }

  &__badge {
    position: absolute;
    top: 16rpx;
    right: 8rpx;
    min-width: 32rpx;
    height: 32rpx;
    padding: 0 8rpx;
    border-radius: 16rpx;
    background: $uni-color-error;
    color: #fff;
    font-size: 20rpx;
    line-height: 32rpx;
    text-align: center;
  }

  // 可滚动模式下不需要 flex:1
  &--scrollable {
    .u-tabs__item {
      flex: none;
    }
  }
}
</style>
