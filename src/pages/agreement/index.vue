<template>
  <view class="agreement-page" :class="globalStore.themeClass">
    <scroll-view class="content-scroll" scroll-y>
      <UAgreementContent :content="content" :loading="loading" :error="error" @retry="retry" />
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: '协议详情',
  },
});

import { onLoad } from '@dcloudio/uni-app';
import { ConsentType } from '@/api';
import { useAgreementContent } from '@/composables';
import { useGlobalStore } from '@/store/modules/global';

const globalStore = useGlobalStore();

interface Query {
  type?: 'user' | 'privacy' | 'ai';
}

const AGREEMENTS: Record<NonNullable<Query['type']>, { type: ConsentType; title: string }> = {
  user: { type: ConsentType.USER_AGREEMENT, title: '用户协议' },
  privacy: { type: ConsentType.PRIVACY_POLICY, title: '隐私政策' },
  ai: { type: ConsentType.AI_SERVICE, title: 'AI 服务声明' },
};

const { content, loading, error, load, retry } = useAgreementContent();

onLoad((query?: Query) => {
  const agreement = query?.type && query.type in AGREEMENTS ? AGREEMENTS[query.type] : AGREEMENTS.user;
  uni.setNavigationBarTitle({ title: agreement.title });
  load(agreement.type);
});
</script>

<style scoped lang="scss">
.agreement-page {
  min-height: 100vh;
  background: var(--color-bg);
}

.content-scroll {
  box-sizing: border-box;
  height: 100vh;
  padding: 32rpx;
}
</style>
