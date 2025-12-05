<template>
  <view class="u-rich-text" :class="{ 'u-rich-text--selectable': selectable }">
    <rich-text :nodes="parsedNodes" :selectable="selectable" :space="space" @itemclick="handleItemClick" />
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { RichTextNodes, RichTextNode, RichTextSpace } from '@uni-helper/uni-app-types';

interface Props {
  /** 富文本内容 (HTML 字符串或 nodes 数组) */
  content?: RichTextNodes;
  /** 是否可选中 */
  selectable?: boolean;
  /** 显示连续空格 ensp | emsp | nbsp */
  space?: RichTextSpace;
}

interface Emits {
  (e: 'itemclick', detail: { node: RichTextNode }): void;
}

const props = withDefaults(defineProps<Props>(), {
  content: '',
  selectable: true,
  space: 'nbsp',
});

const emit = defineEmits<Emits>();

// 为标签添加 class 的辅助函数（小程序不支持标签选择器）
function addClassToTag(html: string, tag: string, className: string): string {
  // 匹配已有 class 的情况
  const withClassRegex = new RegExp(`<${tag}([^>]*?)\\sclass=["']([^"']*)["']`, 'gi');
  html = html.replace(withClassRegex, `<${tag}$1 class="$2 ${className}"`);

  // 匹配没有 class 的情况
  const withoutClassRegex = new RegExp(`<${tag}(?![^>]*class=)([^>]*)>`, 'gi');
  html = html.replace(withoutClassRegex, `<${tag} class="${className}"$1>`);

  return html;
}

// 解析内容
const parsedNodes = computed<RichTextNodes>(() => {
  if (!props.content) return '';

  // 如果是数组，直接返回
  if (Array.isArray(props.content)) {
    return props.content;
  }

  // 如果是字符串，进行预处理
  let html = props.content;

  // 处理图片：添加最大宽度限制（img 标签会在后面统一添加 class）
  html = html.replace(/<img(?![^>]*style=)/gi, '<img style="max-width:100%;height:auto;"');

  // 处理视频标签（小程序不支持，转换为提示）
  html = html.replace(
    /<video[^>]*>.*?<\/video>/gi,
    '<p class="u-rt-p" style="color:#999;text-align:center;">[视频内容请在APP中查看]</p>',
  );

  // 处理 iframe（小程序不支持）
  html = html.replace(/<iframe[^>]*>.*?<\/iframe>/gi, '');

  // 为标签添加 class（小程序不支持标签选择器）
  const tagClassMap: Record<string, string> = {
    h1: 'u-rt-h1',
    h2: 'u-rt-h2',
    h3: 'u-rt-h3',
    h4: 'u-rt-h4',
    h5: 'u-rt-h5',
    h6: 'u-rt-h6',
    p: 'u-rt-p',
    a: 'u-rt-a',
    strong: 'u-rt-strong',
    b: 'u-rt-b',
    em: 'u-rt-em',
    i: 'u-rt-i',
    ul: 'u-rt-ul',
    ol: 'u-rt-ol',
    li: 'u-rt-li',
    blockquote: 'u-rt-blockquote',
    table: 'u-rt-table',
    th: 'u-rt-th',
    td: 'u-rt-td',
    hr: 'u-rt-hr',
    code: 'u-rt-code',
    pre: 'u-rt-pre',
    img: 'u-rt-img',
  };

  for (const [tag, className] of Object.entries(tagClassMap)) {
    html = addClassToTag(html, tag, className);
  }

  return html;
});

// 处理点击事件
function handleItemClick(e: { detail: { node: RichTextNode } }) {
  emit('itemclick', e.detail);
}
</script>

<style scoped lang="scss">
.u-rich-text {
  width: 100%;
  color: var(--color-text);
  font-size: $uni-font-size-base;
  line-height: 1.8;
  overflow-wrap: break-word;

  &--selectable {
    user-select: text;
  }

  // 富文本内部样式（使用 class 选择器，小程序不支持标签选择器）
  :deep(.u-rt-h1),
  :deep(.u-rt-h2),
  :deep(.u-rt-h3),
  :deep(.u-rt-h4),
  :deep(.u-rt-h5),
  :deep(.u-rt-h6) {
    margin: 32rpx 0 16rpx;
    color: var(--color-text);
    font-weight: 600;
    line-height: 1.4;
  }

  :deep(.u-rt-h1) {
    font-size: 44rpx;
  }

  :deep(.u-rt-h2) {
    font-size: 40rpx;
  }

  :deep(.u-rt-h3) {
    font-size: 36rpx;
  }

  :deep(.u-rt-h4) {
    font-size: 32rpx;
  }

  :deep(.u-rt-p) {
    margin: 16rpx 0;
    text-align: justify;
  }

  :deep(.u-rt-a) {
    color: var(--color-primary);
    text-decoration: none;
  }

  :deep(.u-rt-strong),
  :deep(.u-rt-b) {
    font-weight: 600;
  }

  :deep(.u-rt-em),
  :deep(.u-rt-i) {
    font-style: italic;
  }

  :deep(.u-rt-ul),
  :deep(.u-rt-ol) {
    margin: 16rpx 0;
    padding-left: 40rpx;
  }

  :deep(.u-rt-li) {
    margin: 8rpx 0;
  }

  :deep(.u-rt-blockquote) {
    margin: 16rpx 0;
    padding: 16rpx 24rpx;
    border-left: 6rpx solid var(--color-primary);
    background: var(--color-bg-grey);
    color: var(--color-text-secondary);
  }

  :deep(.u-rt-table) {
    width: 100%;
    margin: 16rpx 0;
    border-collapse: collapse;
  }

  :deep(.u-rt-th),
  :deep(.u-rt-td) {
    padding: 12rpx 16rpx;
    border: 1px solid var(--color-border);
    text-align: left;
  }

  :deep(.u-rt-th) {
    background: var(--color-bg-grey);
    font-weight: 600;
  }

  :deep(.u-rt-img) {
    max-width: 100%;
    height: auto;
    margin: 16rpx 0;
    border-radius: $uni-border-radius-base;
  }

  :deep(.u-rt-hr) {
    margin: 32rpx 0;
    border: none;
    border-top: 1px solid var(--color-border);
  }

  :deep(.u-rt-code) {
    padding: 4rpx 12rpx;
    border-radius: $uni-border-radius-sm;
    background: var(--color-bg-grey);
    font-family: monospace;
    font-size: 26rpx;
  }

  :deep(.u-rt-pre) {
    margin: 16rpx 0;
    padding: 24rpx;
    overflow-x: auto;
    border-radius: $uni-border-radius-base;
    background: var(--color-bg-grey);

    .u-rt-code {
      padding: 0;
      background: transparent;
    }
  }
}
</style>
