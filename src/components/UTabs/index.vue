<template>
  <view class="u-tabs" :class="tabsClasses">
    <!-- 可滚动模式 -->
    <scroll-view v-if="scrollable" scroll-x class="u-tabs__scroll">
      <view class="u-tabs__list">
        <view
          v-for="tab in tabs"
          :key="tab.value"
          class="u-tabs__item"
          :class="getItemClasses(tab)"
          @click="handleTabClick(tab)"
        >
          <text class="u-tabs__text">{{ tab.label }}</text>
          <view v-if="tab.badge && tab.badge > 0" class="u-tabs__badge">
            {{ tab.badge > 99 ? '99+' : tab.badge }}
          </view>
        </view>
      </view>
    </scroll-view>
    <!-- 非滚动模式 -->
    <view v-else>
      <view class="u-tabs__list u-tabs__list--flex">
        <view
          v-for="tab in tabs"
          :key="tab.value"
          class="u-tabs__item"
          :class="getItemClasses(tab)"
          @click="handleTabClick(tab)"
        >
          <text class="u-tabs__text">{{ tab.label }}</text>
          <view v-if="tab.badge && tab.badge > 0" class="u-tabs__badge">
            {{ tab.badge > 99 ? '99+' : tab.badge }}
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
definePage({
  meta: {
    isComponent: true,
  },
});

import { computed } from 'vue';

defineOptions({
  name: 'UTabs',
});

// ==================== Types ====================

/** Tab 值类型 */
export type TabValue = string | number;

/** Tab 类型: line 下划线 | card 卡片 */
export type TabType = 'line' | 'card';

export interface TabItem {
  /** 标签文本 */
  label: string;
  /** 标签值 */
  value: TabValue;
  /** 角标数量 */
  badge?: number;
  /** 是否禁用 */
  disabled?: boolean;
}

// ==================== Props ====================

interface Props {
  /** 当前选中值 */
  modelValue: TabValue;
  /** 标签列表 */
  tabs: TabItem[];
  /** 是否可滚动 */
  scrollable?: boolean;
  /** 标签类型: line 下划线 | card 卡片 */
  type?: TabType;
}

const props = withDefaults(defineProps<Props>(), {
  scrollable: false,
  type: 'line',
});

// ==================== Emits ====================

const emit = defineEmits<{
  'update:modelValue': [value: TabValue];
  change: [tab: TabItem];
}>();

// ==================== Computed ====================

// 容器样式类
const tabsClasses = computed(() => ({
  'u-tabs--scrollable': props.scrollable,
  'u-tabs--card': props.type === 'card',
}));

// ==================== Methods ====================

// 获取标签项样式类
function getItemClasses(tab: TabItem) {
  return {
    'u-tabs__item--active': props.modelValue === tab.value,
    'u-tabs__item--disabled': tab.disabled,
  };
}

function handleTabClick(tab: TabItem) {
  if (tab.disabled) return;
  emit('update:modelValue', tab.value);
  emit('change', tab);
}
</script>

<style scoped lang="scss">
.u-tabs {
  background: var(--color-bg);
  box-shadow: var(--shadow-sm);

  &__scroll {
    white-space: nowrap;
  }

  &__list {
    display: inline-flex;
    padding: 0 var(--spacing-sm);

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
    padding: 0 var(--spacing-lg);
    transition: all var(--duration-fast);
    cursor: pointer;

    &--active {
      .u-tabs__text {
        color: var(--color-primary);
        font-weight: 500;
      }

      &::after {
        content: '';
        position: absolute;
        right: var(--spacing-lg);
        bottom: 0;
        left: var(--spacing-lg);
        height: var(--border-width-bold);
        border-radius: var(--radius-sm);
        background: var(--color-primary);
      }
    }

    &--disabled {
      opacity: 0.5;
      cursor: not-allowed;

      .u-tabs__text {
        color: var(--color-text-disabled);
      }
    }
  }

  &__text {
    transition: color var(--duration-fast);
    color: var(--color-text-secondary);
    font-size: var(--font-size-base);
  }

  &__badge {
    position: absolute;
    top: var(--spacing-sm);
    right: var(--spacing-xs);
    min-width: 32rpx;
    height: 32rpx;
    padding: 0 var(--spacing-xs);
    border-radius: var(--radius-full);
    background: var(--color-error);
    color: var(--color-text-inverse);
    font-size: var(--font-size-xs);
    line-height: 32rpx;
    text-align: center;
  }

  // 可滚动模式下不需要 flex:1
  &--scrollable {
    .u-tabs__item {
      flex: none;
    }
  }

  // 卡片类型样式
  &--card {
    padding: var(--spacing-xs);
    border-radius: var(--radius-lg);
    background: var(--color-bg-grey);
    box-shadow: none;

    .u-tabs__list {
      gap: var(--spacing-xs);
      padding: 0;
    }

    .u-tabs__item {
      height: 72rpx;
      padding: 0 var(--spacing-base);
      border-radius: var(--radius-base);
      background: transparent;

      &--active {
        background: var(--color-bg);
        box-shadow: var(--shadow-sm);

        &::after {
          display: none;
        }

        .u-tabs__text {
          color: var(--color-primary);
        }
      }
    }
  }
}
</style>
