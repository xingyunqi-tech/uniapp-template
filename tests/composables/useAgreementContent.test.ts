import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, ConsentType } from '@/api';
import { DEFAULT_AGREEMENT_CONTENT } from '@/constants/agreement';

const api = vi.hoisted(() => ({ getConfig: vi.fn() }));
const consent = vi.hoisted(() => ({ versions: {} as Record<string, string | null> }));

vi.mock('@/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@/api')>()),
  ...api,
}));

vi.mock('@/store/modules/consent', () => ({
  useConsentStore: () => ({ currentVersion: (type: string) => consent.versions[type] ?? null }),
}));

const mod = await import('@/composables/useAgreementContent');
const NotFound = ApiError;

function configOf(key: string, html: unknown) {
  return { key, value: { value: html }, isPublic: true, createdAt: null, updatedAt: null };
}

beforeEach(() => {
  api.getConfig.mockReset();
  consent.versions = {};
  Object.values(ConsentType).forEach(mod.invalidateAgreementContent);
});

describe('fetchAgreementContent', () => {
  it('按协议类型读取对应配置 key 的正文，静默请求', async () => {
    api.getConfig.mockImplementation((key: string) => Promise.resolve(configOf(key, `<p>${key}</p>`)));

    await expect(mod.fetchAgreementContent(ConsentType.USER_AGREEMENT)).resolves.toBe('<p>agreement.userAgreement</p>');
    await expect(mod.fetchAgreementContent(ConsentType.PRIVACY_POLICY)).resolves.toBe('<p>agreement.privacyPolicy</p>');
    await expect(mod.fetchAgreementContent(ConsentType.AI_SERVICE)).resolves.toBe('<p>agreement.aiService</p>');
    expect(api.getConfig).toHaveBeenCalledWith('agreement.userAgreement', {
      showError: false,
      skipAuthHandling: true,
    });
  });

  it('配置不存在（404）时返回内置正文', async () => {
    api.getConfig.mockRejectedValue(new NotFound('configNotFound', 404));

    await expect(mod.fetchAgreementContent(ConsentType.PRIVACY_POLICY)).resolves.toBe(
      DEFAULT_AGREEMENT_CONTENT[ConsentType.PRIVACY_POLICY],
    );
  });

  it('网络失败或 5xx 时 reject，下次读取重新请求', async () => {
    api.getConfig.mockRejectedValueOnce(new Error('network'));
    api.getConfig.mockRejectedValueOnce(new NotFound('internal', 500));
    api.getConfig.mockResolvedValueOnce(configOf('agreement.aiService', '<p>远程</p>'));

    await expect(mod.fetchAgreementContent(ConsentType.AI_SERVICE)).rejects.toThrow('network');
    await expect(mod.fetchAgreementContent(ConsentType.AI_SERVICE)).rejects.toThrow('internal');
    await expect(mod.fetchAgreementContent(ConsentType.AI_SERVICE)).resolves.toBe('<p>远程</p>');
    expect(api.getConfig).toHaveBeenCalledTimes(3);
  });

  it('正文为空或格式不符时返回内置正文', async () => {
    consent.versions[ConsentType.USER_AGREEMENT] = 'v1';
    api.getConfig.mockResolvedValueOnce(configOf('agreement.userAgreement', '  '));
    api.getConfig.mockResolvedValueOnce({ ...configOf('agreement.userAgreement', ''), value: 'raw' });

    await expect(mod.fetchAgreementContent(ConsentType.USER_AGREEMENT)).resolves.toBe(
      DEFAULT_AGREEMENT_CONTENT[ConsentType.USER_AGREEMENT],
    );
    consent.versions[ConsentType.USER_AGREEMENT] = 'v2';
    await expect(mod.fetchAgreementContent(ConsentType.USER_AGREEMENT)).resolves.toBe(
      DEFAULT_AGREEMENT_CONTENT[ConsentType.USER_AGREEMENT],
    );
  });

  it('同一版本复用缓存，并发读取共用同一请求', async () => {
    api.getConfig.mockResolvedValue(configOf('agreement.userAgreement', '<p>远程</p>'));

    const [first, second] = await Promise.all([
      mod.fetchAgreementContent(ConsentType.USER_AGREEMENT),
      mod.fetchAgreementContent(ConsentType.USER_AGREEMENT),
    ]);
    const third = await mod.fetchAgreementContent(ConsentType.USER_AGREEMENT);

    expect([first, second, third]).toEqual(['<p>远程</p>', '<p>远程</p>', '<p>远程</p>']);
    expect(api.getConfig).toHaveBeenCalledTimes(1);
  });

  it('协议版本更新后重新拉取正文', async () => {
    consent.versions[ConsentType.PRIVACY_POLICY] = '1.0';
    api.getConfig.mockResolvedValueOnce(configOf('agreement.privacyPolicy', '<p>旧版</p>'));
    api.getConfig.mockResolvedValueOnce(configOf('agreement.privacyPolicy', '<p>新版</p>'));

    await expect(mod.fetchAgreementContent(ConsentType.PRIVACY_POLICY)).resolves.toBe('<p>旧版</p>');
    consent.versions[ConsentType.PRIVACY_POLICY] = '2.0';
    await expect(mod.fetchAgreementContent(ConsentType.PRIVACY_POLICY)).resolves.toBe('<p>新版</p>');
    expect(api.getConfig).toHaveBeenCalledTimes(2);
  });

  it('invalidateAgreementContent 后重新拉取该协议正文', async () => {
    api.getConfig.mockImplementation((key: string) => Promise.resolve(configOf(key, `<p>${key}</p>`)));
    await mod.fetchAgreementContent(ConsentType.AI_SERVICE);
    await mod.fetchAgreementContent(ConsentType.USER_AGREEMENT);

    mod.invalidateAgreementContent(ConsentType.AI_SERVICE);
    await mod.fetchAgreementContent(ConsentType.AI_SERVICE);
    await mod.fetchAgreementContent(ConsentType.USER_AGREEMENT);

    expect(api.getConfig.mock.calls.map(([key]) => key)).toEqual([
      'agreement.aiService',
      'agreement.userAgreement',
      'agreement.aiService',
    ]);
  });
  it('请求进行中失效时，旧结果不写入缓存', async () => {
    let resolveOld!: (value: unknown) => void;
    api.getConfig.mockReturnValueOnce(new Promise(r => (resolveOld = r)));
    api.getConfig.mockResolvedValueOnce(configOf('agreement.aiService', '<p>新版</p>'));

    const old = mod.fetchAgreementContent(ConsentType.AI_SERVICE);
    mod.invalidateAgreementContent(ConsentType.AI_SERVICE);
    const fresh = mod.fetchAgreementContent(ConsentType.AI_SERVICE);
    resolveOld(configOf('agreement.aiService', '<p>旧版</p>'));

    await expect(old).resolves.toBe('<p>旧版</p>');
    await expect(fresh).resolves.toBe('<p>新版</p>');
    await expect(mod.fetchAgreementContent(ConsentType.AI_SERVICE)).resolves.toBe('<p>新版</p>');
    expect(api.getConfig).toHaveBeenCalledTimes(2);
  });
});

describe('useAgreementContent', () => {
  it('加载期间 loading 为 true，完成后写入正文', async () => {
    let resolve!: (value: unknown) => void;
    api.getConfig.mockReturnValue(new Promise(r => (resolve = r)));
    const { content, loading, error, load } = mod.useAgreementContent();

    const pending = load(ConsentType.USER_AGREEMENT);
    expect(loading.value).toBe(true);
    resolve(configOf('agreement.userAgreement', '<p>远程</p>'));
    await pending;

    expect(loading.value).toBe(false);
    expect(error.value).toBe(false);
    expect(content.value).toBe('<p>远程</p>');
  });

  it('请求失败时 error 为 true，retry 成功后清除', async () => {
    api.getConfig.mockRejectedValueOnce(new Error('network'));
    api.getConfig.mockResolvedValueOnce(configOf('agreement.aiService', '<p>远程</p>'));
    const { content, loading, error, load, retry } = mod.useAgreementContent();

    await load(ConsentType.AI_SERVICE);
    expect(error.value).toBe(true);
    expect(loading.value).toBe(false);
    expect(content.value).toBe('');

    await retry();
    expect(error.value).toBe(false);
    expect(content.value).toBe('<p>远程</p>');
  });

  it('未加载过时 retry 不发请求', async () => {
    await mod.useAgreementContent().retry();

    expect(api.getConfig).not.toHaveBeenCalled();
  });

  it('连续加载时以最后一次为准', async () => {
    let resolveUser!: (value: unknown) => void;
    api.getConfig.mockImplementation((key: string) =>
      key === 'agreement.userAgreement'
        ? new Promise(r => (resolveUser = r))
        : Promise.resolve(configOf(key, '<p>隐私</p>')),
    );
    const { content, loading, load } = mod.useAgreementContent();

    const first = load(ConsentType.USER_AGREEMENT);
    await load(ConsentType.PRIVACY_POLICY);
    resolveUser(configOf('agreement.userAgreement', '<p>用户</p>'));
    await first;

    expect(content.value).toBe('<p>隐私</p>');
    expect(loading.value).toBe(false);
  });
});
