import { ref } from 'vue';
import { PracticeMode, PracticeSessionStatus, type PracticeSessionDto } from '@/api';
import { PAGES } from '@/constants/pages';
import { usePracticeStore, type StartPracticeParams } from '@/store/modules/practice';
import { useUserStore } from '@/store/modules/user';
import { alert } from '@/utils/modal';
import { getCurrentFullPath } from '@/utils/router';
import { showToast } from '@/utils/toast';
import { useRouter } from './useRouter';

export interface LaunchOptions {
  /** 以 redirectTo 打开答题页或成绩报告 */
  replace?: boolean;
}

/** 开始练习与续考：登录校验、模考续考与超时交卷、跳转答题页或成绩报告 */
export function usePracticeLauncher() {
  const practiceStore = usePracticeStore();
  const userStore = useUserStore();
  const router = useRouter();
  const launching = ref(false);

  function requireLogin(): boolean {
    if (userStore.isLoggedIn) return true;
    const redirect = getCurrentFullPath();
    router.push(PAGES.LOGIN, redirect ? { redirect } : undefined);
    return false;
  }

  function go(url: string, params: Record<string, string>, options?: LaunchOptions) {
    return options?.replace ? router.replace(url, params) : router.push(url, params);
  }

  async function launch(params: StartPracticeParams, options?: LaunchOptions): Promise<boolean> {
    if (launching.value || !requireLogin()) return false;
    launching.value = true;
    try {
      let result = await practiceStore.start(params);
      if (result.mode === PracticeMode.MOCK && result.status === PracticeSessionStatus.ABANDONED) {
        result = await practiceStore.start(params);
      }
      if (result.status === PracticeSessionStatus.SUBMITTED) {
        showToast('上次考试已超时自动交卷');
        await go(PAGES.EXAM_REPORT, { sessionId: result.id }, options);
        return true;
      }
      if (result.status !== PracticeSessionStatus.IN_PROGRESS) return false;
      if (!result.isActiveDevice) {
        await alert('考试已截止，未交卷的作答请在原设备上补交');
        return false;
      }
      await go(PAGES.EXAM_ANSWER, { sessionId: result.id }, options);
      if (result.insufficient) showToast(`可出题目不足，本次共 ${result.questionCount} 题`);
      return true;
    } catch (error) {
      console.error('开始练习失败:', error);
      return false;
    } finally {
      launching.value = false;
    }
  }

  /** 继续未完成的会话：模考经创建接口续考以接管当前设备 */
  async function resume(session: PracticeSessionDto, options?: LaunchOptions): Promise<boolean> {
    if (session.mode === PracticeMode.MOCK && session.paperId) {
      return launch({ mode: PracticeMode.MOCK, subjectId: session.subjectId, paperId: session.paperId }, options);
    }
    if (!requireLogin()) return false;
    await go(PAGES.EXAM_ANSWER, { sessionId: session.id }, options);
    return true;
  }

  return { launching, launch, resume, requireLogin };
}
