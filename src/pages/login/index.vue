<route lang="json5">
{
  style: {
    navigationBarTitleText: '登录',
    navigationStyle: 'custom',
  },
}
</route>

<template>
  <AuthLayout title="欢迎回来" card-title="登录账号">
    <!-- 登录方式切换 -->
    <UTabs v-model="loginType" :tabs="loginTabs" class="login-tabs" />

    <!-- 登录表单 -->
    <view class="auth-form">
      <uni-easyinput
        v-model="formData.phone"
        placeholder="请输入手机号"
        prefix-icon="phone"
        type="number"
        :maxlength="PHONE_LENGTH"
        :clearable="true"
      />

      <!-- 密码登录 -->
      <uni-easyinput
        v-if="loginType === 'password'"
        v-model="formData.password"
        type="password"
        placeholder="请输入密码"
        prefix-icon="locked"
        :clearable="true"
      />

      <!-- 验证码登录 -->
      <USmsInput
        v-else
        v-model="formData.code"
        :countdown="sms.countdown.value"
        :is-counting="sms.isCounting.value"
        @send="handleSendCode"
      />

      <button class="submit-btn" :loading="loading" :disabled="loading" @click="handleLogin">
        {{ loading ? '登录中...' : '登录' }}
      </button>
    </view>

    <!-- 其他登录方式 (仅小程序显示) -->
    <!-- #ifdef MP-WEIXIN -->
    <view class="other-login">
      <view class="divider">
        <text class="divider-text">其他登录方式</text>
      </view>

      <view class="social-login">
        <button class="social-btn wechat" open-type="getPhoneNumber" @getphonenumber="handleWechatLogin">
          <text class="i-carbon-logo-wechat" />
        </button>
      </view>
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
  </AuthLayout>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useUserStore } from '@/store/modules/user';
import { useRouter, useSendSms } from '@/composables';
import { isPhone } from '@/utils/validator';
import { PHONE_LENGTH, SMS_CODE_LENGTH, DELAY_TIMES } from '@/constants';
import AuthLayout from '@/components/AuthLayout/index.vue';
import UTabs from '@/components/UTabs/index.vue';
import USmsInput from '@/components/USmsInput/index.vue';

const router = useRouter();
const userStore = useUserStore();

// 登录方式: password | sms
const loginType = ref<'password' | 'sms'>('password');
const loginTabs = [
  { label: '密码登录', value: 'password' },
  { label: '验证码登录', value: 'sms' },
];

// 表单数据
const formData = reactive({
  phone: '',
  password: '',
  code: '',
});

// 加载状态
const loading = ref(false);

// 短信验证码
const sms = useSendSms({
  sendApi: phone => userStore.sendSmsCode(phone),
});

// 重定向地址
let redirectUrl = '';

onLoad(options => {
  // 获取重定向地址
  if (options?.redirect) {
    redirectUrl = decodeURIComponent(options.redirect);
  }

  // 如果已登录，直接跳转
  if (userStore.isLoggedIn) {
    navigateAfterLogin();
  }
});

// 登录后跳转
function navigateAfterLogin() {
  if (redirectUrl) {
    router.replace(redirectUrl);
  } else {
    router.switchTab('/pages/index/index');
  }
}

// 表单验证
function validateForm(): boolean {
  if (!sms.validatePhone(formData.phone)) return false;

  if (loginType.value === 'password') {
    if (!formData.password) {
      uni.showToast({ title: '请输入密码', icon: 'none' });
      return false;
    }
  } else {
    if (!sms.validateCode(formData.code)) return false;
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

// 处理登录
async function handleLogin() {
  if (!validateForm()) return;

  loading.value = true;

  try {
    if (loginType.value === 'password') {
      // 密码登录
      await userStore.login({
        phone: formData.phone,
        password: formData.password,
      });
    } else {
      // 验证码登录
      await userStore.smsLogin({
        phone: formData.phone,
        code: formData.code,
      });
    }

    uni.showToast({
      title: '登录成功',
      icon: 'success',
    });

    // 跳转
    setTimeout(() => {
      navigateAfterLogin();
    }, DELAY_TIMES.LONG);
  } catch (error) {
    console.error('登录失败:', error);
    uni.showToast({
      title: '登录失败，请重试',
      icon: 'none',
    });
  } finally {
    loading.value = false;
  }
}

// 处理微信登录（小程序）
async function handleWechatLogin(e: any) {
  // 获取手机号失败
  if (e.detail.errMsg !== 'getPhoneNumber:ok') {
    uni.showToast({
      title: '获取手机号失败',
      icon: 'none',
    });
    return;
  }

  loading.value = true;

  try {
    // 先获取微信登录 code
    const loginRes = await new Promise<UniApp.LoginRes>((resolve, reject) => {
      uni.login({
        provider: 'weixin',
        success: resolve,
        fail: reject,
      });
    });

    // 调用微信登录接口
    await userStore.wechatLogin({
      code: loginRes.code,
      encryptedData: e.detail.encryptedData!,
      iv: e.detail.iv!,
    });

    uni.showToast({
      title: '登录成功',
      icon: 'success',
    });

    // 跳转
    setTimeout(() => {
      navigateAfterLogin();
    }, DELAY_TIMES.LONG);
  } catch (error) {
    console.error('微信登录失败:', error);
    uni.showToast({
      title: '微信登录失败，请重试',
      icon: 'none',
    });
  } finally {
    loading.value = false;
  }
}

// 跳转注册页
function goToRegister() {
  router.push('/pages/register/index');
}

// 跳转忘记密码页
function goToForgotPassword() {
  router.push('/pages/forgot-password/index');
}
</script>

<style scoped lang="scss">
// 登录方式切换
.login-tabs {
  margin-bottom: 48rpx;
  overflow: hidden;
  border-radius: $uni-border-radius-base;

  :deep(.u-tabs__list) {
    background: $uni-bg-color-grey;
  }

  :deep(.u-tabs__item) {
    height: 80rpx;
    padding: 0 24rpx;

    &--active {
      border-radius: $uni-border-radius-base;
      background: $uni-color-primary;

      .u-tabs__text {
        color: #fff;
      }

      &::after {
        display: none;
      }
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
    border-radius: $uni-border-radius-lg;
    background: $uni-color-primary;
    color: #fff;
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

// 其他登录方式
.other-login {
  margin-top: 64rpx;

  .divider {
    position: relative;
    margin-bottom: 40rpx;
    text-align: center;

    &::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      width: 100%;
      height: 1px;
      background: $uni-border-color;
    }

    .divider-text {
      position: relative;
      z-index: 1;
      padding: 0 32rpx;
      background: $uni-bg-color;
      color: $uni-text-color-secondary;
      font-size: 26rpx;
    }
  }

  .social-login {
    display: flex;
    gap: 48rpx;
    justify-content: center;

    .social-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 96rpx;
      height: 96rpx;
      padding: 0;
      transition: all $uni-duration-fast ease;
      border: 1px solid $uni-border-color;
      border-radius: 50%;
      background: $uni-bg-color;
      font-size: 0;
      line-height: 1;

      &::after {
        display: none;
      }

      &:active {
        transform: scale(0.95);
        border-color: $uni-color-primary;
      }

      .i-carbon-logo-wechat {
        color: #09bb07;
        font-size: 48rpx;
      }
    }
  }
}

// 链接行
.link-row {
  display: flex;
  gap: 8rpx;
  justify-content: center;
  margin-top: 40rpx;
  color: $uni-text-color-secondary;
  font-size: 28rpx;

  &.secondary {
    margin-top: 24rpx;
  }

  .link-text {
    transition: color $uni-duration-fast;
    color: $uni-color-primary;
    font-weight: 500;

    &:active {
      opacity: 0.8;
    }
  }
}
</style>
