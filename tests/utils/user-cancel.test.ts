import { describe, expect, it } from 'vitest';
import { isUserCancel } from '@/utils/platform';

describe('isUserCancel', () => {
  it.each([
    [{ errMsg: 'chooseImage:fail cancel' }],
    [{ errMsg: 'scanCode:fail Cancel' }],
    [{ errorMessage: '用户取消操作' }],
    [{ error: 11 }],
    [{ errCode: 11 }],
  ])('%o 视为用户取消', err => {
    expect(isUserCancel(err)).toBe(true);
  });

  it.each([[{ errMsg: 'chooseImage:fail auth deny' }], [{ errMsg: 'requestPayment:fail' }], [null], ['cancel']])(
    '%o 不视为用户取消',
    err => {
      expect(isUserCancel(err)).toBe(false);
    },
  );
});
