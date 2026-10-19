import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { mount } from '@vue/test-utils';

const userStore = vi.hoisted(() => ({
  isLoggedIn: false,
  wechatPhoneLogin: vi.fn(),
  sendSmsCode: vi.fn(),
}));
const execute = vi.hoisted(() => vi.fn());

vi.mock('@dcloudio/uni-app', () => ({ onLoad: vi.fn() }));
vi.mock('@/store/modules/user', () => ({ useUserStore: () => userStore }));
vi.mock('@/store/modules/global', () => ({ useGlobalStore: () => ({ themeClass: '' }) }));
vi.mock('@/composables', () => ({
  useRouter: () => ({ back: vi.fn(), switchTab: vi.fn(), replace: vi.fn(), push: vi.fn() }),
  useAsyncAction: () => ({ execute }),
  useSendSms: () => ({ send: vi.fn(), countdown: ref(0), isCounting: ref(false) }),
}));

const PassThrough = defineComponent({
  setup:
    (_, { slots }) =>
    () =>
      h('div', slots.default?.()),
});

const { default: LoginPage } = await import('@/pages/login/index.vue');

interface PhoneNumberDetail {
  code?: string;
  errMsg?: string;
  errno?: number;
}

function triggerGetPhoneNumber(detail: PhoneNumberDetail) {
  const wrapper = mount(LoginPage, {
    global: {
      stubs: {
        AuthLayout: PassThrough,
        UForm: PassThrough,
        UInput: true,
        USmsInput: true,
        UButton: true,
        UAgreementCheck: true,
        UPrivacyPopup: true,
      },
    },
  });
  (wrapper.vm as unknown as { handleGetPhoneNumber: (e: { detail: PhoneNumberDetail }) => void }).handleGetPhoneNumber({
    detail,
  });
}

beforeEach(() => {
  vi.mocked(uni.showToast).mockClear();
  execute.mockClear();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('登录页手机号快捷登录', () => {
  it.each([
    ['用户拒绝', { errMsg: 'getPhoneNumber:fail user deny' }],
    ['用户取消', { errMsg: 'getPhoneNumber:fail:cancel' }],
    ['拒绝隐私授权', { errMsg: 'getPhoneNumber:fail privacy permission is not authorized' }],
    ['隐私未授权错误码', { errMsg: 'getPhoneNumber:fail', errno: 104 }],
  ])('%s时不提示', (_, detail) => {
    triggerGetPhoneNumber(detail);

    expect(uni.showToast).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });

  it('配置类错误时提示改用其他方式并输出错误', () => {
    triggerGetPhoneNumber({ errMsg: 'getPhoneNumber:fail no permission', errno: 112 });

    expect(uni.showToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: '手机号快捷登录暂不可用，请使用其他方式登录' }),
    );
    expect(console.error).toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });

  it('获取到 code 时发起登录', () => {
    triggerGetPhoneNumber({ code: 'phone-code', errMsg: 'getPhoneNumber:ok' });

    expect(uni.showToast).not.toHaveBeenCalled();
    expect(execute).toHaveBeenCalledTimes(1);
  });
});
