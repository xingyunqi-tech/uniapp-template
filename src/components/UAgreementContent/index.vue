<template>
  <!-- UAgreementContent - 协议正文：加载骨架、失败重试，HTML 经 mp-html 渲染 -->
  <view class="u-agreement-content">
    <USkeleton v-if="loading" type="detail" :paragraph-rows="skeletonRows" />
    <view v-else-if="error" class="u-agreement-content__error" @click="emit('retry')">
      <text>加载失败，点击重试</text>
    </view>
    <mp-html v-else :content="html" copy-link scroll-table :tag-style="tagStyle" :container-style="containerStyle" />
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
  name: 'UAgreementContent',
});

export interface UAgreementContentProps {
  /** 正文 HTML */
  content?: string;
  /** 是否加载中 */
  loading?: boolean;
  /** 是否加载失败 */
  error?: boolean;
  /** 骨架屏段落行数 */
  skeletonRows?: number;
}

const props = withDefaults(defineProps<UAgreementContentProps>(), {
  content: '',
  loading: false,
  error: false,
  skeletonRows: 8,
});

const emit = defineEmits<{
  retry: [];
}>();

const html = computed(() =>
  props.content.replace(/<(iframe|embed|object)\b[^>]*>[\s\S]*?<\/\1>|<(iframe|embed|object)\b[^>]*>/gi, ''),
);

const containerStyle = 'color: var(--color-text); font-size: 28rpx; line-height: 1.8; word-break: break-word;';
const tagStyle: Record<string, string> = {
  h1: 'margin: 32rpx 0 16rpx; font-size: 40rpx; font-weight: 600;',
  h2: 'margin: 32rpx 0 16rpx; font-size: 36rpx; font-weight: 600;',
  h3: 'margin: 28rpx 0 12rpx; font-size: 32rpx; font-weight: 600;',
  h4: 'margin: 24rpx 0 12rpx; font-size: 30rpx; font-weight: 600;',
  p: 'margin: 12rpx 0;',
  ul: 'padding-left: 40rpx;',
  ol: 'padding-left: 40rpx;',
  table: 'border-collapse: collapse;',
  tr: 'background-color: transparent;',
  th: 'padding: 12rpx; border: 1px solid var(--color-border); background-color: var(--color-bg-grey); white-space: nowrap;',
  td: 'padding: 12rpx; border: 1px solid var(--color-border);',
  blockquote: 'color: var(--color-text-secondary); border-left: 4px solid var(--color-border); padding-left: 16rpx;',
  code: 'background-color: var(--color-bg-grey); color: var(--color-text);',
  a: 'color: var(--color-text-link);',
  hr: 'border-color: var(--color-border);',
};
</script>

<style scoped lang="scss">
.u-agreement-content {
  width: 100%;

  &__error {
    padding: var(--spacing-xl) 0;
    color: var(--color-text-secondary);
    font-size: var(--font-size-base);
    text-align: center;
  }
}
</style>
