import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { PracticeMode, PracticeSessionStatus } from '@/api';
import { PAGES } from '@/constants/pages';
import { sessionResult } from '../fixtures/practice';

const api = vi.hoisted(() => ({ createPracticeSession: vi.fn() }));
const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
const modal = vi.hoisted(() => ({ alert: vi.fn() }));

vi.mock('@/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@/api')>()),
  ...api,
}));
vi.mock('@/composables/useRouter', () => ({ useRouter: () => router }));
vi.mock('@/utils/modal', () => modal);
vi.mock('@/utils/device', () => ({ getDeviceId: () => 'device-1' }));

const { usePracticeLauncher } = await import('@/composables/usePracticeLauncher');
const { useUserStore } = await import('@/store/modules/user');

const MOCK_PARAMS = { mode: PracticeMode.MOCK, subjectId: 'sub1', paperId: 'p1' };

beforeEach(() => {
  setActivePinia(createPinia());
  api.createPracticeSession.mockReset();
  router.push.mockReset().mockResolvedValue(undefined);
  router.replace.mockReset().mockResolvedValue(undefined);
  modal.alert.mockReset().mockResolvedValue(undefined);
  useUserStore().token = 'token';
});

describe('usePracticeLauncher', () => {
  it('未登录时跳转登录页，不创建会话', async () => {
    useUserStore().token = '';
    const { launch } = usePracticeLauncher();

    expect(await launch({ mode: PracticeMode.RANDOM, subjectId: 'sub1' })).toBe(false);
    expect(api.createPracticeSession).not.toHaveBeenCalled();
    expect(router.push).toHaveBeenCalledWith(PAGES.LOGIN, undefined);
  });

  it('创建成功后进入答题页', async () => {
    api.createPracticeSession.mockResolvedValueOnce(sessionResult({ id: 's9' }));
    const { launch } = usePracticeLauncher();

    expect(await launch({ mode: PracticeMode.RANDOM, subjectId: 'sub1' })).toBe(true);
    expect(router.push).toHaveBeenCalledWith(PAGES.EXAM_ANSWER, { sessionId: 's9' });
  });

  it('超时再进入返回已交卷的模考时打开成绩报告', async () => {
    api.createPracticeSession.mockResolvedValueOnce(
      sessionResult({ id: 's2', mode: PracticeMode.MOCK, status: PracticeSessionStatus.SUBMITTED }),
    );
    const { launch } = usePracticeLauncher();

    await launch(MOCK_PARAMS);

    expect(router.push).toHaveBeenCalledWith(PAGES.EXAM_REPORT, { sessionId: 's2' });
  });

  it('超时未作答被放弃的模考重新开考', async () => {
    api.createPracticeSession
      .mockResolvedValueOnce(
        sessionResult({ id: 's2', mode: PracticeMode.MOCK, status: PracticeSessionStatus.ABANDONED }),
      )
      .mockResolvedValueOnce(sessionResult({ id: 's3', mode: PracticeMode.MOCK }));
    const { launch } = usePracticeLauncher();

    await launch(MOCK_PARAMS, { replace: true });

    expect(api.createPracticeSession).toHaveBeenCalledTimes(2);
    expect(router.replace).toHaveBeenCalledWith(PAGES.EXAM_ANSWER, { sessionId: 's3' });
  });

  it('截止后在新设备进入时提示并不进入答题', async () => {
    api.createPracticeSession.mockResolvedValueOnce(sessionResult({ mode: PracticeMode.MOCK, isActiveDevice: false }));
    const { launch } = usePracticeLauncher();

    expect(await launch(MOCK_PARAMS)).toBe(false);
    expect(modal.alert).toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
  });

  it('续考模考经创建接口，其他模式直接打开会话', async () => {
    api.createPracticeSession.mockResolvedValueOnce(sessionResult({ id: 's5', mode: PracticeMode.MOCK }));
    const { resume } = usePracticeLauncher();

    await resume(sessionResult({ id: 's5', mode: PracticeMode.MOCK, paperId: 'p1' }));
    await resume(sessionResult({ id: 's6' }));

    expect(api.createPracticeSession).toHaveBeenCalledWith({ ...MOCK_PARAMS, deviceId: 'device-1' });
    expect(router.push).toHaveBeenCalledWith(PAGES.EXAM_ANSWER, { sessionId: 's6' });
  });
});
