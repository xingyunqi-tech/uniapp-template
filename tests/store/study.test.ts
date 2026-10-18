import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { nextTick } from 'vue';
import type { CheckinCalendarDto, StudyOverviewDto } from '@/api';

const api = vi.hoisted(() => ({
  getStudyOverview: vi.fn(),
  getCheckins: vi.fn(),
  getStudyWeakPoints: vi.fn(),
}));

vi.mock('@/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@/api')>()),
  ...api,
}));

const { useStudyStore } = await import('@/store/modules/study');
const { useUserStore } = await import('@/store/modules/user');

function overview(overrides: Partial<StudyOverviewDto> = {}): StudyOverviewDto {
  return {
    date: '2026-10-17',
    todayAnswered: 12,
    todayCorrect: 9,
    todayDurationSec: 600,
    dailyGoal: 30,
    checkedInToday: false,
    streakDays: 2,
    examId: 'e1',
    examDate: null,
    daysUntilExam: null,
    totalAnswered: 200,
    ...overrides,
  };
}

function calendar(month: string): CheckinCalendarDto {
  return { month, days: [{ date: `${month}-01`, reason: 'GOAL_REACHED' }], streakDays: 1, checkedInToday: true };
}

beforeEach(() => {
  setActivePinia(createPinia());
  Object.values(api).forEach(fn => fn.mockReset());
});

describe('study store', () => {
  it('未登录时不请求概览与薄弱知识点', async () => {
    const store = useStudyStore();

    expect(await store.fetchOverview()).toBeNull();
    expect(await store.fetchWeakPoints('s1')).toEqual([]);
    expect(api.getStudyOverview).not.toHaveBeenCalled();
    expect(api.getStudyWeakPoints).not.toHaveBeenCalled();
  });

  it('登录后保存概览', async () => {
    useUserStore().token = 'token';
    const store = useStudyStore();
    api.getStudyOverview.mockResolvedValueOnce(overview());

    await store.fetchOverview({ showError: false });

    expect(api.getStudyOverview).toHaveBeenCalledWith({ showError: false });
    expect(store.overview?.todayAnswered).toBe(12);
  });

  it('打卡日历按月份缓存', async () => {
    useUserStore().token = 'token';
    const store = useStudyStore();
    api.getCheckins.mockImplementation(({ month }: { month: string }) => Promise.resolve(calendar(month)));

    await store.fetchCheckins('2026-09');
    await store.fetchCheckins('2026-10');

    expect(api.getCheckins).toHaveBeenCalledWith({ month: '2026-09' });
    expect(Object.keys(store.checkins)).toEqual(['2026-09', '2026-10']);
  });

  it('薄弱知识点按科目保存', async () => {
    useUserStore().token = 'token';
    const store = useStudyStore();
    const point = { knowledgePointId: 'k1', name: '函数', path: '/k1/', answered: 8, correct: 3, mastery: 45 };
    api.getStudyWeakPoints.mockResolvedValueOnce([point]);

    await store.fetchWeakPoints('s1');

    expect(api.getStudyWeakPoints).toHaveBeenCalledWith({ subjectId: 's1' }, undefined);
    expect(store.weakPoints.s1).toEqual([point]);
  });

  it('退出登录后清空数据，进行中的请求结果被丢弃', async () => {
    const userStore = useUserStore();
    userStore.token = 'token';
    const store = useStudyStore();
    await nextTick();
    let resolve: (value: StudyOverviewDto) => void = () => undefined;
    api.getStudyOverview.mockReturnValueOnce(new Promise(r => (resolve = r)));

    const task = store.fetchOverview();
    userStore.token = '';
    await nextTick();
    resolve(overview());
    await task;

    expect(store.overview).toBeNull();
  });
});
