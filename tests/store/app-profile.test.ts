import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setActivePinia } from 'pinia';
import { createApp, nextTick } from 'vue';
import { createPersistedPinia } from '@/store/plugins/persist';
import { DEFAULT_SITE_PROFILE } from '@/constants/system';
import type { AppProfile } from '@/api';

const api = vi.hoisted(() => ({
  getAppProfile: vi.fn(),
}));

vi.mock('@/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@/api')>()),
  ...api,
}));

const { APP_PROFILE_MAX_AGE, useAppProfileStore } = await import('@/store/modules/app-profile');

function createStore() {
  const pinia = createPersistedPinia();
  createApp({}).use(pinia);
  setActivePinia(pinia);
  return useAppProfileStore();
}

function profileOf(overrides: Partial<AppProfile> = {}): AppProfile {
  return {
    appName: null,
    slogan: null,
    companyName: null,
    copyright: null,
    icpLicense: null,
    servicePhone: null,
    serviceHours: null,
    serviceEmail: null,
    shareTitle: null,
    ...overrides,
  };
}

beforeEach(() => {
  uni.removeStorageSync('appProfile');
  api.getAppProfile.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('app profile store', () => {
  it('未加载时使用默认站点信息', () => {
    const store = createStore();

    expect(store.profile).toEqual(DEFAULT_SITE_PROFILE);
    expect(store.shareTitle).toBe(DEFAULT_SITE_PROFILE.appName);
  });

  it('静默请求且不触发登录跳转', async () => {
    api.getAppProfile.mockResolvedValue(profileOf());
    const store = createStore();

    await store.load();

    expect(api.getAppProfile).toHaveBeenCalledWith({ showError: false, skipAuthHandling: true });
  });

  it('非 null 字段覆盖默认值，null 字段使用默认值', async () => {
    api.getAppProfile.mockResolvedValue(
      profileOf({ appName: '新名称', servicePhone: '400-000-0000', serviceEmail: 'kf@example.com' }),
    );
    const store = createStore();

    await store.load();

    expect(store.profile).toEqual({
      ...DEFAULT_SITE_PROFILE,
      appName: '新名称',
      servicePhone: '400-000-0000',
      serviceEmail: 'kf@example.com',
    });
  });

  it('空白字符串使用默认值，其余值去除首尾空白后保存', async () => {
    api.getAppProfile.mockResolvedValue(profileOf({ appName: '   ', slogan: '', servicePhone: ' 400-000-0000 ' }));
    const store = createStore();

    await store.load();

    expect(store.remote).toEqual({ servicePhone: '400-000-0000' });
    expect(store.profile.appName).toBe(DEFAULT_SITE_PROFILE.appName);
    expect(store.profile.slogan).toBe(DEFAULT_SITE_PROFILE.slogan);
    expect(store.profile.servicePhone).toBe('400-000-0000');
  });

  it('从未拉取成功时 refreshIfStale 发起拉取', async () => {
    api.getAppProfile.mockResolvedValue(profileOf());
    const store = createStore();

    await store.refreshIfStale();

    expect(api.getAppProfile).toHaveBeenCalledTimes(1);
  });

  it('距上次拉取成功未超过有效期时 refreshIfStale 不发请求，超过后重新拉取', async () => {
    vi.useFakeTimers();
    api.getAppProfile.mockResolvedValue(profileOf());
    const store = createStore();
    await store.load();

    vi.advanceTimersByTime(APP_PROFILE_MAX_AGE);
    await store.refreshIfStale();
    expect(api.getAppProfile).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1);
    await store.refreshIfStale();
    expect(api.getAppProfile).toHaveBeenCalledTimes(2);
  });

  it('上次拉取失败时 refreshIfStale 重新拉取', async () => {
    api.getAppProfile.mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce(profileOf());
    const store = createStore();
    await store.load();

    await store.refreshIfStale();

    expect(api.getAppProfile).toHaveBeenCalledTimes(2);
  });

  it('分享标题已配置时使用分享标题，未配置时使用产品名称', async () => {
    api.getAppProfile.mockResolvedValueOnce(profileOf({ appName: '新名称' }));
    const store = createStore();

    await store.load();
    expect(store.shareTitle).toBe('新名称');

    api.getAppProfile.mockResolvedValueOnce(profileOf({ appName: '新名称', shareTitle: '一起来刷题' }));
    await store.load();
    expect(store.shareTitle).toBe('一起来刷题');
  });

  it('后台改回未配置时恢复默认值', async () => {
    api.getAppProfile.mockResolvedValueOnce(profileOf({ slogan: '自定义宣传语' }));
    const store = createStore();
    await store.load();

    api.getAppProfile.mockResolvedValueOnce(profileOf());
    await store.load();

    expect(store.profile.slogan).toBe(DEFAULT_SITE_PROFILE.slogan);
  });

  it('忽略响应中的未知字段与非字符串值', async () => {
    api.getAppProfile.mockResolvedValue({ ...profileOf({ appName: 123 as unknown as string }), extra: 'x' });
    const store = createStore();

    await store.load();

    expect(store.profile).toEqual(DEFAULT_SITE_PROFILE);
    expect(store.remote).toEqual({});
  });

  it('成功后持久化，新实例启动即读取缓存', async () => {
    api.getAppProfile.mockResolvedValue(profileOf({ companyName: '缓存公司' }));
    const store = createStore();
    await store.load();
    await nextTick();

    const restored = createStore();

    expect(restored.profile.companyName).toBe('缓存公司');
  });

  it('拉取失败时保留上次缓存且不 reject', async () => {
    api.getAppProfile.mockResolvedValueOnce(profileOf({ serviceHours: '全天' }));
    const store = createStore();
    await store.load();
    await nextTick();

    api.getAppProfile.mockRejectedValueOnce(new Error('network'));
    const restored = createStore();
    await expect(restored.load()).resolves.toBeUndefined();

    expect(restored.profile.serviceHours).toBe('全天');
  });

  it('拉取失败且无缓存时使用默认值', async () => {
    api.getAppProfile.mockRejectedValue(new Error('network'));
    const store = createStore();

    await store.load();

    expect(store.profile).toEqual(DEFAULT_SITE_PROFILE);
  });

  it('并发调用复用同一请求', async () => {
    api.getAppProfile.mockResolvedValue(profileOf());
    const store = createStore();

    await Promise.all([store.load(), store.load()]);

    expect(api.getAppProfile).toHaveBeenCalledTimes(1);
  });
});
