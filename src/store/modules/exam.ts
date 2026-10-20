import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import {
  ApiError,
  ContentStatus,
  deleteMyExamProfile,
  getExamSubjects,
  getExams,
  getMyExamProfiles,
  setMyCurrentExam,
  upsertMyExamProfile,
  type Exam,
  type ExamGroupDto,
  type RequestOptions,
  type Subject,
  type UserExamProfile,
} from '@/api';
import {
  followGuestExam,
  guestSyncOrder,
  setGuestCurrentExam,
  unfollowGuestExam,
  type ExamProfileSettings,
  type ExamProfileView,
  type GuestExamProfile,
} from '@/utils/exam-profile';
import { useUserStore } from './user';

const SILENT_REQUEST: RequestOptions = { showError: false };

/** 请求被服务端明确拒绝（考试不存在、参数无效等），重试也不会成功 */
function isRejected(error: unknown): boolean {
  if (!(error instanceof ApiError) || error.status === undefined) return false;
  return error.status >= 400 && error.status < 500 && ![401, 408, 429].includes(error.status);
}

export const useExamStore = defineStore(
  'exam',
  () => {
    const userStore = useUserStore();

    const examGroups = ref<ExamGroupDto[]>([]);
    const examsLoaded = ref(false);
    const subjectsByExam = ref<Record<string, Subject[]>>({});
    const profiles = ref<UserExamProfile[]>([]);
    const profilesLoaded = ref(false);
    const guestProfiles = ref<GuestExamProfile[]>([]);
    const subjectSelection = ref<Record<string, string>>({});

    let examsTask: Promise<ExamGroupDto[]> | null = null;
    let profilesTask: Promise<UserExamProfile[]> | null = null;
    let syncTask: Promise<void> | null = null;
    const subjectTasks = new Map<string, Promise<Subject[]>>();

    const isLoggedIn = computed(() => userStore.isLoggedIn);
    /** 目标考试中已下架的考试不展示；考试列表已加载时以列表为准 */
    const myProfiles = computed<ExamProfileView[]>(() =>
      (isLoggedIn.value ? profiles.value : guestProfiles.value).filter(isListed),
    );
    const currentProfile = computed(() => myProfiles.value.find(profile => profile.isCurrent) ?? null);
    const currentExam = computed<Exam | null>(() => {
      const profile = currentProfile.value;
      return profile ? (profile.exam ?? findExam(profile.examId)) : null;
    });
    const currentSubjects = computed(() =>
      currentProfile.value ? (subjectsByExam.value[currentProfile.value.examId] ?? []) : [],
    );
    const currentSubject = computed<Subject | null>(() => {
      const subjects = currentSubjects.value;
      const selectedId = currentProfile.value ? subjectSelection.value[currentProfile.value.examId] : undefined;
      return subjects.find(subject => subject.id === selectedId) ?? subjects[0] ?? null;
    });

    function findExam(examId: string): Exam | null {
      for (const group of examGroups.value) {
        const exam = group.exams.find(item => item.id === examId);
        if (exam) return exam;
      }
      return null;
    }

    function isListed(profile: ExamProfileView): boolean {
      if (profile.exam && profile.exam.status !== ContentStatus.PUBLISHED) return false;
      return !examsLoaded.value || findExam(profile.examId) !== null;
    }

    function getProfile(examId: string): ExamProfileView | null {
      return myProfiles.value.find(profile => profile.examId === examId) ?? null;
    }

    function fetchExams(force = false): Promise<ExamGroupDto[]> {
      if (!force && examsLoaded.value) return Promise.resolve(examGroups.value);
      examsTask ??= getExams()
        .then(groups => {
          examGroups.value = groups;
          examsLoaded.value = true;
          return groups;
        })
        .finally(() => {
          examsTask = null;
        });
      return examsTask;
    }

    function fetchSubjects(examId: string, force = false): Promise<Subject[]> {
      const cached = subjectsByExam.value[examId];
      if (!force && cached) return Promise.resolve(cached);
      const existing = subjectTasks.get(examId);
      if (existing) return existing;
      const task = getExamSubjects(examId)
        .then(subjects => {
          subjectsByExam.value = { ...subjectsByExam.value, [examId]: subjects };
          return subjects;
        })
        .finally(() => subjectTasks.delete(examId));
      subjectTasks.set(examId, task);
      return task;
    }

    function selectSubject(examId: string, subjectId: string) {
      subjectSelection.value = { ...subjectSelection.value, [examId]: subjectId };
    }

    function fetchProfiles(options?: RequestOptions): Promise<UserExamProfile[]> {
      if (!isLoggedIn.value) return Promise.resolve([]);
      profilesTask ??= getMyExamProfiles(options)
        .then(list => {
          if (isLoggedIn.value) {
            profiles.value = list;
            profilesLoaded.value = true;
          }
          return list;
        })
        .finally(() => {
          profilesTask = null;
        });
      return profilesTask;
    }

    /** 已登录时先同步游客选择，再按需拉取目标考试；游客有目标考试时拉取考试列表用于排除已下架的考试 */
    async function ensureProfiles(force = false): Promise<void> {
      if (!isLoggedIn.value) {
        if (guestProfiles.value.length > 0) await fetchExams(force).catch(() => undefined);
        return;
      }
      await syncGuestProfiles().catch(() => undefined);
      if (force || !profilesLoaded.value) await fetchProfiles();
    }

    async function followExam(exam: Exam, settings: ExamProfileSettings = {}): Promise<void> {
      if (!isLoggedIn.value) {
        guestProfiles.value = followGuestExam(guestProfiles.value, exam, settings);
        return;
      }
      await upsertMyExamProfile(exam.id, settings);
      await fetchProfiles();
    }

    async function setCurrentExam(examId: string): Promise<void> {
      if (!isLoggedIn.value) {
        guestProfiles.value = setGuestCurrentExam(guestProfiles.value, examId);
        return;
      }
      await setMyCurrentExam(examId);
      await fetchProfiles();
    }

    async function unfollowExam(examId: string): Promise<void> {
      if (!isLoggedIn.value) {
        guestProfiles.value = unfollowGuestExam(guestProfiles.value, examId);
        return;
      }
      await deleteMyExamProfile(examId);
      await fetchProfiles();
    }

    async function runGuestSync(): Promise<void> {
      const existing = await getMyExamProfiles(SILENT_REQUEST);
      const existingIds = new Set(existing.map(profile => profile.examId));
      const pending = guestSyncOrder(guestProfiles.value);
      const current = existing.some(profile => profile.isCurrent)
        ? undefined
        : pending.find(profile => profile.isCurrent);
      const handled = new Set<string>();
      const followed = new Set<string>();
      try {
        for (const profile of pending) {
          if (existingIds.has(profile.examId)) {
            handled.add(profile.examId);
            continue;
          }
          try {
            await upsertMyExamProfile(
              profile.examId,
              { examDate: profile.examDate, dailyGoal: profile.dailyGoal },
              SILENT_REQUEST,
            );
            followed.add(profile.examId);
          } catch (error) {
            if (!isRejected(error)) throw error;
          }
          handled.add(profile.examId);
        }
        if (current && followed.has(current.examId)) {
          try {
            await setMyCurrentExam(current.examId, SILENT_REQUEST);
          } catch (error) {
            if (!isRejected(error)) {
              handled.delete(current.examId);
              throw error;
            }
          }
        }
      } finally {
        guestProfiles.value = guestProfiles.value.filter(profile => !handled.has(profile.examId));
        if (handled.size > 0) profilesLoaded.value = false;
      }
      await fetchProfiles(SILENT_REQUEST);
    }

    /** 把游客本地的目标考试同步到账号，账号已关注的考试与已有的当前考试不被覆盖；网络错误时保留本地数据待下次同步 */
    function syncGuestProfiles(): Promise<void> {
      if (!isLoggedIn.value || guestProfiles.value.length === 0) return Promise.resolve();
      syncTask ??= runGuestSync().finally(() => {
        syncTask = null;
      });
      return syncTask;
    }

    function reset() {
      profiles.value = [];
      profilesLoaded.value = false;
    }

    watch(
      () => userStore.token,
      (token, previous) => {
        if (token && !previous) {
          reset();
          syncGuestProfiles().catch(() => undefined);
        } else if (!token && previous) {
          reset();
        }
      },
    );

    return {
      examGroups,
      subjectsByExam,
      profiles,
      profilesLoaded,
      guestProfiles,
      subjectSelection,
      myProfiles,
      currentProfile,
      currentExam,
      currentSubjects,
      currentSubject,
      findExam,
      getProfile,
      fetchExams,
      fetchSubjects,
      selectSubject,
      fetchProfiles,
      ensureProfiles,
      followExam,
      setCurrentExam,
      unfollowExam,
      syncGuestProfiles,
      reset,
    };
  },
  {
    persist: {
      pick: ['guestProfiles', 'subjectSelection'],
    },
  },
);
