<template>
  <view class="feedback-page" :class="globalStore.themeClass">
    <!-- 反馈类型 -->
    <view class="form-section">
      <view class="section-title">反馈类型</view>
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
    </view>

    <!-- 反馈内容 -->
    <view class="form-section">
      <view class="section-title">问题描述</view>
      <view class="textarea-wrapper">
        <textarea
          v-model="formData.content"
          class="feedback-textarea"
          placeholder="请详细描述您遇到的问题或建议，我们会认真处理..."
          :maxlength="FEEDBACK_CONTENT_MAX_LENGTH"
          @input="handleInput"
        />
        <view class="word-count">{{ formData.content.length }}/{{ FEEDBACK_CONTENT_MAX_LENGTH }}</view>
      </view>
    </view>

    <!-- 图片上传 -->
    <view class="form-section">
      <view class="section-title">上传图片（可选，最多{{ FEEDBACK_IMAGE_MAX_COUNT }}张）</view>
      <view class="image-upload">
        <view v-for="(img, index) in formData.tempImages" :key="index" class="image-item">
          <image :src="img" mode="aspectFill" />
          <view class="remove-btn" @click="removeImage(index)">
            <uni-icons type="closeempty" color="var(--color-text-inverse)" size="24rpx" />
          </view>
          <!-- 上传中状态 -->
          <view v-if="index >= formData.images.length" class="uploading-mask">
            <text class="uploading-text">上传中...</text>
          </view>
        </view>
        <view v-if="formData.tempImages.length < FEEDBACK_IMAGE_MAX_COUNT" class="upload-btn" @click="chooseImage">
          <uni-icons type="plusempty" color="var(--color-text-placeholder)" size="48rpx" />
          <text class="upload-text">添加图片</text>
        </view>
      </view>
    </view>

    <!-- 联系方式 -->
    <view class="form-section">
      <view class="section-title">联系方式（可选）</view>
      <input
        v-model="formData.contact"
        class="contact-input"
        type="number"
        :maxlength="11"
        placeholder="请输入手机号，方便我们联系您"
      />
    </view>

    <!-- 提交按钮 -->
    <UFixedButton
      text="提交反馈"
      loading-text="提交中..."
      :disabled="!canSubmit"
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
import { useAsyncAction, useSafeBack } from '@/composables';
import { useGlobalStore } from '@/store/modules/global';
import { useFeedbackStore } from '@/store/modules/feedback';
import { PAGES } from '@/constants';
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

// 图片上传状态
const uploading = ref(false);

const formData = reactive<{
  type: CreateFeedbackDtoType;
  content: string;
  images: string[]; // 服务器返回的图片 URL
  tempImages: string[]; // 本地临时图片路径（用于预览）
  contact: string;
}>({
  type: FEEDBACK_TYPES[0].value as CreateFeedbackDtoType,
  content: '',
  images: [],
  tempImages: [],
  contact: '',
});

// 是否可提交（内容长度足够且没有正在上传的图片）
const canSubmit = computed(() => {
  return formData.content.trim().length >= FEEDBACK_CONTENT_MIN_LENGTH && !uploading.value;
});

// 提交操作
const submitAction = useAsyncAction({
  action: async () => {
    await feedbackStore.submitFeedback({
      type: formData.type,
      content: formData.content,
      images: formData.images.length > 0 ? formData.images : undefined,
      contact: formData.contact || undefined,
    });
  },
  successText: '提交成功',
  onSuccess: () => {
    goBack();
  },
});

// 输入事件
function handleInput(e: { detail: { value: string } }) {
  formData.content = e.detail.value;
}

// 选择并上传图片
async function chooseImage() {
  uni.chooseImage({
    count: FEEDBACK_IMAGE_MAX_COUNT - formData.tempImages.length,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async res => {
      const tempPaths = res.tempFilePaths;

      // 先添加到临时预览
      formData.tempImages.push(...tempPaths);

      // 上传图片
      uploading.value = true;
      try {
        for (const path of tempPaths) {
          const fileInfo = await uploadFileByPath(path);
          formData.images.push(fileInfo.path);
        }
      } catch (error) {
        console.error('图片上传失败:', error);
        uni.showToast({
          title: '图片上传失败',
          icon: 'none',
        });
        // 移除上传失败的临时图片
        formData.tempImages = formData.tempImages.filter(p => !tempPaths.includes(p));
      } finally {
        uploading.value = false;
      }
    },
  });
}

// 移除图片
function removeImage(index: number) {
  formData.tempImages.splice(index, 1);
  formData.images.splice(index, 1);
}

// 提交反馈
function handleSubmit() {
  if (!canSubmit.value) {
    uni.showToast({
      title: `请至少输入${FEEDBACK_CONTENT_MIN_LENGTH}个字`,
      icon: 'none',
    });
    return;
  }

  submitAction.execute();
}
</script>

<style scoped lang="scss">
.feedback-page {
  box-sizing: border-box;
  min-height: 100vh;
  padding: 24rpx;
  padding-bottom: calc(200rpx + env(safe-area-inset-bottom));
  background: var(--color-bg-grey);
}

.form-section {
  margin-bottom: 32rpx;
  padding: 32rpx;
  border-radius: var(--radius-lg);
  background: var(--color-bg);

  .section-title {
    margin-bottom: 24rpx;
    color: var(--color-text);
    font-size: 30rpx;
    font-weight: 500;
  }
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

// 文本域
.textarea-wrapper {
  position: relative;

  .feedback-textarea {
    box-sizing: border-box;
    width: 100%;
    height: 240rpx;
    padding: 24rpx;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-base);
    background: var(--color-bg-grey);
    color: var(--color-text);
    font-size: 28rpx;
    line-height: 1.6;

    &::placeholder {
      color: var(--color-text-placeholder);
    }
  }

  .word-count {
    position: absolute;
    right: 24rpx;
    bottom: 24rpx;
    color: var(--color-text-placeholder);
    font-size: 24rpx;
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

// 联系方式
.contact-input {
  box-sizing: border-box;
  width: 100%;
  height: 88rpx;
  padding: 0 24rpx;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-base);
  background: var(--color-bg-grey);
  color: var(--color-text);
  font-size: 28rpx;

  &::placeholder {
    color: var(--color-text-placeholder);
  }
}
</style>
