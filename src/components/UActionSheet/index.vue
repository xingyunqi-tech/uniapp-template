<template>
  <!--
    UActionSheet - 操作菜单组件
    基于 UPopup 封装，从底部弹出的操作选项列表
    支持分组、危险操作、禁用状态等
  -->
  <UPopup
    ref="popupRef"
    type="bottom"
    :mask-closable="maskClosable"
    :show-close="false"
    :border-radius="24"
    :body-padding="false"
    class="u-action-sheet"
    @change="handleChange"
    @mask-click="handleMaskClick"
  >
    <view class="u-action-sheet__content">
      <!-- 标题 -->
      <view v-if="title || description" class="u-action-sheet__header">
        <text v-if="title" class="u-action-sheet__title">{{ title }}</text>
        <text v-if="description" class="u-action-sheet__description">{{ description }}</text>
      </view>

      <!-- 操作项列表 -->
      <view class="u-action-sheet__actions">
        <view
          v-for="(action, index) in actions"
          :key="action.value ?? index"
          class="u-action-sheet__item"
          :class="getItemClasses(action)"
          @click="handleSelect(action, index)"
        >
          <view v-if="action.icon" class="u-action-sheet__icon">
            <uni-icons :type="action.icon" color="inherit" size="inherit" />
          </view>
          <text class="u-action-sheet__text">{{ action.label }}</text>
          <text v-if="action.subLabel" class="u-action-sheet__sub-text">{{ action.subLabel }}</text>
        </view>
      </view>

      <!-- 取消按钮 -->
      <view v-if="showCancel" class="u-action-sheet__cancel" @click="handleCancel">
        <text class="u-action-sheet__cancel-text">{{ cancelText }}</text>
      </view>
    </view>
  </UPopup>
</template>

<script setup lang="ts">
definePage({
  meta: {
    isComponent: true,
  },
});

import { ref } from 'vue';
import UPopup from '../UPopup/index.vue';

defineOptions({
  name: 'UActionSheet',
});

// ==================== Types ====================

export interface ActionItem {
  /** 显示文本 */
  label: string;
  /** 选项值 */
  value?: string | number;
  /** 副文本 */
  subLabel?: string;
  /** 左侧图标 (uni-icons 的 type) */
  icon?: UniIconsType;
  /** 是否为危险操作 */
  danger?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
}

// ==================== Props ====================

interface Props {
  /** 操作项列表 */
  actions: ActionItem[];
  /** 标题 */
  title?: string;
  /** 描述文字 */
  description?: string;
  /** 是否显示取消按钮 */
  showCancel?: boolean;
  /** 取消按钮文字 */
  cancelText?: string;
  /** 点击遮罩是否关闭 */
  maskClosable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  description: '',
  showCancel: true,
  cancelText: '取消',
  maskClosable: true,
});

// ==================== Emits ====================

const emit = defineEmits<{
  select: [action: ActionItem, index: number];
  cancel: [];
  change: [{ show: boolean }];
}>();

// ==================== Refs ====================

/** UPopup 组件实例类型 */
interface UPopupInstance {
  open: () => void;
  close: () => void;
}

const popupRef = ref<UPopupInstance | null>(null);

// ==================== Methods ====================

/** 获取选项样式类 */
function getItemClasses(action: ActionItem) {
  return {
    'u-action-sheet__item--danger': action.danger,
    'u-action-sheet__item--disabled': action.disabled,
  };
}

/** 处理选择 */
function handleSelect(action: ActionItem, index: number) {
  if (action.disabled) return;
  emit('select', action, index);
  close();
}

/** 处理取消 */
function handleCancel() {
  emit('cancel');
  close();
}

/** 点击遮罩关闭视为取消 */
function handleMaskClick() {
  if (props.maskClosable) emit('cancel');
}

/** 处理弹窗状态变化 */
function handleChange(e: { show: boolean }) {
  emit('change', e);
}

/** 打开操作菜单 */
function open() {
  popupRef.value?.open();
}

/** 关闭操作菜单 */
function close() {
  popupRef.value?.close();
}

// ==================== Expose ====================

defineExpose({
  open,
  close,
});
</script>

<style scoped lang="scss">
.u-action-sheet {
  &__header {
    padding: var(--spacing-lg) var(--spacing-lg) var(--spacing-sm);
    text-align: center;
  }

  &__title {
    display: block;
    color: var(--color-text);
    font-size: var(--font-size-lg);
    font-weight: 500;
  }

  &__description {
    display: block;
    margin-top: var(--spacing-xs);
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }

  &__actions {
    padding: var(--spacing-xs) 0;
  }

  &__item {
    display: flex;
    gap: var(--spacing-sm);
    align-items: center;
    justify-content: center;
    height: 112rpx;
    transition: background-color var(--duration-fast);
    cursor: pointer;

    &:active {
      background: var(--color-bg-grey);
    }

    &--danger {
      .u-action-sheet__text,
      .u-action-sheet__icon {
        color: var(--color-error);
      }
    }

    &--disabled {
      opacity: var(--opacity-disabled);
      cursor: not-allowed;

      &:active {
        background: transparent;
      }
    }
  }

  &__icon {
    color: var(--color-text);
    font-size: var(--font-size-xl);
  }

  &__text {
    color: var(--color-text);
    font-size: var(--font-size-lg);
  }

  &__sub-text {
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }

  &__cancel {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 112rpx;
    margin-top: var(--spacing-sm);
    border-top: var(--spacing-sm) solid var(--color-bg-grey);
    cursor: pointer;

    &:active {
      background: var(--color-bg-grey);
    }
  }

  &__cancel-text {
    color: var(--color-text);
    font-size: var(--font-size-lg);
  }
}
</style>
