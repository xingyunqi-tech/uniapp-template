<template>
  <view class="webview-page" :class="globalStore.themeClass">
    <!-- #ifdef H5 -->
    <view v-if="loading" class="progress-bar">
      <view class="progress-inner" :style="{ width: `${progress}%` }" />
    </view>
    <!-- #endif -->

    <!-- 小程序 web-view 铺满整页并覆盖其他内容，出错时不渲染 -->
    <web-view v-if="url && !error" :src="url" @message="handleMessage" @load="handleLoad" @error="handleError" />

    <!-- 加载失败状态 -->
    <view v-if="error" class="error-state">
      <UEmpty type="error" text="页面加载失败">
        <view class="error-actions">
          <UButton v-if="url" type="primary" size="medium" text="重新加载" @click="handleRetry" />
          <UButton size="medium" text="返回上一页" @click="handleBack" />
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
import { onLoad, onShareAppMessage, onUnload } from '@dcloudio/uni-app';
import { useRouter, useSafeBack } from '@/composables';
import { useGlobalStore } from '@/store/modules/global';
import { decodeQueryValue } from '@/utils/router';
import { isUrlInHosts } from '@/utils/validator';
import { isH5 } from '@/utils/platform';
import { PAGES, WEBVIEW_ALLOWED_HOSTS } from '@/constants';

const globalStore = useGlobalStore();
const router = useRouter();
const goBack = useSafeBack();

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
let retryTimer: ReturnType<typeof setTimeout> | null = null;

interface WebviewShareData {
  title?: string;
  imageUrl?: string;
}
let shareData: WebviewShareData = {};

/**
 * 页面加载
 */
onLoad(options => {
  const targetUrl = options?.url ? decodeQueryValue(options.url) : '';
  if (!isUrlInHosts(targetUrl, WEBVIEW_ALLOWED_HOSTS)) {
    loading.value = false;
    error.value = true;
    errorMessage.value = '不支持打开该页面地址';
    return;
  }
  originalUrl = targetUrl;
  url.value = originalUrl;

  if (options?.title) {
    title.value = decodeQueryValue(options.title);
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
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
});

// #ifdef MP-WEIXIN
onShareAppMessage(options => {
  const shareTitle = shareData.title || title.value;
  const query = [`url=${encodeURIComponent(options.webViewUrl || originalUrl)}`];
  if (shareTitle) query.push(`title=${encodeURIComponent(shareTitle)}`);
  return {
    title: shareTitle,
    imageUrl: shareData.imageUrl,
    path: `${PAGES.WEBVIEW}?${query.join('&')}`,
  };
});
// #endif

/**
 * 模拟加载进度
 */
function startProgress() {
  if (!isH5()) {
    loading.value = false;
    return;
  }
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
 * 微信小程序仅在后退、分享、销毁时派发 message，只记录分享数据；H5 与支付宝实时派发
 */
function handleMessage(e: { detail: unknown }) {
  let messages: unknown[] = [];
  // #ifdef MP-ALIPAY
  messages = [e.detail];
  // #endif
  // #ifndef MP-ALIPAY
  messages = (e.detail as { data?: unknown[] })?.data ?? [];
  // #endif

  messages.forEach(msg => {
    if (typeof msg !== 'object' || msg === null) return;
    const data = msg as Record<string, unknown>;

    if (data.type === 'share') {
      shareData = {
        title: typeof data.title === 'string' ? data.title : undefined,
        imageUrl: typeof data.imageUrl === 'string' ? data.imageUrl : undefined,
      };
      return;
    }

    // #ifndef MP-WEIXIN
    handleRealtimeMessage(data);
    // #endif
  });
}

// #ifndef MP-WEIXIN
function handleRealtimeMessage(data: Record<string, unknown>) {
  if (data.type === 'setTitle' && typeof data.title === 'string') {
    title.value = data.title;
    uni.setNavigationBarTitle({ title: data.title });
  }

  if (data.type === 'navigateTo' && typeof data.url === 'string' && /^\/(?!\/)/.test(data.url)) {
    router.push(data.url);
  }

  if (data.type === 'navigateBack' || data.type === 'close') {
    goBack();
  }

  if (data.type === 'copy' && typeof data.text === 'string') {
    uni.setClipboardData({
      data: data.text,
      success: () => {
        uni.showToast({ title: '复制成功', icon: 'success' });
      },
    });
  }
}
// #endif

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
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = setTimeout(() => {
    retryTimer = null;
    url.value = originalUrl;
  }, 100);
}

/**
 * 返回上一页
 */
function handleBack() {
  goBack();
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
  }
}
</style>
