<template>
  <view class="u-rich-text" :class="{ 'u-rich-text--selectable': selectable }">
    <rich-text :nodes="parsedNodes" :selectable="selectable" :space="space" @itemclick="handleItemClick" />
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  /** 富文本内容 (HTML 字符串或 nodes 数组) */
  content?: string | object[];
  /** 是否可选中 */
  selectable?: boolean;
  /** 显示连续空格 none | ensp | emsp | nbsp */
  space?: 'none' | 'ensp' | 'emsp' | 'nbsp';
}

interface Emits {
  (e: 'itemclick', detail: { node: object }): void;
}

const props = withDefaults(defineProps<Props>(), {
  content: '',
  selectable: true,
  space: 'nbsp',
});

const emit = defineEmits<Emits>();

// 解析内容
const parsedNodes = computed(() => {
  if (!props.content) return [];

  // 如果是数组，直接返回
  if (Array.isArray(props.content)) {
    return props.content;
  }

  // 如果是字符串，进行预处理
  let html = props.content;

  // 处理图片：添加最大宽度限制
  html = html.replace(/<img/gi, '<img style="max-width:100%;height:auto;"');

  // 处理视频标签（小程序不支持，转换为提示）
  html = html.replace(
    /<video[^>]*>.*?<\/video>/gi,
    '<p style="color:#999;text-align:center;">[视频内容请在APP中查看]</p>',
  );

  // 处理 iframe（小程序不支持）
  html = html.replace(/<iframe[^>]*>.*?<\/iframe>/gi, '');

  return html;
});

// 处理点击事件
function handleItemClick(e: { detail: { node: object } }) {
  emit('itemclick', e.detail);
}
</script>

<style scoped lang="scss">
.u-rich-text {
  width: 100%;
  color: $uni-text-color;
  font-size: $uni-font-size-base;
  line-height: 1.8;
  overflow-wrap: break-word;

  &--selectable {
    user-select: text;
  }

  // 富文本内部样式（通过 :deep 穿透）
  :deep(h1),
  :deep(h2),
  :deep(h3),
  :deep(h4),
  :deep(h5),
  :deep(h6) {
    margin: 32rpx 0 16rpx;
    color: $uni-text-color;
    font-weight: 600;
    line-height: 1.4;
  }

  :deep(h1) {
    font-size: 44rpx;
  }

  :deep(h2) {
    font-size: 40rpx;
  }

  :deep(h3) {
    font-size: 36rpx;
  }

  :deep(h4) {
    font-size: 32rpx;
  }

  :deep(p) {
    margin: 16rpx 0;
    text-align: justify;
  }

  :deep(a) {
    color: $uni-color-primary;
    text-decoration: none;
  }

  :deep(strong),
  :deep(b) {
    font-weight: 600;
  }

  :deep(em),
  :deep(i) {
    font-style: italic;
  }

  :deep(ul),
  :deep(ol) {
    margin: 16rpx 0;
    padding-left: 40rpx;
  }

  :deep(li) {
    margin: 8rpx 0;
  }

  :deep(blockquote) {
    margin: 16rpx 0;
    padding: 16rpx 24rpx;
    border-left: 6rpx solid $uni-color-primary;
    background: $uni-bg-color-grey;
    color: $uni-text-color-secondary;
  }

  :deep(table) {
    width: 100%;
    margin: 16rpx 0;
    border-collapse: collapse;
  }

  :deep(th),
  :deep(td) {
    padding: 12rpx 16rpx;
    border: 1px solid $uni-border-color;
    text-align: left;
  }

  :deep(th) {
    background: $uni-bg-color-grey;
    font-weight: 600;
  }

  :deep(img) {
    max-width: 100%;
    height: auto;
    margin: 16rpx 0;
    border-radius: $uni-border-radius-base;
  }

  :deep(hr) {
    margin: 32rpx 0;
    border: none;
    border-top: 1px solid $uni-border-color;
  }

  :deep(code) {
    padding: 4rpx 12rpx;
    border-radius: $uni-border-radius-sm;
    background: $uni-bg-color-grey;
    font-family: monospace;
    font-size: 26rpx;
  }

  :deep(pre) {
    margin: 16rpx 0;
    padding: 24rpx;
    overflow-x: auto;
    border-radius: $uni-border-radius-base;
    background: $uni-bg-color-grey;

    code {
      padding: 0;
      background: transparent;
    }
  }
}
</style>
