<template>
  <view class="feedback-page" :class="globalStore.themeClass">
    <UForm ref="formRef" :model="formData" :rules="rules">
      <!-- 反馈类型 -->
      <UCard class="form-section" title="反馈类型">
        <view class="type-list">
          <view
            v-for="item in FEEDBACK_TYPES"
            :key="item.value"
            class="type-item"
            :class="{ active: formData.type === item.value }"
            @click="formData.type = item.value"
          >
            {{ item.label }}
          </view>
        </view>
      </UCard>

      <!-- 反馈内容 -->
      <UCard class="form-section" title="问题描述">
        <UTextarea
          v-model="formData.content"
          placeholder="请详细描述您遇到的问题或建议，我们会认真处理..."
          :maxlength="FEEDBACK_CONTENT_MAX_LENGTH"
          :height="200"
        />
      </UCard>

      <!-- 图片上传 -->
      <UCard class="form-section" :title="`上传图片（可选，最多${FEEDBACK_IMAGE_MAX_COUNT}张）`">
        <view class="image-upload">
          <view v-for="(img, index) in formData.images" :key="img.path" class="image-item">
            <image :src="img.path" mode="aspectFill" @click="previewImage(img.path)" />
            <view class="remove-btn" @click="removeImage(index)">
              <UIcon name="closeempty" color="var(--color-text-inverse)" size="24rpx" />
            </view>
            <!-- 上传中状态 -->
            <view v-if="!img.url" class="uploading-mask">
              <text class="uploading-text">上传中...</text>
            </view>
          </view>
          <view v-if="formData.images.length < FEEDBACK_IMAGE_MAX_COUNT" class="upload-btn" @click="chooseImage">
            <UIcon name="plusempty" color="var(--color-text-placeholder)" size="48rpx" />
            <text class="upload-text">添加图片</text>
          </view>
        </view>
      </UCard>

      <!-- 联系方式 -->
      <UCard class="form-section" title="联系方式（可选）">
        <UInput
          v-model="formData.contact"
          type="number"
          :maxlength="PHONE_LENGTH"
          placeholder="请输入手机号，方便我们联系您"
        />
      </UCard>
    </UForm>

    <!-- 提交按钮 -->
    <UFixedButton
      text="提交反馈"
      loading-text="提交中..."
      :disabled="uploading"
      :loading="submitAction.loading.value"
      @click="handleSubmit"
    />

    <UPrivacyPopup />
  </view>
</template>

<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: '意见反馈',
  },
});

import { reactive, computed, ref } from 'vue';
import type { UFormExpose } from '@/components/UForm/context';
import { useAsyncAction, useSafeBack } from '@/composables';
import { useGlobalStore } from '@/store/modules/global';
import { useFeedbackStore } from '@/store/modules/feedback';
import { PAGES, PHONE_LENGTH } from '@/constants';
import type { FormRules } from '@/utils/form-rules';
import { uploadFileByPath } from '@/api';
import {
  FEEDBACK_TYPES,
  FEEDBACK_CONTENT_MIN_LENGTH,
  FEEDBACK_IMAGE_MAX_COUNT,
  FEEDBACK_CONTENT_MAX_LENGTH,
} from '@/constants';
import type { CreateFeedbackDtoType } from '@/api';

const globalStore = useGlobalStore();
const feedbackStore = useFeedbackStore();
const goBack = useSafeBack(PAGES.MINE);

interface FeedbackImage {
  /** 本地临时路径（用于预览） */
  path: string;
  /** 服务器返回的图片地址，上传完成前为空 */
  url: string;
}

const formData = reactive<{
  type: CreateFeedbackDtoType;
  content: string;
  images: FeedbackImage[];
  contact: string;
}>({
  type: FEEDBACK_TYPES[0].value as CreateFeedbackDtoType,
  content: '',
  images: [],
  contact: '',
});

const formRef = ref<UFormExpose | null>(null);

const contentMinMessage = `请至少输入${FEEDBACK_CONTENT_MIN_LENGTH}个字`;
const rules: FormRules<typeof formData> = {
  content: [
    { required: true, message: contentMinMessage },
    {
      validator: value => String(value).trim().length >= FEEDBACK_CONTENT_MIN_LENGTH,
      message: contentMinMessage,
    },
  ],
};

// 是否有图片正在上传
const uploading = computed(() => formData.images.some(img => !img.url));

// 提交操作
const submitAction = useAsyncAction({
  action: async () => {
    await feedbackStore.submitFeedback({
      type: formData.type,
      content: formData.content,
      images: formData.images.length > 0 ? formData.images.map(img => img.url) : undefined,
      contact: formData.contact || undefined,
    });
  },
  successText: '提交成功',
  onSuccess: () => {
    goBack();
  },
});

// 选择并上传图片
function chooseImage() {
  uni.chooseImage({
    count: FEEDBACK_IMAGE_MAX_COUNT - formData.images.length,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: res => {
      const start = formData.images.length;
      formData.images.push(...(res.tempFilePaths as string[]).map(path => ({ path, url: '' })));
      formData.images.slice(start).forEach(uploadImage);
    },
  });
}

// 上传单张图片，失败时移除
async function uploadImage(image: FeedbackImage) {
  try {
    const fileInfo = await uploadFileByPath(image.path);
    image.url = fileInfo.path;
  } catch (error) {
    console.error('图片上传失败:', error);
    uni.showToast({
      title: '图片上传失败',
      icon: 'none',
    });
    removeImage(formData.images.indexOf(image));
  }
}

// 预览已选图片
function previewImage(current: string) {
  uni.previewImage({ urls: formData.images.map(img => img.path), current });
}

// 移除图片
function removeImage(index: number) {
  if (index !== -1) formData.images.splice(index, 1);
}

// 提交反馈
async function handleSubmit() {
  if (uploading.value) {
    uni.showToast({ title: '图片上传中，请稍候', icon: 'none' });
    return;
  }
  if (!(await formRef.value?.validate())) return;

  submitAction.execute();
}
</script>

<style scoped lang="scss">
.feedback-page {
  box-sizing: border-box;
  min-height: 100vh;
  padding: 24rpx;
  background: var(--color-bg-grey);
}

.form-section {
  margin-bottom: 24rpx;
}

// 反馈类型
.type-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;

  .type-item {
    padding: 16rpx 32rpx;
    transition: all var(--duration-fast);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-base);
    background: var(--color-bg-grey);
    color: var(--color-text-secondary);
    font-size: 28rpx;

    &.active {
      border-color: var(--color-primary);
      background: var(--color-primary);
      color: var(--color-text-inverse);
    }
  }
}

// 图片上传
.image-upload {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;

  .image-item {
    position: relative;
    width: 200rpx;
    height: 200rpx;

    image {
      width: 100%;
      height: 100%;
      border-radius: var(--radius-base);
      object-fit: cover;
    }

    .remove-btn {
      display: flex;
      position: absolute;
      top: -16rpx;
      right: -16rpx;
      align-items: center;
      justify-content: center;
      width: 40rpx;
      height: 40rpx;
      border-radius: 50%;
      background: var(--color-error);
    }

    .uploading-mask {
      display: flex;
      position: absolute;
      inset: 0;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-base);
      background: var(--color-bg-mask-light);

      .uploading-text {
        color: var(--color-text-inverse);
        font-size: 24rpx;
      }
    }
  }

  .upload-btn {
    display: flex;
    flex-direction: column;
    gap: 12rpx;
    align-items: center;
    justify-content: center;
    width: 200rpx;
    height: 200rpx;
    border: 1px dashed var(--color-border);
    border-radius: var(--radius-base);
    background: var(--color-bg-grey);

    .upload-text {
      color: var(--color-text-placeholder);
      font-size: 24rpx;
    }
  }
}
</style>
