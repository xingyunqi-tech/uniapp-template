<template>
  <view class="u-sms-input">
    <uni-easyinput
      :model-value="modelValue"
      placeholder="请输入验证码"
      prefix-icon="email"
      type="number"
      :maxlength="maxlength"
      :clearable="true"
      @update:model-value="$emit('update:modelValue', $event)"
    />
    <button class="u-sms-btn" :disabled="disabled || isCounting" @click="handleClick">
      {{ buttonText }}
    </button>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { SMS_CODE_LENGTH } from '@/constants/form';

defineOptions({
  name: 'USmsInput',
});

const props = withDefaults(
  defineProps<{
    /** 验证码值 */
    modelValue: string;
    /** 倒计时秒数 */
    countdown?: number;
    /** 是否正在倒计时 */
    isCounting?: boolean;
    /** 是否禁用发送按钮 */
    disabled?: boolean;
    /** 最大长度 */
    maxlength?: number;
    /** 发送中文案 */
    sendingText?: string;
    /** 默认文案 */
    defaultText?: string;
  }>(),
  {
    countdown: 0,
    isCounting: false,
    disabled: false,
    maxlength: SMS_CODE_LENGTH,
    sendingText: '发送中...',
    defaultText: '获取验证码',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
  send: [];
}>();

const buttonText = computed(() => {
  if (props.isCounting) {
    return `${props.countdown}s`;
  }
  return props.defaultText;
});

function handleClick() {
  emit('send');
}
</script>

<style scoped lang="scss">
.u-sms-input {
  display: flex;
  gap: 20rpx;
  align-items: center;

  :deep(.uni-easyinput) {
    flex: 1;
  }

  .u-sms-btn {
    flex-shrink: 0;
    width: 200rpx;
    height: 72rpx;
    padding: 0;
    border: none;
    border-radius: $uni-border-radius-base;
    background: $uni-color-primary;
    color: #fff;
    font-size: 26rpx;
    line-height: 72rpx;

    &::after {
      display: none;
    }

    &:active {
      opacity: 0.8;
    }

    &[disabled] {
      background: $uni-bg-color-grey;
      color: $uni-text-color-disabled;
    }
  }
}
</style>
