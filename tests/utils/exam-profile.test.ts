import { describe, expect, it } from 'vitest';
import type { Exam } from '@/api';
import {
  followGuestExam,
  guestSyncOrder,
  setGuestCurrentExam,
  unfollowGuestExam,
  type GuestExamProfile,
} from '@/utils/exam-profile';

function exam(id: string): Exam {
  return {
    id,
    name: `考试${id}`,
    category: 'CIVIL_SERVICE',
    icon: null,
    description: null,
    sort: 0,
    status: 'PUBLISHED',
    createdAt: '',
    updatedAt: '',
  };
}

function followAll(ids: string[]): GuestExamProfile[] {
  return ids.reduce<GuestExamProfile[]>((profiles, id, index) => followGuestExam(profiles, exam(id), {}, index), []);
}

describe('followGuestExam', () => {
  it('首个关注的考试成为当前，使用默认每日目标', () => {
    const [first] = followGuestExam([], exam('a'), {}, 1);

    expect(first).toMatchObject({ examId: 'a', isCurrent: true, examDate: null, dailyGoal: 30, followedAt: 1 });
  });

  it('后续关注的考试不改变当前考试', () => {
    const profiles = followAll(['a', 'b']);

    expect(profiles.map(profile => profile.isCurrent)).toEqual([true, false]);
  });

  it('重复关注时更新考试日期与每日目标，保留关注时间', () => {
    const profiles = followGuestExam(followAll(['a']), exam('a'), { examDate: '2026-11-29', dailyGoal: 50 }, 99);

    expect(profiles).toHaveLength(1);
    expect(profiles[0]).toMatchObject({ examDate: '2026-11-29', dailyGoal: 50, followedAt: 0 });
  });

  it('未传入的设置保持原值，examDate 传 null 时清空', () => {
    const followed = followGuestExam([], exam('a'), { examDate: '2026-11-29', dailyGoal: 50 });

    expect(followGuestExam(followed, exam('a'), {})[0]).toMatchObject({ examDate: '2026-11-29', dailyGoal: 50 });
    expect(followGuestExam(followed, exam('a'), { examDate: null })[0].examDate).toBeNull();
  });
});

describe('setGuestCurrentExam', () => {
  it('同一时间只有一个当前考试', () => {
    const profiles = setGuestCurrentExam(followAll(['a', 'b']), 'b');

    expect(profiles.filter(profile => profile.isCurrent).map(profile => profile.examId)).toEqual(['b']);
  });

  it('未关注的考试不改变当前考试', () => {
    const profiles = followAll(['a']);

    expect(setGuestCurrentExam(profiles, 'x')).toBe(profiles);
  });
});

describe('unfollowGuestExam', () => {
  it('取消关注当前考试时，最近关注的另一个考试成为当前', () => {
    const profiles = unfollowGuestExam(followAll(['a', 'b', 'c']), 'a');

    expect(profiles.map(profile => [profile.examId, profile.isCurrent])).toEqual([
      ['b', false],
      ['c', true],
    ]);
  });

  it('取消关注非当前考试时当前考试不变', () => {
    const profiles = unfollowGuestExam(followAll(['a', 'b']), 'b');

    expect(profiles.map(profile => [profile.examId, profile.isCurrent])).toEqual([['a', true]]);
  });

  it('取消唯一的考试后列表为空', () => {
    expect(unfollowGuestExam(followAll(['a']), 'a')).toEqual([]);
  });
});

describe('guestSyncOrder', () => {
  it('按关注时间先后排序', () => {
    const [a, b] = followAll(['a', 'b']);

    expect(guestSyncOrder([b, a]).map(profile => profile.examId)).toEqual(['a', 'b']);
  });
});
