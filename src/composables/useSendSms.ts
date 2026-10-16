import { ref, watch, onUnmounted } from 'vue';
import { isPhone } from '@/utils/validator';
import { storage } from '@/utils/storage';
import { useCountdown } from './useCountdown';
import { SMS_CODE_LENGTH, SMS_COUNTDOWN_SECONDS } from '@/constants/form';

export interface UseSendSmsOptions {
  /** 倒计时秒数，默认 60 */
  countdownSeconds?: number;
  /** 发送验证码的 API 函数，失败提示由请求层统一弹出 */
  sendApi?: (phone: string) => Promise<unknown>;
  /** 发送场景，设置后倒计时截止时间按手机号 + 场景持久化 */
  scene?: string;
  /** 当前手机号，配合 scene 在进入页面或手机号变化时恢复剩余倒计时 */
  phone?: () => string;
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
  /** 恢复该手机号未结束的倒计时，返回是否恢复 */
  restore: (phone: string) => boolean;
}

/** 存储结构：`${scene}:${phone}` -> 倒计时截止时间戳 (毫秒) */
const SMS_DEADLINE_KEY = 'sms_countdown_deadline';

function readDeadlines(): Record<string, number> {
  const data = storage.get<Record<string, number>>(SMS_DEADLINE_KEY);
  return data && typeof data === 'object' ? data : {};
}

function writeDeadline(key: string, deadline: number): void {
  const now = Date.now();
  const deadlines = Object.fromEntries(Object.entries(readDeadlines()).filter(([, value]) => value > now));
  deadlines[key] = deadline;
  storage.set(SMS_DEADLINE_KEY, deadlines);
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
  const { countdownSeconds = SMS_COUNTDOWN_SECONDS, sendApi, scene, phone: getPhone } = options;

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

    if (code.length !== SMS_CODE_LENGTH || !/^\d+$/.test(code)) {
      uni.showToast({ title: `验证码为${SMS_CODE_LENGTH}位数字`, icon: 'none' });
      return false;
    }

    return true;
  }

  function restore(phone: string): boolean {
    if (!scene || !phone || isCounting.value) return false;
    const deadline = readDeadlines()[`${scene}:${phone}`];
    const remaining = deadline ? Math.ceil((deadline - Date.now()) / 1000) : 0;
    if (remaining <= 0) return false;
    start(remaining);
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
    if (isCounting.value || restore(phone)) return false;

    // 如果正在发送，不允许重复发送
    if (sending.value) return false;

    sending.value = true;

    try {
      // 调用发送 API
      if (sendApi) {
        await sendApi(phone);
      }

      if (scene) writeDeadline(`${scene}:${phone}`, Date.now() + countdownSeconds * 1000);

      // 组件已卸载，不执行后续操作
      if (isUnmounted) return false;

      // 开始倒计时
      start();

      return true;
    } catch (error) {
      console.error('发送验证码失败:', error);
      return false;
    } finally {
      if (!isUnmounted) {
        sending.value = false;
      }
    }
  }

  if (getPhone) {
    watch(getPhone, value => restore(value), { immediate: true });
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
    restore,
  };
}
