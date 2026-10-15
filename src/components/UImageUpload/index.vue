<template>
  <!--
    UImageUpload - 基于 uni-file-picker 的图片上传组件
    封装 uni-file-picker，提供统一样式和简化 API
  -->
  <view class="u-image-upload">
    <uni-file-picker
      v-model="fileList"
      :limit="maxCount"
      :mode="mode"
      :file-mediatype="mediaType"
      :file-extname="fileExtname"
      :title="title"
      :disabled="disabled"
      :readonly="readonly"
      :del-icon="!disabled && !readonly"
      :auto-upload="autoUpload"
      :image-styles="imageStyleConfig"
      :list-styles="listStyleConfig"
      @select="handleSelect"
      @success="handleSuccess"
      @fail="handleFail"
      @progress="handleProgress"
      @delete="handleDelete"
    >
      <slot>
        <view class="u-image-upload__add">
          <view class="u-image-upload__add-icon">
            <uni-icons type="plusempty" color="inherit" size="inherit" />
          </view>
          <text v-if="addText" class="u-image-upload__add-text">{{ addText }}</text>
        </view>
      </slot>
    </uni-file-picker>
  </view>
</template>

<script setup lang="ts">
definePage({
  meta: {
    isComponent: true,
  },
});

import { ref, computed, watch, toRaw } from 'vue';

defineOptions({
  name: 'UImageUpload',
  options: {
    styleIsolation: 'shared',
  },
});

// ==================== Types ====================

/** 文件上传状态 */
export type FileUploadStatus = 'ready' | 'uploading' | 'success' | 'error';

/** 显示模式 */
export type UploadMode = 'grid' | 'list';

/** 媒体类型 */
export type MediaType = 'image' | 'video' | 'all';

/** 文件项类型 */
export interface FileItem {
  /** 文件名 */
  name: string;
  /** 文件扩展名 */
  extname: string;
  /** 本地临时路径或远程 URL */
  url: string;
  /** 文件大小 */
  size?: number;
  /** 云存储文件 ID */
  fileID?: string;
  /** 上传状态 */
  status?: FileUploadStatus;
  /** 上传进度 */
  progress?: number;
  /** 云存储返回的信息 */
  cloudPath?: string;
}

/** 选择结果 (与 uni-file-picker select 事件一致) */
export interface SelectResult {
  tempFilePaths: string[];
  tempFiles: FileItem[];
}

// ==================== Props ====================

interface Props {
  /** 已上传的文件列表 (v-model) */
  modelValue?: FileItem[];
  /** 最大上传数量，uni-file-picker 最多支持 9 */
  maxCount?: number;
  /** 显示模式: grid 宫格 | list 列表 */
  mode?: UploadMode;
  /** 媒体类型: image 图片 | video 视频 | all 全部 */
  mediaType?: MediaType;
  /** 允许的文件扩展名 */
  fileExtname?: string[];
  /** 组件标题 */
  title?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否只读 */
  readonly?: boolean;
  /** 是否自动上传（需配置 uniCloud） */
  autoUpload?: boolean;
  /** 添加按钮文案 */
  addText?: string;
  /** 图片宽度 (rpx) */
  imageWidth?: number;
  /** 图片高度 (rpx) */
  imageHeight?: number;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  maxCount: 9,
  mode: 'grid',
  mediaType: 'image',
  fileExtname: () => ['png', 'jpg', 'jpeg', 'gif', 'webp'],
  title: '',
  disabled: false,
  readonly: false,
  autoUpload: false,
  addText: '',
  imageWidth: 200,
  imageHeight: 200,
});

// ==================== Emits ====================

const emit = defineEmits<{
  'update:modelValue': [files: FileItem[]];
  select: [result: SelectResult];
  success: [result: UniHelper.UniFilePickerOnSuccessEvent];
  fail: [event: UniHelper.UniFilePickerOnFailEvent];
  progress: [event: UniHelper.UniFilePickerOnProgressEvent];
  delete: [event: UniHelper.UniFilePickerOnDeleteEvent];
}>();

// ==================== State ====================

/** 内部文件列表 - 使用 shallowRef 提高性能 */
const fileList = ref<FileItem[]>([]);

// ==================== Computed ====================

if (import.meta.env.DEV && props.maxCount > 9) {
  console.warn('[UImageUpload] maxCount 最大为 9，超出部分不生效');
}

/** 图片样式配置，uni-file-picker 按 px 处理数值，需由 rpx 换算 */
const imageStyleConfig = computed(() => ({
  width: uni.upx2px(props.imageWidth),
  height: uni.upx2px(props.imageHeight),
  border: {
    color: 'var(--color-border)',
    width: '1',
    style: 'dashed',
    radius: '8rpx',
  },
}));

/** 列表样式配置 */
const listStyleConfig = computed(() => ({
  border: true,
  dividline: true,
  borderStyle: {
    color: 'var(--color-border)',
    width: '1',
    style: 'solid',
    radius: '8rpx',
  },
}));

// ==================== Watch ====================

/** 最近一次 emit 出去的数组，父组件回写时据此跳过同步 */
let lastEmitted: FileItem[] | undefined;

// 同步外部值到内部
watch(
  () => props.modelValue,
  newVal => {
    if (toRaw(newVal) === lastEmitted) return;
    fileList.value = [...newVal];
  },
  { immediate: true },
);

// 同步内部值到外部
watch(
  fileList,
  newVal => {
    lastEmitted = [...newVal];
    emit('update:modelValue', lastEmitted);
  },
  { deep: true },
);

// ==================== Methods ====================

/** 选择文件 */
function handleSelect(result: SelectResult) {
  emit('select', result);
}

/** 上传成功 */
function handleSuccess(event: UniHelper.UniFilePickerOnSuccessEvent) {
  emit('success', event);
}

/** 上传失败 */
function handleFail(event: UniHelper.UniFilePickerOnFailEvent) {
  emit('fail', event);
}

/** 上传进度 */
function handleProgress(event: UniHelper.UniFilePickerOnProgressEvent) {
  emit('progress', event);
}

/** 删除文件 */
function handleDelete(event: UniHelper.UniFilePickerOnDeleteEvent) {
  emit('delete', event);
}

// ==================== Expose ====================

defineExpose({
  /** 获取文件列表 */
  getFileList: () => fileList.value,
  /** 清空文件列表 */
  clear: () => {
    fileList.value = [];
  },
});
</script>

<style scoped lang="scss">
.u-image-upload {
  &__add {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    color: var(--color-text-secondary);
  }

  &__add-icon {
    font-size: var(--font-size-xl);
  }

  &__add-text {
    margin-top: var(--spacing-xs);
    font-size: var(--font-size-sm);
  }
}

// 覆盖 uni-file-picker 默认样式
:deep(.uni-file-picker__container) {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

:deep(.file-picker__box) {
  margin: 0 !important;
}

:deep(.file-picker__box-content) {
  border-radius: var(--radius-base) !important;
  background: var(--color-bg-grey) !important;
}

// 始终传入自定义的添加按钮内容，隐藏 uni-file-picker 默认的十字图标
:deep(.icon-add) {
  display: none !important;
}

:deep(.icon-del-box) {
  background-color: var(--color-bg-mask-light) !important;
}
</style>
