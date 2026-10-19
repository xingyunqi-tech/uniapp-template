/**
 * AI 功能前置条件：总开关、AI 服务声明同意、手机号绑定，以及「问 AI」入口
 */
import { computed, ref } from 'vue';
import { ApiError, ConsentType } from '@/api';
import { PAGES } from '@/constants/pages';
import { useAiStore } from '@/store/modules/ai';
import { useConsentStore } from '@/store/modules/consent';
import { getBusinessErrorMessage } from '@/utils/business-error';
import { confirm } from '@/utils/modal';
import { getCurrentFullPath } from '@/utils/router';
import { showToast } from '@/utils/toast';
import { useRouter } from './useRouter';

/** retry：已补齐前置条件可重试；handled：已提示；unhandled：非前置条件错误 */
export type AiAccessResolution = 'retry' | 'handled' | 'unhandled';

/**
 * 页面内的 AI 前置条件处理，模板中放置 `<UAiConsentPopup v-model="consentVisible" @result="resolveConsent" />`
 */
export function useAiAccess() {
  const consentStore = useConsentStore();
  const aiStore = useAiStore();
  const router = useRouter();

  /** AI 服务声明弹窗是否显示 */
  const consentVisible = ref(false);
  let waiting: ((agreed: boolean) => void) | null = null;

  async function needsConsent(): Promise<boolean> {
    await consentStore.check();
    return consentStore.needsConsent(ConsentType.AI_SERVICE);
  }

  function openConsent(): Promise<boolean> {
    waiting?.(false);
    consentVisible.value = true;
    return new Promise(resolve => {
      waiting = resolve;
    });
  }

  /** 未同意当前版本 AI 服务声明时弹出声明，返回是否已同意 */
  async function ensureConsent(): Promise<boolean> {
    return (await needsConsent()) ? openConsent() : true;
  }

  /** 声明弹窗的选择结果 */
  function resolveConsent(agreed: boolean): void {
    consentVisible.value = false;
    const resolve = waiting;
    waiting = null;
    resolve?.(agreed);
  }

  /** 提示未绑定手机号的用户以手机号登录，确认后前往登录页并带回当前页 */
  async function guidePhoneLogin(): Promise<void> {
    const confirmed = await confirm({
      title: '需要手机号登录',
      content: getBusinessErrorMessage('phoneBindingRequired'),
      confirmText: '去登录',
    });
    if (confirmed) await router.push(PAGES.LOGIN, { redirect: getCurrentFullPath() }).catch(() => {});
  }

  /** 处理 AI 前置条件错误：aiConsentRequired、phoneBindingRequired、aiUnavailable */
  async function handleAccessError(error: unknown): Promise<AiAccessResolution> {
    const key = error instanceof ApiError ? error.errorKey : undefined;
    if (key === 'aiConsentRequired') {
      if (!(await needsConsent())) {
        showToast(getBusinessErrorMessage(key));
        return 'handled';
      }
      return (await openConsent()) ? 'retry' : 'handled';
    }
    if (key === 'phoneBindingRequired') {
      await guidePhoneLogin();
      return 'handled';
    }
    if (key === 'aiUnavailable') {
      showToast(getBusinessErrorMessage(key));
      aiStore.loadEnabled();
      return 'handled';
    }
    return 'unhandled';
  }

  return { consentVisible, ensureConsent, resolveConsent, handleAccessError };
}

/** 讲题目标：带 sessionId 时按该练习会话判定答案可见性 */
export interface AskAiTarget {
  questionId: string;
  sessionId?: string | null;
}

/** 「问 AI」入口：总开关关闭时不显示入口并提示，否则进入讲题对话页创建或复用会话 */
export function useAskAi() {
  const aiStore = useAiStore();
  const router = useRouter();

  /** 是否显示「问 AI」入口 */
  const aiEnabled = computed(() => aiStore.enabled);
  aiStore.ensureEnabled();

  async function askAi(target: AskAiTarget): Promise<void> {
    if (!aiStore.enabled) {
      showToast(getBusinessErrorMessage('aiUnavailable'));
      return;
    }
    await router
      .push(PAGES.AI_CHAT, {
        questionId: target.questionId,
        ...(target.sessionId ? { sessionId: target.sessionId } : {}),
      })
      .catch(() => {});
  }

  return { aiEnabled, askAi };
}
