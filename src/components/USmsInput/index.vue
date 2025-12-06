<route lang="json5">
{
  meta: {
    isComponent: true,
  },
}
</route>

<template>
  <!--
    USmsInput - 短信验证码输入组件
    内置倒计时功能，支持手动/自动开始倒计时
  -->
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
    <button class="u-sms-btn" :disabled="isButtonDisabled" @click="handleClick">
      {{ buttonText }}
    </button>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import { SMS_CODE_LENGTH } from '@/constants/form';

defineOptions({
  name: 'USmsInput',
});

const props = withDefaults(
  defineProps<{
    /** 验证码值 */
    modelValue: string;
    /** 倒计时总秒数 */
    countdownSeconds?: number;
    /** 是否禁用发送按钮 */
    disabled?: boolean;
    /** 最大长度 */
    maxlength?: number;
    /** 默认文案 */
    defaultText?: string;
    /** 倒计时文案模板，{s} 会被替换为秒数 */
    countdownTemplate?: string;
    /** 是否点击后自动开始倒计时 (默认 false，需外部调用 startCountdown) */
    autoStart?: boolean;
  }>(),
  {
    countdownSeconds: 60,
    disabled: false,
    maxlength: SMS_CODE_LENGTH,
    defaultText: '获取验证码',
    countdownTemplate: '{s}s',
    autoStart: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
  send: [];
}>();

// 内部倒计时状态
const countdown = ref(0);
const isCounting = ref(false);
let timer: ReturnType<typeof setInterval> | null = null;

// 按钮是否禁用
const isButtonDisabled = computed(() => props.disabled || isCounting.value);

// 按钮文案
const buttonText = computed(() => {
  if (isCounting.value) {
    return props.countdownTemplate.replace('{s}', String(countdown.value));
  }
  return props.defaultText;
});

// 开始倒计时
function startCountdown() {
  countdown.value = props.countdownSeconds;
  isCounting.value = true;

  timer = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      stopCountdown();
    }
  }, 1000);
}

// 停止倒计时
function stopCountdown() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  isCounting.value = false;
  countdown.value = 0;
}

// 点击发送
function handleClick() {
  if (isButtonDisabled.value) return;
  emit('send');
  // 如果配置了 autoStart，则立即开始倒计时
  // 否则需要外部在发送成功后调用 startCountdown()
  if (props.autoStart) {
    startCountdown();
  }
}

// 组件销毁时清理定时器
onUnmounted(() => {
  stopCountdown();
});

// 暴露方法供外部调用
defineExpose({
  /** 手动开始倒计时 */
  startCountdown,
  /** 手动停止倒计时 */
  stopCountdown,
  /** 当前是否在倒计时 */
  isCounting,
  /** 当前倒计时秒数 */
  countdown,
});
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
    background: var(--color-primary);
    color: var(--color-text-inverse);
    font-size: 26rpx;
    line-height: 72rpx;

    &::after {
      display: none;
    }

    &:active {
      opacity: 0.8;
    }

    &[disabled] {
      background: var(--color-bg-grey);
      color: var(--color-text-disabled);
    }
  }
}
</style>
