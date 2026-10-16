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
    background-color="transparent"
    :safe-area="false"
    class="u-popup"
    @change="handleChange"
    @mask-click="handleMaskClick"
  >
    <!-- 对话框模式，覆盖样式挂在外层 view 上（支付宝中组件标签不是真实节点） -->
    <view v-if="type === 'dialog'" class="u-popup__dialog" :class="{ 'u-popup__dialog--confirming': confirming }">
      <uni-popup-dialog
        v-if="slots.default"
        v-bind="dialogProps"
        @close="handleDialogClose"
        @confirm="handleDialogConfirm"
      >
        <slot />
      </uni-popup-dialog>
      <uni-popup-dialog v-else v-bind="dialogProps" @close="handleDialogClose" @confirm="handleDialogConfirm" />
    </view>

    <!-- 底部弹出模式 -->
    <template v-else-if="type === 'bottom'">
      <view class="u-popup__bottom" :class="{ 'u-popup__bottom--safe': safeArea }" :style="bottomStyle">
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
      <view class="u-popup__content" :class="`u-popup__content--${type}`" :style="contentStyle">
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

import { computed, onBeforeUnmount, onMounted, ref, useSlots, watch } from 'vue';

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
  /** 是否显示，支持 v-model */
  modelValue?: boolean;
  /** 弹出类型 */
  type?: PopupType;
  /** 是否开启动画 */
  animation?: boolean;
  /** 点击遮罩是否关闭 */
  maskClosable?: boolean;
  /** 遮罩背景色 */
  maskBackground?: string;
  /** 弹窗内容背景色 (对话框除外) */
  backgroundColor?: string;
  /** 底部弹窗是否适配底部安全区 */
  safeArea?: boolean;
  /** 标题 (底部弹窗和对话框) */
  title?: string;
  /** 是否显示关闭按钮 (底部弹窗) */
  showClose?: boolean;
  /** 底部弹窗顶部圆角 (rpx) */
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
  /** 对话框是否显示取消按钮 */
  showCancel?: boolean;
  /** 取消按钮文字 */
  cancelText?: string;
  /** 确认按钮文字 */
  confirmText?: string;
  /** 对话框确认前置钩子，返回 false 或 reject 时不关闭；输入模式传入输入值 */
  beforeConfirm?: (value?: string) => boolean | void | Promise<boolean | void>;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
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
  showCancel: true,
  cancelText: '取消',
  confirmText: '确定',
  beforeConfirm: undefined,
});

// ==================== Emits ====================

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
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

const slots = useSlots();
const popupRef = ref<UniPopupInstance | null>(null);
const visible = ref(false);
const confirming = ref(false);

// ==================== Computed ====================

const bottomStyle = computed(() => ({
  borderRadius: `${props.borderRadius}rpx ${props.borderRadius}rpx 0 0`,
  maxHeight: `${props.maxHeight}vh`,
  background: props.backgroundColor,
}));

const contentStyle = computed(() => ({
  background: props.backgroundColor,
}));

const dialogProps = computed(() => ({
  type: props.dialogType,
  mode: props.dialogMode,
  title: props.title,
  content: props.content,
  placeholder: props.placeholder,
  modelValue: props.dialogValue,
  beforeClose: true,
  showClose: props.showCancel,
  cancelText: props.cancelText,
  confirmText: props.confirmText,
  borderRadius: 'var(--radius-lg)',
}));

// ==================== Methods ====================

/** uni-popup 关闭动画时长 (ms)，期间调用 open 不生效 */
const CLOSE_ANIMATION_MS = 300;
let reopenTimer: ReturnType<typeof setTimeout> | undefined;

function clearReopen() {
  clearTimeout(reopenTimer);
  reopenTimer = undefined;
}

/** 打开弹窗，关闭动画进行中时等动画结束再打开 */
function open() {
  clearReopen();
  popupRef.value?.open();
  if (!visible.value) {
    reopenTimer = setTimeout(() => {
      reopenTimer = undefined;
      popupRef.value?.open();
    }, CLOSE_ANIMATION_MS + 20);
  }
}

/** 关闭弹窗 */
function close() {
  clearReopen();
  popupRef.value?.close();
}

function handleChange(e: { show: boolean }) {
  if (visible.value !== e.show) {
    visible.value = e.show;
    emit('update:modelValue', e.show);
  }
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
async function handleDialogConfirm(value?: unknown) {
  if (confirming.value) return;
  const result = value === undefined || value === null ? undefined : String(value);
  if (props.beforeConfirm) {
    confirming.value = true;
    try {
      if ((await props.beforeConfirm(result)) === false) return;
    } catch (error) {
      console.error('[UPopup] beforeConfirm 执行失败:', error);
      return;
    } finally {
      confirming.value = false;
    }
    if (!visible.value) return;
  }
  emit('confirm', result);
  close();
}

watch(
  () => props.modelValue,
  show => {
    if (show === visible.value) return;
    if (show) open();
    else close();
  },
);

onMounted(() => {
  if (props.modelValue) open();
});

onBeforeUnmount(clearReopen);

// ==================== Expose ====================

defineExpose({
  open,
  close,
});
</script>

<style scoped lang="scss">
.u-popup {
  z-index: var(--z-index-popup);

  &__bottom {
    display: flex;
    box-sizing: border-box;
    flex-direction: column;
    width: 100vw;
    overflow: hidden;
    background: var(--color-bg);

    &--safe {
      padding-bottom: var(--safe-area-inset-bottom);
    }
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
    box-sizing: border-box;
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

    &--left,
    &--right {
      height: 100%;
    }
  }
}

// 覆盖 uni-popup-dialog 样式
.u-popup__dialog :deep(.uni-popup-dialog) {
  overflow: hidden;
  background-color: var(--color-bg);
}

.u-popup__dialog :deep(.uni-dialog-title-text) {
  color: var(--color-text);
  font-size: var(--font-size-xl);
}

.u-popup__dialog :deep(.uni-popup__success) {
  color: var(--color-success);
}

.u-popup__dialog :deep(.uni-popup__warn) {
  color: var(--color-warning);
}

.u-popup__dialog :deep(.uni-popup__error) {
  color: var(--color-error);
}

.u-popup__dialog :deep(.uni-dialog-content),
.u-popup__dialog :deep(.uni-dialog-content-text) {
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
}

.u-popup__dialog :deep(.uni-dialog-input) {
  border-color: var(--color-border);
  background-color: var(--color-bg-input);
  color: var(--color-text);
}

.u-popup__dialog :deep(.uni-dialog-button-group) {
  border-top: var(--border-width-base) solid var(--color-border);
}

.u-popup__dialog :deep(.uni-border-left) {
  border-left-color: var(--color-border);
}

.u-popup__dialog :deep(.uni-dialog-button-text) {
  color: var(--color-text-secondary);
  font-size: var(--font-size-lg);
}

.u-popup__dialog :deep(.uni-button-color) {
  color: var(--color-primary);
}

.u-popup__dialog--confirming :deep(.uni-dialog-button:last-child) {
  opacity: var(--opacity-disabled);
  pointer-events: none;
}

.u-popup__dialog--confirming :deep(.uni-button-color::before) {
  content: '';
  display: inline-block;
  width: 28rpx;
  height: 28rpx;
  margin-right: var(--spacing-xs);
  animation: u-popup-spin 0.8s linear infinite;
  border: 3rpx solid currentcolor;
  border-radius: var(--radius-circle);
  border-top-color: transparent;
  vertical-align: -4rpx;
}

@keyframes u-popup-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
