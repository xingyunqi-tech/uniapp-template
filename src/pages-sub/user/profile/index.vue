<template>
  <view class="profile-page" :class="globalStore.themeClass">
    <!-- 头像区域 -->
    <view class="avatar-section">
      <view class="avatar-upload-wrapper">
        <!-- #ifdef MP-WEIXIN -->
        <button
          class="avatar-choose-btn"
          open-type="chooseAvatar"
          :disabled="avatarUploading"
          @chooseavatar="handleChooseAvatar"
        >
          <image class="avatar-image" :src="formData.avatar || DEFAULT_AVATAR" mode="aspectFill" />
        </button>
        <!-- #endif -->
        <!-- #ifndef MP-WEIXIN -->
        <UImageUpload
          v-model="avatarList"
          :max-count="1"
          :auto-upload="false"
          add-text="更换头像"
          @select="handleAvatarSelect"
          @delete="handleAvatarDelete"
        />
        <!-- #endif -->
      </view>
      <text class="avatar-tip">点击更换头像</text>
    </view>

    <!-- 表单区域 -->
    <view class="form-section">
      <UMenuGroup>
        <UFormItem label="昵称">
          <!-- #ifdef MP-WEIXIN -->
          <input
            v-model="formData.username"
            class="u-form-input"
            placeholder-class="u-form-placeholder"
            type="nickname"
            placeholder="请输入昵称"
            :maxlength="NICKNAME_MAX_LENGTH"
            @blur="handleNicknameBlur"
            @nicknamereview="handleNicknameReview"
          />
          <!-- #endif -->
          <!-- #ifndef MP-WEIXIN -->
          <input
            v-model="formData.username"
            class="u-form-input"
            placeholder-class="u-form-placeholder"
            placeholder="请输入昵称"
            :maxlength="NICKNAME_MAX_LENGTH"
          />
          <!-- #endif -->
        </UFormItem>

        <UFormItem label="手机号">
          <view class="form-value disabled">
            <text>{{ formData.phone || '未绑定' }}</text>
          </view>
        </UFormItem>

        <UFormItem label="性别" show-arrow>
          <picker mode="selector" :range="genderLabels" :value="genderIndex" @change="handleGenderChange">
            <text :class="{ 'form-placeholder': !hasGender }">{{ genderText }}</text>
          </picker>
        </UFormItem>

        <UFormItem label="生日" show-arrow>
          <picker mode="date" :value="formData.birthday" :end="today" @change="handleBirthdayChange">
            <text :class="{ 'form-placeholder': !formData.birthday }">{{ formData.birthday || '请选择' }}</text>
          </picker>
        </UFormItem>
      </UMenuGroup>
    </view>

    <!-- 保存按钮 -->
    <UFixedButton
      text="保存"
      loading-text="保存中..."
      :loading="saveAction.loading.value"
      :disabled="avatarUploading"
      @click="handleSave"
    />

    <UPrivacyPopup />
  </view>
</template>

<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: '编辑资料',
  },
});

import { ref, reactive, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useUserStore } from '@/store/modules/user';
import { useAsyncAction } from '@/composables';
import { useGlobalStore } from '@/store/modules/global';
import { formatDateTime } from '@/utils/datetime';
import { AVATAR_MAX_SIZE_MB, GENDER_OPTIONS, NICKNAME_MAX_LENGTH } from '@/constants';
import { uploadFileByPath } from '@/api';
import type { FileItem, SelectResult } from '@/components';

const DEFAULT_AVATAR = '/static/images/default-avatar.png';

const globalStore = useGlobalStore();
const userStore = useUserStore();

// 头像上传状态
const avatarUploading = ref(false);
// 上传后的文件 ID
const uploadedPhotoId = ref<string | null>(null);

// 性别选项
const genderLabels = GENDER_OPTIONS.map(item => item.label);
const genderIndex = ref(0);

// 头像列表 (用于 UImageUpload)
const avatarList = ref<FileItem[]>([]);

// 表单数据
const formData = reactive({
  avatar: '',
  username: '',
  phone: '',
  gender: 0,
  birthday: '',
});

const genderOption = computed(() => GENDER_OPTIONS.find(item => item.value === formData.gender));
const hasGender = computed(() => !!genderOption.value);
const genderText = computed(() => genderOption.value?.label ?? '请选择');

// 今天日期（用于限制生日选择）
const today = computed(() => formatDateTime(new Date(), 'YYYY-MM-DD'));

// 保存操作
const saveAction = useAsyncAction({
  action: async () => {
    // 构建更新参数
    const updateParams: {
      nickname?: string;
      firstName?: string;
      lastName?: string;
      photo?: { id: string } | null;
      gender?: number;
      birthday?: string;
    } = {
      nickname: formData.username.trim() || undefined,
      gender: formData.gender,
    };

    // 新上传头像时提交文件 ID，删除了原头像时提交 null
    if (uploadedPhotoId.value) {
      updateParams.photo = { id: uploadedPhotoId.value };
    } else if (!formData.avatar && userStore.userInfo?.avatar) {
      updateParams.photo = null;
    }

    // 如果有生日，添加 birthday 参数
    if (formData.birthday) {
      updateParams.birthday = formData.birthday;
    }

    // 调用更新用户信息 API
    await userStore.updateUserInfo(updateParams);

    // 清除已上传的头像 ID（避免重复提交）
    uploadedPhotoId.value = null;
  },
  successText: '保存成功',
});

/**
 * 初始化表单数据
 */
function initFormData() {
  if (userStore.userInfo) {
    formData.avatar = userStore.userInfo.avatar || '';
    formData.username = userStore.userInfo.nickname || '';
    formData.phone = userStore.userInfo.phone || '';
    formData.gender = userStore.userInfo.gender ?? 0;
    formData.birthday = userStore.userInfo.birthday || '';

    // 初始化性别选择索引
    const genderOptionIndex = GENDER_OPTIONS.findIndex(item => item.value === formData.gender);
    genderIndex.value = genderOptionIndex >= 0 ? genderOptionIndex : 0;

    resetAvatarList();
  }
}

onLoad(async () => {
  // 先用本地缓存数据初始化
  initFormData();

  // 从接口获取最新用户数据
  try {
    await userStore.getUserInfo();
    // 更新表单数据
    initFormData();
  } catch (error) {
    console.error('获取用户信息失败:', error);
  }
});

// 按当前头像重置上传组件
function resetAvatarList() {
  avatarList.value = formData.avatar
    ? [{ name: 'avatar', extname: 'png', url: formData.avatar, status: 'success' }]
    : [];
}

// 上传头像临时文件，size 未知时不校验大小
async function uploadAvatar(path: string, size?: number) {
  if (size && size > AVATAR_MAX_SIZE_MB * 1024 * 1024) {
    uni.showToast({ title: `头像不能超过${AVATAR_MAX_SIZE_MB}MB`, icon: 'none' });
    resetAvatarList();
    return;
  }

  avatarUploading.value = true;
  try {
    const fileInfo = await uploadFileByPath(path);
    uploadedPhotoId.value = fileInfo.id;
    formData.avatar = fileInfo.path;
    resetAvatarList();

    uni.showToast({
      title: '头像已上传',
      icon: 'success',
    });
  } catch (error) {
    console.error('头像上传失败:', error);
    uni.showToast({
      title: '头像上传失败',
      icon: 'none',
    });
    resetAvatarList();
  } finally {
    avatarUploading.value = false;
  }
}

// 选择头像后上传
function handleAvatarSelect(result: SelectResult) {
  const path = result.tempFilePaths[0];
  if (path) uploadAvatar(path, result.tempFiles[0]?.size);
}

// 微信头像选择
function handleChooseAvatar(e: UniHelper.ButtonOnChooseavatarEvent) {
  uploadAvatar((e.detail as { avatarUrl: string }).avatarUrl);
}

// 微信昵称：选择微信昵称时不一定触发 input，失焦时同步
function handleNicknameBlur(e: { detail: { value: string } }) {
  formData.username = e.detail.value;
}

// 微信昵称安全审核未通过时输入框会被清空，同步清空并提示
function handleNicknameReview(e: UniHelper.InputOnNicknamereviewEvent) {
  if (e.detail.pass) return;
  formData.username = '';
  uni.showToast({ title: '昵称未通过安全审核，请重新输入', icon: 'none' });
}

// 删除头像
function handleAvatarDelete() {
  formData.avatar = '';
  uploadedPhotoId.value = null;
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
  box-sizing: border-box;
  min-height: 100vh;
  padding: 24rpx;
  padding-bottom: calc(200rpx + var(--safe-area-inset-bottom));
  background: var(--color-bg-grey);
}

// 头像区域
.avatar-section {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  align-items: center;
  margin-bottom: 24rpx;
  padding: 48rpx 0;
  border-radius: var(--radius-lg);
  background: var(--color-bg);

  .avatar-upload-wrapper {
    .avatar-choose-btn {
      width: 160rpx;
      height: 160rpx;
      margin: 0;
      padding: 0;
      overflow: hidden;
      border-radius: 50%;
      background: transparent;

      &::after {
        border: none;
      }
    }

    .avatar-image {
      width: 100%;
      height: 100%;
    }

    // 覆盖 uni-file-picker 样式，使其显示为圆形头像
    :deep(.uni-file-picker) {
      .file-picker__box {
        width: 160rpx !important;
        height: 160rpx !important;
        margin: 0 !important;
        overflow: hidden;
        border-radius: 50% !important;
      }

      .file-picker__box-content {
        border-radius: 50% !important;
      }

      .file-picker__box-content image {
        border-radius: 50% !important;
      }

      .icon-del-box {
        top: 0 !important;
        right: 0 !important;
        border-radius: 50% !important;
      }

      .is-add {
        border-radius: 50% !important;
      }
    }
  }

  .avatar-tip {
    color: var(--color-text-secondary);
    font-size: 26rpx;
  }
}

// 表单区域
.form-section {
  .form-value {
    &.disabled {
      color: var(--color-text-secondary);
    }
  }

  .form-placeholder {
    color: var(--color-text-placeholder);
  }
}
</style>
