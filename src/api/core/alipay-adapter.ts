/**
 * 支付宝小程序请求适配：HTTP 错误经 fail 返回时按正常响应交给拦截器
 */
import type { UniappRequestAdapter } from '@alova/adapter-uniapp';
import { toHttpFailResponse } from '@/utils/http-fail-response';
import { isAlipay } from '@/utils/platform';

type RequestResult = UniNamespace.RequestSuccessCallbackResult;

/** 包装 uni 请求适配器，仅在支付宝小程序生效；上传的字符串状态码转为数字 */
export function withAlipayHttpErrors(base: UniappRequestAdapter): UniappRequestAdapter {
  return (elements, method) => {
    if (!isAlipay()) return base(elements, method);
    const { requestType } = method.config;
    if (requestType) {
      const handle = base(elements, method);
      if (requestType !== 'upload') return handle;
      const response = handle.response().then(result => ({ ...result, statusCode: Number(result.statusCode) }));
      return { ...handle, response: () => response };
    }

    let task: UniApp.RequestTask | undefined;
    const response = new Promise<RequestResult>((resolve, reject) => {
      task = uni.request({
        ...method.config,
        url: elements.url,
        data: elements.data as UniApp.RequestOptions['data'],
        header: elements.headers,
        method: elements.type as UniApp.RequestOptions['method'],
        timeout: method.config.timeout,
        success: resolve,
        fail: reason => {
          const failed = toHttpFailResponse(reason);
          if (!failed) {
            reject(new Error(reason.errMsg));
            return;
          }
          resolve({
            statusCode: failed.statusCode,
            data: failed.data as RequestResult['data'],
            header: failed.header as RequestResult['header'],
            cookies: [],
          });
        },
      });
    });
    return {
      response: () => response,
      headers: () => response.then(result => result.header || {}),
      abort: () => task?.abort(),
    };
  };
}
