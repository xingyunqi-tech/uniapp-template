<route lang="json5">
{
  style: {
    navigationBarTitleText: '修改密码',
  },
}
</route>

<template>
  <view class="password-page" :class="globalStore.themeClass">
    <!-- 表单区域 -->
    <view class="form-section">
      <view class="form-group">
        <view class="form-item">
          <text class="form-label">原密码</text>
          <input
            v-model="formData.oldPassword"
            class="form-input"
            :type="showOldPassword ? 'text' : 'safe-password'"
            placeholder="请输入原密码"
            :maxlength="PASSWORD_MAX_LENGTH"
          />
          <text
            :class="showOldPassword ? 'i-carbon-view' : 'i-carbon-view-off'"
            class="toggle-eye"
            @click="showOldPassword = !showOldPassword"
          />
        </view>

        <view class="form-item">
          <text class="form-label">新密码</text>
          <input
            v-model="formData.newPassword"
            class="form-input"
            :type="showNewPassword ? 'text' : 'safe-password'"
            :placeholder="`请输入新密码（${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH}位）`"
            :maxlength="PASSWORD_MAX_LENGTH"
          />
          <text
            :class="showNewPassword ? 'i-carbon-view' : 'i-carbon-view-off'"
            class="toggle-eye"
            @click="showNewPassword = !showNewPassword"
          />
        </view>

        <view class="form-item">
          <text class="form-label">确认密码</text>
          <input
            v-model="formData.confirmPassword"
            class="form-input"
            :type="showConfirmPassword ? 'text' : 'safe-password'"
            placeholder="请再次输入新密码"
            :maxlength="PASSWORD_MAX_LENGTH"
          />
          <text
            :class="showConfirmPassword ? 'i-carbon-view' : 'i-carbon-view-off'"
            class="toggle-eye"
            @click="showConfirmPassword = !showConfirmPassword"
          />
        </view>
      </view>
    </view>

    <!-- 密码强度提示 -->
    <view v-if="formData.newPassword" class="strength-section">
      <UPasswordStrength
        :strength="pwdStrength.strength.value"
        :strength-text="pwdStrength.strengthText.value"
        :strength-class="pwdStrength.strengthClass.value"
        :is-length-valid="pwdStrength.isLengthValid.value"
        :has-letter="pwdStrength.hasLetter.value"
        :has-number="pwdStrength.hasNumber.value"
        :horizontal="false"
        :show-rules-title="true"
      />
    </view>

    <!-- 保存按钮 -->
    <UFixedButton
      text="确认修改"
      loading-text="提交中..."
      :loading="saving"
      :disabled="!canSubmit"
      @click="handleSave"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, toRef } from 'vue';
import { useUserStore } from '@/store/modules/user';
import { usePasswordStrength } from '@/composables';
import { useGlobalStore } from '@/store/modules/global';

import { PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH, DELAY_TIMES } from '@/constants';
import { UPasswordStrength, UFixedButton } from '@/components';

const globalStore = useGlobalStore();

const userStore = useUserStore();

// 表单数据
const formData = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});

// 密码可见性
const showOldPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);

// 保存状态
const saving = ref(false);

// 密码强度
const pwdStrength = usePasswordStrength(toRef(formData, 'newPassword'));

// 是否可提交
const canSubmit = computed(() => {
  return (
    formData.oldPassword.length >= PASSWORD_MIN_LENGTH &&
    formData.newPassword.length >= PASSWORD_MIN_LENGTH &&
    formData.confirmPassword.length >= PASSWORD_MIN_LENGTH &&
    pwdStrength.hasLetter.value &&
    pwdStrength.hasNumber.value &&
    formData.newPassword === formData.confirmPassword
  );
});

// 保存密码
async function handleSave() {
  // 验证
  if (!formData.oldPassword) {
    uni.showToast({ title: '请输入原密码', icon: 'none' });
    return;
  }
  if (!formData.newPassword) {
    uni.showToast({ title: '请输入新密码', icon: 'none' });
    return;
  }
  if (formData.newPassword.length < PASSWORD_MIN_LENGTH) {
    uni.showToast({ title: `新密码长度不能少于${PASSWORD_MIN_LENGTH}位`, icon: 'none' });
    return;
  }
  if (!pwdStrength.hasLetter.value || !pwdStrength.hasNumber.value) {
    uni.showToast({ title: '密码需包含字母和数字', icon: 'none' });
    return;
  }
  if (formData.newPassword !== formData.confirmPassword) {
    uni.showToast({ title: '两次密码输入不一致', icon: 'none' });
    return;
  }
  if (formData.oldPassword === formData.newPassword) {
    uni.showToast({ title: '新密码不能与原密码相同', icon: 'none' });
    return;
  }

  saving.value = true;

  try {
    // TODO: 调用实际的修改密码 API
    await new Promise(resolve => setTimeout(resolve, 1000));

    uni.showToast({
      title: '密码修改成功',
      icon: 'success',
    });

    // 清除登录状态，让用户重新登录
    setTimeout(() => {
      userStore.logout();
      uni.reLaunch({
        url: '/pages/login/index',
      });
    }, DELAY_TIMES.LONG);
  } catch {
    uni.showToast({
      title: '修改失败',
      icon: 'none',
    });
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped lang="scss">
.password-page {
  min-height: 100vh;
  padding-bottom: calc(var(--safe-area-inset-bottom) + 140rpx);
  background: var(--color-bg-grey);
}

// 表单区域
.form-section {
  padding: 24rpx;

  .form-group {
    overflow: hidden;
    border-radius: var(--radius-lg);
    background: var(--color-bg);
    box-shadow: var(--shadow-sm);

    .form-item {
      display: flex;
      gap: 16rpx;
      align-items: center;
      padding: 32rpx;

      &:not(:last-child) {
        border-bottom: 1px solid var(--color-border-light);
      }

      .form-label {
        flex-shrink: 0;
        width: 160rpx;
        color: var(--color-text);
        font-size: 30rpx;
      }

      .form-input {
        flex: 1;
        color: var(--color-text);
        font-size: 30rpx;
      }

      .toggle-eye {
        flex-shrink: 0;
        padding: 8rpx;
        color: var(--color-text-secondary);
        font-size: 36rpx;
      }
    }
  }
}

// 密码强度区域
.strength-section {
  margin: 0 24rpx;
  padding: 24rpx;
  border-radius: var(--radius-lg);
  background: var(--color-bg);
  box-shadow: var(--shadow-sm);
}
</style>
