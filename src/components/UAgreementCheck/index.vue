<template>
  <view class="u-agreement-check">
    <view class="u-agreement-check__box" :class="{ checked: modelValue }" @click="toggle">
      <uni-icons v-if="modelValue" type="checkmarkempty" color="var(--color-text-inverse)" size="24rpx" />
    </view>
    <text class="u-agreement-check__text" @click="toggle">
      {{ prefix }}
      <text class="u-agreement-check__link" @click.stop="openAgreement('user')">《用户协议》</text>
      和
      <text class="u-agreement-check__link" @click.stop="openAgreement('privacy')">《隐私政策》</text>
    </text>
  </view>
</template>

<script setup lang="ts">
definePage({
  meta: {
    isComponent: true,
  },
});

import { PAGES } from '@/constants/pages';
import { navigateTo } from '@/utils/router';

defineOptions({
  name: 'UAgreementCheck',
});

const props = withDefaults(
  defineProps<{
    /** 是否已同意 */
    modelValue: boolean;
    /** 协议链接前的文案 */
    prefix?: string;
  }>(),
  {
    prefix: '我已阅读并同意',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

function toggle() {
  emit('update:modelValue', !props.modelValue);
}

function openAgreement(type: 'user' | 'privacy') {
  navigateTo(PAGES.AGREEMENT, { type });
}
</script>

<style scoped lang="scss">
.u-agreement-check {
  display: flex;
  gap: 12rpx;
  align-items: flex-start;

  &__box {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 36rpx;
    height: 36rpx;
    margin-top: 4rpx;
    transition: all var(--duration-fast);
    border: 2rpx solid var(--color-border);
    border-radius: 8rpx;

    &.checked {
      border-color: var(--color-primary);
      background: var(--color-primary);
    }
  }

  &__text {
    flex: 1;
    color: var(--color-text-secondary);
    font-size: 24rpx;
    line-height: 1.6;
  }

  &__link {
    color: var(--color-primary);

    &:active {
      opacity: 0.8;
    }
  }
}
</style>
