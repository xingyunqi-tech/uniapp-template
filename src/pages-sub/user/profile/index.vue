<route lang="json5">
{
  style: {
    navigationBarTitleText: '编辑资料',
  },
}
</route>

<template>
  <view class="profile-page" :class="globalStore.themeClass">
    <!-- 头像区域 -->
    <view class="avatar-section">
      <view class="avatar-upload-wrapper">
        <UImageUpload
          v-model="avatarList"
          :max-count="1"
          :max-size="5"
          :auto-upload="false"
          add-text="更换头像"
          @change="handleAvatarChange"
        />
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
    <UFixedButton
      text="保存"
      loading-text="保存中..."
      :loading="saveAction.loading.value"
      :disabled="avatarUploading"
      @click="handleSave"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useUserStore } from '@/store/modules/user';
import { useAsyncAction } from '@/composables';
import { useGlobalStore } from '@/store/modules/global';
import { formatDateTime } from '@/utils/datetime';
import { GENDER_OPTIONS, NICKNAME_MAX_LENGTH } from '@/constants';
import { uploadFileByPath } from '@/api';
import type { FileItem } from '@/components';

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
      photo?: { id: string };
      gender?: number;
      birthday?: string;
    } = {
      nickname: formData.username,
      gender: formData.gender,
    };

    // 如果有新上传的头像，添加 photo 参数
    if (uploadedPhotoId.value) {
      updateParams.photo = { id: uploadedPhotoId.value };
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
  errorText: '保存失败',
});

/**
 * 初始化表单数据
 */
function initFormData() {
  if (userStore.userInfo) {
    formData.avatar = userStore.userInfo.avatar || '';
    formData.username = userStore.userInfo.username || '';
    formData.phone = userStore.userInfo.phone || '';
    formData.gender = userStore.userInfo.gender ?? 0;
    formData.birthday = userStore.userInfo.birthday || '';

    // 初始化性别选择索引
    const genderOptionIndex = GENDER_OPTIONS.findIndex(item => item.value === formData.gender);
    genderIndex.value = genderOptionIndex >= 0 ? genderOptionIndex : 0;

    // 初始化头像列表
    if (formData.avatar) {
      avatarList.value = [{ name: 'avatar', extname: 'png', url: formData.avatar, status: 'success' }];
    }
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

// 头像变化
async function handleAvatarChange(files: FileItem[]) {
  if (files.length > 0) {
    const file = files[0];

    // 如果是新选择的图片（状态为 ready），需要上传
    // FileItem.url 在选择时是临时路径
    if (file.status === 'ready' && file.url) {
      avatarUploading.value = true;
      try {
        const fileInfo = await uploadFileByPath(file.url);
        uploadedPhotoId.value = fileInfo.id;
        formData.avatar = fileInfo.path;

        // 更新 avatarList 的状态
        avatarList.value = [{ ...file, url: fileInfo.path, status: 'success' }];

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
        // 重置
        avatarList.value = [];
      } finally {
        avatarUploading.value = false;
      }
    } else {
      // 已存在的头像
      formData.avatar = file.url;
    }
  } else {
    formData.avatar = '';
    uploadedPhotoId.value = null;
  }
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
  padding-bottom: calc(200rpx + env(safe-area-inset-bottom));
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

  :deep(.u-menu-group__list) {
    padding: 0 24rpx;
  }
}
</style>
