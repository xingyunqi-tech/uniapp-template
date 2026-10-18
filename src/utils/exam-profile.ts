import type { Exam } from '@/api';
import { DEFAULT_DAILY_GOAL } from '@/constants/exam';

export interface ExamProfileSettings {
  examDate?: string | null;
  dailyGoal?: number;
}

export interface ExamProfileView {
  examId: string;
  isCurrent: boolean;
  examDate: string | null;
  dailyGoal: number;
  exam?: Exam;
}

export interface GuestExamProfile extends ExamProfileView {
  followedAt: number;
}

export function followGuestExam(
  profiles: GuestExamProfile[],
  exam: Exam,
  settings: ExamProfileSettings = {},
  now = Date.now(),
): GuestExamProfile[] {
  const existing = profiles.find(profile => profile.examId === exam.id);
  if (existing) {
    return profiles.map(profile =>
      profile === existing
        ? {
            ...profile,
            exam,
            examDate: settings.examDate !== undefined ? settings.examDate : profile.examDate,
            dailyGoal: settings.dailyGoal ?? profile.dailyGoal,
          }
        : profile,
    );
  }
  return [
    ...profiles,
    {
      examId: exam.id,
      exam,
      isCurrent: !profiles.some(profile => profile.isCurrent),
      examDate: settings.examDate ?? null,
      dailyGoal: settings.dailyGoal ?? DEFAULT_DAILY_GOAL,
      followedAt: now,
    },
  ];
}

export function setGuestCurrentExam(profiles: GuestExamProfile[], examId: string): GuestExamProfile[] {
  if (!profiles.some(profile => profile.examId === examId)) return profiles;
  return profiles.map(profile => ({ ...profile, isCurrent: profile.examId === examId }));
}

/** 取消关注当前考试时，最近关注的另一个考试成为当前 */
export function unfollowGuestExam(profiles: GuestExamProfile[], examId: string): GuestExamProfile[] {
  const removed = profiles.find(profile => profile.examId === examId);
  if (!removed) return profiles;
  const rest = profiles.filter(profile => profile !== removed);
  if (!removed.isCurrent || rest.length === 0) return rest;
  const latest = rest.reduce((a, b) => (b.followedAt > a.followedAt ? b : a));
  return rest.map(profile => ({ ...profile, isCurrent: profile === latest }));
}

/** 按关注时间先后排序 */
export function guestSyncOrder(profiles: GuestExamProfile[]): GuestExamProfile[] {
  return [...profiles].sort((a, b) => a.followedAt - b.followedAt);
}
