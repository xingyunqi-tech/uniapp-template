<template>
  <AuthLayout title="创建账号" card-title="手机号注册" :class="globalStore.themeClass">
    <!-- 注册表单 -->
    <view class="auth-form">
      <uni-easyinput
        v-model="formData.phone"
        :styles="EASYINPUT_STYLES"
        :placeholder-style="EASYINPUT_PLACEHOLDER_STYLE"
        :primary-color="globalStore.primaryColor"
        placeholder="请输入手机号"
        prefix-icon="phone"
        type="number"
        :maxlength="PHONE_LENGTH"
        :clearable="true"
      />

      <USmsInput
        v-model="formData.code"
        :countdown="sms.countdown.value"
        :is-counting="sms.isCounting.value"
        @send="handleSendCode"
      />

      <uni-easyinput
        v-model="formData.password"
        :styles="EASYINPUT_STYLES"
        :placeholder-style="EASYINPUT_PLACEHOLDER_STYLE"
        :primary-color="globalStore.primaryColor"
        type="password"
        :placeholder="`请输入密码（${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH}位）`"
        prefix-icon="locked"
        :clearable="true"
      />

      <uni-easyinput
        v-model="formData.confirmPassword"
        :styles="EASYINPUT_STYLES"
        :placeholder-style="EASYINPUT_PLACEHOLDER_STYLE"
        :primary-color="globalStore.primaryColor"
        type="password"
        placeholder="请再次输入密码"
        prefix-icon="locked"
        :clearable="true"
      />

      <UButton class="submit-btn" type="primary" block :loading="loading" @click="handleRegister">
        {{ loading ? '注册中...' : '注册' }}
      </UButton>
    </view>

    <!-- 登录链接 -->
    <view class="link-row">
      <text>已有账号？</text>
      <text class="link-text" @click="goToLogin">立即登录</text>
    </view>

    <!-- 用户协议 -->
    <view class="agreement">
      <UAgreementCheck v-model="agreed" prefix="注册即表示同意" />
    </view>
  </AuthLayout>
</template>

<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: '注册',
    navigationStyle: 'custom',
  },
});

import { reactive, ref } from 'vue';
import { useUserStore } from '@/store/modules/user';
import { useAsyncAction, useRouter, useSafeBack, useSendSms } from '@/composables';
import { useGlobalStore } from '@/store/modules/global';
import {
  EASYINPUT_PLACEHOLDER_STYLE,
  EASYINPUT_STYLES,
  PAGES,
  PHONE_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
} from '@/constants';
import { AuthSendCodeDtoType } from '@/api';

const globalStore = useGlobalStore();

const router = useRouter();
const backToLogin = useSafeBack(PAGES.LOGIN);
const userStore = useUserStore();

// 表单数据
const formData = reactive({
  phone: '',
  password: '',
  confirmPassword: '',
  code: '',
});

// 注册，成功提示后跳转首页，跳转前保持锁定
const registerAction = useAsyncAction({
  action: () =>
    userStore.register({
      phone: formData.phone,
      password: formData.password,
      code: formData.code,
    }),
  successText: '注册成功',
  onSuccess: () => {
    router.switchTab(PAGES.HOME);
  },
});
const loading = registerAction.loading;

// 是否同意协议
const agreed = ref(false);

// 短信验证码
const sms = useSendSms({
  sendApi: phone => userStore.sendSmsCode(phone, AuthSendCodeDtoType.register),
  scene: AuthSendCodeDtoType.register,
  phone: () => formData.phone,
});

// 表单验证
function validateForm(): boolean {
  if (!sms.validatePhone(formData.phone)) return false;

  if (!sms.validateCode(formData.code)) return false;

  if (!formData.password) {
    uni.showToast({ title: '请输入密码', icon: 'none' });
    return false;
  }

  if (formData.password.length < PASSWORD_MIN_LENGTH || formData.password.length > PASSWORD_MAX_LENGTH) {
    uni.showToast({ title: `密码长度应为${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH}位`, icon: 'none' });
    return false;
  }

  if (!formData.confirmPassword) {
    uni.showToast({ title: '请再次输入密码', icon: 'none' });
    return false;
  }

  if (formData.password !== formData.confirmPassword) {
    uni.showToast({ title: '两次输入的密码不一致', icon: 'none' });
    return false;
  }

  if (!agreed.value) {
    uni.showToast({ title: '请阅读并同意用户协议', icon: 'none' });
    return false;
  }

  return true;
}

// 发送验证码
async function handleSendCode() {
  const success = await sms.send(formData.phone);
  if (success) {
    uni.showToast({ title: '验证码已发送', icon: 'success' });
  }
}

// 处理注册
function handleRegister() {
  if (!validateForm()) return;
  registerAction.execute();
}

// 跳转登录页
function goToLogin() {
  backToLogin();
}
</script>

<style scoped lang="scss">
// 表单样式
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 32rpx;

  .submit-btn {
    margin-top: 16rpx;
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

  .link-text {
    transition: color var(--duration-fast);
    color: var(--color-primary);
    font-weight: 500;

    &:active {
      opacity: 0.8;
    }
  }
}

// 用户协议
.agreement {
  margin-top: 48rpx;
}
</style>
