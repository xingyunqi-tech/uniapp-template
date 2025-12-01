<route lang="json5">
{
  style: {
    navigationBarTitleText: '注册',
    navigationStyle: 'custom',
  },
}
</route>

<template>
  <AuthLayout title="创建账号" card-title="手机号注册">
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
        :maxlength="11"
        :clearable="true"
      />

      <!-- 密码注册 -->
      <template v-if="registerType === 'password'">
        <uni-easyinput
          v-model="formData.password"
          type="password"
          placeholder="请输入密码（6-20位）"
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
      <view v-else class="sms-input">
        <uni-easyinput
          v-model="formData.code"
          placeholder="请输入验证码"
          prefix-icon="email"
          type="number"
          :maxlength="6"
          :clearable="true"
        />
        <button class="sms-btn" :disabled="countdown > 0" @click="handleSendCode">
          {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
        </button>
      </view>

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

    <!-- 协议弹窗 -->
    <AgreementPopup ref="agreementPopupRef" @confirm="handleAgreementConfirm" />
  </AuthLayout>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useUserStore } from '@/store/modules/user';
import { useRouter } from '@/composables/useRouter';
import { isPhone } from '@/utils/validator';
import AuthLayout from '@/components/AuthLayout/index.vue';
import AgreementPopup from '@/components/AgreementPopup/index.vue';

const router = useRouter();
const userStore = useUserStore();

// 协议弹窗引用
const agreementPopupRef = ref<InstanceType<typeof AgreementPopup>>();

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

// 验证码倒计时
const countdown = ref(0);
let countdownTimer: ReturnType<typeof setInterval> | null = null;

// 表单验证
function validateForm(): boolean {
  if (!formData.phone) {
    uni.showToast({ title: '请输入手机号', icon: 'none' });
    return false;
  }

  if (!isPhone(formData.phone)) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' });
    return false;
  }

  if (registerType.value === 'password') {
    if (!formData.password) {
      uni.showToast({ title: '请输入密码', icon: 'none' });
      return false;
    }

    if (formData.password.length < 6 || formData.password.length > 20) {
      uni.showToast({ title: '密码长度应为6-20位', icon: 'none' });
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
    if (!formData.code) {
      uni.showToast({ title: '请输入验证码', icon: 'none' });
      return false;
    }
    if (formData.code.length !== 6) {
      uni.showToast({ title: '验证码为6位数字', icon: 'none' });
      return false;
    }
  }

  if (!agreed.value) {
    uni.showToast({ title: '请阅读并同意用户协议', icon: 'none' });
    return false;
  }

  return true;
}

// 发送验证码
async function handleSendCode() {
  if (!formData.phone) {
    uni.showToast({ title: '请输入手机号', icon: 'none' });
    return;
  }

  if (!isPhone(formData.phone)) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' });
    return;
  }

  try {
    await userStore.sendSmsCode(formData.phone);

    uni.showToast({ title: '验证码已发送', icon: 'success' });

    // 开始倒计时
    countdown.value = 60;
    countdownTimer = setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0) {
        clearInterval(countdownTimer!);
        countdownTimer = null;
      }
    }, 1000);
  } catch (error) {
    console.error('发送验证码失败:', error);
    uni.showToast({ title: '发送失败，请重试', icon: 'none' });
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
        password: formData.password,
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
    }, 1500);
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

// 显示协议弹窗
function showAgreement(type: 'user' | 'privacy') {
  agreementPopupRef.value?.open(type);
}

// 协议确认回调
function handleAgreementConfirm() {
  agreed.value = true;
}
</script>

<style scoped lang="scss">
// 注册方式切换
.register-tabs {
  display: flex;
  gap: 0;
  justify-content: center;
  margin-bottom: 48rpx;
  border-radius: $uni-border-radius-base;
  background: $uni-bg-color-grey;

  .tab-item {
    flex: 1;
    padding: 20rpx 0;
    transition: all $uni-duration-fast;
    border-radius: $uni-border-radius-base;
    color: $uni-text-color-secondary;
    font-size: 28rpx;
    text-align: center;

    &.active {
      background: $uni-color-primary;
      color: #fff;
      font-weight: 500;
    }
  }
}

// 表单样式
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 32rpx;

  .sms-input {
    display: flex;
    gap: 20rpx;
    align-items: center;

    :deep(.uni-easyinput) {
      flex: 1;
    }

    .sms-btn {
      flex-shrink: 0;
      width: 200rpx;
      height: 72rpx;
      padding: 0;
      border: none;
      border-radius: $uni-border-radius-base;
      background: $uni-color-primary;
      color: #fff;
      font-size: 26rpx;
      line-height: 72rpx;

      &:active {
        opacity: 0.8;
      }

      &[disabled] {
        background: $uni-bg-color-grey;
        color: $uni-text-color-disabled;
      }
    }
  }

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

// 链接行
.link-row {
  display: flex;
  gap: 8rpx;
  justify-content: center;
  margin-top: 40rpx;
  color: $uni-text-color-secondary;
  font-size: 28rpx;

  .link-text {
    transition: color $uni-duration-fast;
    color: $uni-color-primary;
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
    transition: all $uni-duration-fast;
    border: 2rpx solid $uni-border-color;
    border-radius: 8rpx;

    &.checked {
      border-color: $uni-color-primary;
      background: $uni-color-primary;
    }

    .i-carbon-checkmark {
      color: #fff;
      font-size: 24rpx;
    }
  }

  .agreement-text {
    flex: 1;
    color: $uni-text-color-secondary;
    font-size: 24rpx;
    line-height: 1.6;

    .agreement-link {
      color: $uni-color-primary;

      &:active {
        opacity: 0.8;
      }
    }
  }
}
</style>
