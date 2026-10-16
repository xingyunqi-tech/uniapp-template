import { afterEach, describe, expect, it, vi, type Mock } from 'vitest';
import { http } from '@/api/core/alova';
import { reportApiError } from '@/utils/error-reporter';

vi.mock('@/utils/error-reporter', async importOriginal => ({
  ...(await importOriginal<typeof import('@/utils/error-reporter')>()),
  reportApiError: vi.fn(),
}));

interface RequestOptions {
  success: (res: { statusCode: number; data: unknown; header: Record<string, string> }) => void;
}

const requestMock = uni.request as unknown as Mock;

function reply(statusCode: number, data?: unknown) {
  requestMock.mockImplementation((options: RequestOptions) => {
    void Promise.resolve().then(() => options.success({ statusCode, data, header: {} }));
    return { abort: vi.fn() };
  });
}

afterEach(() => {
  requestMock.mockReset();
  (uni.showToast as Mock).mockClear();
  (reportApiError as Mock).mockClear();
});

describe('响应体解析', () => {
  it.each([
    ['204 空串', 204, ''],
    ['null', 200, null],
    ['undefined', 200, undefined],
  ])('%s 视为成功，data 为 undefined', async (_name, status, body) => {
    reply(status, body);

    const result = await http.Delete('/empty').send();

    expect(result).toEqual({ code: 200, message: '', data: undefined });
    expect(uni.showToast).not.toHaveBeenCalled();
  });

  it.each([
    ['HTML 页面', '<html></html>'],
    ['不带 code 的对象', { id: 1 }],
  ])('%s 视为响应格式错误，提示并上报', async (_name, body) => {
    reply(200, body);

    await expect(http.Get('/raw').send()).rejects.toThrow('响应格式错误');

    expect(uni.showToast).toHaveBeenCalled();
    expect(reportApiError).toHaveBeenCalledWith('/raw', 'GET', '响应格式错误', 200);
  });

  it('业务码错误提示并上报', async () => {
    reply(200, { code: 1001, message: '余额不足' });

    await expect(http.Get('/biz').send()).rejects.toThrow('余额不足');

    expect(reportApiError).toHaveBeenCalledWith('/biz', 'GET', '余额不足', 1001);
  });
});

describe('HTTP 错误上报', () => {
  it.each([400, 404, 409, 422])('%i 不上报', async status => {
    reply(status, { code: status, message: '校验失败' });

    await expect(http.Post('/form', {}).send()).rejects.toThrow('校验失败');

    expect(reportApiError).not.toHaveBeenCalled();
  });

  it('5xx 上报', async () => {
    reply(500, { code: 500, message: '服务异常' });

    await expect(http.Get('/server').send()).rejects.toThrow('服务异常');

    expect(reportApiError).toHaveBeenCalledWith('/server', 'GET', '服务异常', 500);
  });
});
