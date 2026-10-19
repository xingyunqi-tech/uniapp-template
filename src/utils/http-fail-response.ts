/**
 * 支付宝小程序 HTTP 状态码 >= 400 时 uni.request 走 fail，回调中带状态码、响应体与响应头
 */

export interface HttpFailResponse {
  statusCode: number;
  data: unknown;
  header: Record<string, unknown>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object';
}

/** fail 结果带 HTTP 错误状态码（>= 400）时转为响应，其余情况（含网络失败、超时、中断）返回 null */
export function toHttpFailResponse(result: unknown): HttpFailResponse | null {
  if (!isRecord(result)) return null;
  const { statusCode, status, data, header, headers } = result;
  const code = Number(statusCode ?? status);
  if (!Number.isInteger(code) || code < 400) return null;
  return { statusCode: code, data, header: isRecord(header) ? header : isRecord(headers) ? headers : {} };
}
