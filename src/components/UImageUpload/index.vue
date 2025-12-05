<template>
  <view class="u-image-upload" :class="themeClass">
    <!-- 已上传的图片列表 -->
    <view
      v-for="(item, index) in fileList"
      :key="item.id || index"
      class="upload-item"
      :class="{ 'is-error': item.status === 'error' }"
    >
      <!-- 图片预览 -->
      <image class="upload-image" :src="item.url" mode="aspectFill" @click="handlePreview(index)" />

      <!-- 上传进度 -->
      <view v-if="item.status === 'uploading'" class="upload-progress">
        <view class="progress-bar" :style="{ width: `${item.progress || 0}%` }" />
        <text class="progress-text">{{ item.progress || 0 }}%</text>
      </view>

      <!-- 错误提示 -->
      <view v-if="item.status === 'error'" class="upload-error" @click="handleRetry(index)">
        <text class="i-carbon-warning" />
        <text class="error-text">点击重试</text>
      </view>

      <!-- 删除按钮 -->
      <view v-if="!disabled && item.status !== 'uploading'" class="upload-delete" @click.stop="handleDelete(index)">
        <text class="i-carbon-close" />
      </view>
    </view>

    <!-- 添加按钮 -->
    <view v-if="showAddButton" class="upload-add" @click="handleChoose">
      <text class="i-carbon-add add-icon" />
      <text v-if="addText" class="add-text">{{ addText }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useTheme } from '@/composables';

// ==================== 类型定义 ====================

/** 文件状态 */
export type FileStatus = 'pending' | 'uploading' | 'done' | 'error';

/** 文件项 */
export interface FileItem {
  /** 唯一标识 */
  id?: string;
  /** 文件 URL (本地临时路径或远程 URL) */
  url: string;
  /** 文件名 */
  name?: string;
  /** 文件大小 (字节) */
  size?: number;
  /** 文件状态 */
  status?: FileStatus;
  /** 上传进度 (0-100) */
  progress?: number;
  /** 服务器返回的数据 */
  response?: unknown;
  /** 错误信息 */
  error?: string;
}

/** 上传函数类型 */
export type UploadFunction = (file: { path: string; name: string; size: number }) => Promise<string>;

/** 临时文件类型 */
interface TempFile {
  path: string;
  size: number;
  name?: string;
  type?: string;
}

// ==================== Props ====================

interface Props {
  /** 已上传的文件列表 (v-model) */
  modelValue?: FileItem[];
  /** 最大上传数量 */
  maxCount?: number;
  /** 最大文件大小 (MB) */
  maxSize?: number;
  /** 是否允许多选 */
  multiple?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 添加按钮文案 */
  addText?: string;
  /** 图片来源 */
  sourceType?: ('album' | 'camera')[];
  /** 图片尺寸类型 */
  sizeType?: ('original' | 'compressed')[];
  /** 自定义上传函数 */
  uploadFn?: UploadFunction;
  /** 上传地址 (当不使用 uploadFn 时) */
  uploadUrl?: string;
  /** 上传文件字段名 */
  uploadName?: string;
  /** 上传请求头 */
  uploadHeader?: Record<string, string>;
  /** 上传额外参数 */
  uploadFormData?: Record<string, string>;
  /** 是否在选择后自动上传 */
  autoUpload?: boolean;
  /** 是否显示提示 */
  showToast?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  maxCount: 9,
  maxSize: 10,
  multiple: true,
  disabled: false,
  addText: '',
  sourceType: () => ['album', 'camera'],
  sizeType: () => ['original', 'compressed'],
  uploadFn: undefined,
  uploadUrl: '',
  uploadName: 'file',
  uploadHeader: () => ({}),
  uploadFormData: () => ({}),
  autoUpload: true,
  showToast: true,
});

// ==================== Emits ====================

interface Emits {
  (e: 'update:modelValue', value: FileItem[]): void;
  (e: 'change', value: FileItem[]): void;
  (e: 'exceed', files: TempFile[]): void;
  (e: 'success', file: FileItem, index: number): void;
  (e: 'error', file: FileItem, index: number): void;
  (e: 'delete', file: FileItem, index: number): void;
  (e: 'preview', file: FileItem, index: number): void;
}

const emit = defineEmits<Emits>();

// ==================== Composables ====================

const { themeClass } = useTheme();

// ==================== State ====================

/** 内部文件列表 */
const fileList = ref<FileItem[]>([...props.modelValue]);

/** 文件计数器 (用于生成唯一 ID) */
let fileIdCounter = 0;

// ==================== Computed ====================

/** 是否显示添加按钮 */
const showAddButton = computed(() => {
  return !props.disabled && fileList.value.length < props.maxCount;
});

/** 剩余可选数量 */
const remainCount = computed(() => {
  return Math.max(0, props.maxCount - fileList.value.length);
});

// ==================== Watch ====================

watch(
  () => props.modelValue,
  newVal => {
    fileList.value = [...newVal];
  },
  { deep: true },
);

// ==================== Methods ====================

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return `file_${Date.now()}_${++fileIdCounter}`;
}

/**
 * 更新文件列表并触发事件
 */
function updateFileList(list: FileItem[]) {
  fileList.value = list;
  emit('update:modelValue', list);
  emit('change', list);
}

/**
 * 选择图片
 */
function handleChoose() {
  if (props.disabled || remainCount.value <= 0) {
    return;
  }

  uni.chooseImage({
    count: props.multiple ? remainCount.value : 1,
    sourceType: props.sourceType,
    sizeType: props.sizeType,
    success: res => {
      // 统一转换为数组格式
      const tempFiles = res.tempFiles as Array<{ path: string; size: number; name?: string; type?: string }>;
      const files: TempFile[] = Array.isArray(tempFiles)
        ? tempFiles.map(f => ({ path: f.path, size: f.size, name: f.name, type: f.type }))
        : [tempFiles];

      // 检查数量限制
      if (files.length > remainCount.value) {
        emit('exceed', files);
        if (props.showToast) {
          uni.showToast({
            title: `最多上传 ${props.maxCount} 张图片`,
            icon: 'none',
          });
        }
        return;
      }

      // 检查文件大小
      const maxSizeBytes = props.maxSize * 1024 * 1024;
      const oversizedFiles = files.filter(file => file.size > maxSizeBytes);
      if (oversizedFiles.length > 0) {
        if (props.showToast) {
          uni.showToast({
            title: `图片大小不能超过 ${props.maxSize}MB`,
            icon: 'none',
          });
        }
        return;
      }

      // 添加到列表
      const newFiles: FileItem[] = files.map(file => ({
        id: generateId(),
        url: file.path,
        name: file.path.split('/').pop() || 'image',
        size: file.size,
        status: props.autoUpload ? 'pending' : 'done',
        progress: 0,
      }));

      const updatedList = [...fileList.value, ...newFiles];
      updateFileList(updatedList);

      // 自动上传
      if (props.autoUpload) {
        newFiles.forEach((file, index) => {
          const listIndex = fileList.value.length - newFiles.length + index;
          uploadFile(file, listIndex);
        });
      }
    },
    fail: err => {
      console.error('选择图片失败:', err);
    },
  });
}

/**
 * 上传单个文件
 */
async function uploadFile(file: FileItem, index: number) {
  // 更新状态为上传中
  updateFileStatus(index, 'uploading', 0);

  try {
    let resultUrl: string;

    if (props.uploadFn) {
      // 使用自定义上传函数
      resultUrl = await props.uploadFn({
        path: file.url,
        name: file.name || 'image',
        size: file.size || 0,
      });
    } else if (props.uploadUrl) {
      // 使用默认上传方式
      resultUrl = await defaultUpload(file, index);
    } else {
      // 没有配置上传方式，直接标记为完成
      updateFileStatus(index, 'done', 100);
      emit('success', fileList.value[index], index);
      return;
    }

    // 更新为上传成功
    const updatedList = [...fileList.value];
    updatedList[index] = {
      ...updatedList[index],
      url: resultUrl,
      status: 'done',
      progress: 100,
    };
    updateFileList(updatedList);
    emit('success', updatedList[index], index);
  } catch (error) {
    // 更新为上传失败
    updateFileStatus(index, 'error', 0);
    emit('error', fileList.value[index], index);

    if (props.showToast) {
      uni.showToast({
        title: '上传失败',
        icon: 'none',
      });
    }
  }
}

/**
 * 默认上传方法
 */
function defaultUpload(file: FileItem, index: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadTask = uni.uploadFile({
      url: props.uploadUrl,
      filePath: file.url,
      name: props.uploadName,
      header: props.uploadHeader,
      formData: props.uploadFormData,
      success: res => {
        if (res.statusCode === 200) {
          try {
            const data = JSON.parse(res.data);
            // 假设服务器返回 { data: { url: '...' } } 或 { url: '...' }
            const url = data.data?.url || data.url || file.url;
            resolve(url);
          } catch {
            resolve(file.url);
          }
        } else {
          reject(new Error(`上传失败: ${res.statusCode}`));
        }
      },
      fail: reject,
    });

    // 监听上传进度
    uploadTask.onProgressUpdate(res => {
      updateFileStatus(index, 'uploading', res.progress);
    });
  });
}

/**
 * 更新文件状态
 */
function updateFileStatus(index: number, status: FileStatus, progress: number) {
  const updatedList = [...fileList.value];
  if (updatedList[index]) {
    updatedList[index] = {
      ...updatedList[index],
      status,
      progress,
    };
    updateFileList(updatedList);
  }
}

/**
 * 删除图片
 */
function handleDelete(index: number) {
  const file = fileList.value[index];
  const updatedList = fileList.value.filter((_, i) => i !== index);
  updateFileList(updatedList);
  emit('delete', file, index);
}

/**
 * 重试上传
 */
function handleRetry(index: number) {
  const file = fileList.value[index];
  uploadFile(file, index);
}

/**
 * 预览图片
 */
function handlePreview(index: number) {
  const urls = fileList.value.filter(f => f.status !== 'error').map(f => f.url);
  const current = fileList.value[index].url;

  emit('preview', fileList.value[index], index);

  uni.previewImage({
    urls,
    current,
  });
}

// ==================== Expose ====================

defineExpose({
  /** 手动选择图片 */
  choose: handleChoose,
  /** 手动上传指定文件 */
  upload: uploadFile,
  /** 获取文件列表 */
  getFileList: () => fileList.value,
  /** 清空文件列表 */
  clear: () => updateFileList([]),
});
</script>

<style scoped lang="scss">
.u-image-upload {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

// 上传项
.upload-item {
  position: relative;
  width: 200rpx;
  height: 200rpx;
  overflow: hidden;
  border-radius: $uni-border-radius-base;
  background: var(--color-bg-grey);

  &.is-error {
    .upload-image {
      opacity: 0.5;
    }
  }

  .upload-image {
    width: 100%;
    height: 100%;
  }
}

// 上传进度
.upload-progress {
  display: flex;
  position: absolute;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgb(0 0 0 / 0.5);
  inset: 0;

  .progress-bar {
    width: 80%;
    height: 8rpx;
    border-radius: 4rpx;
    background: var(--color-primary);
  }

  .progress-text {
    margin-top: 8rpx;
    color: var(--color-text-inverse);
    font-size: 24rpx;
  }
}

// 错误状态
.upload-error {
  display: flex;
  position: absolute;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgb(0 0 0 / 0.5);
  inset: 0;

  .i-carbon-warning {
    color: var(--color-warning);
    font-size: 48rpx;
  }

  .error-text {
    margin-top: 8rpx;
    color: var(--color-text-inverse);
    font-size: 24rpx;
  }
}

// 删除按钮
.upload-delete {
  display: flex;
  position: absolute;
  top: 0;
  right: 0;
  align-items: center;
  justify-content: center;
  width: 40rpx;
  height: 40rpx;
  border-radius: 0 0 0 8rpx;
  background: rgb(0 0 0 / 0.5);

  .i-carbon-close {
    color: var(--color-text-inverse);
    font-size: 24rpx;
  }
}

// 添加按钮
.upload-add {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 200rpx;
  height: 200rpx;
  transition: all $uni-duration-fast;
  border: 2rpx dashed var(--color-border);
  border-radius: $uni-border-radius-base;
  background: var(--color-bg-grey);

  &:active {
    border-color: var(--color-primary);
    background: var(--color-bg-hover);
  }

  .add-icon {
    color: var(--color-text-secondary);
    font-size: 64rpx;
  }

  .add-text {
    margin-top: 8rpx;
    color: var(--color-text-secondary);
    font-size: 24rpx;
  }
}
</style>
