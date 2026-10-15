import { describe, expect, it } from 'vitest';
import { getErrorQueueSize, getGlobalErrorHandlers, updateErrorReporterOptions } from '@/utils/error-reporter';

describe('未处理的 Promise 拒绝', () => {
  updateErrorReporterOptions({ enabled: true, consoleLog: false });
  const handlers = getGlobalErrorHandlers();

  it('路由拦截产生的失败不上报', () => {
    const before = getErrorQueueSize();

    handlers.onUnhandledRejection({ reason: { errMsg: 'navigateTo:fail intercepted' }, promise: Promise.resolve() });

    expect(getErrorQueueSize()).toBe(before);
  });

  it('其他失败照常上报', () => {
    const before = getErrorQueueSize();

    handlers.onUnhandledRejection({ reason: new Error('boom'), promise: Promise.resolve() });

    expect(getErrorQueueSize()).toBe(before + 1);
  });
});
