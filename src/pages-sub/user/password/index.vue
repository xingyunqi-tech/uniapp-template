<template>
  <view class="password-page" :class="globalStore.themeClass">
    <!-- 表单区域 -->
    <view class="form-section">
      <UForm ref="formRef" :model="formData" :rules="rules">
        <UMenuGroup>
          <UFormItem label="原密码" prop="oldPassword">
            <UInput
              v-model="formData.oldPassword"
              type="password"
              placeholder="请输入原密码"
              :maxlength="PASSWORD_MAX_LENGTH"
              :clearable="false"
            />
          </UFormItem>

          <UFormItem label="新密码" prop="newPassword">
            <UInput
              v-model="formData.newPassword"
              type="password"
              :placeholder="`请输入新密码（${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH}位）`"
              :maxlength="PASSWORD_MAX_LENGTH"
              :clearable="false"
            />
          </UFormItem>

          <UFormItem label="确认密码" prop="confirmPassword">
            <UInput
              v-model="formData.confirmPassword"
              type="password"
              placeholder="请再次输入新密码"
              :maxlength="PASSWORD_MAX_LENGTH"
              :clearable="false"
            />
          </UFormItem>
        </UMenuGroup>
      </UForm>
    </view>

    <!-- 密码强度提示 -->
    <UCard v-if="formData.newPassword" class="strength-section">
      <UPasswordStrength :password="formData.newPassword" :horizontal="false" :show-rules-title="true" />
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
import type { UFormExpose } from '@/components/UForm/context';
import { useUserStore } from '@/store/modules/user';
import { useAsyncAction, usePasswordStrength } from '@/composables';
import { useGlobalStore } from '@/store/modules/global';
import { usePracticeStore } from '@/store/modules/practice';
import { PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH, PAGES } from '@/constants';
import type { FormRules } from '@/utils/form-rules';

const globalStore = useGlobalStore();

const userStore = useUserStore();

// 表单数据
const formData = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});

// 修改成功后清除登录状态，让用户重新登录
const saveAction = useAsyncAction({
  action: async () => {
    await usePracticeStore().flushAll();
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

const formRef = ref<UFormExpose | null>(null);

const rules: FormRules<typeof formData> = {
  oldPassword: { required: true, message: '请输入原密码' },
  newPassword: [
    { required: true, message: '请输入新密码' },
    { min: PASSWORD_MIN_LENGTH, message: `新密码长度不能少于${PASSWORD_MIN_LENGTH}位` },
    { validator: () => pwdStrength.hasLetter.value && pwdStrength.hasNumber.value, message: '密码需包含字母和数字' },
    {
      validator: (value, model) => value !== model.oldPassword,
      message: '新密码不能与原密码相同',
      deps: ['oldPassword'],
    },
  ],
  confirmPassword: [
    { required: true, message: '两次密码输入不一致' },
    { validator: (value, model) => value === model.newPassword, message: '两次密码输入不一致', deps: ['newPassword'] },
  ],
};

// 保存密码
async function handleSave() {
  if (!(await formRef.value?.validate())) return;
  saveAction.execute();
}
</script>

<style scoped lang="scss">
.password-page {
  box-sizing: border-box;
  min-height: 100vh;
  background: var(--color-bg-grey);
}

// 表单区域
.form-section {
  padding: 24rpx;
}

// 密码强度区域
.strength-section {
  margin: 0 24rpx;
}
</style>
