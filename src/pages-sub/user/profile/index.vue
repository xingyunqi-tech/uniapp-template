<route lang="json5">
{
  style: {
    navigationBarTitleText: '编辑资料',
  },
}
</route>

<template>
  <view class="profile-page" :class="themeClass">
    <!-- 头像区域 -->
    <view class="avatar-section" @click="handleChooseAvatar">
      <view class="avatar-wrapper">
        <image class="avatar" :src="formData.avatar || '/static/images/default-avatar.png'" mode="aspectFill" />
        <view class="avatar-edit">
          <text class="i-carbon-camera" />
        </view>
      </view>
      <text class="avatar-tip">点击更换头像</text>
    </view>

    <!-- 表单区域 -->
    <view class="form-section">
      <UMenuGroup>
        <UFormItem label="昵称">
          <input v-model="formData.username" placeholder="请输入昵称" :maxlength="NICKNAME_MAX_LENGTH" />
        </UFormItem>

        <UFormItem label="手机号">
          <view class="form-value disabled">
            <text>{{ formData.phone || '未绑定' }}</text>
          </view>
        </UFormItem>

        <UFormItem label="性别" show-arrow>
          <picker mode="selector" :range="genderLabels" :value="genderIndex" @change="handleGenderChange">
            <text>{{ genderLabels[genderIndex] }}</text>
          </picker>
        </UFormItem>

        <UFormItem label="生日" :border="false" show-arrow>
          <picker mode="date" :value="formData.birthday" :end="today" @change="handleBirthdayChange">
            <text>{{ formData.birthday || '请选择' }}</text>
          </picker>
        </UFormItem>
      </UMenuGroup>
    </view>

    <!-- 保存按钮 -->
    <UFixedButton text="保存" loading-text="保存中..." :loading="saveAction.loading.value" @click="handleSave" />
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useUserStore } from '@/store/modules/user';
import { useAsyncAction, useTheme } from '@/composables';

import { formatDateTime } from '@/utils/datetime';
import { GENDER_OPTIONS, NICKNAME_MAX_LENGTH } from '@/constants';
import UMenuGroup from '@/components/UMenuGroup/index.vue';
import UFormItem from '@/components/UFormItem/index.vue';

import UFixedButton from '@/components/UFixedButton/index.vue';

const { themeClass } = useTheme();
const userStore = useUserStore();

// 性别选项
const genderLabels = GENDER_OPTIONS.map(item => item.label);
const genderIndex = ref(0);

// 表单数据
const formData = reactive({
  avatar: '',
  username: '',
  phone: '',
  gender: 0,
  birthday: '',
});

// 今天日期（用于限制生日选择）
const today = computed(() => formatDateTime(new Date(), 'YYYY-MM-DD'));

// 保存操作
const saveAction = useAsyncAction({
  action: async () => {
    // TODO: 调用实际的更新用户信息 API
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 更新本地状态
    userStore.setUserInfo({
      ...userStore.userInfo,
      avatar: formData.avatar,
      username: formData.username,
    });
  },
  successText: '保存成功',
  errorText: '保存失败',
  onSuccess: () => {
    uni.navigateBack();
  },
});

onLoad(() => {
  // 初始化表单数据
  if (userStore.userInfo) {
    formData.avatar = userStore.userInfo.avatar || '';
    formData.username = userStore.userInfo.username || '';
    formData.phone = userStore.userInfo.phone || '';
  }
});

// 选择头像
function handleChooseAvatar() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: res => {
      const tempFilePath = res.tempFilePaths[0];
      // TODO: 上传头像到服务器
      formData.avatar = tempFilePath;
      uni.showToast({
        title: '头像已更换',
        icon: 'success',
      });
    },
  });
}

// 性别变化
function handleGenderChange(e: { detail: { value: number } }) {
  genderIndex.value = e.detail.value;
  formData.gender = GENDER_OPTIONS[e.detail.value].value;
}

// 生日变化
function handleBirthdayChange(e: { detail: { value: string } }) {
  formData.birthday = e.detail.value;
}

// 保存资料
function handleSave() {
  if (!formData.username.trim()) {
    uni.showToast({
      title: '请输入昵称',
      icon: 'none',
    });
    return;
  }

  saveAction.execute();
}
</script>

<style scoped lang="scss">
.profile-page {
  min-height: 100vh;
  padding: 24rpx;
  padding-bottom: calc(200rpx + env(safe-area-inset-bottom));
  background: var(--color-bg-grey);
}

// 头像区域
.avatar-section {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  align-items: center;
  padding: 48rpx 0;
  background: var(--color-bg);

  .avatar-wrapper {
    position: relative;

    .avatar {
      width: 160rpx;
      height: 160rpx;
      border-radius: 50%;
    }

    .avatar-edit {
      display: flex;
      position: absolute;
      right: 0;
      bottom: 0;
      align-items: center;
      justify-content: center;
      width: 48rpx;
      height: 48rpx;
      border-radius: 50%;
      background: var(--color-primary);
      color: var(--color-text-inverse);
      font-size: 24rpx;
    }
  }

  .avatar-tip {
    color: var(--color-text-secondary);
    font-size: 26rpx;
  }
}

// 表单区域
.form-section {
  padding: 24rpx;

  .form-value {
    &.disabled {
      color: var(--color-text-secondary);
    }
  }
}
</style>
