import { ref, onUnmounted } from 'vue';
import { isPhone } from '@/utils/validator';
import { useCountdown } from './useCountdown';
import { SMS_CODE_LENGTH, SMS_COUNTDOWN_SECONDS } from '@/constants/form';

export interface UseSendSmsOptions {
  /** 倒计时秒数，默认 60 */
  countdownSeconds?: number;
  /** 发送验证码的 API 函数 */
  sendApi?: (phone: string) => Promise<unknown>;
}

export interface UseSendSmsReturn {
  /** 当前倒计时秒数 */
  countdown: ReturnType<typeof ref<number>>;
  /** 是否正在倒计时 */
  isCounting: ReturnType<typeof ref<boolean>>;
  /** 是否正在发送 */
  sending: ReturnType<typeof ref<boolean>>;
  /** 发送验证码 */
  send: (phone: string) => Promise<boolean>;
  /** 验证手机号格式 */
  validatePhone: (phone: string) => boolean;
  /** 验证验证码格式 */
  validateCode: (code: string) => boolean;
}

/**
 * 发送短信验证码 Composable
 * @description 封装验证码发送逻辑，包含手机号验证、发送请求、倒计时
 * @example
 * ```ts
 * const { countdown, isCounting, sending, send } = useSendSms({
 *   sendApi: (phone) => userStore.sendSmsCode(phone),
 * });
 *
 * async function handleSendCode() {
 *   const success = await send(formData.phone);
 *   if (success) {
 *     uni.showToast({ title: '验证码已发送', icon: 'success' });
 *   }
 * }
 * ```
 */
export function useSendSms(options: UseSendSmsOptions = {}): UseSendSmsReturn {
  const { countdownSeconds = SMS_COUNTDOWN_SECONDS, sendApi } = options;

  const { countdown, isCounting, start } = useCountdown({
    seconds: countdownSeconds,
  });

  const sending = ref(false);

  // 标记组件是否已卸载，防止异步操作完成后更新状态
  let isUnmounted = false;

  /**
   * 验证手机号格式
   */
  function validatePhone(phone: string): boolean {
    if (!phone) {
      uni.showToast({ title: '请输入手机号', icon: 'none' });
      return false;
    }

    if (!isPhone(phone)) {
      uni.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return false;
    }

    return true;
  }

  /**
   * 验证验证码格式
   */
  function validateCode(code: string): boolean {
    if (!code) {
      uni.showToast({ title: '请输入验证码', icon: 'none' });
      return false;
    }

    if (code.length !== SMS_CODE_LENGTH) {
      uni.showToast({ title: `验证码为${SMS_CODE_LENGTH}位数字`, icon: 'none' });
      return false;
    }

    return true;
  }

  /**
   * 发送验证码
   * @returns 是否发送成功
   */
  async function send(phone: string): Promise<boolean> {
    // 验证手机号
    if (!validatePhone(phone)) return false;

    // 如果正在倒计时，不允许发送
    if (isCounting.value) return false;

    // 如果正在发送，不允许重复发送
    if (sending.value) return false;

    sending.value = true;

    try {
      // 调用发送 API
      if (sendApi) {
        await sendApi(phone);
      }

      // 组件已卸载，不执行后续操作
      if (isUnmounted) return false;

      // 开始倒计时
      start();

      return true;
    } catch (error) {
      // 组件已卸载，不显示 toast
      if (isUnmounted) return false;

      console.error('发送验证码失败:', error);
      uni.showToast({ title: '发送失败，请重试', icon: 'none' });
      return false;
    } finally {
      if (!isUnmounted) {
        sending.value = false;
      }
    }
  }

  // 组件卸载时标记
  onUnmounted(() => {
    isUnmounted = true;
  });

  return {
    countdown,
    isCounting,
    sending,
    send,
    validatePhone,
    validateCode,
  };
}
