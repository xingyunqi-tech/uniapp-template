<template>
  <AuthLayout title="欢迎回来" card-title="登录账号" :class="globalStore.themeClass">
    <!-- 登录方式切换 -->
    <view class="login-tabs">
      <view class="tab-item" :class="{ active: loginType === 'password' }" @click="loginType = 'password'">
        密码登录
      </view>
      <view class="tab-item" :class="{ active: loginType === 'sms' }" @click="loginType = 'sms'"> 验证码登录 </view>
    </view>

    <!-- 登录表单 -->
    <UForm ref="formRef" :model="formData" :rules="rules">
      <view class="auth-form">
        <UInput
          v-model="formData.phone"
          placeholder="请输入手机号"
          prefix-icon="phone"
          type="number"
          :maxlength="PHONE_LENGTH"
        />

        <!-- 密码登录 -->
        <UInput
          v-if="loginType === 'password'"
          v-model="formData.password"
          type="password"
          placeholder="请输入密码"
          prefix-icon="locked"
        />

        <!-- 验证码登录 -->
        <USmsInput
          v-else
          v-model="formData.code"
          :countdown="sms.countdown.value"
          :is-counting="sms.isCounting.value"
          @send="handleSendCode"
        />

        <UButton class="submit-btn" type="primary" block :loading="loading" @click="handleLogin">
          {{ loading ? '登录中...' : '登录' }}
        </UButton>

        <view class="login-agreement">
          <UAgreementCheck v-model="agreed" prefix="登录即表示同意" />
        </view>
      </view>
    </UForm>

    <!-- 其他登录方式 (仅小程序显示) -->
    <!-- #ifdef MP-WEIXIN -->
    <view class="other-login">
      <!-- 未同意协议时不能直接弹出手机号授权，先提示勾选 -->
      <button
        v-if="agreed"
        class="quick-login-btn wechat"
        :disabled="loading"
        open-type="getPhoneNumber"
        @getphonenumber="handleGetPhoneNumber"
      >
        手机号快捷登录
      </button>
      <button v-else class="quick-login-btn wechat" :disabled="loading" @click="checkAgreed">手机号快捷登录</button>
    </view>
    <!-- #endif -->

    <!-- 底部链接 -->
    <view class="link-row">
      <text>还没有账号？</text>
      <text class="link-text" @click="goToRegister">立即注册</text>
    </view>

    <view class="link-row secondary">
      <text class="link-text" @click="goToForgotPassword">忘记密码？</text>
    </view>

    <UPrivacyPopup />
  </AuthLayout>
</template>

<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: '登录',
    navigationStyle: 'custom',
  },
});

import { reactive, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import type { UFormExpose } from '@/components/UForm/context';
import { useUserStore } from '@/store/modules/user';
import { AuthSendCodeDtoType } from '@/api';
import { useAsyncAction, useRouter, useSendSms } from '@/composables';
import { useGlobalStore } from '@/store/modules/global';
import { PAGES, PHONE_LENGTH } from '@/constants';
import { decodeQueryValue } from '@/utils';
import { getPathFromUrl, isPreviousPage, isTabBarPage } from '@/utils/router';
import { phoneRules, smsCodeRules, type FormRules } from '@/utils/form-rules';

const globalStore = useGlobalStore();
const router = useRouter();
const userStore = useUserStore();

// 登录方式: password | sms
const loginType = ref<'password' | 'sms'>('password');

// 表单数据
const formData = reactive({
  phone: '',
  password: '',
  code: '',
});

// 短信验证码
const sms = useSendSms({
  sendApi: phone => userStore.sendSmsCode(phone, AuthSendCodeDtoType.login),
  scene: AuthSendCodeDtoType.login,
  phone: () => formData.phone,
});

// 重定向地址
let redirectUrl = '';

onLoad(options => {
  // 获取重定向地址
  if (options?.redirect) {
    redirectUrl = decodeQueryValue(options.redirect);
  }

  // 如果已登录，直接跳转
  if (userStore.isLoggedIn) {
    navigateAfterLogin();
  }
});

// 登录后跳转，回跳目标为上一页时返回，为 TabBar 页时用 switchTab，跳转失败时恢复按钮
function navigateAfterLogin() {
  const target = redirectUrl || PAGES.HOME;
  const navigation = isPreviousPage(target)
    ? router.back()
    : isTabBarPage(target)
      ? router.switchTab(getPathFromUrl(target))
      : router.replace(target);
  navigation.catch(() => {
    loading.value = false;
  });
}

const formRef = ref<UFormExpose | null>(null);

const rules: FormRules<typeof formData> = {
  phone: phoneRules(),
  password: { required: true, message: '请输入密码' },
  code: smsCodeRules(),
};

// 表单验证，按登录方式校验对应字段
async function validateForm(): Promise<boolean> {
  const fields = loginType.value === 'password' ? ['phone', 'password'] : ['phone', 'code'];
  return (await formRef.value?.validate(fields)) ?? false;
}

// 发送验证码
async function handleSendCode() {
  const success = await sms.send(formData.phone);
  if (success) {
    uni.showToast({ title: '验证码已发送', icon: 'success' });
  }
}

// 表单登录（密码 / 验证码）
async function loginWithForm() {
  if (loginType.value === 'password') {
    await userStore.login({
      phone: formData.phone,
      password: formData.password,
    });
  } else {
    await userStore.smsLogin({
      phone: formData.phone,
      code: formData.code,
    });
  }
}

// 获取微信登录 code，失败时请求层不会提示，在此单独提示
async function getWechatLoginCode(): Promise<string> {
  const loginRes = await new Promise<UniApp.LoginRes>((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success: resolve,
      fail: err => {
        uni.showToast({ title: '微信授权失败，请重试', icon: 'none' });
        reject(err);
      },
    });
  });
  return loginRes.code;
}

// 手机号快捷登录（小程序）
async function loginWithWechatPhone(phoneCode: string) {
  await userStore.wechatPhoneLogin({
    loginCode: await getWechatLoginCode(),
    phoneCode,
  });
}

/** 本次登录方式，各登录方式共用一把锁 */
let loginMethod: () => Promise<void> = loginWithForm;

/** 登录请求开始到跳转离开前为 true，登录失败时恢复 */
const loading = ref(false);

const loginAction = useAsyncAction({
  action: () => loginMethod(),
  successText: '登录成功',
  onSuccess: navigateAfterLogin,
  onError: () => {
    loading.value = false;
  },
});

function startLogin(method: () => Promise<void>) {
  if (loading.value) return;
  loginMethod = method;
  loading.value = true;
  loginAction.execute();
}

/** 是否已同意用户协议与隐私政策 */
const agreed = ref(false);

function checkAgreed(): boolean {
  if (!agreed.value) {
    uni.showToast({ title: '请阅读并同意用户协议和隐私政策', icon: 'none' });
  }
  return agreed.value;
}

// 处理登录
async function handleLogin() {
  if (!(await validateForm()) || !checkAgreed()) return;
  startLogin(loginWithForm);
}

// 手机号快捷登录授权回调（小程序）
function handleGetPhoneNumber(e: UniHelper.ButtonOnGetphonenumberEvent) {
  const { code, errMsg = '', errno } = e.detail as typeof e.detail & { errno?: number };
  if (!code) {
    // 用户拒绝或取消授权时不提示
    if (errno !== 104 && !/deny|cancel|privacy permission is not authorized/i.test(errMsg)) {
      console.error('[getPhoneNumber]', errMsg);
      uni.showToast({ title: '手机号快捷登录暂不可用，请使用其他方式登录', icon: 'none' });
    }
    return;
  }
  startLogin(() => loginWithWechatPhone(code));
}

// 跳转注册页
function goToRegister() {
  router.push(PAGES.REGISTER);
}

// 跳转忘记密码页
function goToForgotPassword() {
  router.push(PAGES.FORGOT_PASSWORD);
}
</script>

<style scoped lang="scss">
// 登录方式切换
.login-tabs {
  display: flex;
  gap: 0;
  justify-content: center;
  margin-bottom: 48rpx;
  border-radius: var(--radius-base);
  background: var(--color-bg-grey);

  .tab-item {
    flex: 1;
    padding: 20rpx 0;
    transition: all var(--duration-fast);
    border-radius: var(--radius-base);
    color: var(--color-text-secondary);
    font-size: 28rpx;
    text-align: center;

    &.active {
      background: var(--color-primary);
      color: var(--color-text-inverse);
      font-weight: 500;
    }
  }
}

// 表单样式
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 32rpx;

  .submit-btn {
    margin-top: 16rpx;
  }
}

// 其他登录方式
.other-login {
  margin-top: 64rpx;

  .quick-login-btn {
    width: 100%;
    height: 96rpx;
    margin-bottom: 48rpx;
    border: none;
    border-radius: var(--radius-lg);
    color: var(--color-text-inverse);
    font-size: 32rpx;
    font-weight: 500;
    line-height: 96rpx;

    &::after {
      border: none;
    }

    &:active {
      opacity: 0.8;
    }

    &[disabled] {
      opacity: 0.6;
    }

    &.wechat {
      background: var(--color-brand-wechat);
    }
  }
}

// 链接行
.link-row {
  display: flex;
  gap: 8rpx;
  justify-content: center;
  margin-top: 40rpx;
  color: var(--color-text-secondary);
  font-size: 28rpx;

  &.secondary {
    margin-top: 24rpx;
  }

  .link-text {
    transition: color var(--duration-fast);
    color: var(--color-primary);
    font-weight: 500;

    &:active {
      opacity: 0.8;
    }
  }
}

.login-agreement {
  margin-top: 8rpx;
}
</style>
