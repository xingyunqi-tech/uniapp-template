<route lang="json5">
{
  style: {
    navigationBarTitleText: '注册',
    navigationStyle: 'custom',
  },
}
</route>

<template>
  <AuthLayout title="创建账号" card-title="手机号注册" :class="globalStore.themeClass">
    <!-- 注册方式切换 -->
    <view class="register-tabs">
      <view class="tab-item" :class="{ active: registerType === 'password' }" @click="registerType = 'password'">
        密码注册
      </view>
      <view class="tab-item" :class="{ active: registerType === 'sms' }" @click="registerType = 'sms'">
        验证码注册
      </view>
    </view>

    <!-- 注册表单 -->
    <view class="auth-form">
      <uni-easyinput
        v-model="formData.phone"
        placeholder="请输入手机号"
        prefix-icon="phone"
        type="number"
        :maxlength="PHONE_LENGTH"
        :clearable="true"
      />

      <!-- 密码注册 -->
      <template v-if="registerType === 'password'">
        <uni-easyinput
          v-model="formData.password"
          type="password"
          :placeholder="`请输入密码（${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH}位）`"
          prefix-icon="locked"
          :clearable="true"
        />

        <uni-easyinput
          v-model="formData.confirmPassword"
          type="password"
          placeholder="请再次输入密码"
          prefix-icon="locked"
          :clearable="true"
        />
      </template>

      <!-- 验证码注册 -->
      <USmsInput
        v-else
        v-model="formData.code"
        :countdown="sms.countdown.value"
        :is-counting="sms.isCounting.value"
        @send="handleSendCode"
      />

      <button class="submit-btn" :loading="loading" :disabled="loading" @click="handleRegister">
        {{ loading ? '注册中...' : '注册' }}
      </button>
    </view>

    <!-- 登录链接 -->
    <view class="link-row">
      <text>已有账号？</text>
      <text class="link-text" @click="goToLogin">立即登录</text>
    </view>

    <!-- 用户协议 -->
    <view class="agreement">
      <view class="agreement-checkbox" :class="{ checked: agreed }" @click="agreed = !agreed">
        <text v-if="agreed" class="i-carbon-checkmark" />
      </view>
      <text class="agreement-text">
        注册即表示同意
        <text class="agreement-link" @click.stop="showAgreement('user')">《用户协议》</text>
        和
        <text class="agreement-link" @click.stop="showAgreement('privacy')">《隐私政策》</text>
      </text>
    </view>
  </AuthLayout>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useUserStore } from '@/store/modules/user';
import { useRouter, useSendSms } from '@/composables';
import { useGlobalStore } from '@/store/modules/global';
import { PAGES, PHONE_LENGTH, PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH, DELAY_TIMES } from '@/constants';
import { encryptPassword } from '@/utils';

const globalStore = useGlobalStore();

const router = useRouter();
const userStore = useUserStore();

// 注册方式: password | sms
const registerType = ref<'password' | 'sms'>('password');

// 表单数据
const formData = reactive({
  phone: '',
  password: '',
  confirmPassword: '',
  code: '',
});

// 加载状态
const loading = ref(false);

// 是否同意协议
const agreed = ref(false);

// 短信验证码
const sms = useSendSms({
  sendApi: phone => userStore.sendSmsCode(phone),
});

// 表单验证
function validateForm(): boolean {
  if (!sms.validatePhone(formData.phone)) return false;

  if (registerType.value === 'password') {
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
  } else {
    if (!sms.validateCode(formData.code)) return false;
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
async function handleRegister() {
  if (!validateForm()) return;

  loading.value = true;

  try {
    if (registerType.value === 'password') {
      // 密码注册
      await userStore.register({
        phone: formData.phone,
        password: encryptPassword(formData.password),
      });
    } else {
      // 验证码注册（直接登录）
      await userStore.smsLogin({
        phone: formData.phone,
        code: formData.code,
      });
    }

    uni.showToast({
      title: '注册成功',
      icon: 'success',
    });

    // 跳转到首页
    setTimeout(() => {
      router.switchTab('/pages/index/index');
    }, DELAY_TIMES.LONG);
  } catch (error) {
    console.error('注册失败:', error);
    uni.showToast({
      title: '注册失败，请重试',
      icon: 'none',
    });
  } finally {
    loading.value = false;
  }
}

// 跳转登录页
function goToLogin() {
  router.back();
}

// 显示协议页面
function showAgreement(type: 'user' | 'privacy') {
  router.push(`${PAGES.AGREEMENT}?type=${type}`);
}
</script>

<style scoped lang="scss">
// 注册方式切换
.register-tabs {
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
  display: flex;
  gap: 12rpx;
  align-items: flex-start;
  margin-top: 48rpx;

  .agreement-checkbox {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 36rpx;
    height: 36rpx;
    margin-top: 4rpx;
    transition: all var(--duration-fast);
    border: 2rpx solid var(--color-border);
    border-radius: 8rpx;

    &.checked {
      border-color: var(--color-primary);
      background: var(--color-primary);
    }

    .i-carbon-checkmark {
      color: var(--color-text-inverse);
      font-size: 24rpx;
    }
  }

  .agreement-text {
    flex: 1;
    color: var(--color-text-secondary);
    font-size: 24rpx;
    line-height: 1.6;

    .agreement-link {
      color: var(--color-primary);

      &:active {
        opacity: 0.8;
      }
    }
  }
}
</style>
