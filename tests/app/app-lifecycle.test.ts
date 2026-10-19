import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';

const hooks = vi.hoisted(() => ({}) as Record<string, (...args: unknown[]) => void>);
const appProfileStore = vi.hoisted(() => ({ load: vi.fn(), refreshIfStale: vi.fn() }));

vi.mock('@dcloudio/uni-app', () => {
  const register = (name: string) => (callback: (...args: unknown[]) => void) => {
    hooks[name] = callback;
  };
  return {
    onLaunch: register('onLaunch'),
    onShow: register('onShow'),
    onHide: register('onHide'),
    onError: register('onError'),
    onUnhandledRejection: register('onUnhandledRejection'),
    onThemeChange: register('onThemeChange'),
    onPageNotFound: register('onPageNotFound'),
  };
});
vi.mock('@/store/modules/app-profile', () => ({ useAppProfileStore: () => appProfileStore }));
vi.mock('@/store/modules/global', () => ({ useGlobalStore: () => ({ initTheme: vi.fn(), initLocale: vi.fn() }) }));
vi.mock('@/store/modules/user', () => ({ useUserStore: () => ({ ensureSession: () => Promise.resolve() }) }));
vi.mock('@/store/modules/config', () => ({ useConfigStore: () => ({ load: vi.fn() }) }));
vi.mock('@/store/modules/consent', () => ({ useConsentStore: () => ({ check: vi.fn() }) }));
vi.mock('@/utils/update', () => ({ checkUpdate: vi.fn() }));
vi.mock('@/utils/network', () => ({ setupNetworkListener: vi.fn(), onNetworkChange: vi.fn() }));
vi.mock('@/utils/error-reporter', () => ({ initErrorReporter: vi.fn(() => ({})), resetReportFailureCount: vi.fn() }));
vi.mock('@/utils/performance-reporter', () => ({ initPerformanceReporter: vi.fn() }));

const { default: App } = await import('@/App.vue');

beforeEach(() => {
  appProfileStore.load.mockClear();
  appProfileStore.refreshIfStale.mockClear();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  mount(App);
});

describe('App 站点信息拉取', () => {
  it('启动时拉取站点信息', () => {
    hooks.onLaunch({});

    expect(appProfileStore.load).toHaveBeenCalledTimes(1);
  });

  it('回到前台时按有效期刷新站点信息', () => {
    hooks.onShow({});

    expect(appProfileStore.refreshIfStale).toHaveBeenCalledTimes(1);
    expect(appProfileStore.load).not.toHaveBeenCalled();
  });
});
