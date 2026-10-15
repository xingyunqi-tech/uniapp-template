import { afterEach, describe, expect, it, vi, type Mock } from 'vitest';
import { http, serializeParams } from '@/api/core/alova';
import { uploadFileByPath } from '@/api/custom/override';
import { getWeather } from '@/api/custom/external';
import { storage, STORAGE_KEYS } from '@/utils/storage';
import { i18n } from '@/utils/locale';

interface RequestOptions {
  url: string;
  method: string;
  header: Record<string, string>;
  data?: unknown;
  success: (res: { statusCode: number; data: unknown; header: Record<string, string> }) => void;
}

type Reply = { statusCode: number; data?: unknown };

const requestMock = uni.request as unknown as Mock;

/** 按请求返回响应，记录每次请求 */
function mockServer(handler: (options: RequestOptions) => Reply) {
  const calls: RequestOptions[] = [];
  requestMock.mockImplementation((options: RequestOptions) => {
    const snapshot = { ...options, header: { ...options.header } };
    calls.push(snapshot);
    const reply = handler(snapshot);
    void Promise.resolve().then(() => options.success({ data: reply.data, statusCode: reply.statusCode, header: {} }));
    return { abort: vi.fn() };
  });
  return calls;
}

const ok = (data: unknown = null): Reply => ({ statusCode: 200, data: { code: 200, message: 'ok', data } });

afterEach(() => {
  requestMock.mockReset();
  (uni.showLoading as Mock).mockClear();
  (uni.hideLoading as Mock).mockClear();
  storage.remove(STORAGE_KEYS.TOKEN);
});

describe('查询参数', () => {
  it('键值做 URL 编码，忽略 undefined/null，数组展开为同名多项', () => {
    expect(serializeParams({ keyword: 'a&b c#', tags: ['x', 'y'], empty: null, none: undefined, page: 1 })).toBe(
      'keyword=a%26b%20c%23&tags=x&tags=y&page=1',
    );
  });

  it('请求 URL 使用编码后的查询参数', async () => {
    const calls = mockServer(() => ok());

    await http.Get('/search', { params: { keyword: 'a&b' } }).send();

    expect(calls[0].url).toBe('/search?keyword=a%26b');
  });
});

describe('请求合并', () => {
  it('进行中的相同 GET 请求只发一次', async () => {
    const calls = mockServer(() => ok());

    await Promise.all([http.Get('/same').send(), http.Get('/same').send()]);

    expect(calls).toHaveLength(1);
  });

  it('进行中的相同 POST 请求各自发出', async () => {
    const calls = mockServer(() => ok());

    await Promise.all([http.Post('/same', { a: 1 }).send(), http.Post('/same', { a: 1 }).send()]);

    expect(calls).toHaveLength(2);
  });
});

describe('Loading', () => {
  it('并发的 showLoading 请求只显示一次，全部结束后关闭一次', async () => {
    mockServer(() => ok());
    const meta = { showLoading: true };

    await Promise.all([http.Get('/l1', { meta }).send(), http.Get('/l2', { meta }).send()]);

    expect(uni.showLoading).toHaveBeenCalledTimes(1);
    expect(uni.hideLoading).toHaveBeenCalledTimes(1);
  });

  it('命中缓存的 showLoading 请求同样关闭 Loading', async () => {
    mockServer(() => ok());
    const config = { cacheFor: 60000, meta: { showLoading: true } };

    await http.Get('/cached', config).send();
    await http.Get('/cached', config).send();

    expect(requestMock).toHaveBeenCalledTimes(1);
    expect(uni.showLoading).toHaveBeenCalledTimes(2);
    expect(uni.hideLoading).toHaveBeenCalledTimes(2);
  });

  it('错误提示顶替 Loading 后，其余请求结束不再调用 hideLoading', async () => {
    mockServer(({ url }) => (url === '/bad' ? { statusCode: 200, data: { code: 500, message: '失败' } } : ok()));
    const meta = { showLoading: true };

    await Promise.allSettled([http.Get('/bad', { meta }).send(), http.Get('/good', { meta }).send()]);

    expect(uni.showToast).toHaveBeenCalledWith({ title: '失败', icon: 'none' });
    expect(uni.hideLoading).not.toHaveBeenCalled();
  });

  it('错误提示顶替 Loading 后新开启的 Loading，只在新请求结束时关闭', async () => {
    const held = new Map<string, () => void>();
    requestMock.mockImplementation((options: RequestOptions) => {
      const reply = options.url === '/bad' ? { statusCode: 200, data: { code: 500, message: '失败' } } : ok();
      held.set(options.url, () => options.success({ data: reply.data, statusCode: reply.statusCode, header: {} }));
      return { abort: vi.fn() };
    });
    const meta = { showLoading: true };

    const bad = http.Get('/bad', { meta }).send();
    const slow = http.Get('/slow', { meta }).send();
    await vi.waitFor(() => expect(held.size).toBe(2));
    held.get('/bad')!();
    await expect(bad).rejects.toThrow('失败');

    const next = http.Get('/next', { meta }).send();
    await vi.waitFor(() => expect(held.has('/next')).toBe(true));
    held.get('/slow')!();
    await slow;
    expect(uni.hideLoading).not.toHaveBeenCalled();

    held.get('/next')!();
    await next;
    expect(uni.hideLoading).toHaveBeenCalledTimes(1);
  });

  it('未开启 showLoading 的请求失败时不关闭 Loading', async () => {
    requestMock.mockImplementation((options: { fail: (err: { errMsg: string }) => void }) => {
      void Promise.resolve().then(() => options.fail({ errMsg: 'request:fail' }));
      return { abort: vi.fn() };
    });

    await expect(http.Get('/fail', { meta: { showError: false } }).send()).rejects.toThrow('request:fail');

    expect(uni.hideLoading).not.toHaveBeenCalled();
  });
});

describe('uploadFileByPath', () => {
  it('经 http 实例上传：带 Token，解析字符串响应体', async () => {
    storage.set(STORAGE_KEYS.TOKEN, 'tk');
    const uploadMock = vi.fn(
      (options: { header: Record<string, string>; success: (res: { statusCode: number; data: string }) => void }) => {
        void Promise.resolve().then(() =>
          options.success({
            statusCode: 201,
            data: JSON.stringify({ code: 200, message: 'ok', data: { file: { id: 'f1', path: '/f1.png' } } }),
          }),
        );
        return { abort: vi.fn(), onProgressUpdate: vi.fn() };
      },
    );
    Object.assign(uni, { uploadFile: uploadMock });

    try {
      await expect(uploadFileByPath('/tmp/a.png')).resolves.toEqual({ id: 'f1', path: '/f1.png' });
      expect(uploadMock.mock.calls[0][0]).toMatchObject({
        name: 'file',
        filePath: '/tmp/a.png',
        header: { Authorization: 'Bearer tk' },
      });
    } finally {
      Reflect.deleteProperty(uni, 'uploadFile');
    }
  });
});

describe('外部 API', () => {
  it('不携带业务 Token，直接返回第三方响应体', async () => {
    storage.set(STORAGE_KEYS.TOKEN, 'tk');
    const weather = { city: 'beijing', temperature: 20, weather: 'sunny', humidity: 30 };
    const calls = mockServer(() => ({ statusCode: 200, data: weather }));

    await expect(getWeather('bei jing')).resolves.toEqual(weather);

    expect(calls[0].url).toBe('https://api.weather.example.com/weather/bei%20jing');
    expect(calls[0].header.Authorization).toBeUndefined();
  });
});

describe('语言与错误提示', () => {
  afterEach(() => {
    i18n.global.locale.value = 'zh-CN';
    (uni.showToast as Mock).mockClear();
  });

  it('按界面语言携带 x-custom-lang 请求头', async () => {
    const calls = mockServer(() => ok());

    await http.Get('/lang-zh').send();
    i18n.global.locale.value = 'en-US';
    await http.Get('/lang-en').send();

    expect(calls[0].header['x-custom-lang']).toBe('zh');
    expect(calls[1].header['x-custom-lang']).toBe('en');
  });

  it('校验失败时提示第一条字段错误', async () => {
    mockServer(() => ({
      statusCode: 422,
      data: { code: 422, message: '数据验证失败', data: { oldPassword: '原密码不正确' } },
    }));

    await expect(http.Delete('/auth/me').send()).rejects.toThrow('原密码不正确');
    expect(uni.showToast).toHaveBeenCalledWith({ title: '原密码不正确', icon: 'none' });
  });

  it('字段错误为未翻译的错误码时提示 message', async () => {
    mockServer(() => ({
      statusCode: 422,
      data: { code: 422, message: '数据验证失败', data: { email: 'emailExists' } },
    }));

    await expect(http.Put('/auth/me', {}).send()).rejects.toThrow('数据验证失败');
    expect(uni.showToast).toHaveBeenCalledWith({ title: '数据验证失败', icon: 'none' });
  });
});
