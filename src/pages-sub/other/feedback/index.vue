<route lang="json5">
{
  style: {
    navigationBarTitleText: '意见反馈',
  },
}
</route>

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
        <view v-for="(img, index) in formData.images" :key="index" class="image-item">
          <image :src="img" mode="aspectFill" />
          <view class="remove-btn" @click="removeImage(index)">
            <text class="i-carbon-close" />
          </view>
        </view>
        <view v-if="formData.images.length < FEEDBACK_IMAGE_MAX_COUNT" class="upload-btn" @click="chooseImage">
          <text class="i-carbon-add" />
          <text class="upload-text">添加图片</text>
        </view>
      </view>
    </view>

    <!-- 联系方式 -->
    <view class="form-section">
      <view class="section-title">联系方式（可选）</view>
      <input v-model="formData.contact" class="contact-input" placeholder="请输入手机号或邮箱，方便我们联系您" />
    </view>

    <!-- 提交按钮 -->
    <UFixedButton
      text="提交反馈"
      loading-text="提交中..."
      :disabled="!canSubmit"
      :loading="submitAction.loading.value"
      @click="handleSubmit"
    />
  </view>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue';
import { useAsyncAction } from '@/composables';
import { useGlobalStore } from '@/store/modules/global';

import {
  FEEDBACK_TYPES,
  FEEDBACK_CONTENT_MIN_LENGTH,
  FEEDBACK_IMAGE_MAX_COUNT,
  FEEDBACK_CONTENT_MAX_LENGTH,
} from '@/constants';
import UFixedButton from '@/components/UFixedButton/index.vue';

const globalStore = useGlobalStore();

/** 反馈类型 */
type FeedbackType = (typeof FEEDBACK_TYPES)[number]['value'];

const formData = reactive<{
  type: FeedbackType;
  content: string;
  images: string[];
  contact: string;
}>({
  type: FEEDBACK_TYPES[0].value,
  content: '',
  images: [],
  contact: '',
});

// 是否可提交
const canSubmit = computed(() => {
  return formData.content.trim().length >= FEEDBACK_CONTENT_MIN_LENGTH;
});

// 提交操作
const submitAction = useAsyncAction({
  action: async () => {
    // TODO: 替换为实际 API 调用
    await new Promise(resolve => setTimeout(resolve, 1000));
  },
  successText: '提交成功',
  errorText: '提交失败，请重试',
  onSuccess: () => {
    uni.navigateBack();
  },
});

// 输入事件
function handleInput(e: { detail: { value: string } }) {
  formData.content = e.detail.value;
}

// 选择图片
function chooseImage() {
  uni.chooseImage({
    count: FEEDBACK_IMAGE_MAX_COUNT - formData.images.length,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: res => {
      formData.images.push(...res.tempFilePaths);
    },
  });
}

// 移除图片
function removeImage(index: number) {
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
  min-height: 100vh;
  padding: 24rpx;
  padding-bottom: calc(200rpx + env(safe-area-inset-bottom));
  background: var(--color-bg-grey);
}

.form-section {
  margin-bottom: 32rpx;
  padding: 32rpx;
  border-radius: $uni-border-radius-lg;
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
    transition: all $uni-duration-fast;
    border: 1px solid var(--color-border);
    border-radius: $uni-border-radius-base;
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
    border-radius: $uni-border-radius-base;
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
      border-radius: $uni-border-radius-base;
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

      .i-carbon-close {
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
    border-radius: $uni-border-radius-base;
    background: var(--color-bg-grey);

    .i-carbon-add {
      color: var(--color-text-placeholder);
      font-size: 48rpx;
    }

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
  border-radius: $uni-border-radius-base;
  background: var(--color-bg-grey);
  color: var(--color-text);
  font-size: 28rpx;

  &::placeholder {
    color: var(--color-text-placeholder);
  }
}
</style>
