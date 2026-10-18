import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { nextTick } from 'vue';
import { ApiError } from '@/api/core/alova';
import type { Exam, UserExamProfile } from '@/api';

const api = vi.hoisted(() => ({
  getExams: vi.fn(),
  getExamSubjects: vi.fn(),
  getMyExamProfiles: vi.fn(),
  upsertMyExamProfile: vi.fn(),
  setMyCurrentExam: vi.fn(),
  deleteMyExamProfile: vi.fn(),
}));

vi.mock('@/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@/api')>()),
  ...api,
}));

const { useExamStore } = await import('@/store/modules/exam');
const { useUserStore } = await import('@/store/modules/user');

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

function serverProfile(examId: string, isCurrent: boolean): UserExamProfile {
  return {
    id: `p-${examId}`,
    userId: 1,
    examId,
    isCurrent,
    examDate: null,
    dailyGoal: 30,
    exam: exam(examId),
    createdAt: '',
    updatedAt: '',
  };
}

function login() {
  useUserStore().token = 'token';
}

beforeEach(() => {
  setActivePinia(createPinia());
  Object.values(api).forEach(fn => fn.mockReset());
  api.getMyExamProfiles.mockResolvedValue([]);
});

describe('exam store 游客', () => {
  it('游客关注考试保存在本地，首个关注的成为当前考试', async () => {
    const store = useExamStore();

    await store.followExam(exam('a'), { examDate: '2026-11-29', dailyGoal: 40 });
    await store.followExam(exam('b'));

    expect(api.upsertMyExamProfile).not.toHaveBeenCalled();
    expect(store.currentExam?.id).toBe('a');
    expect(store.currentProfile).toMatchObject({ examDate: '2026-11-29', dailyGoal: 40 });
    expect(store.myProfiles.map(profile => profile.examId)).toEqual(['a', 'b']);
  });

  it('游客切换与取消关注当前考试', async () => {
    const store = useExamStore();
    await store.followExam(exam('a'));
    await store.followExam(exam('b'));

    await store.setCurrentExam('b');
    expect(store.currentExam?.id).toBe('b');

    await store.unfollowExam('b');
    expect(store.currentExam?.id).toBe('a');
  });
});

describe('exam store 已登录', () => {
  it('关注、设为当前、取消关注后重新拉取目标考试', async () => {
    login();
    const store = useExamStore();
    api.getMyExamProfiles.mockResolvedValue([serverProfile('a', true)]);

    await store.followExam(exam('a'), { dailyGoal: 50 });
    await store.setCurrentExam('a');
    await store.unfollowExam('a');

    expect(api.upsertMyExamProfile).toHaveBeenCalledWith('a', { dailyGoal: 50 });
    expect(api.setMyCurrentExam).toHaveBeenCalledWith('a');
    expect(api.deleteMyExamProfile).toHaveBeenCalledWith('a');
    expect(api.getMyExamProfiles).toHaveBeenCalledTimes(3);
    expect(store.currentExam?.id).toBe('a');
  });

  it('ensureProfiles 只在未加载或强制时请求', async () => {
    login();
    const store = useExamStore();
    api.getMyExamProfiles.mockResolvedValue([]);

    await store.ensureProfiles();
    await store.ensureProfiles();
    await store.ensureProfiles(true);

    expect(api.getMyExamProfiles).toHaveBeenCalledTimes(2);
  });
});

describe('游客选择同步', () => {
  it('登录后按关注顺序同步并设置当前考试，完成后清空本地', async () => {
    const store = useExamStore();
    await store.followExam(exam('a'));
    await store.followExam(exam('b'), { examDate: '2026-11-29', dailyGoal: 60 });
    await store.setCurrentExam('b');
    api.getMyExamProfiles
      .mockResolvedValueOnce([])
      .mockResolvedValue([serverProfile('a', false), serverProfile('b', true)]);

    login();
    await store.syncGuestProfiles();

    expect(api.upsertMyExamProfile.mock.calls).toEqual([
      ['a', { examDate: null, dailyGoal: 30 }, { showError: false }],
      ['b', { examDate: '2026-11-29', dailyGoal: 60 }, { showError: false }],
    ]);
    expect(api.setMyCurrentExam).toHaveBeenCalledWith('b', { showError: false });
    expect(store.guestProfiles).toEqual([]);
    expect(store.currentExam?.id).toBe('b');
  });

  it('登录态变化时自动同步', async () => {
    const store = useExamStore();
    await store.followExam(exam('a'));
    api.getMyExamProfiles.mockResolvedValueOnce([]).mockResolvedValue([serverProfile('a', true)]);

    login();
    await nextTick();
    await vi.waitFor(() => expect(store.guestProfiles).toEqual([]));

    expect(api.upsertMyExamProfile).toHaveBeenCalledTimes(1);
    expect(api.setMyCurrentExam).toHaveBeenCalledWith('a', { showError: false });
  });

  it('考试已下架等被拒绝的选择直接丢弃，其余继续同步', async () => {
    const store = useExamStore();
    await store.followExam(exam('a'));
    await store.followExam(exam('b'));
    api.upsertMyExamProfile.mockRejectedValueOnce(new ApiError('not found', 404));
    api.getMyExamProfiles.mockResolvedValueOnce([]).mockResolvedValue([serverProfile('b', true)]);

    login();
    await store.syncGuestProfiles();

    expect(api.upsertMyExamProfile).toHaveBeenCalledTimes(2);
    expect(api.setMyCurrentExam).not.toHaveBeenCalled();
    expect(store.guestProfiles).toEqual([]);
  });

  it('账号已关注的考试跳过，账号已有当前考试时不改变当前考试', async () => {
    const store = useExamStore();
    await store.followExam(exam('a'), { dailyGoal: 99 });
    await store.followExam(exam('b'));
    api.getMyExamProfiles
      .mockResolvedValueOnce([serverProfile('a', false), serverProfile('c', true)])
      .mockResolvedValue([serverProfile('a', false), serverProfile('b', false), serverProfile('c', true)]);

    login();
    await store.syncGuestProfiles();

    expect(api.upsertMyExamProfile.mock.calls.map(call => call[0])).toEqual(['b']);
    expect(api.setMyCurrentExam).not.toHaveBeenCalled();
    expect(store.guestProfiles).toEqual([]);
    expect(store.currentExam?.id).toBe('c');
  });

  it('账号没有当前考试时把游客的当前考试设为当前', async () => {
    const store = useExamStore();
    await store.followExam(exam('a'));
    await store.followExam(exam('b'));
    await store.setCurrentExam('b');
    api.getMyExamProfiles.mockResolvedValueOnce([serverProfile('a', false)]);

    login();
    await store.syncGuestProfiles();

    expect(api.upsertMyExamProfile.mock.calls.map(call => call[0])).toEqual(['b']);
    expect(api.setMyCurrentExam).toHaveBeenCalledWith('b', { showError: false });
  });

  it('读取账号目标考试失败时不同步并保留本地选择', async () => {
    const store = useExamStore();
    await store.followExam(exam('a'));
    api.getMyExamProfiles.mockRejectedValueOnce(new Error('timeout'));

    login();
    await expect(store.syncGuestProfiles()).rejects.toThrow('timeout');

    expect(api.upsertMyExamProfile).not.toHaveBeenCalled();
    expect(store.guestProfiles.map(profile => profile.examId)).toEqual(['a']);
  });

  it('网络错误时保留未同步的本地选择', async () => {
    const store = useExamStore();
    await store.followExam(exam('a'));
    await store.followExam(exam('b'));
    api.upsertMyExamProfile.mockResolvedValueOnce(serverProfile('a', true)).mockRejectedValueOnce(new Error('timeout'));

    login();
    await expect(store.syncGuestProfiles()).rejects.toThrow('timeout');

    expect(store.guestProfiles.map(profile => profile.examId)).toEqual(['b']);
  });

  it('设置当前考试遇到网络错误时保留当前考试待重试', async () => {
    const store = useExamStore();
    await store.followExam(exam('a'));
    api.setMyCurrentExam.mockRejectedValueOnce(new Error('timeout'));

    login();
    await expect(store.syncGuestProfiles()).rejects.toThrow('timeout');

    expect(store.guestProfiles.map(profile => profile.examId)).toEqual(['a']);
  });

  it('退出登录后清空账号的目标考试', async () => {
    login();
    const store = useExamStore();
    api.getMyExamProfiles.mockResolvedValue([serverProfile('a', true)]);
    await store.ensureProfiles();

    useUserStore().token = '';
    await nextTick();

    expect(store.profiles).toEqual([]);
    expect(store.currentExam).toBeNull();
  });
});

describe('科目缓存', () => {
  it('缓存科目并复用进行中的请求，选中科目按考试记录', async () => {
    const store = useExamStore();
    const subjects = [
      { id: 's1', name: '行测' },
      { id: 's2', name: '申论' },
    ];
    api.getExamSubjects.mockResolvedValue(subjects);
    await store.followExam(exam('a'));

    await Promise.all([store.fetchSubjects('a'), store.fetchSubjects('a')]);
    await store.fetchSubjects('a');

    expect(api.getExamSubjects).toHaveBeenCalledTimes(1);
    expect(store.currentSubject?.id).toBe('s1');

    store.selectSubject('a', 's2');
    expect(store.currentSubject?.id).toBe('s2');
  });

  it('考试列表缓存后按 id 查找考试', async () => {
    const store = useExamStore();
    api.getExams.mockResolvedValue([{ category: 'CIVIL_SERVICE', exams: [exam('a')] }]);

    await store.fetchExams();
    await store.fetchExams();

    expect(api.getExams).toHaveBeenCalledTimes(1);
    expect(store.findExam('a')?.name).toBe('考试a');
    expect(store.findExam('x')).toBeNull();
  });
});
