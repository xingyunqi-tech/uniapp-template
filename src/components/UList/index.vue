<template>
  <!--
    UList - 分页列表状态容器
    统一首次加载、空状态、加载失败重试与底部加载更多状态；滚动与数据加载由页面负责
  -->
  <view class="u-list">
    <template v-if="empty">
      <view v-if="loading" class="u-list__state">
        <ULoadMore status="loading" />
      </view>
      <UEmpty v-else-if="error" type="error" :text="errorText">
        <UButton type="primary" size="small" text="重试" @click="emit('retry')" />
      </UEmpty>
      <slot v-else-if="$slots.empty" name="empty" />
      <UEmpty v-else :type="emptyType" :icon="emptyIcon" :text="emptyText" />
    </template>
    <template v-else>
      <slot />
      <view v-if="error" class="u-list__footer-error" @click="emit('retry')">
        <text>加载失败，点击重试</text>
      </view>
      <ULoadMore v-else :status="loadMoreStatus" />
    </template>
  </view>
</template>

<script setup lang="ts">
definePage({
  meta: {
    isComponent: true,
  },
});

import { computed } from 'vue';
import type { LoadMoreStatus } from '../ULoadMore/index.vue';
import type { IconName } from '../UIcon/index.vue';

defineOptions({
  name: 'UList',
  options: {
    virtualHost: true,
  },
});

export interface UListProps {
  /** 列表是否为空 */
  empty: boolean;
  /** 是否正在加载 */
  loading?: boolean;
  /** 是否已加载全部数据 */
  finished?: boolean;
  /** 最近一次加载是否失败 */
  error?: boolean;
  /** 空状态文字 */
  emptyText?: string;
  /** 空状态类型 */
  emptyType?: 'default' | 'search' | 'network' | 'error' | 'cart' | 'message';
  /** 空状态图标，覆盖 emptyType 对应的图标 */
  emptyIcon?: IconName;
  /** 首次加载失败的文字 */
  errorText?: string;
}

const props = withDefaults(defineProps<UListProps>(), {
  loading: false,
  finished: false,
  error: false,
  emptyText: '暂无数据',
  emptyType: 'default',
  emptyIcon: undefined,
  errorText: '加载失败，请重试',
});

const emit = defineEmits<{
  retry: [];
}>();

const loadMoreStatus = computed<LoadMoreStatus>(() => {
  if (props.loading) return 'loading';
  if (props.finished) return 'nomore';
  return 'loadmore';
});
</script>

<style scoped lang="scss">
.u-list {
  &__state {
    padding: var(--spacing-xxl) 0;
  }

  &__footer-error {
    padding: var(--spacing-lg) 0;
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    text-align: center;
  }
}
</style>
