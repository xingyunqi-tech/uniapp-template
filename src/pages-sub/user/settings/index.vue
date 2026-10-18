<template>
  <view class="settings-page" :class="globalStore.themeClass">
    <!-- 设置菜单 -->
    <view class="settings-section">
      <UMenuGroup title="账号设置">
        <UMenuItem icon="person" title="个人资料" show-arrow @click="handleMenuClick('profile')" />
        <UMenuItem icon="locked" title="账号安全" show-arrow :border="false" @click="handleMenuClick('security')" />
      </UMenuGroup>
    </view>

    <view class="settings-section">
      <UMenuGroup title="通用设置">
        <UMenuItem
          icon="trash"
          title="清除缓存"
          :right-text="cacheSize"
          :show-arrow="false"
          @click="handleClearCache"
        />
        <UMenuItem icon="compose" title="意见反馈" show-arrow @click="handleMenuClick('feedback')" />
        <UMenuItem
          icon="info"
          title="关于我们"
          :right-text="`v${version}`"
          show-arrow
          :border="showDevOptions"
          @click="handleAboutClick"
        />
        <!-- 连续点击版本号 5 次显示 -->
        <UMenuItem
          v-if="showDevOptions"
          icon="loop"
          :title="$t('settings.followSystem')"
          show-switch
          :switch-checked="globalStore.followSystemTheme"
          @switch-change="handleToggleFollowSystem"
        />
        <UMenuItem
          v-if="showDevOptions"
          icon="color"
          :title="$t('settings.theme')"
          :right-text="isDarkMode ? $t('settings.dark') : $t('settings.light')"
          show-switch
          :switch-checked="isDarkMode"
          @switch-change="handleToggleTheme"
        />
        <UMenuItem
          v-if="showDevOptions"
          icon="font"
          :title="$t('settings.international')"
          :right-text="isEnglish ? 'English' : '中文'"
          show-switch
          :switch-checked="isEnglish"
          @switch-change="handleToggleLocale"
        />
        <UMenuItem
          v-if="showDevOptions"
          icon="paperclip"
          title="组件演示"
          :border="false"
          show-arrow
          @click="router.push(PAGES.COMPONENT_DEMO)"
        />
      </UMenuGroup>
    </view>

    <!-- 退出登录按钮 -->
    <view v-if="isLoggedIn" class="logout-section">
      <UButton class="logout-btn" type="danger" plain block text="退出登录" @click="handleLogout" />
      <text class="delete-account" @click="handleDeleteAccount">注销账号</text>
    </view>

    <!-- 注销账号身份验证 -->
    <UPopup ref="deletePopupRef" type="bottom" title="注销账号">
      <UForm ref="deleteFormRef" :model="deleteForm" :rules="deleteRules">
        <view class="delete-form">
          <view class="delete-form__notice">
            <text class="delete-form__notice-title">注销后以下数据将被删除且无法恢复：</text>
            <text v-for="item in DELETE_CLEANUP_ITEMS" :key="item" class="delete-form__notice-item">· {{ item }}</text>
            <text class="delete-form__notice-item">提交的题目纠错与举报内容将匿名保留，不再关联你的账号。</text>
          </view>
          <text class="delete-form__tip">请先验证身份</text>
          <template v-if="verifyMode === 'password'">
            <UInput v-model="deleteForm.password" type="password" placeholder="请输入当前密码" prefix-icon="locked" />
            <text v-if="boundPhone" class="delete-form__switch" @click="verifyMode = 'sms'">没有密码？用短信验证</text>
          </template>
          <template v-else>
            <text class="delete-form__phone">验证码将发送至 {{ formatPhone(boundPhone) }}</text>
            <USmsInput
              v-model="deleteForm.code"
              :countdown="sms.countdown.value"
              :is-counting="sms.isCounting.value"
              @send="handleSendVerifyCode"
            />
            <text class="delete-form__switch" @click="verifyMode = 'password'">使用密码验证</text>
          </template>
          <UButton
            type="danger"
            block
            text="确认注销"
            :loading="deleteAccountAction.loading.value"
            @click="handleConfirmDelete"
          />
        </view>
      </UForm>
    </UPopup>

    <UDialog />
  </view>
</template>

<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: '设置',
  },
});

import { ref, computed, reactive } from 'vue';
import { onShow, onUnload } from '@dcloudio/uni-app';
import { useUserStore } from '@/store/modules/user';
import { useGlobalStore } from '@/store/modules/global';
import { useAsyncAction, useDialog, useRouter, useSendSms } from '@/composables';
import { PAGES, THEME_TYPE, LOCALE_TYPE } from '@/constants';
import { formatFileSize, formatPhone, storage } from '@/utils';
import { smsCodeRules, type FormRules } from '@/utils/form-rules';
import { AuthSendCodeDtoType } from '@/api';
import type { UFormExpose } from '@/components/UForm/context';

const router = useRouter();
const userStore = useUserStore();
const globalStore = useGlobalStore();
const dialog = useDialog();

// 计算属性
const isLoggedIn = computed(() => userStore.isLoggedIn);

// 设置状态
const cacheSize = ref('0 MB');
const version = ref(uni.getAppBaseInfo().appVersion || '1.0.0');

// ==================== 隐藏开发者选项 ====================
const devModeClickCount = ref(0);
let devModeTimer: ReturnType<typeof setTimeout> | null = null;

// 使用 global store 中的 showDevOptions 状态（持久化）
const showDevOptions = computed(() => globalStore.showDevOptions);

// 主题和语言状态
const isDarkMode = computed(() => globalStore.currentTheme === THEME_TYPE.DARK);
const isEnglish = computed(() => globalStore.currentLocale === LOCALE_TYPE.EN_US);

onShow(() => {
  calculateCacheSize();
});

onUnload(() => {
  if (devModeTimer) clearTimeout(devModeTimer);
  devModeTimer = null;
});

// 计算缓存大小
function calculateCacheSize() {
  cacheSize.value = formatFileSize(storage.getCacheSize());
}

// 清除缓存（搜索历史、浏览记录、草稿），不影响登录状态与偏好设置
async function handleClearCache() {
  const confirmed = await dialog.confirm('确定要清除缓存吗？');
  if (!confirmed) return;

  storage.clearCache();
  calculateCacheSize();
  uni.showToast({ title: '清除成功', icon: 'success' });
}

// 点击菜单项
function handleMenuClick(type: string) {
  switch (type) {
    case 'profile':
      router.push(PAGES.PROFILE);
      break;
    case 'security':
      router.push(PAGES.PASSWORD);
      break;
    case 'feedback':
      router.push(PAGES.FEEDBACK);
      break;
  }
}

// 退出登录
const logoutAction = useAsyncAction({
  action: () => userStore.logout(),
  successText: '已退出登录',
  onSuccess: () => {
    uni.switchTab({ url: PAGES.HOME });
  },
});

async function handleLogout() {
  const confirmed = await dialog.confirm('确定要退出登录吗？');
  if (confirmed) logoutAction.execute();
}

// 注销账号
const deletePopupRef = ref<{ open: () => void; close: () => void } | null>(null);
const verifyMode = ref<'password' | 'sms'>('password');
const deleteForm = reactive({ password: '', code: '' });
const deleteFormRef = ref<UFormExpose | null>(null);
const deleteRules: FormRules<typeof deleteForm> = {
  password: { required: true, message: '请输入当前密码' },
  code: smsCodeRules(),
};
const boundPhone = computed(() => userStore.userInfo?.phone || '');
const DELETE_CLEANUP_ITEMS = [
  '练习记录与作答、错题本、学习统计与打卡',
  '笔记、收藏、分享记录、目标考试与个人生成的试卷',
  '上传的头像、照片等文件',
  '站内通知、通知设置与收货地址',
];

const sms = useSendSms({
  sendApi: phone => userStore.sendSmsCode(phone, AuthSendCodeDtoType.verify_identity),
  scene: AuthSendCodeDtoType.verify_identity,
  phone: () => boundPhone.value,
});

const deleteAccountAction = useAsyncAction({
  action: async () => {
    await userStore.deleteAccount(
      verifyMode.value === 'password' ? { oldPassword: deleteForm.password } : { smsCode: deleteForm.code },
    );
    deletePopupRef.value?.close();
  },
  successText: '账号已注销',
  onSuccess: () => {
    uni.switchTab({ url: PAGES.HOME });
  },
});

function handleDeleteAccount() {
  verifyMode.value = 'password';
  deleteForm.password = '';
  deleteForm.code = '';
  deletePopupRef.value?.open();
}

async function handleSendVerifyCode() {
  const success = await sms.send(boundPhone.value);
  if (success) {
    uni.showToast({ title: '验证码已发送', icon: 'success' });
  }
}

async function handleConfirmDelete() {
  const field = verifyMode.value === 'password' ? 'password' : 'code';
  if (!(await deleteFormRef.value?.validate(field))) return;
  deleteAccountAction.execute();
}

// ==================== 隐藏开发者选项功能 ====================
/**
 * 点击关于我们：连续点击 5 次触发开发者选项，否则跳转关于页面
 */
function handleAboutClick() {
  devModeClickCount.value++;

  // 清除之前的定时器
  if (devModeTimer) {
    clearTimeout(devModeTimer);
  }

  // 500ms 内未达到次数则重置并跳转
  devModeTimer = setTimeout(() => {
    if (devModeClickCount.value < 5) {
      router.push(PAGES.ABOUT);
    }
    devModeClickCount.value = 0;
  }, 500);

  // 达到 5 次点击
  if (devModeClickCount.value >= 5) {
    if (devModeTimer) {
      clearTimeout(devModeTimer);
      devModeTimer = null;
    }
    devModeClickCount.value = 0;
    globalStore.toggleDevOptions();
    uni.showToast({
      title: globalStore.showDevOptions ? '已开启开发者选项' : '已关闭开发者选项',
      icon: 'none',
    });
  }
}

/**
 * 切换主题
 */
function handleToggleTheme(checked: boolean) {
  globalStore.setTheme(checked ? THEME_TYPE.DARK : THEME_TYPE.LIGHT);
}

/**
 * 切换是否跟随系统主题
 */
function handleToggleFollowSystem(checked: boolean) {
  globalStore.setFollowSystemTheme(checked);
}

/**
 * 切换语言
 */
function handleToggleLocale(checked: boolean) {
  globalStore.setLocale(checked ? LOCALE_TYPE.EN_US : LOCALE_TYPE.ZH_CN);
}
</script>

<style scoped lang="scss">
.settings-page {
  box-sizing: border-box;
  min-height: 100vh;
  padding-bottom: calc(var(--safe-area-inset-bottom) + 48rpx);
  background: var(--color-bg-grey);
}

// 设置分组
.settings-section {
  padding: 24rpx;
}

// 退出登录
.logout-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx 24rpx;

  .delete-account {
    margin-top: 32rpx;
    color: var(--color-text-secondary);
    font-size: 26rpx;
  }

  .logout-btn {
    box-shadow: var(--shadow-sm);
  }
}

.delete-form {
  display: flex;
  flex-direction: column;
  gap: 32rpx;
  padding-bottom: 24rpx;

  &__notice {
    display: flex;
    flex-direction: column;
    gap: 8rpx;
    padding: var(--spacing-base);
    border-radius: var(--radius-base);
    background: var(--color-bg-grey);
  }

  &__notice-title {
    color: var(--color-text);
    font-size: 26rpx;
    font-weight: 600;
  }

  &__notice-item {
    color: var(--color-text-secondary);
    font-size: 24rpx;
    line-height: 1.5;
  }

  &__tip,
  &__phone {
    color: var(--color-text-secondary);
    font-size: 26rpx;
    line-height: 1.5;
  }

  &__switch {
    align-self: flex-end;
    color: var(--color-primary);
    font-size: 26rpx;
  }
}
</style>
