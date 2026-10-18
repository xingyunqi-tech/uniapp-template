/**
 * 业务错误键：后端在错误响应 data.errorKey 中返回，与后端 business-error-keys.ts 保持一致
 */
import { t } from './locale';

export const BUSINESS_ERROR_KEYS = [
  'sessionTakenOver',
  'sessionClosed',
  'questionInMockInProgress',
  'answerHidden',
  'selfAssessmentNotAllowed',
  'questionNotAccessible',
  'noQuestionsAvailable',
  'generateLimitExceeded',
  'mockSessionBusy',
  'paperRequired',
  'reportNotAvailable',
  'dailySessionCannotFinish',
  'dailySessionCannotAbandon',
  'aiUnavailable',
  'aiQuotaExceeded',
  'aiRateLimited',
  'aiConsentRequired',
  'wechatBindingRequired',
  'contentBlocked',
  'errataInProgress',
  'answerChangeNotAllowed',
] as const;

export type BusinessErrorKey = (typeof BUSINESS_ERROR_KEYS)[number];

export function isBusinessErrorKey(value: unknown): value is BusinessErrorKey {
  return typeof value === 'string' && (BUSINESS_ERROR_KEYS as readonly string[]).includes(value);
}

/** 取响应 data 中已登记的错误键 */
export function getBusinessErrorKey(data: unknown): BusinessErrorKey | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const { errorKey } = data as { errorKey?: unknown };
  return isBusinessErrorKey(errorKey) ? errorKey : undefined;
}

/** 错误键对应的当前语言提示文案 */
export function getBusinessErrorMessage(key: BusinessErrorKey): string {
  return t(`businessError.${key}`);
}
