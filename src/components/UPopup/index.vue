<template>
  <!--
    UPopup - 基于 uni-popup 的弹出层组件
    封装 uni-popup，提供简化 API 和统一样式
    支持 dialog/bottom/center/top 等模式
  -->
  <uni-popup
    ref="popupRef"
    :type="type"
    :animation="animation"
    :is-mask-click="maskClosable"
    :mask-background-color="maskBackground"
    :background-color="backgroundColor"
    :safe-area="safeArea"
    class="u-popup"
    @change="handleChange"
    @mask-click="handleMaskClick"
  >
    <!-- 对话框模式，覆盖样式挂在外层 view 上（支付宝中组件标签不是真实节点） -->
    <view v-if="type === 'dialog'" class="u-popup__dialog">
      <uni-popup-dialog
        :type="dialogType"
        :mode="dialogMode"
        :title="title"
        :content="content"
        :placeholder="placeholder"
        :model-value="dialogValue"
        :before-close="true"
        :cancel-text="cancelText"
        :confirm-text="confirmText"
        @close="handleDialogClose"
        @confirm="handleDialogConfirm"
      >
        <slot />
      </uni-popup-dialog>
    </view>

    <!-- 底部弹出模式 -->
    <template v-else-if="type === 'bottom'">
      <view class="u-popup__bottom" :style="bottomStyle">
        <!-- 标题栏 -->
        <view v-if="title || showClose" class="u-popup__header">
          <text v-if="title" class="u-popup__title">{{ title }}</text>
          <view v-if="showClose" class="u-popup__close" @click="close">
            <uni-icons type="closeempty" color="inherit" size="inherit" />
          </view>
        </view>
        <!-- 内容 -->
        <view class="u-popup__body" :class="{ 'u-popup__body--flush': !bodyPadding }">
          <slot />
        </view>
      </view>
    </template>

    <!-- 中间弹出 / 顶部弹出 / 其他模式 -->
    <template v-else>
      <view class="u-popup__content" :class="`u-popup__content--${type}`">
        <slot />
      </view>
    </template>
  </uni-popup>
</template>

<script setup lang="ts">
definePage({
  meta: {
    isComponent: true,
  },
});

import { ref, computed } from 'vue';

defineOptions({
  name: 'UPopup',
  options: {
    styleIsolation: 'shared',
  },
});

// ==================== Types ====================

export type PopupType = 'center' | 'bottom' | 'top' | 'left' | 'right' | 'dialog';
/** uni-popup-dialog 支持的类型 */
export type DialogType = UniHelper.UniPopupDialogType;
export type DialogMode = 'base' | 'input';

// ==================== Props ====================

interface Props {
  /** 弹出类型 */
  type?: PopupType;
  /** 是否开启动画 */
  animation?: boolean;
  /** 点击遮罩是否关闭 */
  maskClosable?: boolean;
  /** 遮罩背景色 */
  maskBackground?: string;
  /** 弹窗背景色 */
  backgroundColor?: string;
  /** 是否开启底部安全区 */
  safeArea?: boolean;
  /** 标题 (底部弹窗和对话框) */
  title?: string;
  /** 是否显示关闭按钮 (底部弹窗) */
  showClose?: boolean;
  /** 底部弹窗圆角 */
  borderRadius?: number;
  /** 底部弹窗最大高度 (vh) */
  maxHeight?: number;
  /** 底部弹窗内容区是否保留内边距 */
  bodyPadding?: boolean;
  // 对话框专属属性
  /** 对话框类型 */
  dialogType?: DialogType;
  /** 对话框模式 */
  dialogMode?: DialogMode;
  /** 对话框内容 */
  content?: string;
  /** 输入框占位符 */
  placeholder?: string;
  /** 输入框默认值 */
  dialogValue?: string;
  /** 取消按钮文字 */
  cancelText?: string;
  /** 确认按钮文字 */
  confirmText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'center',
  animation: true,
  maskClosable: true,
  maskBackground: 'var(--color-bg-mask-light)',
  backgroundColor: 'var(--color-bg)',
  safeArea: true,
  title: '',
  showClose: true,
  borderRadius: 24,
  maxHeight: 70,
  bodyPadding: true,
  dialogType: 'info',
  dialogMode: 'base',
  content: '',
  placeholder: '请输入',
  dialogValue: '',
  cancelText: '取消',
  confirmText: '确定',
});

// ==================== Emits ====================

const emit = defineEmits<{
  change: [{ show: boolean }];
  maskClick: [];
  close: [];
  confirm: [value?: string];
}>();

// ==================== Types ====================

/** uni-popup 组件实例类型 */
interface UniPopupInstance {
  open: (type?: string) => void;
  close: () => void;
}

// ==================== Refs ====================

const popupRef = ref<UniPopupInstance | null>(null);

// ==================== Computed ====================

const bottomStyle = computed(() => ({
  borderRadius: `${props.borderRadius}rpx ${props.borderRadius}rpx 0 0`,
  maxHeight: `${props.maxHeight}vh`,
}));

// ==================== Methods ====================

/** 打开弹窗 */
function open() {
  popupRef.value?.open();
}

/** 关闭弹窗 */
function close() {
  popupRef.value?.close();
}

function handleChange(e: { show: boolean }) {
  emit('change', e);
  if (!e.show) {
    emit('close');
  }
}

function handleMaskClick() {
  emit('maskClick');
}

function handleDialogClose() {
  close();
  // close 事件由 handleChange 统一触发，避免重复
}

/** 输入模式下 uni-popup-dialog 直接传出输入值，基础模式不传参 */
function handleDialogConfirm(value?: unknown) {
  emit('confirm', value === undefined || value === null ? undefined : String(value));
  close();
}

// ==================== Expose ====================

defineExpose({
  open,
  close,
});
</script>

<style scoped lang="scss">
.u-popup {
  &__bottom {
    display: flex;
    flex-direction: column;
    width: 100vw;
    overflow: hidden;
    background: var(--color-bg);
  }

  &__header {
    display: flex;
    position: relative;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    height: 100rpx;
    border-bottom: var(--border-width-base) solid var(--color-border);
  }

  &__title {
    color: var(--color-text);
    font-size: var(--font-size-lg);
    font-weight: 500;
  }

  &__close {
    display: flex;
    position: absolute;
    top: 50%;
    right: var(--spacing-base);
    align-items: center;
    justify-content: center;
    width: 60rpx;
    height: 60rpx;
    transform: translateY(-50%);
    color: var(--color-text-secondary);
    font-size: var(--font-size-xl);
    cursor: pointer;

    &:active {
      opacity: var(--opacity-hover);
    }
  }

  &__body {
    flex: 1;
    padding: var(--spacing-base);
    overflow-y: auto;

    &--flush {
      padding: 0;
    }
  }

  &__content {
    background: var(--color-bg);

    &--center {
      min-width: 500rpx;
      padding: var(--spacing-lg);
      border-radius: var(--radius-lg);
    }

    &--top,
    &--left,
    &--right {
      padding: var(--spacing-base);
    }
  }
}

// 覆盖 uni-popup-dialog 样式
.u-popup__dialog :deep(.uni-popup-dialog) {
  border-radius: var(--radius-lg);
}

.u-popup__dialog :deep(.uni-dialog-title) {
  color: var(--color-text);
  font-size: var(--font-size-xl);
}

.u-popup__dialog :deep(.uni-dialog-content) {
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
}

.u-popup__dialog :deep(.uni-dialog-button-group) {
  border-top: var(--border-width-base) solid var(--color-border);
}

.u-popup__dialog :deep(.uni-dialog-button) {
  color: var(--color-text-secondary);
  font-size: var(--font-size-lg);

  &:last-child {
    color: var(--color-primary);
  }
}
</style>
