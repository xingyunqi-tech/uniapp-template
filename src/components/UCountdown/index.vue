<template>
  <!-- UCountdown - 倒计时，支持剩余毫秒或结束时间戳、格式化与作用域插槽自定义样式 -->
  <view class="u-countdown">
    <slot
      :days="timeData.days"
      :hours="timeData.hours"
      :minutes="timeData.minutes"
      :seconds="timeData.seconds"
      :milliseconds="timeData.milliseconds"
      :total="timeData.total"
    >
      <text class="u-countdown__text">{{ formattedText }}</text>
    </slot>
  </view>
</template>

<script setup lang="ts">
definePage({
  meta: {
    isComponent: true,
  },
});

import { computed, watch } from 'vue';
import { useCountdown } from '@/composables/useCountdown';

defineOptions({
  name: 'UCountdown',
  options: {
    virtualHost: true,
  },
});

export interface CountdownTimeData {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
  /** 剩余总毫秒数 */
  total: number;
}

export interface UCountdownProps {
  /** 剩余时间（毫秒），与 endTime 二选一 */
  time?: number;
  /** 结束时间戳（毫秒），优先于 time */
  endTime?: number;
  /** 格式，支持 DD/HH/mm/ss/SSS/SS/S，未包含的高位单位折算进下一级 */
  format?: string;
  /** 天数为 0 时隐藏 DD 及其后的分隔文字 */
  hideZeroDay?: boolean;
  /** 是否自动开始 */
  autoStart?: boolean;
  /** 是否毫秒级刷新，初始化时确定 */
  millisecond?: boolean;
}

const props = withDefaults(defineProps<UCountdownProps>(), {
  time: 0,
  endTime: undefined,
  format: 'HH:mm:ss',
  hideZeroDay: false,
  autoStart: true,
  millisecond: false,
});

const emit = defineEmits<{
  change: [time: CountdownTimeData];
  finish: [];
}>();

defineSlots<{
  default?: (props: CountdownTimeData) => unknown;
}>();

const MILLISECOND_INTERVAL = 30;
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const { remaining, isCounting, startUntil, stop } = useCountdown({
  interval: props.millisecond ? MILLISECOND_INTERVAL : SECOND,
  onFinish: () => emit('finish'),
});

const displayTotal = computed(() =>
  props.millisecond ? remaining.value : Math.ceil(remaining.value / SECOND) * SECOND,
);

const timeData = computed<CountdownTimeData>(() => {
  const total = displayTotal.value;
  return {
    days: Math.floor(total / DAY),
    hours: Math.floor((total % DAY) / HOUR),
    minutes: Math.floor((total % HOUR) / MINUTE),
    seconds: Math.floor((total % MINUTE) / SECOND),
    milliseconds: total % SECOND,
    total,
  };
});

const pad = (value: number, length = 2) => String(value).padStart(length, '0');

const formattedText = computed(() => {
  let { days, hours, minutes, seconds, milliseconds } = timeData.value;
  let format = props.format;
  if (props.hideZeroDay && days === 0) format = format.replace(/DD[^HmsS]*/, '');
  if (!format.includes('DD')) hours += days * 24;
  if (!format.includes('HH')) minutes += hours * 60;
  if (!format.includes('mm')) seconds += minutes * 60;
  if (!format.includes('ss')) milliseconds += seconds * SECOND;
  const tokens: Record<string, string> = {
    DD: pad(days),
    HH: pad(hours),
    mm: pad(minutes),
    ss: pad(seconds),
    SSS: pad(milliseconds, 3),
    SS: pad(Math.floor(milliseconds / 10)),
    S: String(Math.floor(milliseconds / 100)),
  };
  return format.replace(/DD|HH|mm|ss|SSS|SS|S/g, token => tokens[token]);
});

function getInitialRemaining() {
  if (props.endTime !== undefined) return Math.max(0, props.endTime - Date.now());
  return Math.max(0, props.time);
}

/** endTime 已传入（含已过期）或剩余时间大于 0 */
function hasTarget() {
  return props.endTime !== undefined || remaining.value > 0;
}

/** 开始或继续倒计时，传入 endTime 时始终以其为结束时间，已过期时触发一次 finish */
function start() {
  if (isCounting.value || !hasTarget()) return;
  startUntil(props.endTime ?? Date.now() + remaining.value);
}

/** 暂停倒计时 */
function pause() {
  stop();
}

/** 按当前 props 重置剩余时间，autoStart 时重新开始 */
function reset() {
  stop();
  remaining.value = getInitialRemaining();
  if (props.autoStart) start();
}

reset();

watch(
  () => Math.ceil(remaining.value / SECOND),
  () => emit('change', timeData.value),
);

watch(() => [props.time, props.endTime], reset);

defineExpose({
  start,
  pause,
  reset,
});
</script>

<style scoped lang="scss">
.u-countdown {
  display: inline-flex;
  align-items: center;
  color: var(--color-text);
  font-size: var(--font-size-base);

  &__text {
    font-variant-numeric: tabular-nums;
  }
}
</style>
