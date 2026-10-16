import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { mount, type VueWrapper } from '@vue/test-utils';
import UPrivacyPopup from '@/components/UPrivacyPopup/index.vue';
import { privacyListenerOwner } from '@/components/UPrivacyPopup/owner';

type PrivacyResolve = (option: { event: string; buttonId?: string }) => void;
type PrivacyHandler = (resolve: PrivacyResolve) => void;

const showCallbacks: (() => void)[] = [];
const hideCallbacks: (() => void)[] = [];

vi.mock('@dcloudio/uni-app', () => ({
  onShow: (callback: () => void) => showCallbacks.push(callback),
  onHide: (callback: () => void) => hideCallbacks.push(callback),
}));

const wxMock = {
  onNeedPrivacyAuthorization: vi.fn<(handler: PrivacyHandler) => void>(),
  getPrivacySetting: vi.fn((options: { success: (res: { privacyContractName?: string }) => void }) =>
    options.success({ privacyContractName: '《小程序隐私指引》' }),
  ),
  openPrivacyContract: vi.fn(),
};
vi.stubGlobal('wx', wxMock);

const wrappers: VueWrapper[] = [];

function mountPopup() {
  const wrapper = mount(UPrivacyPopup);
  wrappers.push(wrapper);
  return wrapper;
}

function latestHandler(): PrivacyHandler {
  return wxMock.onNeedPrivacyAuthorization.mock.lastCall![0];
}

async function requestPrivacy() {
  const resolve = vi.fn<PrivacyResolve>();
  latestHandler()(resolve);
  await nextTick();
  return resolve;
}

beforeEach(() => {
  showCallbacks.length = 0;
  hideCallbacks.length = 0;
  privacyListenerOwner.current = null;
  wxMock.onNeedPrivacyAuthorization.mockClear();
  wxMock.openPrivacyContract.mockClear();
});

afterEach(() => {
  wrappers.splice(0).forEach(wrapper => wrapper.unmount());
});

describe('UPrivacyPopup', () => {
  it('挂载后注册隐私授权监听，未触发时不显示', () => {
    const wrapper = mountPopup();

    expect(wxMock.onNeedPrivacyAuthorization).toHaveBeenCalled();
    expect(wrapper.find('.u-privacy-popup').exists()).toBe(false);
  });

  it('需要授权时显示弹窗与隐私协议名称', async () => {
    const wrapper = mountPopup();

    await requestPrivacy();

    expect(wrapper.find('.u-privacy-popup').exists()).toBe(true);
    expect(wrapper.find('.u-privacy-popup__link').text()).toBe('《小程序隐私指引》');
  });

  it('点击同意时带按钮 id 回传 agree 并关闭', async () => {
    const wrapper = mountPopup();
    const resolve = await requestPrivacy();

    await wrapper.find('#u-privacy-agree').trigger('agreeprivacyauthorization');

    expect(resolve).toHaveBeenCalledWith({ buttonId: 'u-privacy-agree', event: 'agree' });
    expect(wrapper.find('.u-privacy-popup').exists()).toBe(false);
  });

  it('点击拒绝时回传 disagree 并关闭', async () => {
    const wrapper = mountPopup();
    const resolve = await requestPrivacy();

    await wrapper.findAll('.u-privacy-popup__btn')[0].trigger('click');

    expect(resolve).toHaveBeenCalledWith({ event: 'disagree' });
    expect(wrapper.find('.u-privacy-popup').exists()).toBe(false);
  });

  it('点击协议名称打开隐私协议', async () => {
    const wrapper = mountPopup();
    await requestPrivacy();

    await wrapper.find('.u-privacy-popup__link').trigger('click');

    expect(wxMock.openPrivacyContract).toHaveBeenCalledTimes(1);
  });

  it('页面隐藏后隐私请求直接拒绝，重新显示后恢复弹窗', async () => {
    const wrapper = mountPopup();

    hideCallbacks[0]();
    const rejected = await requestPrivacy();
    expect(rejected).toHaveBeenCalledWith({ event: 'disagree' });
    expect(wrapper.find('.u-privacy-popup').exists()).toBe(false);

    showCallbacks[0]();
    const pending = await requestPrivacy();
    expect(pending).not.toHaveBeenCalled();
    expect(wrapper.find('.u-privacy-popup').exists()).toBe(true);
  });

  it('监听已被其他页面弹窗接管时，隐藏不覆盖监听', () => {
    mountPopup();
    mountPopup();
    const callCount = wxMock.onNeedPrivacyAuthorization.mock.calls.length;

    hideCallbacks[0]();

    expect(wxMock.onNeedPrivacyAuthorization).toHaveBeenCalledTimes(callCount);
  });

  it('卸载时未处理的授权请求按拒绝处理', async () => {
    const wrapper = mountPopup();
    const resolve = await requestPrivacy();

    wrapper.unmount();
    wrappers.splice(wrappers.indexOf(wrapper), 1);

    expect(resolve).toHaveBeenCalledWith({ event: 'disagree' });
    expect(privacyListenerOwner.current).toBeNull();
  });
});
