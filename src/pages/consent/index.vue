<template>
  <view class="consent-page" :class="globalStore.themeClass">
    <UNavBar :title="title" :show-back="false" />

    <view class="consent-body">
      <text class="consent-title">{{ title }}</text>
      <view class="consent-content">
        <text v-if="upgraded">我们更新了</text>
        <text v-else>欢迎使用{{ APP_NAME }}！在使用前，请仔细阅读</text>
        <text class="consent-link" @click="openAgreement('user')">《用户协议》</text>
        <text>和</text>
        <text class="consent-link" @click="openAgreement('privacy')">《隐私政策》</text>
        <text v-if="upgraded">，请阅读更新内容后继续使用。</text>
        <text v-else>。</text>
      </view>
      <text class="consent-paragraph">
        我们会收集你的作答记录、错题、笔记、上传的照片等信息，用于提供练习与学习统计等服务。你可以在「我的」页随时查看上述协议，也可以在设置中注销账号。
      </text>
      <text class="consent-paragraph">点击「同意并继续」即表示你已阅读并同意上述协议。</text>
    </view>

    <view class="consent-actions">
      <UButton type="primary" block text="同意并继续" :loading="agreeing" @click="handleAgree" />
      <UButton type="text" block text="不同意" @click="handleDisagree" />
    </view>
  </view>
</template>

<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: '用户协议与隐私政策',
    navigationStyle: 'custom',
  },
});

import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useGlobalStore } from '@/store/modules/global';
import { useConsentStore } from '@/store/modules/consent';
import { useRouter } from '@/composables';
import { APP_NAME, PAGES } from '@/constants';
import { decodeQueryValue, getPathFromUrl, isTabBarPage } from '@/utils/router';

const globalStore = useGlobalStore();
const consentStore = useConsentStore();
const router = useRouter();

const agreeing = ref(false);
let redirectUrl = '';

const upgraded = computed(() => consentStore.required.some(type => consentStore.isUpgrade(type)));
const title = computed(() => (upgraded.value ? '协议更新提示' : '用户协议与隐私政策'));

onLoad(options => {
  if (options?.redirect) redirectUrl = decodeQueryValue(options.redirect);
});

function openAgreement(type: 'user' | 'privacy') {
  router.push(PAGES.AGREEMENT, { type });
}

async function leave() {
  const target = redirectUrl && getPathFromUrl(redirectUrl) !== PAGES.CONSENT ? redirectUrl : PAGES.HOME;
  try {
    await (isTabBarPage(target) ? router.switchTab(getPathFromUrl(target)) : router.reLaunch(target));
  } catch {
    await router.reLaunch(PAGES.HOME).catch(() => {});
  }
}

async function handleAgree() {
  if (agreeing.value) return;
  agreeing.value = true;
  try {
    const agreed = await consentStore.agree(consentStore.required);
    if (!agreed) {
      uni.showToast({ title: '协议已更新，请重新阅读后同意', icon: 'none' });
      return;
    }
    if (consentStore.required.length > 0) {
      uni.showToast({ title: '操作失败，请稍后重试', icon: 'none' });
      return;
    }
    await leave();
  } finally {
    agreeing.value = false;
  }
}

function handleDisagree() {
  // #ifdef MP-WEIXIN
  wx.exitMiniProgram();
  // #endif
  // #ifdef MP-ALIPAY
  my.exitMiniProgram();
  // #endif
  // #ifdef APP-PLUS
  plus.runtime.quit();
  // #endif
  uni.showToast({ title: '需同意用户协议与隐私政策后才能使用', icon: 'none' });
}
</script>

<style scoped lang="scss">
.consent-page {
  display: flex;
  box-sizing: border-box;
  flex-direction: column;
  min-height: 100vh;
  padding-bottom: calc(var(--safe-area-inset-bottom) + var(--spacing-xl));
  background: var(--color-bg);
}

.consent-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--spacing-base);
  padding: var(--spacing-xl) var(--spacing-lg);
}

.consent-title {
  color: var(--color-text);
  font-size: var(--font-size-xl);
  font-weight: 600;
}

.consent-content,
.consent-paragraph {
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
  line-height: 1.7;
}

.consent-link {
  color: var(--color-primary);
}

.consent-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: 0 var(--spacing-lg);
}
</style>
