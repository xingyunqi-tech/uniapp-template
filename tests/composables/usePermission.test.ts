import { beforeEach, describe, expect, it, vi } from 'vitest';

const platform = vi.hoisted(() => ({ mp: true, alipay: false }));

vi.mock('@/utils/platform', () => ({
  isMP: () => platform.mp,
  isAlipay: () => platform.alipay,
}));

import { isUserDenied, promptOpenSettings, usePermission } from '@/composables/usePermission';

const uniMock = uni as unknown as Record<string, ReturnType<typeof vi.fn>>;

describe('usePermission', () => {
  beforeEach(() => {
    platform.mp = true;
    platform.alipay = false;
    uniMock.getSetting = vi.fn().mockResolvedValue({ authSetting: {} });
    uniMock.authorize = vi.fn();
    uniMock.openSetting = vi.fn().mockResolvedValue({});
    uniMock.showModal = vi.fn(({ success }) => success({ confirm: false }));
  });

  it('微信用户拒绝授权时提示去设置', async () => {
    uniMock.authorize.mockRejectedValue({ errMsg: 'authorize:fail auth deny' });
    const { request, status } = usePermission({ type: 'scope.camera' });

    await expect(request()).resolves.toBe(false);
    expect(status.value).toBe('denied');
    expect(uniMock.showModal).toHaveBeenCalledTimes(1);
  });

  it('errMsg 为 auth denied 时同样视为用户拒绝', async () => {
    uniMock.authorize.mockRejectedValue({ errMsg: 'authorize:fail:auth denied' });
    const { request } = usePermission({ type: 'scope.camera' });

    await request();
    expect(uniMock.showModal).toHaveBeenCalledTimes(1);
  });

  it('非用户拒绝的失败不提示去设置', async () => {
    uniMock.authorize.mockRejectedValue({ errMsg: 'authorize:fail privacy permission is not authorized' });
    const { request, status } = usePermission({ type: 'scope.camera' });

    await expect(request()).resolves.toBe(false);
    expect(status.value).not.toBe('denied');
    expect(uniMock.showModal).not.toHaveBeenCalled();
  });

  it('支付宝按 authSetting 键名映射读取授权状态', async () => {
    platform.alipay = true;
    uniMock.getSetting.mockResolvedValue({ authSetting: { location: true, camera: false } });

    await expect(usePermission({ type: 'scope.userLocation' }).check()).resolves.toBe('authorized');
    await expect(usePermission({ type: 'scope.camera' }).check()).resolves.toBe('denied');
    await expect(usePermission({ type: 'scope.writePhotosAlbum' }).check()).resolves.toBe('not-determined');
  });

  it('支付宝未决定时不调用 authorize，由目标 API 触发授权', async () => {
    platform.alipay = true;
    const { request } = usePermission({ type: 'scope.camera' });

    await expect(request()).resolves.toBe(true);
    expect(uniMock.authorize).not.toHaveBeenCalled();
  });

  it('支付宝已拒绝时提示去设置', async () => {
    platform.alipay = true;
    uniMock.getSetting.mockResolvedValue({ authSetting: { album: false } });
    const { request } = usePermission({ type: 'scope.writePhotosAlbum' });

    await expect(request()).resolves.toBe(false);
    expect(uniMock.showModal).toHaveBeenCalledTimes(1);
  });
});

describe('isUserDenied', () => {
  it.each([
    'chooseImage:fail auth deny',
    'authorize:fail auth denied',
    'chooseImage:fail permission denied',
    'chooseImage:fail No Permission',
  ])('%s 视为用户拒绝', errMsg => {
    expect(isUserDenied({ errMsg })).toBe(true);
  });

  it('其他失败不视为用户拒绝', () => {
    expect(isUserDenied({ errMsg: 'chooseImage:fail cancel' })).toBe(false);
  });
});

describe('promptOpenSettings', () => {
  beforeEach(() => {
    uniMock.openSetting = vi.fn(({ complete }) => complete?.());
    uniMock.openAppAuthorizeSetting = vi.fn(({ complete }) => complete?.());
  });

  it('确认后打开设置页', async () => {
    uniMock.showModal = vi.fn(({ success }) => success({ confirm: true }));

    await expect(promptOpenSettings('需要相册权限')).resolves.toBe(true);
    expect(uniMock.showModal).toHaveBeenCalledWith(
      expect.objectContaining({ content: '需要相册权限', confirmText: '去设置' }),
    );
    expect(uniMock.openSetting).toHaveBeenCalled();
  });

  it('取消时不打开设置页', async () => {
    uniMock.showModal = vi.fn(({ success }) => success({ confirm: false }));

    await expect(promptOpenSettings('需要相册权限')).resolves.toBe(false);
    expect(uniMock.openSetting).not.toHaveBeenCalled();
  });
});
