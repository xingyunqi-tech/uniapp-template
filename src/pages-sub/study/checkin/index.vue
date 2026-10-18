<template>
  <view class="checkin-page" :class="globalStore.themeClass">
    <view class="checkin-summary">
      <view class="checkin-summary__streak">
        <text class="checkin-summary__value">{{ calendar?.streakDays ?? '-' }}</text>
        <text class="checkin-summary__unit">天</text>
      </view>
      <text class="checkin-summary__label">连续打卡</text>
      <text class="checkin-summary__today" :class="{ 'checkin-summary__today--done': calendar?.checkedInToday }">
        {{ todayText }}
      </text>
    </view>

    <view class="checkin-calendar">
      <view class="checkin-calendar__header">
        <view class="checkin-calendar__nav" @click="changeMonth(-1)">
          <UIcon name="left" size="32rpx" color="var(--color-text)" />
        </view>
        <text class="checkin-calendar__month">{{ formatMonthLabel(month) }}</text>
        <view
          class="checkin-calendar__nav"
          :class="{ 'checkin-calendar__nav--disabled': !canGoNext }"
          @click="changeMonth(1)"
        >
          <UIcon name="right" size="32rpx" color="var(--color-text)" />
        </view>
      </view>

      <view class="checkin-calendar__week">
        <text v-for="label in WEEKDAY_LABELS" :key="label" class="checkin-calendar__weekday">{{ label }}</text>
      </view>

      <UPageState :loading="loading && !calendar" :error="loadError" @retry="load">
        <view v-for="(week, weekIndex) in weeks" :key="weekIndex" class="checkin-calendar__week">
          <view
            v-for="cell in week"
            :key="cell.date"
            class="checkin-day"
            :class="{
              'checkin-day--outside': !cell.inMonth,
              'checkin-day--checked': cell.checked && cell.inMonth,
              'checkin-day--today': cell.isToday,
              'checkin-day--future': cell.isFuture,
            }"
          >
            <text class="checkin-day__number">{{ cell.day }}</text>
          </view>
        </view>
      </UPageState>

      <text class="checkin-calendar__footer">本月已打卡 {{ monthCount }} 天</text>
    </view>

    <text class="checkin-tip">完成当天的每日一练，或当天做题数达到每日目标，即自动打卡</text>
  </view>
</template>

<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: '打卡日历',
  },
});

import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useGlobalStore } from '@/store/modules/global';
import { useStudyStore } from '@/store/modules/study';
import { formatMonthLabel, monthCalendar, shanghaiMonth, shiftMonth, WEEKDAY_LABELS } from '@/utils/checkin-calendar';
import { shanghaiDate } from '@/utils/exam-date';

const globalStore = useGlobalStore();
const studyStore = useStudyStore();

const today = ref(shanghaiDate());
const month = ref(shanghaiMonth());
const loading = ref(false);
const loadError = ref(false);

const calendar = computed(() => studyStore.checkins[month.value] ?? null);
const checkedDates = computed(() => (calendar.value?.days ?? []).map(day => day.date));
const weeks = computed(() => monthCalendar(month.value, checkedDates.value, today.value));
const monthCount = computed(() => checkedDates.value.filter(date => date.startsWith(month.value)).length);
const canGoNext = computed(() => month.value < today.value.slice(0, 7));
const todayText = computed(() => {
  if (!calendar.value) return '';
  return calendar.value.checkedInToday ? '今日已打卡' : '今日未打卡';
});

async function load() {
  const target = month.value;
  loading.value = true;
  loadError.value = false;
  try {
    await studyStore.fetchCheckins(target);
  } catch (error) {
    if (target === month.value) loadError.value = true;
    console.error('加载打卡日历失败:', error);
  } finally {
    if (target === month.value) loading.value = false;
  }
}

function changeMonth(delta: number) {
  if (delta > 0 && !canGoNext.value) return;
  month.value = shiftMonth(month.value, delta);
  load();
}

onShow(() => {
  today.value = shanghaiDate();
  load();
});
</script>

<style scoped lang="scss">
.checkin-page {
  display: flex;
  box-sizing: border-box;
  flex-direction: column;
  min-height: 100vh;
  padding: 24rpx;
  background: var(--color-bg-grey);
  gap: 24rpx;
}

.checkin-summary {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx 24rpx;
  border-radius: var(--radius-lg);
  background: var(--color-bg);
  gap: 8rpx;

  &__streak {
    display: flex;
    align-items: baseline;
    gap: 8rpx;
  }

  &__value {
    color: var(--color-primary);
    font-size: 80rpx;
    font-weight: 700;
  }

  &__unit,
  &__label {
    color: var(--color-text-secondary);
    font-size: 26rpx;
  }

  &__today {
    margin-top: 8rpx;
    padding: 6rpx 20rpx;
    border-radius: var(--radius-full);
    background: var(--color-bg-grey);
    color: var(--color-text-secondary);
    font-size: 24rpx;

    &--done {
      background: var(--color-success-bg);
      color: var(--color-success);
    }
  }
}

.checkin-calendar {
  display: flex;
  flex-direction: column;
  padding: 24rpx;
  border-radius: var(--radius-lg);
  background: var(--color-bg);
  gap: 12rpx;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12rpx;
  }

  &__nav {
    padding: 8rpx 16rpx;

    &--disabled {
      opacity: 0.3;
    }
  }

  &__month {
    color: var(--color-text);
    font-size: 32rpx;
    font-weight: 600;
  }

  &__week {
    display: flex;
  }

  &__weekday {
    flex: 1;
    color: var(--color-text-secondary);
    font-size: 24rpx;
    text-align: center;
  }

  &__footer {
    margin-top: 12rpx;
    color: var(--color-text-secondary);
    font-size: 24rpx;
    text-align: center;
  }
}

.checkin-day {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  height: 80rpx;

  &__number {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 64rpx;
    height: 64rpx;
    border-radius: 50%;
    color: var(--color-text);
    font-size: 28rpx;
  }

  &--outside &__number,
  &--future &__number {
    color: var(--color-text-placeholder);
  }

  &--today &__number {
    border: 2rpx solid var(--color-primary);
    color: var(--color-primary);
  }

  &--checked &__number {
    background: var(--color-primary);
    color: var(--color-text-inverse);
  }
}

.checkin-tip {
  color: var(--color-text-secondary);
  font-size: 24rpx;
  line-height: 1.6;
  text-align: center;
}
</style>
