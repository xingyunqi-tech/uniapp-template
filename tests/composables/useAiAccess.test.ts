import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { flushPromises } from '@vue/test-utils';
import { ApiError, ConsentType } from '@/api';
import { useAiAccess, useAskAi } from '@/composables/useAiAccess';
import { useAiStore } from '@/store/modules/ai';

const consent = vi.hoisted(() => ({
  check: vi.fn(),
  needsConsent: vi.fn(),
}));

vi.mock('@/store/modules/consent', () => ({ useConsentStore: () => consent }));

const router = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('@/composables/useRouter', () => ({ useRouter: () => router }));

const modal = vi.hoisted(() => ({ confirm: vi.fn() }));

vi.mock('@/utils/modal', () => modal);

const platform = vi.hoisted(() => ({ weixin: true }));

vi.mock('@/utils/platform', async importOriginal => ({
  ...(await importOriginal<typeof import('@/utils/platform')>()),
  isWeixin: () => platform.weixin,
}));

vi.mock('@/utils/router', async importOriginal => ({
  ...(await importOriginal<typeof import('@/utils/router')>()),
  getCurrentFullPath: () => '/pages-sub/ai/chat/index?questionId=q1',
}));

const api = vi.hoisted(() => ({ getConfig: vi.fn() }));

vi.mock('@/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@/api')>()),
  ...api,
}));

function businessError(errorKey: string): ApiError {
  return new ApiError('error', 403, undefined, errorKey as never, { errorKey });
}

beforeEach(() => {
  setActivePinia(createPinia());
  consent.check.mockReset().mockResolvedValue([]);
  consent.needsConsent.mockReset().mockReturnValue(false);
  router.push.mockReset().mockResolvedValue(undefined);
  modal.confirm.mockReset().mockResolvedValue(true);
  api.getConfig.mockReset().mockResolvedValue({ key: 'ai.enabled', value: true });
  platform.weixin = true;
  vi.mocked(uni.showToast).mockClear();
});

describe('useAiAccess', () => {
  it('已同意 AI 服务声明时不弹出', async () => {
    const access = useAiAccess();

    await expect(access.ensureConsent()).resolves.toBe(true);
    expect(consent.needsConsent).toHaveBeenCalledWith(ConsentType.AI_SERVICE);
    expect(access.consentVisible.value).toBe(false);
  });

  it('未同意时弹出声明并等待选择', async () => {
    consent.needsConsent.mockReturnValue(true);
    const access = useAiAccess();
    const result = access.ensureConsent();
    await flushPromises();

    expect(access.consentVisible.value).toBe(true);
    access.resolveConsent(true);
    await expect(result).resolves.toBe(true);
    expect(access.consentVisible.value).toBe(false);
  });

  it('再次弹出时以未同意结束上一次等待', async () => {
    consent.needsConsent.mockReturnValue(true);
    const access = useAiAccess();
    const first = access.ensureConsent();
    await flushPromises();
    const second = access.ensureConsent();
    await flushPromises();

    await expect(first).resolves.toBe(false);
    access.resolveConsent(false);
    await expect(second).resolves.toBe(false);
  });

  it('aiConsentRequired：需要同意时弹出声明，同意后可重试', async () => {
    consent.needsConsent.mockReturnValue(true);
    const access = useAiAccess();
    const resolution = access.handleAccessError(businessError('aiConsentRequired'));
    await flushPromises();
    access.resolveConsent(true);

    await expect(resolution).resolves.toBe('retry');
  });

  it('aiConsentRequired：本地已同意时提示错误', async () => {
    const access = useAiAccess();

    await expect(access.handleAccessError(businessError('aiConsentRequired'))).resolves.toBe('handled');
    expect(uni.showToast).toHaveBeenCalled();
  });

  it('wechatBindingRequired：微信小程序引导到登录页绑定', async () => {
    const access = useAiAccess();

    await expect(access.handleAccessError(businessError('wechatBindingRequired'))).resolves.toBe('handled');
    expect(modal.confirm).toHaveBeenCalledWith(expect.objectContaining({ confirmText: '去绑定' }));
    expect(router.push).toHaveBeenCalledWith('/pages/login/index', {
      redirect: '/pages-sub/ai/chat/index?questionId=q1',
    });
  });

  it('wechatBindingRequired：其他平台只提示', async () => {
    platform.weixin = false;
    const access = useAiAccess();

    await access.guideWechatBinding();
    expect(modal.confirm).toHaveBeenCalledWith(expect.objectContaining({ showCancel: false }));
    expect(router.push).not.toHaveBeenCalled();
  });

  it('aiUnavailable 提示并刷新总开关，其他错误不处理', async () => {
    const access = useAiAccess();

    await expect(access.handleAccessError(businessError('aiUnavailable'))).resolves.toBe('handled');
    expect(api.getConfig).toHaveBeenCalled();
    await expect(access.handleAccessError(businessError('answerHidden'))).resolves.toBe('unhandled');
    await expect(access.handleAccessError(new Error('x'))).resolves.toBe('unhandled');
  });
});

describe('useAskAi', () => {
  it('进入讲题对话页并携带练习会话，本次启动只拉取一次总开关', async () => {
    const { aiEnabled, askAi } = useAskAi();
    useAskAi();
    await flushPromises();
    expect(aiEnabled.value).toBe(true);
    expect(api.getConfig).toHaveBeenCalledTimes(1);

    await askAi({ questionId: 'q1', sessionId: 's1' });
    expect(router.push).toHaveBeenCalledWith('/pages-sub/ai/chat/index', { questionId: 'q1', sessionId: 's1' });

    await askAi({ questionId: 'q2' });
    expect(router.push).toHaveBeenLastCalledWith('/pages-sub/ai/chat/index', { questionId: 'q2' });
  });

  it('总开关关闭时提示服务暂不可用', async () => {
    api.getConfig.mockResolvedValue({ key: 'ai.enabled', value: false });
    await useAiStore().loadEnabled();
    const { aiEnabled, askAi } = useAskAi();
    expect(aiEnabled.value).toBe(false);

    await askAi({ questionId: 'q1' });
    expect(router.push).not.toHaveBeenCalled();
    expect(uni.showToast).toHaveBeenCalled();
  });
});
