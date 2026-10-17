import { afterEach, describe, expect, it, vi, type Mock } from 'vitest';
import { ApiError, http, setAuthHandlers } from '@/api/core/alova';
import { customMutator } from '@/api/core/mutator';
import { storage, STORAGE_KEYS } from '@/utils/storage';
import { reportApiError } from '@/utils/error-reporter';
import { i18n } from '@/utils/locale';
import { LOCALE_TYPE } from '@/constants/system';
import zhCN from '@/locale/zh-CN.json';
import enUS from '@/locale/en-US.json';

vi.mock('@/utils/error-reporter', async importOriginal => ({
  ...(await importOriginal<typeof import('@/utils/error-reporter')>()),
  reportApiError: vi.fn(),
}));

interface RequestOptions {
  url: string;
  method: string;
  header: Record<string, string>;
  data?: unknown;
  success: (res: { statusCode: number; data: unknown; header: Record<string, string> }) => void;
}

const requestMock = uni.request as unknown as Mock;
const originalLocale = i18n.global.locale.value;

function reply(statusCode: number, data?: unknown) {
  const calls: RequestOptions[] = [];
  requestMock.mockImplementation((options: RequestOptions) => {
    calls.push(options);
    void Promise.resolve().then(() => options.success({ statusCode, data, header: {} }));
    return { abort: vi.fn() };
  });
  return calls;
}

afterEach(() => {
  requestMock.mockReset();
  (uni.showToast as Mock).mockClear();
  (reportApiError as Mock).mockClear();
  storage.remove(STORAGE_KEYS.DEVICE_ID);
  storage.remove(STORAGE_KEYS.TOKEN);
  setAuthHandlers(null);
  i18n.global.locale.value = originalLocale;
});

describe('业务错误键提示', () => {
  const takenOver = { code: 409, message: 'Conflict', data: { errorKey: 'sessionTakenOver' } };

  it('已登记的错误键提示对应文案，错误携带 errorKey', async () => {
    i18n.global.locale.value = LOCALE_TYPE.ZH_CN;
    reply(409, takenOver);

    const error = await http
      .Post('/practice/sessions/1/answers', {})
      .send()
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      message: zhCN['businessError.sessionTakenOver'],
      status: 409,
      errorKey: 'sessionTakenOver',
    });
    expect(uni.showToast).toHaveBeenCalledWith({ title: zhCN['businessError.sessionTakenOver'], icon: 'none' });
  });

  it('文案跟随界面语言', async () => {
    i18n.global.locale.value = LOCALE_TYPE.EN_US;
    reply(409, takenOver);

    await expect(http.Post('/answers', {}).send()).rejects.toThrow(enUS['businessError.sessionTakenOver']);
  });

  it('未登记的错误键使用后端 message，errorKey 为空', async () => {
    reply(409, { code: 409, message: '冲突', data: { errorKey: 'unknownKey' } });

    const error = await http
      .Post('/answers', {})
      .send()
      .catch((e: unknown) => e);

    expect(error).toMatchObject({ message: '冲突', errorKey: undefined });
  });

  it('带已登记错误键的 5xx 不上报，未带错误键的 5xx 上报', async () => {
    reply(503, { code: 503, message: 'Service Unavailable', data: { errorKey: 'aiUnavailable' } });
    await expect(http.Post('/ai', {}).send()).rejects.toMatchObject({ status: 503, errorKey: 'aiUnavailable' });
    expect(reportApiError).not.toHaveBeenCalled();

    reply(503, { code: 503, message: 'Service Unavailable', data: null });
    await expect(http.Post('/ai', {}).send()).rejects.toMatchObject({ status: 503 });
    expect(reportApiError).toHaveBeenCalledWith('/ai', 'POST', 'Service Unavailable', 503);
  });

  it('showError 为 false 时不提示，错误仍携带 errorKey', async () => {
    reply(429, { code: 429, message: 'Too Many Requests', data: { errorKey: 'aiQuotaExceeded' } });

    const error = await http
      .Post('/ai', {}, { meta: { showError: false } })
      .send()
      .catch((e: unknown) => e);

    expect(error).toMatchObject({ errorKey: 'aiQuotaExceeded' });
    expect(uni.showToast).not.toHaveBeenCalled();
  });
});

describe('设备标识', () => {
  const ok = { code: 200, message: 'ok', data: null };

  it('默认不携带 deviceId', async () => {
    const calls = reply(200, ok);

    await http.Post('/plain', { a: 1 }).send();
    await http.Get('/plain').send();

    expect(calls[0].data).toEqual({ a: 1 });
    expect(calls[1].url).toBe('/plain');
  });

  it('withDeviceId 时合并进请求体，多次请求使用同一标识', async () => {
    storage.set(STORAGE_KEYS.DEVICE_ID, 'device-1');
    const calls = reply(200, ok);

    await http.Post('/sessions', { mode: 'MOCK' }, { meta: { withDeviceId: true } }).send();
    await http.Put('/sessions/1/answers', undefined, { meta: { withDeviceId: true } }).send();

    expect(calls[0].data).toEqual({ mode: 'MOCK', deviceId: 'device-1' });
    expect(calls[1].data).toEqual({ deviceId: 'device-1' });
  });

  it('withDeviceId 的 GET 请求写入查询参数', async () => {
    storage.set(STORAGE_KEYS.DEVICE_ID, 'device-1');
    const calls = reply(200, ok);

    await http.Get('/sessions', { params: { page: 1 }, meta: { withDeviceId: true } }).send();

    expect(calls[0].url).toBe('/sessions?page=1&deviceId=device-1');
  });

  it('withDeviceId 的 DELETE 请求合并进请求体', async () => {
    storage.set(STORAGE_KEYS.DEVICE_ID, 'device-1');
    const calls = reply(200, ok);

    await http.Delete('/sessions/1', { reason: 'quit' }, { meta: { withDeviceId: true } }).send();

    expect(calls[0].method).toBe('DELETE');
    expect(calls[0].data).toEqual({ reason: 'quit', deviceId: 'device-1' });
  });

  it.each([
    ['字符串', 'raw-text'],
    ['ArrayBuffer', new ArrayBuffer(4)],
  ])('请求体为%s时写入查询参数，请求体不变', async (_name, body) => {
    storage.set(STORAGE_KEYS.DEVICE_ID, 'device-1');
    const calls = reply(200, ok);

    await http.Post('/raw', body, { params: { a: 1 }, meta: { withDeviceId: true } }).send();

    expect(calls[0].url).toBe('/raw?a=1&deviceId=device-1');
    expect(calls[0].data).toBe(body);
  });

  it('上传请求的 deviceId 进入 formData', async () => {
    storage.set(STORAGE_KEYS.DEVICE_ID, 'device-1');
    const uploadFile = vi.fn((options: { success: (res: { statusCode: number; data: string }) => void }) => {
      void Promise.resolve().then(() => options.success({ statusCode: 200, data: JSON.stringify(ok) }));
      return { abort: vi.fn(), onProgressUpdate: vi.fn() };
    });
    const target = uni as unknown as Record<string, unknown>;
    target.uploadFile = uploadFile;

    try {
      await http
        .Post(
          '/upload',
          { name: 'file', filePath: 'tmp/a.jpg' },
          { requestType: 'upload', meta: { withDeviceId: true } },
        )
        .send();
    } finally {
      delete target.uploadFile;
    }

    expect(uploadFile).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'file', filePath: 'tmp/a.jpg', formData: { deviceId: 'device-1' } }),
    );
  });

  it('GET 请求 401 刷新 Token 后重发保留原查询参数', async () => {
    storage.set(STORAGE_KEYS.DEVICE_ID, 'device-1');
    storage.set(STORAGE_KEYS.TOKEN, 'expired');
    setAuthHandlers({
      refreshToken: async () => {
        storage.set(STORAGE_KEYS.TOKEN, 'fresh');
        return 'fresh';
      },
      clearAuth: vi.fn(),
    });
    const calls: RequestOptions[] = [];
    requestMock.mockImplementation((options: RequestOptions) => {
      calls.push(options);
      const fresh = options.header.Authorization === 'Bearer fresh';
      const data = fresh ? ok : { code: 401, message: 'Unauthorized' };
      void Promise.resolve().then(() => options.success({ statusCode: fresh ? 200 : 401, data, header: {} }));
      return { abort: vi.fn() };
    });

    await http.Get('/sessions', { params: { page: 1 }, meta: { withDeviceId: true } }).send();

    expect(calls.map(call => call.url)).toEqual([
      '/sessions?page=1&deviceId=device-1',
      '/sessions?page=1&deviceId=device-1',
    ]);
  });

  it('经 Orval mutator 的 options 开启 withDeviceId', async () => {
    storage.set(STORAGE_KEYS.DEVICE_ID, 'device-1');
    const calls = reply(200, ok);

    await customMutator({ url: '/sessions', method: 'POST', data: { mode: 'MOCK' } }, { withDeviceId: true });

    expect(calls[0].data).toEqual({ mode: 'MOCK', deviceId: 'device-1' });
  });

  it('首次请求生成并保存 deviceId', async () => {
    const calls = reply(200, ok);

    await http.Post('/sessions', {}, { meta: { withDeviceId: true } }).send();

    const saved = storage.get<string>(STORAGE_KEYS.DEVICE_ID);
    expect(saved).toBeTruthy();
    expect(calls[0].data).toEqual({ deviceId: saved });
  });
});
