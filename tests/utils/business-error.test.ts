import { afterEach, describe, expect, it } from 'vitest';
import {
  BUSINESS_ERROR_KEYS,
  getBusinessErrorKey,
  getBusinessErrorMessage,
  isBusinessErrorKey,
} from '@/utils/business-error';
import { i18n } from '@/utils/locale';
import { LOCALE_TYPE } from '@/constants/system';
import zhCN from '@/locale/zh-CN.json';
import enUS from '@/locale/en-US.json';

const originalLocale = i18n.global.locale.value;

afterEach(() => {
  i18n.global.locale.value = originalLocale;
});

describe('业务错误键', () => {
  it.each([
    ['zh-CN', zhCN],
    ['en-US', enUS],
  ])('%s 语言包包含全部错误键文案', (_locale, messages) => {
    for (const key of BUSINESS_ERROR_KEYS) {
      expect((messages as Record<string, string>)[`businessError.${key}`]).toBeTruthy();
    }
  });

  it.each([
    'mockSessionBusy',
    'paperRequired',
    'reportNotAvailable',
    'dailySessionCannotFinish',
    'dailySessionCannotAbandon',
  ])('登记练习会话错误键 %s', key => {
    expect(isBusinessErrorKey(key)).toBe(true);
    expect(getBusinessErrorKey({ errorKey: key })).toBe(key);
  });

  it('只识别已登记的错误键', () => {
    expect(isBusinessErrorKey('sessionTakenOver')).toBe(true);
    expect(isBusinessErrorKey('unknownKey')).toBe(false);
    expect(isBusinessErrorKey(1)).toBe(false);
  });

  it.each([
    [{ errorKey: 'sessionTakenOver' }, 'sessionTakenOver'],
    [{ errorKey: 'unknownKey' }, undefined],
    [{ email: 'emailExists' }, undefined],
    [null, undefined],
    ['sessionTakenOver', undefined],
  ])('从响应 data %j 取错误键', (data, expected) => {
    expect(getBusinessErrorKey(data)).toBe(expected);
  });

  it('按当前语言返回文案', () => {
    i18n.global.locale.value = LOCALE_TYPE.ZH_CN;
    expect(getBusinessErrorMessage('sessionTakenOver')).toBe(zhCN['businessError.sessionTakenOver']);

    i18n.global.locale.value = LOCALE_TYPE.EN_US;
    expect(getBusinessErrorMessage('sessionTakenOver')).toBe(enUS['businessError.sessionTakenOver']);
  });
});
