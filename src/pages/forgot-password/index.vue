<template>
  <AuthLayout title="找回密码" card-title="重置密码" :class="globalStore.themeClass">
    <!-- 步骤指示器 -->
    <view class="steps">
      <view :class="['step', { active: step >= 1, done: step > 1 }]">
        <view class="step-dot">{{ step > 1 ? '' : '1' }}</view>
        <text class="step-text">验证手机</text>
      </view>
      <view class="step-line" :class="{ active: step > 1 }" />
      <view :class="['step', { active: step >= 2 }]">
        <view class="step-dot">2</view>
        <text class="step-text">设置密码</text>
      </view>
    </view>

    <!-- 第一步：验证手机号 -->
    <view v-if="step === 1" class="auth-form">
      <uni-easyinput
        v-model="formData.phone"
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

      <button class="submit-btn" :loading="verifying" :disabled="verifying" @click="handleVerify">
        {{ verifying ? '验证中...' : '下一步' }}
      </button>
    </view>

    <!-- 第二步：设置新密码 -->
    <view v-else class="auth-form">
      <uni-easyinput
        v-model="formData.newPassword"
        type="password"
        :placeholder="`请输入新密码（${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH}位）`"
        prefix-icon="locked"
        :clearable="true"
      />

      <uni-easyinput
        v-model="formData.confirmPassword"
        type="password"
        placeholder="请再次输入新密码"
        prefix-icon="locked"
        :clearable="true"
      />

      <!-- 密码强度提示 -->
      <UPasswordStrength
        v-if="formData.newPassword"
        :strength="pwdStrength.strength.value"
        :strength-text="pwdStrength.strengthText.value"
        :strength-class="pwdStrength.strengthClass.value"
        :is-length-valid="pwdStrength.isLengthValid.value"
        :has-letter="pwdStrength.hasLetter.value"
        :has-number="pwdStrength.hasNumber.value"
      />

      <button class="submit-btn" :loading="submitting" :disabled="submitting" @click="handleReset">
        {{ submitting ? '提交中...' : '重置密码' }}
      </button>
    </view>

    <!-- 返回登录 -->
    <view class="link-row">
      <text class="link-text" @click="goBack">返回登录</text>
    </view>
  </AuthLayout>
</template>

<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: '忘记密码',
    navigationStyle: 'custom',
  },
});

import { reactive, ref, toRef } from 'vue';
import { useUserStore } from '@/store/modules/user';
import { useRouter, useSendSms, usePasswordStrength } from '@/composables';
import { useGlobalStore } from '@/store/modules/global';
import { PAGES, PHONE_LENGTH, PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH, DELAY_TIMES } from '@/constants';
import { AuthSendCodeDtoType } from '@/api';

const globalStore = useGlobalStore();

const router = useRouter();
const userStore = useUserStore();

// 当前步骤: 1-验证手机号, 2-设置新密码
const step = ref(1);

// 表单数据
const formData = reactive({
  phone: '',
  code: '',
  newPassword: '',
  confirmPassword: '',
});

// 状态
const verifying = ref(false);
const submitting = ref(false);

// 短信验证码
const sms = useSendSms({
  sendApi: phone => userStore.sendSmsCode(phone, AuthSendCodeDtoType.reset_password),
});

// 密码强度
const pwdStrength = usePasswordStrength(toRef(formData, 'newPassword'));

// 发送验证码
async function handleSendCode() {
  const success = await sms.send(formData.phone);
  if (success) {
    uni.showToast({ title: '验证码已发送', icon: 'success' });
  }
}

// 验证手机号和验证码
async function handleVerify() {
  if (!sms.validatePhone(formData.phone)) return;
  if (!sms.validateCode(formData.code)) return;

  verifying.value = true;

  try {
    // TODO: 调用验证码校验接口
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 验证成功，进入下一步
    step.value = 2;
  } catch {
    uni.showToast({ title: '验证码错误', icon: 'none' });
  } finally {
    verifying.value = false;
  }
}

// 重置密码
async function handleReset() {
  if (!formData.newPassword) {
    uni.showToast({ title: '请输入新密码', icon: 'none' });
    return;
  }

  if (formData.newPassword.length < PASSWORD_MIN_LENGTH || formData.newPassword.length > PASSWORD_MAX_LENGTH) {
    uni.showToast({ title: `密码长度应为${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH}位`, icon: 'none' });
    return;
  }

  if (!pwdStrength.hasLetter.value || !pwdStrength.hasNumber.value) {
    uni.showToast({ title: '密码需包含字母和数字', icon: 'none' });
    return;
  }

  if (!formData.confirmPassword) {
    uni.showToast({ title: '请再次输入密码', icon: 'none' });
    return;
  }

  if (formData.newPassword !== formData.confirmPassword) {
    uni.showToast({ title: '两次输入的密码不一致', icon: 'none' });
    return;
  }

  submitting.value = true;

  try {
    // 调用重置密码接口
    await userStore.resetPasswordByPhone(formData.phone, formData.code, formData.newPassword);

    uni.showToast({
      title: '密码重置成功',
      icon: 'success',
    });

    // 跳转到登录页
    setTimeout(() => {
      router.replace(PAGES.LOGIN);
    }, DELAY_TIMES.LONG);
  } catch (error) {
    console.error('重置密码失败:', error);
    uni.showToast({ title: '重置失败，请重试', icon: 'none' });
  } finally {
    submitting.value = false;
  }
}

// 返回登录
function goBack() {
  router.back();
}
</script>

<style scoped lang="scss">
// 步骤指示器
.steps {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 48rpx;

  .step {
    display: flex;
    flex-direction: column;
    gap: 8rpx;
    align-items: center;

    .step-dot {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48rpx;
      height: 48rpx;
      transition: all var(--duration-fast);
      border: 2rpx solid var(--color-border);
      border-radius: 50%;
      background: var(--color-bg);
      color: var(--color-text-secondary);
      font-size: 24rpx;
    }

    .step-text {
      color: var(--color-text-secondary);
      font-size: 24rpx;
    }

    &.active {
      .step-dot {
        border-color: var(--color-primary);
        background: var(--color-primary);
        color: var(--color-text-inverse);
      }

      .step-text {
        color: var(--color-primary);
      }
    }

    &.done {
      .step-dot {
        &::before {
          content: '';
          display: block;
          width: 16rpx;
          height: 8rpx;
          transform: rotate(-45deg);
          border-bottom: 3rpx solid var(--color-text-inverse);
          border-left: 3rpx solid var(--color-text-inverse);
        }
      }
    }
  }

  .step-line {
    width: 80rpx;
    height: 2rpx;
    margin: 0 16rpx;
    margin-bottom: 32rpx;
    transition: background var(--duration-fast);
    background: var(--color-border);

    &.active {
      background: var(--color-primary);
    }
  }
}

// 表单样式
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 32rpx;

  .submit-btn {
    width: 100%;
    height: 96rpx;
    margin-top: 16rpx;
    border: none;
    border-radius: var(--radius-lg);
    background: var(--color-primary);
    color: var(--color-text-inverse);
    font-size: 32rpx;
    font-weight: 500;
    line-height: 96rpx;

    &:active {
      opacity: 0.8;
    }

    &[disabled] {
      opacity: 0.6;
    }
  }
}

// 链接行
.link-row {
  display: flex;
  justify-content: center;
  margin-top: 40rpx;

  .link-text {
    transition: color var(--duration-fast);
    color: var(--color-primary);
    font-size: 28rpx;
    font-weight: 500;

    &:active {
      opacity: 0.8;
    }
  }
}
</style>
