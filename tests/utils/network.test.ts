import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type StatusHandler = (res: { isConnected: boolean; networkType: string }) => void;

let emitStatus: StatusHandler;

async function setup(initialType = 'wifi', options = {}) {
  vi.resetModules();
  vi.mocked(uni).getNetworkType = vi.fn(({ success }) => success({ networkType: initialType })) as never;
  vi.mocked(uni).onNetworkStatusChange = vi.fn((handler: StatusHandler) => {
    emitStatus = handler;
  }) as never;
  const network = await import('@/utils/network');
  network.setupNetworkListener(options);
  return network;
}

const offline = { isConnected: false, networkType: 'none' };
const online = { isConnected: true, networkType: 'wifi' };

beforeEach(() => {
  vi.useFakeTimers();
  vi.mocked(uni.showToast).mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('setupNetworkListener', () => {
  it('启动时不提示，同步初始在线状态', async () => {
    const { isOnline } = await setup('none');

    vi.runAllTimers();
    expect(isOnline.value).toBe(false);
    expect(uni.showToast).not.toHaveBeenCalled();
  });

  it('断网与恢复时各提示一次', async () => {
    const { isOnline } = await setup();

    emitStatus(offline);
    expect(isOnline.value).toBe(false);
    vi.advanceTimersByTime(1000);
    expect(uni.showToast).toHaveBeenLastCalledWith(expect.objectContaining({ title: '网络已断开', icon: 'none' }));

    emitStatus(online);
    vi.advanceTimersByTime(1000);
    expect(uni.showToast).toHaveBeenLastCalledWith(expect.objectContaining({ title: '网络已恢复' }));
    expect(uni.showToast).toHaveBeenCalledTimes(2);
  });

  it('短时间内来回切换不提示', async () => {
    await setup();

    emitStatus(offline);
    vi.advanceTimersByTime(300);
    emitStatus(online);
    vi.advanceTimersByTime(2000);

    expect(uni.showToast).not.toHaveBeenCalled();
  });

  it('连接类型变化但仍在线时不提示', async () => {
    await setup();

    emitStatus({ isConnected: true, networkType: '4g' });
    vi.runAllTimers();

    expect(uni.showToast).not.toHaveBeenCalled();
  });

  it('showToast 为 false 时不提示，仍更新状态并触发回调', async () => {
    const { isOnline, onNetworkChange } = await setup('wifi', { showToast: false });
    const callback = vi.fn();
    onNetworkChange(callback);

    emitStatus(offline);
    vi.runAllTimers();

    expect(isOnline.value).toBe(false);
    expect(callback).toHaveBeenCalledWith(false, 'none');
    expect(uni.showToast).not.toHaveBeenCalled();
  });

  it('toastDelay 为 0 时立即提示自定义文案', async () => {
    await setup('wifi', { toastDelay: 0, offlineMessage: '没网了' });

    emitStatus(offline);

    expect(uni.showToast).toHaveBeenCalledWith(expect.objectContaining({ title: '没网了' }));
  });
});
