<template>
  <!-- UAiConsentPopup - AI 服务声明弹窗，同意后上报当前版本，放在页面根节点 -->
  <UPopup
    :model-value="modelValue"
    type="bottom"
    title="AI 服务声明"
    :mask-closable="false"
    :show-close="false"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <view class="u-ai-consent">
      <scroll-view scroll-y class="u-ai-consent__body">
        <UAgreementContent :content="content" :loading="loading" :error="error" :skeleton-rows="6" @retry="retry" />
      </scroll-view>
      <view class="u-ai-consent__actions">
        <UButton
          text="同意并使用"
          type="primary"
          block
          :loading="agreeing"
          :disabled="loading || error"
          @click="handleAgree"
        />
        <UButton text="暂不使用" type="text" block :disabled="agreeing" @click="handleDecline" />
      </view>
    </view>
  </UPopup>
</template>

<script setup lang="ts">
definePage({
  meta: {
    isComponent: true,
  },
});

import { ref, watch } from 'vue';
import { ConsentType } from '@/api';
import { invalidateAgreementContent, useAgreementContent } from '@/composables/useAgreementContent';
import { useConsentStore } from '@/store/modules/consent';
import { showToast } from '@/utils/toast';

defineOptions({
  name: 'UAiConsentPopup',
});

export interface UAiConsentPopupProps {
  /** 是否显示，支持 v-model */
  modelValue: boolean;
}

const props = defineProps<UAiConsentPopupProps>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  /** true 为已同意并上报，false 为暂不使用 */
  result: [agreed: boolean];
}>();

const consentStore = useConsentStore();
const agreeing = ref(false);
const { content, loading, error, load, retry } = useAgreementContent();

watch(
  () => props.modelValue,
  visible => {
    if (visible) load(ConsentType.AI_SERVICE);
  },
  { immediate: true },
);

async function handleAgree() {
  if (agreeing.value || loading.value || error.value) return;
  agreeing.value = true;
  try {
    const agreed = await consentStore.agree([ConsentType.AI_SERVICE]);
    if (!agreed) {
      showToast('AI 服务声明已更新，请重新阅读后同意');
      invalidateAgreementContent(ConsentType.AI_SERVICE);
      await load(ConsentType.AI_SERVICE);
      return;
    }
    emit('update:modelValue', false);
    emit('result', true);
  } finally {
    agreeing.value = false;
  }
}

function handleDecline() {
  emit('update:modelValue', false);
  emit('result', false);
}
</script>

<style scoped lang="scss">
.u-ai-consent {
  display: flex;
  flex-direction: column;
  gap: 24rpx;

  &__body {
    max-height: 50vh;
  }

  &__actions {
    display: flex;
    flex-direction: column;
    gap: 12rpx;
  }
}
</style>
