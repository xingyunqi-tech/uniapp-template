<template>
  <!--
    URichText - 富文本渲染组件
    支持 HTML 字符串解析，自动处理图片、视频等标签
  -->
  <view class="u-rich-text" :class="{ 'u-rich-text--selectable': selectable }">
    <rich-text :nodes="parsedNodes" :selectable="selectable" :space="space" @itemclick="handleItemClick" />
  </view>
</template>

<script setup lang="ts">
definePage({
  meta: {
    isComponent: true,
  },
});

import { computed } from 'vue';
import type { RichTextNodes, RichTextNode, RichTextSpace } from '@uni-helper/uni-app-types';

defineOptions({
  name: 'URichText',
  options: {
    virtualHost: true,
  },
});

interface Props {
  /** 富文本内容 (HTML 字符串或 nodes 数组) */
  content?: RichTextNodes;
  /** 是否可选中 */
  selectable?: boolean;
  /** 显示连续空格 ensp | emsp | nbsp */
  space?: RichTextSpace;
  /** 点击图片时预览内容中的全部图片，仅 H5 / App 生效（小程序 rich-text 不支持节点点击） */
  previewImage?: boolean;
}

interface Emits {
  (e: 'itemclick', detail: { node: RichTextNode }): void;
}

const props = withDefaults(defineProps<Props>(), {
  content: '',
  selectable: true,
  space: 'nbsp',
  previewImage: false,
});

const emit = defineEmits<Emits>();

// 为标签添加 class 的辅助函数（小程序不支持标签选择器）
function addClassToTag(html: string, tag: string, className: string): string {
  // 匹配已有 class 的情况
  const withClassRegex = new RegExp(`<${tag}(?=[\\s/>])([^>]*?)\\sclass=["']([^"']*)["']`, 'gi');
  html = html.replace(withClassRegex, `<${tag}$1 class="$2 ${className}"`);

  // 匹配没有 class 的情况
  const withoutClassRegex = new RegExp(`<${tag}(?=[\\s/>])(?![^>]*\\sclass=)([^>]*)>`, 'gi');
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
  html = html.replace(/<img(?![^>]*\sstyle=)/gi, '<img style="max-width:100%;height:auto;"');

  // 各端 rich-text 均不渲染 video，转换为提示
  // 先替换成对标签，再处理剩余的单独开始标签（含自闭合写法）
  html = html.replace(
    /<video\b[^>]*>[\s\S]*?<\/video>|<video\b[^>]*>/gi,
    '<p style="color:var(--color-text-secondary);text-align:center;">[视频内容请在APP中查看]</p>',
  );

  // 处理 iframe（小程序不支持）
  html = html.replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>|<iframe\b[^>]*>/gi, '');

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

function collectNodeImages(nodes: RichTextNode[], urls: string[]) {
  for (const node of nodes) {
    if (node.type === 'text') continue;
    const src = node.attrs?.src;
    if (node.name === 'img' && typeof src === 'string' && src) urls.push(src);
    if (node.children) collectNodeImages(node.children, urls);
  }
  return urls;
}

const NAMED_ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0' };

/** 解码属性值中的 HTML 实体，与 rich-text 渲染后的节点属性保持一致 */
function decodeEntities(value: string): string {
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
    if (code[0] === '#') {
      const point = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isNaN(point) ? entity : String.fromCodePoint(point);
    }
    return NAMED_ENTITIES[code.toLowerCase()] ?? entity;
  });
}

/** 内容中的图片地址 */
const imageUrls = computed<string[]>(() => {
  const { content } = props;
  if (!content) return [];
  if (Array.isArray(content)) return collectNodeImages(content, []);
  const html = content.replace(/<!--[\s\S]*?-->/g, '');
  const urls: string[] = [];
  const imgSrcRegex = /<img\b[^>]*?\ssrc=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = imgSrcRegex.exec(html))) urls.push(decodeEntities(match[1]));
  return urls;
});

/** 预览内容中的全部图片，current 为首张展示的图片地址 */
function previewImages(current?: string) {
  const urls = imageUrls.value;
  if (urls.length === 0) return;
  uni.previewImage({ urls, current: current && urls.includes(current) ? current : urls[0] });
}

function handleItemClick(e: { detail: { node: RichTextNode } }) {
  emit('itemclick', e.detail);
  const { node } = e.detail;
  if (props.previewImage && node.type !== 'text' && node.name === 'img') {
    const src = node.attrs?.src;
    previewImages(typeof src === 'string' ? src : undefined);
  }
}

defineExpose({
  previewImages,
});
</script>

<style scoped lang="scss">
.u-rich-text {
  width: 100%;
  color: var(--color-text);
  font-size: var(--font-size-base);
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
    margin: var(--spacing-lg) 0 var(--spacing-sm);
    color: var(--color-text);
    font-weight: 600;
    line-height: 1.4;
  }

  :deep(.u-rt-h1) {
    font-size: var(--font-size-xxl);
  }

  :deep(.u-rt-h2) {
    font-size: 40rpx;
  }

  :deep(.u-rt-h3) {
    font-size: var(--font-size-xl);
  }

  :deep(.u-rt-h4) {
    font-size: var(--font-size-lg);
  }

  :deep(.u-rt-p) {
    margin: var(--spacing-sm) 0;
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
    margin: var(--spacing-sm) 0;
    padding-left: var(--spacing-xl);
  }

  :deep(.u-rt-li) {
    margin: var(--spacing-xs) 0;
  }

  :deep(.u-rt-blockquote) {
    margin: var(--spacing-sm) 0;
    padding: var(--spacing-sm) var(--spacing-base);
    border-left: 6rpx solid var(--color-primary);
    background: var(--color-bg-grey);
    color: var(--color-text-secondary);
  }

  :deep(.u-rt-table) {
    width: 100%;
    margin: var(--spacing-sm) 0;
    border-collapse: collapse;
  }

  :deep(.u-rt-th),
  :deep(.u-rt-td) {
    padding: var(--spacing-sm) var(--spacing-sm);
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
    margin: var(--spacing-sm) 0;
    border-radius: var(--radius-base);
  }

  :deep(.u-rt-hr) {
    margin: var(--spacing-lg) 0;
    border: none;
    border-top: 1px solid var(--color-border);
  }

  :deep(.u-rt-code) {
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--radius-sm);
    background: var(--color-bg-grey);
    font-family: monospace;
    font-size: var(--font-size-sm);
  }

  :deep(.u-rt-pre) {
    margin: var(--spacing-sm) 0;
    padding: var(--spacing-base);
    overflow-x: auto;
    border-radius: var(--radius-base);
    background: var(--color-bg-grey);

    .u-rt-code {
      padding: 0;
      background: transparent;
    }
  }
}
</style>
