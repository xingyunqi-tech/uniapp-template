<template>
  <!--
    UPageState - 页面状态容器
    按 loading > error > empty > 内容 的优先级切换页面主体
  -->
  <view class="u-page-state" :class="{ 'u-page-state--full': fullHeight }">
    <template v-if="state === 'loading'">
      <slot v-if="$slots.loading" name="loading" />
      <view v-else class="u-page-state__panel u-page-state__panel--loading">
        <ULoading visible :fullscreen="false" :text="loadingText" mask-background="transparent" />
      </view>
    </template>

    <template v-else-if="state === 'error'">
      <slot v-if="$slots.error" name="error" />
      <view v-else class="u-page-state__panel">
        <UEmpty v-if="hasErrorAction" :type="errorType" :icon="errorIcon" :text="errorMessage">
          <view class="u-page-state__actions">
            <UButton v-if="showRetry" type="primary" size="small" :text="retryText" @click="emit('retry')" />
            <slot name="error-action" />
          </view>
        </UEmpty>
        <UEmpty v-else :type="errorType" :icon="errorIcon" :text="errorMessage" />
      </view>
    </template>

    <template v-else-if="state === 'empty'">
      <slot v-if="$slots.empty" name="empty" />
      <view v-else class="u-page-state__panel">
        <UEmpty v-if="$slots['empty-action']" :type="emptyType" :icon="emptyIcon" :text="emptyText">
          <slot name="empty-action" />
        </UEmpty>
        <UEmpty v-else :type="emptyType" :icon="emptyIcon" :text="emptyText" />
      </view>
    </template>

    <slot v-else />
  </view>
</template>

<script setup lang="ts">
definePage({
  meta: {
    isComponent: true,
  },
});

import { computed, ref, useSlots, watch } from 'vue';
import type { IconName } from '../UIcon/index.vue';

defineOptions({
  name: 'UPageState',
  options: {
    virtualHost: true,
  },
});

export type PageStateType = 'loading' | 'error' | 'empty' | 'content';
type EmptyType = 'default' | 'search' | 'network' | 'error' | 'cart' | 'message';

export interface UPageStateProps {
  /** 是否加载中 */
  loading?: boolean;
  /** 是否加载失败，非空字符串作为错误文案，空字符串视为无错误 */
  error?: string | boolean;
  /** 是否为空 */
  empty?: boolean;
  /** 已展示过内容时，加载中保留内容不切换为加载态 */
  keepContentOnLoading?: boolean;
  /** 加载文字 */
  loadingText?: string;
  /** 空状态文字 */
  emptyText?: string;
  /** 空状态类型 */
  emptyType?: EmptyType;
  /** 空状态图标，覆盖 emptyType 对应的图标 */
  emptyIcon?: IconName;
  /** 错误默认文案，error 为字符串时以其为准 */
  errorText?: string;
  /** 错误状态类型 */
  errorType?: EmptyType;
  /** 错误状态图标，覆盖 errorType 对应的图标 */
  errorIcon?: IconName;
  /** 是否显示重试按钮 */
  showRetry?: boolean;
  /** 重试按钮文字 */
  retryText?: string;
  /** 撑满父容器剩余高度（父容器需为纵向 flex） */
  fullHeight?: boolean;
}

const props = withDefaults(defineProps<UPageStateProps>(), {
  loading: false,
  error: false,
  empty: false,
  keepContentOnLoading: false,
  loadingText: '',
  emptyText: '暂无数据',
  emptyType: 'default',
  emptyIcon: undefined,
  errorText: '加载失败',
  errorType: 'network',
  errorIcon: undefined,
  showRetry: true,
  retryText: '重新加载',
  fullHeight: false,
});

const emit = defineEmits<{
  retry: [];
}>();

const slots = useSlots();

/** 最近一次非加载状态 */
const settledState = ref<Exclude<PageStateType, 'loading'> | null>(null);

const state = computed<PageStateType>(() => {
  if (props.loading) {
    return props.keepContentOnLoading && settledState.value === 'content' ? 'content' : 'loading';
  }
  if (props.error !== false && props.error !== '') return 'error';
  if (props.empty) return 'empty';
  return 'content';
});

watch(
  state,
  value => {
    if (value !== 'loading') settledState.value = value;
  },
  { immediate: true },
);

const errorMessage = computed(() => (typeof props.error === 'string' && props.error ? props.error : props.errorText));

const hasErrorAction = computed(() => props.showRetry || !!slots['error-action']);

defineExpose({
  state,
});
</script>

<style scoped lang="scss">
.u-page-state {
  &--full {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;

    .u-page-state__panel {
      flex: 1;
    }
  }

  &__panel {
    display: flex;
    position: relative;
    box-sizing: border-box;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;

    &--loading {
      min-height: 400rpx;
    }
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--spacing-base);
  }
}
</style>
