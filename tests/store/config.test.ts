import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setActivePinia } from 'pinia';
import { createApp, nextTick } from 'vue';
import { createPersistedPinia } from '@/store/plugins/persist';
import { ApiError } from '@/api';

const api = vi.hoisted(() => ({
  getConfig: vi.fn(),
}));

vi.mock('@/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@/api')>()),
  ...api,
}));

const network = vi.hoisted(() => ({
  listeners: [] as Array<(isConnected: boolean) => void>,
}));

vi.mock('@/utils/network', () => ({
  onNetworkChange: (callback: (isConnected: boolean) => void) => {
    network.listeners.push(callback);
    return () => {};
  },
}));

function emitNetwork(isConnected: boolean) {
  network.listeners.forEach(listener => listener(isConnected));
}

async function flush() {
  await new Promise(resolve => setTimeout(resolve, 0));
}

const { useConfigStore } = await import('@/store/modules/config');

function createStore() {
  const pinia = createPersistedPinia();
  createApp({}).use(pinia);
  setActivePinia(pinia);
  return useConfigStore();
}

function configOf(key: string, value: unknown) {
  return { key, value: { value }, isPublic: true, createdAt: '', updatedAt: '' };
}

beforeEach(() => {
  uni.removeStorageSync('config');
  api.getConfig.mockReset();
  network.listeners.length = 0;
});

describe('config store', () => {
  it('并发拉取配置，静默请求且不触发登录跳转', async () => {
    api.getConfig.mockImplementation((key: string) => Promise.resolve(configOf(key, { key })));
    const store = createStore();

    await store.load(['a', 'b', 'a']);

    expect(api.getConfig).toHaveBeenCalledTimes(2);
    expect(api.getConfig).toHaveBeenCalledWith('a', { showError: false, skipAuthHandling: true });
    expect(store.get('a', null)).toEqual({ key: 'a' });
    expect(store.get('b', null)).toEqual({ key: 'b' });
  });

  it('单个失败不影响其他配置，load 不 reject', async () => {
    api.getConfig.mockImplementation((key: string) =>
      key === 'bad' ? Promise.reject(new Error('network')) : Promise.resolve(configOf(key, { ok: true })),
    );
    const store = createStore();

    await expect(store.load(['bad', 'good'])).resolves.toBeUndefined();

    expect(store.get('good', null)).toEqual({ ok: true });
    expect(store.get('bad', { fallback: true })).toEqual({ fallback: true });
  });

  it('未加载时返回默认值', () => {
    const store = createStore();
    expect(store.get('missing', { enabled: false })).toEqual({ enabled: false });
  });

  it('读取配置存储结构中的 value，缺少 value 时返回默认值', async () => {
    api.getConfig.mockImplementation((key: string) =>
      Promise.resolve(
        key === 'flag' ? configOf(key, false) : { key, value: {}, isPublic: true, createdAt: '', updatedAt: '' },
      ),
    );
    const store = createStore();
    await store.load(['flag', 'empty']);

    expect(store.get('flag', true)).toBe(false);
    expect(store.get('empty', 'fallback')).toBe('fallback');
  });

  it('缓存持久化，新实例启动即可读取', async () => {
    api.getConfig.mockResolvedValue(configOf('app.notice', { text: 'hi' }));
    await createStore().load(['app.notice']);
    await nextTick();

    const restored = createStore();
    expect(restored.get('app.notice', null)).toEqual({ text: 'hi' });
  });

  it('刷新失败时保留缓存', async () => {
    api.getConfig.mockResolvedValueOnce(configOf('app.notice', { text: 'hi' }));
    const store = createStore();
    await store.load(['app.notice']);

    api.getConfig.mockRejectedValueOnce(new ApiError('Unauthorized', 401));
    await store.load(['app.notice']);

    expect(store.get('app.notice', null)).toEqual({ text: 'hi' });
  });

  it('配置不存在（404）时清除缓存，回退默认值', async () => {
    api.getConfig.mockResolvedValueOnce(configOf('app.notice', { text: 'hi' }));
    const store = createStore();
    await store.load(['app.notice']);

    api.getConfig.mockRejectedValueOnce(new ApiError('configNotFound', 404));
    await store.load(['app.notice']);

    expect(store.get('app.notice', null)).toBeNull();
  });

  it('同一 key 请求进行中时复用', async () => {
    let resolve!: (value: unknown) => void;
    api.getConfig.mockReturnValue(new Promise(res => (resolve = res)));
    const store = createStore();

    const first = store.load(['k']);
    const second = store.load(['k']);
    resolve(configOf('k', { v: 1 }));
    await Promise.all([first, second]);

    expect(api.getConfig).toHaveBeenCalledTimes(1);
    expect(store.get('k', null)).toEqual({ v: 1 });
  });

  it('网络从离线恢复后只重试失败的 key', async () => {
    api.getConfig.mockImplementation((key: string) =>
      key === 'bad' ? Promise.reject(new Error('network')) : Promise.resolve(configOf(key, { ok: key })),
    );
    const store = createStore();
    await store.load(['bad', 'good']);
    api.getConfig.mockClear();
    api.getConfig.mockImplementation((key: string) => Promise.resolve(configOf(key, { ok: key })));

    emitNetwork(false);
    emitNetwork(true);
    await flush();

    expect(api.getConfig).toHaveBeenCalledTimes(1);
    expect(api.getConfig).toHaveBeenCalledWith('bad', { showError: false, skipAuthHandling: true });
    expect(store.get('bad', null)).toEqual({ ok: 'bad' });
  });

  it('在线期间的网络类型变化不重试', async () => {
    api.getConfig.mockRejectedValue(new Error('network'));
    const store = createStore();
    await store.load(['bad']);
    emitNetwork(true);
    await flush();
    api.getConfig.mockClear();

    emitNetwork(true);
    await flush();

    expect(api.getConfig).not.toHaveBeenCalled();
  });

  it('无失败或仅 404 时网络恢复不发请求', async () => {
    api.getConfig.mockImplementation((key: string) =>
      key === 'gone' ? Promise.reject(new ApiError('configNotFound', 404)) : Promise.resolve(configOf(key, {})),
    );
    const store = createStore();
    await store.load(['gone', 'ok']);
    api.getConfig.mockClear();

    emitNetwork(false);
    emitNetwork(true);
    await flush();

    expect(api.getConfig).not.toHaveBeenCalled();
  });

  it('prune 加载成功后删除不在列表里的缓存', async () => {
    api.getConfig.mockImplementation((key: string) => Promise.resolve(configOf(key, { key })));
    const store = createStore();
    await store.load(['old', 'a']);

    await store.load(['a', 'b'], { prune: true });

    expect(store.get('old', null)).toBeNull();
    expect(Object.keys(store.values).sort()).toEqual(['a', 'b']);
  });

  it('不带 prune 的按需加载不删除其他缓存', async () => {
    api.getConfig.mockImplementation((key: string) => Promise.resolve(configOf(key, { key })));
    const store = createStore();
    await store.load(['old']);

    await store.load(['a']);

    expect(store.get('old', null)).toEqual({ key: 'old' });
  });

  it('prune 加载有失败时保留缓存，重试成功后再剪枝', async () => {
    api.getConfig.mockImplementation((key: string) => Promise.resolve(configOf(key, { key })));
    const store = createStore();
    await store.load(['old', 'a']);
    api.getConfig.mockImplementation((key: string) =>
      key === 'a' ? Promise.reject(new Error('network')) : Promise.resolve(configOf(key, { key })),
    );

    await store.load(['a', 'b'], { prune: true });

    expect(store.get('old', null)).toEqual({ key: 'old' });
    expect(store.get('a', null)).toEqual({ key: 'a' });

    api.getConfig.mockImplementation((key: string) => Promise.resolve(configOf(key, { key, v: 2 })));
    await store.retryFailed();

    expect(store.get('old', null)).toBeNull();
    expect(store.get('a', null)).toEqual({ key: 'a', v: 2 });
  });

  it('prune 加载中 404 的 key 删除，其余不在列表里的缓存一并清理', async () => {
    api.getConfig.mockImplementation((key: string) => Promise.resolve(configOf(key, { key })));
    const store = createStore();
    await store.load(['old', 'a']);
    api.getConfig.mockImplementation((key: string) =>
      key === 'a' ? Promise.reject(new ApiError('configNotFound', 404)) : Promise.resolve(configOf(key, { key })),
    );

    await store.load(['a', 'b'], { prune: true });

    expect(Object.keys(store.values)).toEqual(['b']);
  });
});
