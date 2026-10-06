<template>
  <view class="webview-page" :class="globalStore.themeClass">
    <!-- 加载进度条 -->
    <view v-if="loading" class="progress-bar">
      <view class="progress-inner" :style="{ width: `${progress}%` }" />
    </view>

    <!-- Webview 容器 -->
    <web-view :src="url" @message="handleMessage" @load="handleLoad" @error="handleError" />

    <!-- 加载失败状态 -->
    <view v-if="error" class="error-state">
      <UEmpty type="error" text="页面加载失败">
        <view class="error-actions">
          <button class="retry-btn" @click="handleRetry">重新加载</button>
          <button class="back-btn" @click="handleBack">返回上一页</button>
        </view>
      </UEmpty>
      <text class="error-desc">{{ errorMessage }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: '加载中...',
  },
});

import { ref } from 'vue';
import { onLoad, onUnload } from '@dcloudio/uni-app';
import { useRouter } from '@/composables';
import { useGlobalStore } from '@/store/modules/global';

const globalStore = useGlobalStore();
const router = useRouter();

// 状态
const url = ref('');
const title = ref('');
const loading = ref(true);
const progress = ref(0);
const error = ref(false);
const errorMessage = ref('');

// 原始参数（用于重试）
let originalUrl = '';

// 进度模拟定时器
let progressTimer: ReturnType<typeof setInterval> | null = null;

/**
 * 页面加载
 */
onLoad(options => {
  if (options?.url) {
    // URL 需要解码
    originalUrl = decodeURIComponent(options.url);
    url.value = originalUrl;
  }

  if (options?.title) {
    title.value = decodeURIComponent(options.title);
    uni.setNavigationBarTitle({ title: title.value });
  }

  // 开始模拟进度
  startProgress();
});

onUnload(() => {
  if (progressTimer) {
    clearInterval(progressTimer);
    progressTimer = null;
  }
});

/**
 * 模拟加载进度
 */
function startProgress() {
  progress.value = 0;
  progressTimer = setInterval(() => {
    if (progress.value < 90) {
      // 模拟进度，越接近90越慢
      const increment = Math.max(1, (90 - progress.value) / 10);
      progress.value = Math.min(90, progress.value + increment);
    }
  }, 100);
}

/**
 * 完成进度
 */
function finishProgress() {
  if (progressTimer) {
    clearInterval(progressTimer);
    progressTimer = null;
  }
  progress.value = 100;
  setTimeout(() => {
    loading.value = false;
  }, 200);
}

/**
 * 处理 Webview 消息
 * H5 页面可以通过 postMessage 与小程序通信
 */
function handleMessage(e: { detail: { data: unknown[] } }) {
  const messages = e.detail.data;
  console.log('[Webview] 收到消息:', messages);

  // 处理来自 H5 的消息
  messages.forEach((msg: unknown) => {
    if (typeof msg === 'object' && msg !== null) {
      const data = msg as Record<string, unknown>;

      // 更新标题
      if (data.type === 'setTitle' && typeof data.title === 'string') {
        title.value = data.title;
        uni.setNavigationBarTitle({ title: data.title });
      }

      // 跳转页面
      if (data.type === 'navigateTo' && typeof data.url === 'string') {
        router.push(data.url);
      }

      // 返回上一页
      if (data.type === 'navigateBack') {
        router.back();
      }

      // 分享
      if (data.type === 'share') {
        // 触发分享
        uni.showShareMenu({
          withShareTicket: true,
          menus: ['shareAppMessage', 'shareTimeline'],
        });
      }

      // 复制文本
      if (data.type === 'copy' && typeof data.text === 'string') {
        uni.setClipboardData({
          data: data.text,
          success: () => {
            uni.showToast({ title: '复制成功', icon: 'success' });
          },
        });
      }

      // 关闭 Webview
      if (data.type === 'close') {
        router.back();
      }
    }
  });
}

/**
 * 从 URL 中解析 hostname
 * 兼容所有平台
 */
function parseHostname(urlStr: string): string {
  // #ifdef H5
  try {
    return new URL(urlStr).hostname;
  } catch {
    return '';
  }
  // #endif

  // #ifndef H5
  // eslint-disable-next-line no-unreachable -- UniApp 条件编译，非 H5 平台使用正则解析
  const match = urlStr.match(/^https?:\/\/([^/:]+)/);
  return match?.[1] ?? '';
  // #endif
}

/**
 * 处理加载完成
 */
function handleLoad() {
  error.value = false;
  finishProgress();

  // 如果没有传入标题，尝试从 URL 解析
  if (!title.value && url.value) {
    const hostname = parseHostname(url.value);
    uni.setNavigationBarTitle({ title: hostname || '详情' });
  }
}

/**
 * 处理加载错误
 */
function handleError(e: UniHelper.WebViewOnErrorEvent & { detail?: { errMsg?: string } }) {
  console.error('[Webview] 加载失败:', e.detail?.errMsg);
  error.value = true;
  errorMessage.value = e.detail?.errMsg || '网络异常，请检查网络连接';
  finishProgress();
}

/**
 * 重新加载
 */
function handleRetry() {
  error.value = false;
  loading.value = true;
  startProgress();
  // 通过重新赋值触发 web-view 重新加载
  url.value = '';
  setTimeout(() => {
    url.value = originalUrl;
  }, 100);
}

/**
 * 返回上一页
 */
function handleBack() {
  router.back();
}
</script>

<style scoped lang="scss">
.webview-page {
  position: relative;
  min-height: 100vh;
  background: var(--color-bg);
}

// 进度条
.progress-bar {
  position: fixed;
  z-index: 999;
  top: 0;
  right: 0;
  left: 0;
  height: 4rpx;
  background: var(--color-bg-grey);

  .progress-inner {
    height: 100%;
    transition: width 0.1s linear;
    background: var(--color-primary);
  }
}

// 错误状态
.error-state {
  display: flex;
  position: fixed;
  z-index: 998;
  inset: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48rpx;
  background: var(--color-bg);

  .error-desc {
    margin-top: 16rpx;
    color: var(--color-text-secondary);
    font-size: 26rpx;
    text-align: center;
  }

  .error-actions {
    display: flex;
    gap: 24rpx;

    .retry-btn,
    .back-btn {
      width: 240rpx;
      height: 80rpx;
      border-radius: var(--radius-base);
      font-size: 28rpx;
      line-height: 80rpx;

      &::after {
        display: none;
      }
    }

    .retry-btn {
      border: none;
      background: var(--color-primary);
      color: var(--color-text-inverse);
    }

    .back-btn {
      border: 1px solid var(--color-border);
      background: var(--color-bg);
      color: var(--color-text);
    }
  }
}
</style>
