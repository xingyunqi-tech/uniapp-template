import { ref, onUnmounted } from 'vue';

export interface UseCountdownOptions {
  /** 倒计时秒数，默认 60 */
  seconds?: number;
  /** 倒计时结束回调 */
  onFinish?: () => void;
}

export interface UseCountdownReturn {
  /** 当前倒计时秒数 */
  countdown: ReturnType<typeof ref<number>>;
  /** 是否正在倒计时 */
  isCounting: ReturnType<typeof ref<boolean>>;
  /** 开始倒计时 */
  start: (seconds?: number) => void;
  /** 停止倒计时 */
  stop: () => void;
  /** 重置倒计时 */
  reset: () => void;
}

/**
 * 倒计时 Composable
 * @description 用于验证码发送等场景的倒计时逻辑
 * @example
 * ```ts
 * const { countdown, isCounting, start, stop } = useCountdown({ seconds: 60 });
 *
 * // 开始倒计时
 * start();
 *
 * // 模板中使用
 * // <button :disabled="isCounting">{{ isCounting ? `${countdown}s` : '获取验证码' }}</button>
 * ```
 */
export function useCountdown(options: UseCountdownOptions = {}): UseCountdownReturn {
  const { seconds = 60, onFinish } = options;

  const countdown = ref(0);
  const isCounting = ref(false);
  let timer: ReturnType<typeof setInterval> | null = null;

  /**
   * 清除定时器
   */
  function clearTimer() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  /**
   * 开始倒计时
   * @param customSeconds 自定义秒数，不传则使用默认值
   */
  function start(customSeconds?: number) {
    // 如果正在倒计时，不重复启动
    if (isCounting.value) return;

    const targetSeconds = customSeconds ?? seconds;
    countdown.value = targetSeconds;
    isCounting.value = true;

    timer = setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0) {
        stop();
        onFinish?.();
      }
    }, 1000);
  }

  /**
   * 停止倒计时
   */
  function stop() {
    clearTimer();
    isCounting.value = false;
  }

  /**
   * 重置倒计时
   */
  function reset() {
    stop();
    countdown.value = 0;
  }

  // 组件卸载时清除定时器
  onUnmounted(() => {
    clearTimer();
  });

  return {
    countdown,
    isCounting,
    start,
    stop,
    reset,
  };
}
