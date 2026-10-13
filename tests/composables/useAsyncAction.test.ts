import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAsyncAction } from '@/composables/useAsyncAction';

describe('useAsyncAction', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('成功回调延迟执行前再次调用不重复执行操作', async () => {
    const action = vi.fn(() => Promise.resolve('ok'));
    const onSuccess = vi.fn();
    const { loading, execute } = useAsyncAction({ action, onSuccess, delay: 1500 });

    await execute();
    expect(loading.value).toBe(false);
    await execute();
    await vi.advanceTimersByTimeAsync(1500);

    expect(action).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('异步成功回调完成后才允许再次执行', async () => {
    let finishCallback!: () => void;
    const action = vi.fn(() => Promise.resolve());
    const onSuccess = vi.fn(() => new Promise<void>(resolve => (finishCallback = resolve)));
    const { execute } = useAsyncAction({ action, onSuccess, delay: 0 });

    const first = execute();
    await vi.advanceTimersByTimeAsync(0);
    expect(onSuccess).toHaveBeenCalled();
    await execute();
    expect(action).toHaveBeenCalledTimes(1);

    finishCallback();
    await first;
    execute();
    expect(action).toHaveBeenCalledTimes(2);
  });

  it('操作失败后立即允许再次执行', async () => {
    const action = vi.fn(() => Promise.reject(new Error('fail')));
    const onSuccess = vi.fn();
    const { loading, execute } = useAsyncAction({ action, onSuccess, showErrorToast: false });

    await execute();
    expect(loading.value).toBe(false);
    await execute();

    expect(action).toHaveBeenCalledTimes(2);
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
