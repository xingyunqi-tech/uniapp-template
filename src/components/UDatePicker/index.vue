<template>
  <!-- UDatePicker - 日期时间选择，底部弹层内用 picker-view 滚动选择，v-model 绑定格式化字符串 -->
  <view class="u-date-picker" :class="{ 'u-date-picker--disabled': disabled, 'u-date-picker--plain': !!formItem }">
    <view class="u-date-picker__field" @click="open">
      <slot :text="text" :value="modelValue">
        <text class="u-date-picker__text" :class="{ 'u-date-picker__text--placeholder': !text }">
          {{ text || placeholderText }}
        </text>
        <view v-if="clearVisible" class="u-date-picker__suffix" @click.stop="clear">
          <UIcon name="clear" size="36rpx" color="var(--color-text-placeholder)" />
        </view>
        <view v-else class="u-date-picker__suffix">
          <UIcon name="right" size="32rpx" color="var(--color-text-placeholder)" />
        </view>
      </slot>
    </view>

    <UPopup v-model="visible" type="bottom" :show-close="false" :body-padding="false">
      <view class="u-date-picker__toolbar">
        <text class="u-date-picker__action" @click="visible = false">{{ cancelText }}</text>
        <text class="u-date-picker__title">{{ titleText }}</text>
        <text class="u-date-picker__action u-date-picker__action--confirm" @click="confirm">{{ confirmText }}</text>
      </view>
      <view v-if="isRange" class="u-date-picker__tabs">
        <view
          v-for="(item, index) in rangeDraft"
          :key="index"
          class="u-date-picker__tab"
          :class="{ 'u-date-picker__tab--active': activeIndex === index }"
          @click="activeIndex = index"
        >
          <text class="u-date-picker__tab-label">{{ index === 0 ? '开始日期' : '结束日期' }}</text>
          <text class="u-date-picker__tab-value">{{ formatParts(item, VALUE_FORMAT.date) }}</text>
        </view>
      </view>
      <picker-view
        class="u-date-picker__view"
        :value="indexes"
        :indicator-style="INDICATOR_STYLE"
        :mask-style="MASK_STYLE"
        @change="handleViewChange"
      >
        <picker-view-column v-for="column in columns" :key="column.key">
          <view v-for="item in column.items" :key="item" class="u-date-picker__option">
            {{ padZero(item) }}{{ COLUMN_UNIT[column.key] }}
          </view>
        </picker-view-column>
      </picker-view>
    </UPopup>
  </view>
</template>

<script setup lang="ts">
definePage({
  meta: {
    isComponent: true,
  },
});

import { computed, inject, ref, watch } from 'vue';
import { formatDateTime, str2Date } from '@/utils/datetime';
import { U_FORM_ITEM_KEY, type UFormItemContext } from '../UForm/context';

defineOptions({
  name: 'UDatePicker',
  options: {
    virtualHost: true,
    styleIsolation: 'shared',
  },
});

export type DatePickerType = 'date' | 'time' | 'datetime' | 'daterange';

export type DatePickerValue = string | string[];

export interface UDatePickerProps {
  /** 选中值，date 为 YYYY-MM-DD，time 为 HH:mm，datetime 为 YYYY-MM-DD HH:mm，daterange 为日期数组 */
  modelValue?: DatePickerValue;
  /** 选择类型 */
  type?: DatePickerType;
  /** 可选范围起点，格式同 modelValue 单值 */
  start?: string;
  /** 可选范围终点，格式同 modelValue 单值 */
  end?: string;
  /** 未选择时的占位文字 */
  placeholder?: string;
  /** 弹层标题 */
  title?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 有值时是否显示清除图标 */
  clearable?: boolean;
  /** 展示格式，支持 YYYY、MM、DD、HH、mm，默认与值格式相同 */
  format?: string;
  /** 日期范围的分隔文字 */
  rangeSeparator?: string;
  /** 取消按钮文字 */
  cancelText?: string;
  /** 确认按钮文字 */
  confirmText?: string;
}

const props = withDefaults(defineProps<UDatePickerProps>(), {
  modelValue: '',
  type: 'date',
  start: '',
  end: '',
  placeholder: '',
  title: '',
  disabled: false,
  clearable: true,
  format: '',
  rangeSeparator: ' 至 ',
  cancelText: '取消',
  confirmText: '确定',
});

const emit = defineEmits<{
  'update:modelValue': [value: DatePickerValue];
  change: [value: DatePickerValue];
}>();

interface DateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

type ColumnKey = keyof DateParts;

interface Column {
  key: ColumnKey;
  items: number[];
}

const VALUE_FORMAT = {
  date: 'YYYY-MM-DD',
  time: 'HH:mm',
  datetime: 'YYYY-MM-DD HH:mm',
} as const;

const COLUMN_KEYS: Record<DatePickerType, ColumnKey[]> = {
  date: ['year', 'month', 'day'],
  daterange: ['year', 'month', 'day'],
  time: ['hour', 'minute'],
  datetime: ['year', 'month', 'day', 'hour', 'minute'],
};

const COLUMN_UNIT: Record<ColumnKey, string> = {
  year: '年',
  month: '月',
  day: '日',
  hour: '时',
  minute: '分',
};

/** 未设置 start/end 时可选年份相对今年的范围 */
const YEARS_BEFORE = 100;
const YEARS_AFTER = 20;

const INDICATOR_STYLE = 'height: 88rpx;';
const MASK_STYLE =
  'background-image: linear-gradient(180deg, var(--color-bg), transparent), linear-gradient(0deg, var(--color-bg), transparent);';

const formItem = inject<UFormItemContext | null>(U_FORM_ITEM_KEY, null);

const visible = ref(false);
const draft = ref<DateParts>(emptyParts());
const rangeDraft = ref<[DateParts, DateParts]>([emptyParts(), emptyParts()]);
const activeIndex = ref(0);

const isRange = computed(() => props.type === 'daterange');
const isTime = computed(() => props.type === 'time');
const valueFormat = computed(() => (props.type === 'daterange' ? VALUE_FORMAT.date : VALUE_FORMAT[props.type]));

const placeholderText = computed(() => props.placeholder || (isTime.value ? '请选择时间' : '请选择日期'));
const titleText = computed(() => props.title || placeholderText.value);

const rangeValue = computed(() => (Array.isArray(props.modelValue) ? props.modelValue : []));
const hasValue = computed(() =>
  isRange.value ? rangeValue.value.length === 2 && rangeValue.value.every(Boolean) : !!props.modelValue,
);

const text = computed(() => {
  if (!hasValue.value) return '';
  const values = isRange.value ? rangeValue.value : [props.modelValue as string];
  const formatted = values.map(value => {
    const parts = parseValue(value);
    return parts && props.format ? formatParts(parts, props.format) : value;
  });
  return formatted.join(props.rangeSeparator);
});

const clearVisible = computed(() => props.clearable && !props.disabled && hasValue.value);

const now = new Date();

const minParts = computed(
  () =>
    parseValue(props.start) ??
    (isTime.value
      ? { ...emptyParts(), hour: 0, minute: 0 }
      : { year: now.getFullYear() - YEARS_BEFORE, month: 1, day: 1, hour: 0, minute: 0 }),
);

const maxParts = computed(
  () =>
    parseValue(props.end) ??
    (isTime.value
      ? { ...emptyParts(), hour: 23, minute: 59 }
      : { year: now.getFullYear() + YEARS_AFTER, month: 12, day: 31, hour: 23, minute: 59 }),
);

const current = computed(() => (isRange.value ? rangeDraft.value[activeIndex.value] : draft.value));

const columns = computed(() => buildColumns(current.value));

const indexes = computed(() =>
  columns.value.map(column => Math.max(0, column.items.indexOf(current.value[column.key]))),
);

function emptyParts(): DateParts {
  return { year: 0, month: 0, day: 0, hour: 0, minute: 0 };
}

function padZero(value: number) {
  return String(value).padStart(2, '0');
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function toKey(parts: DateParts) {
  return (((parts.year * 100 + parts.month) * 100 + parts.day) * 100 + parts.hour) * 100 + parts.minute;
}

/** time 类型的值只有时分，补上固定日期后解析与格式化 */
const TIME_BASE_DATE = '2000-01-01';

function parseValue(value: string): DateParts | null {
  if (!value) return null;
  const date = str2Date(isTime.value ? `${TIME_BASE_DATE} ${value}` : value);
  if (!date) return null;
  if (isTime.value) return { ...emptyParts(), hour: date.getHours(), minute: date.getMinutes() };
  const withTime = props.type === 'datetime';
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour: withTime ? date.getHours() : 0,
    minute: withTime ? date.getMinutes() : 0,
  };
}

function formatParts(parts: DateParts, format: string) {
  const date = str2Date(TIME_BASE_DATE) as Date;
  if (!isTime.value) date.setFullYear(parts.year, parts.month - 1, parts.day);
  date.setHours(parts.hour, parts.minute, 0, 0);
  return formatDateTime(date, format);
}

function range(from: number, to: number) {
  return Array.from({ length: Math.max(0, to - from + 1) }, (_, index) => from + index);
}

/** 按当前值生成各列选项，与 start/end 同前缀的列按边界截断 */
function buildColumns(parts: DateParts): Column[] {
  const min = minParts.value;
  const max = maxParts.value;
  const bounds: Record<ColumnKey, [number, number]> = {
    year: [min.year, max.year],
    month: [1, 12],
    day: [1, daysInMonth(parts.year, parts.month)],
    hour: [0, 23],
    minute: [0, 59],
  };
  const order: ColumnKey[] = ['year', 'month', 'day', 'hour', 'minute'];
  let atMin = true;
  let atMax = true;
  order.forEach((key, index) => {
    if (index > 0) {
      const prev = order[index - 1];
      atMin = atMin && parts[prev] === min[prev];
      atMax = atMax && parts[prev] === max[prev];
    }
    if (index === 0) return;
    if (atMin) bounds[key][0] = Math.max(bounds[key][0], min[key]);
    if (atMax) bounds[key][1] = Math.min(bounds[key][1], max[key]);
  });
  return COLUMN_KEYS[props.type].map(key => ({ key, items: range(bounds[key][0], bounds[key][1]) }));
}

/** 日期修正到当月天数内，并限制在 start/end 之间 */
function clampParts(parts: DateParts): DateParts {
  const next = { ...parts };
  if (!isTime.value) next.day = Math.min(next.day, daysInMonth(next.year, next.month));
  if (toKey(next) < toKey(minParts.value)) return { ...minParts.value };
  if (toKey(next) > toKey(maxParts.value)) return { ...maxParts.value };
  return next;
}

function initialParts(value: string) {
  const parsed = parseValue(value);
  if (parsed) return clampParts(parsed);
  const today: DateParts = {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
    hour: props.type === 'date' || props.type === 'daterange' ? 0 : now.getHours(),
    minute: props.type === 'date' || props.type === 'daterange' ? 0 : now.getMinutes(),
  };
  if (isTime.value) Object.assign(today, { year: 0, month: 0, day: 0 });
  return clampParts(today);
}

function open() {
  if (props.disabled) return;
  if (isRange.value) {
    const [startValue = '', endValue = ''] = rangeValue.value;
    rangeDraft.value = [initialParts(startValue), initialParts(endValue)];
    activeIndex.value = 0;
  } else {
    draft.value = initialParts(props.modelValue as string);
  }
  visible.value = true;
}

interface PickerViewChangeEvent {
  detail: {
    value: number[];
  };
}

function handleViewChange(e: PickerViewChangeEvent) {
  const next = { ...current.value };
  columns.value.forEach((column, index) => {
    const item = column.items[e.detail.value[index] ?? 0];
    if (item !== undefined) next[column.key] = item;
  });
  const clamped = clampParts(next);
  if (isRange.value) {
    const pair: [DateParts, DateParts] = [...rangeDraft.value];
    pair[activeIndex.value] = clamped;
    rangeDraft.value = pair;
  } else {
    draft.value = clamped;
  }
}

watch(visible, (value, oldValue) => {
  if (oldValue && !value) formItem?.onBlur();
});

function update(value: DatePickerValue) {
  emit('update:modelValue', value);
  emit('change', value);
}

function confirm() {
  if (isRange.value) {
    const sorted = [...rangeDraft.value].sort((a, b) => toKey(a) - toKey(b));
    update(sorted.map(parts => formatParts(parts, valueFormat.value)));
  } else {
    update(formatParts(draft.value, valueFormat.value));
  }
  visible.value = false;
}

function clear() {
  update(isRange.value ? [] : '');
}

defineExpose({
  open,
});
</script>

<style scoped lang="scss">
.u-date-picker {
  flex: 1;
  min-width: 0;

  &__field {
    display: flex;
    box-sizing: border-box;
    align-items: center;
    min-height: 72rpx;
    padding: 0 var(--spacing-base);
    border: var(--border-width-base) solid var(--color-border);
    border-radius: var(--radius-base);
    background-color: var(--color-bg);
  }

  &--disabled &__field {
    background-color: var(--color-bg-grey);
  }

  &--plain &__field {
    min-height: 48rpx;
    padding: 0;
    border: none;
    background-color: transparent;
  }

  &__text {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    color: var(--color-text);
    font-size: var(--font-size-base);
    line-height: 48rpx;
    text-overflow: ellipsis;
    white-space: nowrap;

    &--placeholder {
      color: var(--color-text-placeholder);
    }
  }

  &--disabled &__text {
    color: var(--color-text-disabled);
  }

  &__suffix {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    padding-left: var(--spacing-xs);
  }

  &__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 100rpx;
    padding: 0 var(--spacing-lg);
    border-bottom: var(--border-width-base) solid var(--color-border);
  }

  &__title {
    color: var(--color-text);
    font-size: var(--font-size-lg);
    font-weight: 500;
  }

  &__action {
    color: var(--color-text-secondary);
    font-size: var(--font-size-base);

    &--confirm {
      color: var(--color-primary);
    }
  }

  &__tabs {
    display: flex;
    padding: var(--spacing-sm) var(--spacing-lg) 0;
    gap: var(--spacing-base);
  }

  &__tab {
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    padding: var(--spacing-xs) 0;
    border-bottom: var(--border-width-bold) solid transparent;

    &--active {
      border-bottom-color: var(--color-primary);
    }
  }

  &__tab-label {
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }

  &__tab-value {
    color: var(--color-text);
    font-size: var(--font-size-base);
  }

  &__tab--active &__tab-value {
    color: var(--color-primary);
  }

  &__view {
    width: 100%;
    height: 440rpx;
  }

  &__option {
    height: 88rpx;
    color: var(--color-text);
    font-size: var(--font-size-base);
    line-height: 88rpx;
    text-align: center;
  }
}

// 覆盖 H5 端 picker-view 选中框上下边线的默认颜色
.u-date-picker :deep(.uni-picker-view-indicator::before),
.u-date-picker :deep(.uni-picker-view-indicator::after) {
  border-color: var(--color-border);
}
</style>
