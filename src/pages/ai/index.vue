<template>
  <view class="ai-page" :class="globalStore.themeClass">
    <UEmpty icon="chatbubble" text="AI 助教即将上线" />
  </view>
</template>

<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: 'AI 助教',
  },
});

import { useGlobalStore } from '@/store/modules/global';

const globalStore = useGlobalStore();
</script>

<style scoped lang="scss">
.ai-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--color-bg-grey);
}
</style>
