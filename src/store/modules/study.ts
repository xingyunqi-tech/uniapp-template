import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import {
  getCheckins,
  getStudyOverview,
  getStudyWeakPoints,
  type CheckinCalendarDto,
  type RequestOptions,
  type StudyOverviewDto,
  type WeakPointDto,
} from '@/api';
import { useUserStore } from './user';

export const useStudyStore = defineStore('study', () => {
  const userStore = useUserStore();

  const overview = ref<StudyOverviewDto | null>(null);
  const checkins = ref<Record<string, CheckinCalendarDto>>({});
  const weakPoints = ref<Record<string, WeakPointDto[]>>({});
  let generation = 0;

  async function fetchOverview(options?: RequestOptions): Promise<StudyOverviewDto | null> {
    if (!userStore.isLoggedIn) return null;
    const current = generation;
    const result = await getStudyOverview(options);
    if (current === generation) overview.value = result;
    return result;
  }

  /** 打卡日历，month 为 YYYY-MM */
  async function fetchCheckins(month: string): Promise<CheckinCalendarDto> {
    const current = generation;
    const result = await getCheckins({ month });
    if (current === generation) checkins.value = { ...checkins.value, [result.month || month]: result };
    return result;
  }

  async function fetchWeakPoints(subjectId: string, options?: RequestOptions): Promise<WeakPointDto[]> {
    if (!userStore.isLoggedIn) return [];
    const current = generation;
    const result = await getStudyWeakPoints({ subjectId }, options);
    if (current === generation) weakPoints.value = { ...weakPoints.value, [subjectId]: result };
    return result;
  }

  function reset() {
    generation++;
    overview.value = null;
    checkins.value = {};
    weakPoints.value = {};
  }

  watch(
    () => userStore.token,
    (token, previous) => {
      if (!token !== !previous) reset();
    },
  );

  return { overview, checkins, weakPoints, fetchOverview, fetchCheckins, fetchWeakPoints, reset };
});
