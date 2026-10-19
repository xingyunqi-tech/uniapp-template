import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { ApiError, http, setAuthHandlers } from '@/api/core/alova';
import { storage, STORAGE_KEYS } from '@/utils/storage';

const platform = vi.hoisted(() => ({ alipay: true }));

vi.mock('@/utils/platform', async importOriginal => ({
  ...(await importOriginal<typeof import('@/utils/platform')>()),
  isAlipay: () => platform.alipay,
}));

interface RequestOptions {
  url: string;
  header: Record<string, string>;
  success: (result: unknown) => void;
  fail: (result: unknown) => void;
}

type Reply = { success: unknown } | { fail: unknown };

const requestMock = uni.request as unknown as Mock;

function mockServer(handler: (options: RequestOptions) => Reply) {
  const calls: RequestOptions[] = [];
  requestMock.mockImplementation((options: RequestOptions) => {
    const snapshot = { ...options, header: { ...options.header } };
    calls.push(snapshot);
    const reply = handler(snapshot);
    void Promise.resolve().then(() => ('success' in reply ? options.success(reply.success) : options.fail(reply.fail)));
    return { abort: vi.fn() };
  });
  return calls;
}

const phoneBindingBody = { code: 403, message: 'forbidden', data: { errorKey: 'phoneBindingRequired' } };

beforeEach(() => {
  platform.alipay = true;
  vi.mocked(uni.showToast).mockClear();
});

afterEach(() => {
  requestMock.mockReset();
  setAuthHandlers(null);
});

describe('支付宝小程序请求适配', () => {
  it('HTTP 错误经 fail 返回时解析出业务错误键并提示', async () => {
    mockServer(() => ({
      fail: { errMsg: 'request:fail 19', statusCode: 403, data: phoneBindingBody, header: {} },
    }));

    const error = await http.Get('/api/v1/ai/conversations').catch(err => err);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 403,
      errorKey: 'phoneBindingRequired',
      message: '请使用手机号登录后使用 AI 助教',
    });
    expect(uni.showToast).toHaveBeenCalledWith(expect.objectContaining({ title: '请使用手机号登录后使用 AI 助教' }));
  });

  it('兼容 status、headers 字段与字符串响应体', async () => {
    mockServer(() => ({
      fail: { errMsg: 'request:fail 19', status: 422, data: JSON.stringify(phoneBindingBody), headers: {} },
    }));

    await expect(http.Get('/x', { meta: { showError: false } })).rejects.toMatchObject({
      status: 422,
      errorKey: 'phoneBindingRequired',
    });
  });

  it('401 经 fail 返回时刷新 Token 并重发', async () => {
    storage.set(STORAGE_KEYS.TOKEN, 'expired');
    const refreshToken = vi.fn(async () => {
      storage.set(STORAGE_KEYS.TOKEN, 'fresh');
      return 'fresh';
    });
    setAuthHandlers({ refreshToken, clearAuth: vi.fn() });
    const calls = mockServer(({ header }) =>
      header.Authorization === 'Bearer fresh'
        ? { success: { statusCode: 200, data: { code: 200, message: 'ok', data: 'done' }, header: {} } }
        : { fail: { errMsg: 'request:fail 19', statusCode: 401, data: { code: 401, message: 'Unauthorized' } } },
    );

    await expect(http.Get('/profile')).resolves.toMatchObject({ data: 'done' });
    expect(refreshToken).toHaveBeenCalledTimes(1);
    expect(calls.map(call => call.header.Authorization)).toEqual(['Bearer expired', 'Bearer fresh']);
  });

  it('网络失败仍按网络错误处理', async () => {
    mockServer(() => ({ fail: { errMsg: 'request:fail timeout' } }));

    const error = await http.Get('/x').catch(err => err);

    expect(error).not.toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ message: 'request:fail timeout' });
    expect(uni.showToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'request:fail timeout' }));
  });

  it('fail 带非错误状态码时按网络错误处理', async () => {
    mockServer(() => ({ fail: { errMsg: 'request:fail', statusCode: 200, data: { code: 200 } } }));

    const error = await http.Get('/x', { meta: { showError: false } }).catch(err => err);

    expect(error).not.toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ message: 'request:fail' });
  });

  it('非支付宝平台不转换 fail 结果', async () => {
    platform.alipay = false;
    mockServer(() => ({
      fail: { errMsg: 'request:fail 19', statusCode: 403, data: phoneBindingBody, header: {} },
    }));

    const error = await http.Get('/x', { meta: { showError: false } }).catch(err => err);

    expect(error).not.toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ message: 'request:fail 19' });
  });

  it('上传返回的字符串状态码按数字处理', async () => {
    const uploadFile = vi.fn((options: { success: (result: unknown) => void }) => {
      void Promise.resolve().then(() => options.success({ statusCode: '403', data: JSON.stringify(phoneBindingBody) }));
      return { abort: vi.fn(), onProgressUpdate: vi.fn() };
    });
    const target = uni as unknown as { uploadFile?: unknown };
    target.uploadFile = uploadFile;
    try {
      await expect(
        http.Post(
          '/upload',
          { name: 'file', filePath: 'tmp/a.jpg' },
          { requestType: 'upload', meta: { showError: false } },
        ),
      ).rejects.toMatchObject({ status: 403, errorKey: 'phoneBindingRequired' });
      expect(uploadFile).toHaveBeenCalled();
    } finally {
      delete target.uploadFile;
    }
  });
});
