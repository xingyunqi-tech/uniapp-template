import { computed, ref, onUnmounted, type ComputedRef, type Ref } from 'vue';

export interface UseCountdownOptions {
  /** 倒计时秒数，默认 60 */
  seconds?: number;
  /** 倒计时结束回调 */
  onFinish?: () => void;
  /** 刷新间隔（毫秒），默认 1000 */
  interval?: number;
}

export interface UseCountdownReturn {
  /** 当前倒计时秒数 */
  countdown: ComputedRef<number>;
  /** 剩余毫秒数 */
  remaining: Ref<number>;
  /** 是否正在倒计时 */
  isCounting: ReturnType<typeof ref<boolean>>;
  /** 开始倒计时 */
  start: (seconds?: number) => void;
  /** 倒计时到指定时间戳（毫秒） */
  startUntil: (endTime: number) => void;
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
  const { seconds = 60, onFinish, interval = 1000 } = options;

  const remaining = ref(0);
  const countdown = computed(() => Math.round(remaining.value / 1000));
  const isCounting = ref(false);
  let timer: ReturnType<typeof setTimeout> | null = null;
  let deadline = 0;

  /**
   * 清除定时器
   */
  function clearTimer() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  /** 按结束时间计算剩余时间，定时器在后台被挂起后恢复时可校正 */
  function tick() {
    remaining.value = Math.max(0, deadline - Date.now());
    if (remaining.value <= 0) {
      stop();
      onFinish?.();
      return;
    }
    timer = setTimeout(tick, remaining.value % interval || interval);
  }

  /**
   * 倒计时到指定时间戳
   * @param endTime 结束时间戳（毫秒）
   */
  function startUntil(endTime: number) {
    if (isCounting.value) return;
    deadline = endTime;
    isCounting.value = true;
    if (endTime <= Date.now()) {
      remaining.value = 0;
      timer = setTimeout(tick, 0);
      return;
    }
    tick();
  }

  /**
   * 开始倒计时
   * @param customSeconds 自定义秒数，不传则使用默认值
   */
  function start(customSeconds?: number) {
    startUntil(Date.now() + (customSeconds ?? seconds) * 1000);
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
    remaining.value = 0;
  }

  // 组件卸载时清除定时器
  onUnmounted(() => {
    clearTimer();
  });

  return {
    countdown,
    remaining,
    isCounting,
    start,
    startUntil,
    stop,
    reset,
  };
}
