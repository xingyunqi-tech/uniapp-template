<template>
  <view class="password-page" :class="globalStore.themeClass">
    <!-- 表单区域 -->
    <view class="form-section">
      <UMenuGroup>
        <UFormItem label="原密码">
          <input
            v-model="formData.oldPassword"
            class="u-form-input"
            placeholder-class="u-form-placeholder"
            :password="!showOldPassword"
            placeholder="请输入原密码"
            :maxlength="PASSWORD_MAX_LENGTH"
          />
          <view class="toggle-eye" @click="showOldPassword = !showOldPassword">
            <uni-icons :type="showOldPassword ? 'eye' : 'eye-slash'" color="inherit" size="inherit" />
          </view>
        </UFormItem>

        <UFormItem label="新密码">
          <input
            v-model="formData.newPassword"
            class="u-form-input"
            placeholder-class="u-form-placeholder"
            :password="!showNewPassword"
            :placeholder="`请输入新密码（${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH}位）`"
            :maxlength="PASSWORD_MAX_LENGTH"
          />
          <view class="toggle-eye" @click="showNewPassword = !showNewPassword">
            <uni-icons :type="showNewPassword ? 'eye' : 'eye-slash'" color="inherit" size="inherit" />
          </view>
        </UFormItem>

        <UFormItem label="确认密码">
          <input
            v-model="formData.confirmPassword"
            class="u-form-input"
            placeholder-class="u-form-placeholder"
            :password="!showConfirmPassword"
            placeholder="请再次输入新密码"
            :maxlength="PASSWORD_MAX_LENGTH"
          />
          <view class="toggle-eye" @click="showConfirmPassword = !showConfirmPassword">
            <uni-icons :type="showConfirmPassword ? 'eye' : 'eye-slash'" color="inherit" size="inherit" />
          </view>
        </UFormItem>
      </UMenuGroup>
    </view>

    <!-- 密码强度提示 -->
    <UCard v-if="formData.newPassword" class="strength-section">
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
    </UCard>

    <!-- 保存按钮 -->
    <UFixedButton text="确认修改" loading-text="提交中..." :loading="saveAction.loading.value" @click="handleSave" />
  </view>
</template>

<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: '修改密码',
  },
});

import { ref, reactive, toRef } from 'vue';
import { useUserStore } from '@/store/modules/user';
import { useAsyncAction, usePasswordStrength } from '@/composables';
import { useGlobalStore } from '@/store/modules/global';
import { PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH, PAGES } from '@/constants';

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

// 修改成功后清除登录状态，让用户重新登录
const saveAction = useAsyncAction({
  action: async () => {
    await userStore.changePassword(formData.oldPassword, formData.newPassword);
    await userStore.logout();
  },
  successText: '密码修改成功',
  onSuccess: () => {
    uni.reLaunch({ url: PAGES.LOGIN });
  },
});

// 密码强度
const pwdStrength = usePasswordStrength(toRef(formData, 'newPassword'));

// 保存密码
function handleSave() {
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

  saveAction.execute();
}
</script>

<style scoped lang="scss">
.password-page {
  box-sizing: border-box;
  min-height: 100vh;
  padding-bottom: calc(var(--safe-area-inset-bottom) + 140rpx);
  background: var(--color-bg-grey);
}

// 表单区域
.form-section {
  padding: 24rpx;

  .toggle-eye {
    flex-shrink: 0;
    padding: 8rpx;
    color: var(--color-text-secondary);
    font-size: 36rpx;
  }
}

// 密码强度区域
.strength-section {
  margin: 0 24rpx;
}
</style>
