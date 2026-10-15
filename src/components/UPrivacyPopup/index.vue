<template>
  <!-- #ifdef MP-WEIXIN -->
  <view v-if="visible" class="u-privacy-popup">
    <view class="u-privacy-popup__panel">
      <text class="u-privacy-popup__title">用户隐私保护提示</text>
      <view class="u-privacy-popup__content">
        <text>在使用相关功能前，请仔细阅读</text>
        <text class="u-privacy-popup__link" @click="openContract">{{ contractName }}</text>
        <text>。如不同意，该功能将无法使用。</text>
      </view>
      <view class="u-privacy-popup__actions">
        <button class="u-privacy-popup__btn" @click="handleDisagree">拒绝</button>
        <button
          :id="AGREE_BUTTON_ID"
          class="u-privacy-popup__btn u-privacy-popup__btn--primary"
          open-type="agreePrivacyAuthorization"
          @agreeprivacyauthorization="handleAgree"
        >
          同意
        </button>
      </view>
    </view>
  </view>
  <!-- #endif -->
</template>

<script setup lang="ts">
definePage({
  meta: {
    isComponent: true,
  },
});

import { onMounted, onUnmounted, ref } from 'vue';
import { onHide, onShow } from '@dcloudio/uni-app';
import { privacyListenerOwner } from './owner';

defineOptions({
  name: 'UPrivacyPopup',
});

type PrivacyResolveOption = { event: 'agree' | 'disagree'; buttonId?: string };
type PrivacyResolve = (option: PrivacyResolveOption) => void;

const AGREE_BUTTON_ID = 'u-privacy-agree';

const visible = ref(false);
const contractName = ref('《隐私保护指引》');
let resolvePrivacy: PrivacyResolve | null = null;
const owner = {};

/** 隐私授权监听全局只生效一个，页面每次显示时重新注册到当前页 */
function register() {
  privacyListenerOwner.current = owner;
  // #ifdef MP-WEIXIN
  wx.onNeedPrivacyAuthorization(((resolve: PrivacyResolve) => {
    resolvePrivacy = resolve;
    visible.value = true;
  }) as never);
  wx.getPrivacySetting({
    success: (res: { privacyContractName?: string }) => {
      if (res.privacyContractName) contractName.value = res.privacyContractName;
    },
  });
  // #endif
}

/**
 * 页面隐藏或卸载后改为直接拒绝，未放置弹窗的页面调用隐私接口时立即失败，不会一直等待；
 * 监听已被其他页面的弹窗接管时不覆盖
 */
function registerFallback() {
  if (privacyListenerOwner.current !== owner) return;
  privacyListenerOwner.current = null;
  // #ifdef MP-WEIXIN
  wx.onNeedPrivacyAuthorization(((resolve: PrivacyResolve) => resolve({ event: 'disagree' })) as never);
  // #endif
}

function settle(result: PrivacyResolveOption) {
  resolvePrivacy?.(result);
  resolvePrivacy = null;
  visible.value = false;
}

function handleAgree() {
  settle({ buttonId: AGREE_BUTTON_ID, event: 'agree' });
}

function handleDisagree() {
  settle({ event: 'disagree' });
}

function openContract() {
  // #ifdef MP-WEIXIN
  wx.openPrivacyContract({});
  // #endif
}

onMounted(register);
onShow(register);
onHide(registerFallback);
onUnmounted(() => {
  if (resolvePrivacy) handleDisagree();
  registerFallback();
});
</script>

<style scoped lang="scss">
.u-privacy-popup {
  display: flex;
  position: fixed;
  z-index: 9999;
  inset: 0;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-mask-light);

  &__panel {
    width: 600rpx;
    padding: var(--spacing-lg);
    border-radius: var(--radius-lg);
    background: var(--color-bg);
  }

  &__title {
    display: block;
    margin-bottom: var(--spacing-base);
    color: var(--color-text);
    font-size: 32rpx;
    font-weight: 600;
    text-align: center;
  }

  &__content {
    color: var(--color-text-secondary);
    font-size: 28rpx;
    line-height: 1.6;
  }

  &__link {
    color: var(--color-primary);
  }

  &__actions {
    display: flex;
    gap: var(--spacing-base);
    margin-top: var(--spacing-lg);
  }

  &__btn {
    flex: 1;
    height: 80rpx;
    margin: 0;
    border-radius: var(--radius-base);
    background: var(--color-bg-grey);
    color: var(--color-text);
    font-size: 28rpx;
    line-height: 80rpx;

    &::after {
      border: none;
    }

    &--primary {
      background: var(--color-primary);
      color: var(--color-text-inverse);
    }
  }
}
</style>
