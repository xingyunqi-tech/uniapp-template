<template>
  <!--
    USmsInput - 短信验证码输入组件
    内置倒计时功能，支持手动/自动开始倒计时
  -->
  <view class="u-sms-input">
    <UInput
      :model-value="modelValue"
      :placeholder="placeholder"
      :prefix-icon="prefixIcon"
      type="number"
      :maxlength="maxlength"
      @update:model-value="$emit('update:modelValue', $event)"
    />
    <button
      class="u-sms-btn"
      :class="{ 'button-disabled': isButtonDisabled }"
      :disabled="isButtonDisabled"
      @click="handleClick"
    >
      {{ buttonText }}
    </button>
  </view>
</template>

<script setup lang="ts">
definePage({
  meta: {
    isComponent: true,
  },
});

import { computed } from 'vue';
import { SMS_CODE_LENGTH } from '@/constants/form';
import { useCountdown } from '@/composables';

defineOptions({
  name: 'USmsInput',
  options: {
    styleIsolation: 'shared',
  },
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
    /** 输入框占位文字 */
    placeholder?: string;
    /** 输入框前缀图标 (uni-icons 的 type)，传空字符串不显示 */
    prefixIcon?: UniIconsType | '';
    /** 默认文案 */
    defaultText?: string;
    /** 倒计时文案模板，{s} 会被替换为秒数 */
    countdownTemplate?: string;
    /** 是否点击后自动开始倒计时 (默认 false，需外部调用 startCountdown)，受控模式下不生效 */
    autoStart?: boolean;
    /** 外部倒计时秒数，传入后由 countdown/isCounting 控制按钮状态 */
    countdown?: number;
    /** 外部是否正在倒计时，不传时按 countdown > 0 判断 */
    isCounting?: boolean;
  }>(),
  {
    countdownSeconds: 60,
    disabled: false,
    maxlength: SMS_CODE_LENGTH,
    placeholder: '请输入验证码',
    prefixIcon: 'email',
    defaultText: '获取验证码',
    countdownTemplate: '{s}s',
    autoStart: false,
    countdown: undefined,
    isCounting: undefined,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
  send: [];
}>();

// 使用 useCountdown composable 管理倒计时
const {
  countdown,
  isCounting,
  start: startCountdown,
  stop: stopCountdown,
  reset: resetCountdown,
} = useCountdown({
  seconds: props.countdownSeconds,
});

const isControlled = computed(() => props.countdown !== undefined);
const counting = computed(() =>
  isControlled.value ? (props.isCounting ?? (props.countdown ?? 0) > 0) : isCounting.value,
);
const remainingSeconds = computed(() => (isControlled.value ? (props.countdown ?? 0) : countdown.value));

// 按钮是否禁用
const isButtonDisabled = computed(() => props.disabled || counting.value);

// 按钮文案
const buttonText = computed(() => {
  if (counting.value) {
    return props.countdownTemplate.replace('{s}', String(remainingSeconds.value));
  }
  return props.defaultText;
});

/** 开始内部倒计时，受控模式下由外部 countdown 控制，不启动内部计时 */
function startInternalCountdown(seconds = props.countdownSeconds) {
  if (isControlled.value) {
    if (import.meta.env.DEV) {
      console.warn('[USmsInput] 已传入 countdown，倒计时由外部控制，startCountdown / autoStart 不生效');
    }
    return;
  }
  startCountdown(seconds);
}

// 点击发送
function handleClick() {
  if (isButtonDisabled.value) return;
  emit('send');
  // 如果配置了 autoStart，则立即开始倒计时
  // 否则需要外部在发送成功后调用 startCountdown()
  if (props.autoStart) {
    startInternalCountdown();
  }
}

// 暴露方法供外部调用
defineExpose({
  /** 手动开始倒计时 */
  startCountdown: startInternalCountdown,
  /** 手动停止倒计时 */
  stopCountdown,
  /** 重置倒计时 */
  resetCountdown,
  /** 当前是否在倒计时 */
  isCounting: counting,
  /** 当前倒计时秒数 */
  countdown: remainingSeconds,
});
</script>

<style scoped lang="scss">
.u-sms-input {
  display: flex;
  gap: var(--spacing-base);
  align-items: center;

  .u-sms-btn {
    flex-shrink: 0;
    width: 200rpx;
    height: 72rpx;
    padding: 0;
    border: none;
    border-radius: var(--radius-base);
    background: var(--color-primary);
    color: var(--color-text-inverse);
    font-size: var(--font-size-sm);
    line-height: 72rpx;

    &::after {
      display: none;
    }

    &:active {
      opacity: var(--opacity-hover);
    }
  }

  .u-sms-btn.button-disabled {
    background: var(--color-bg-grey);
    color: var(--color-text-disabled);

    &:active {
      opacity: 1;
    }
  }
}
</style>
