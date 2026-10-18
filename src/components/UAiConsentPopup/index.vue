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
        <text v-for="(paragraph, index) in AI_SERVICE_STATEMENT" :key="index" class="u-ai-consent__paragraph">
          {{ paragraph }}
        </text>
      </scroll-view>
      <view class="u-ai-consent__actions">
        <UButton text="同意并使用" type="primary" block :loading="agreeing" @click="handleAgree" />
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

import { ref } from 'vue';
import { ConsentType } from '@/api';
import { useConsentStore } from '@/store/modules/consent';
import { showToast } from '@/utils/toast';

defineOptions({
  name: 'UAiConsentPopup',
});

export interface UAiConsentPopupProps {
  /** 是否显示，支持 v-model */
  modelValue: boolean;
}

defineProps<UAiConsentPopupProps>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  /** true 为已同意并上报，false 为暂不使用 */
  result: [agreed: boolean];
}>();

const AI_SERVICE_STATEMENT = [
  'AI 助教基于大语言模型，为你讲解题目、解答追问。使用前请阅读以下说明：',
  '1. 回答内容由 AI 生成，可能存在错误或不完整，请结合教材与题目解析判断，不作为考试答案的唯一依据。',
  '2. 为提供讲题服务，我们会将你提问的题目内容、作答记录与对话内容发送给模型服务商处理，不会用于与学习无关的用途。',
  '3. 你的提问与 AI 的回答会经过内容安全检测，请勿输入违法违规内容或个人敏感信息。',
  '4. 每日使用次数有限，额度用尽后次日恢复。对回答有异议时，可通过回答下方的「举报」反馈。',
  '5. 你可以在「AI 助教」中删除历史会话；注销账号后，AI 会话与消息将一并删除。',
];

const consentStore = useConsentStore();
const agreeing = ref(false);

async function handleAgree() {
  if (agreeing.value) return;
  agreeing.value = true;
  try {
    const agreed = await consentStore.agree([ConsentType.AI_SERVICE]);
    if (!agreed) {
      showToast('AI 服务声明已更新，请重新阅读后同意');
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

  &__paragraph {
    display: block;
    margin-bottom: 16rpx;
    color: var(--color-text);
    font-size: 28rpx;
    line-height: 1.7;
  }

  &__actions {
    display: flex;
    flex-direction: column;
    gap: 12rpx;
  }
}
</style>
