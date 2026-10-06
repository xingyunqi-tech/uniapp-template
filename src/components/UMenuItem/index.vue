<template>
  <!--
    UMenuItem - 菜单项组件
    自定义实现，不依赖 uni-list-item，确保小程序兼容性
  -->
  <view
    class="u-menu-item"
    :class="{
      'u-menu-item--disabled': disabled,
      'u-menu-item--danger': danger,
      'u-menu-item--border': border,
    }"
    :hover-class="disabled ? '' : 'u-menu-item--hover'"
    @click="handleClick"
  >
    <!-- 左侧图标 -->
    <view v-if="icon" class="u-menu-item__icon">
      <uni-icons :type="icon" :size="`${iconSize}rpx`" :color="iconColorValue" />
    </view>

    <!-- 内容区域 -->
    <view class="u-menu-item__content">
      <text class="u-menu-item__title">{{ title }}</text>
      <text v-if="label" class="u-menu-item__label">{{ label }}</text>
    </view>

    <!-- 右侧区域 -->
    <view class="u-menu-item__right">
      <text v-if="rightText" class="u-menu-item__right-text">{{ rightText }}</text>
      <text v-if="badge" class="u-menu-item__badge">{{ badge }}</text>
      <switch
        v-if="showSwitch"
        :checked="switchChecked"
        :disabled="disabled"
        class="u-menu-item__switch"
        @change="handleSwitchChange"
      />
      <uni-icons
        v-if="showArrow && !showSwitch"
        type="right"
        size="16"
        color="var(--color-text-placeholder)"
        class="u-menu-item__arrow"
      />
    </view>

    <!-- 微信客服按钮 (仅微信小程序) -->
    <!-- #ifdef MP-WEIXIN -->
    <button v-if="isContact" class="u-menu-item__contact-btn" open-type="contact" />
    <!-- #endif -->
  </view>
</template>

<script setup lang="ts">
definePage({
  meta: {
    isComponent: true,
  },
});

import { computed } from 'vue';

defineOptions({
  name: 'UMenuItem',
});

interface Props {
  /** 标题 */
  title: string;
  /** 标题下方描述 */
  label?: string;
  /** 右侧文字 */
  rightText?: string;
  /** 左侧图标 (uni-icons 的 type) */
  icon?: UniIconsType;
  /** 图标颜色 */
  iconColor?: string;
  /** 图标大小 (rpx) */
  iconSize?: number;
  /** 是否显示右侧箭头 */
  showArrow?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否显示下边框 */
  border?: boolean;
  /** 右侧角标文字 */
  badge?: string;
  /** 是否显示开关 */
  showSwitch?: boolean;
  /** 开关状态 */
  switchChecked?: boolean;
  /** 是否为危险操作 */
  danger?: boolean;
  /** 是否为微信客服按钮 */
  isContact?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  rightText: '',
  icon: undefined,
  iconColor: '',
  iconSize: 40,
  showArrow: true,
  disabled: false,
  border: true,
  badge: '',
  showSwitch: false,
  switchChecked: false,
  danger: false,
  isContact: false,
});

const emit = defineEmits<{
  click: [];
  switchChange: [checked: boolean];
}>();

// 图标颜色
const iconColorValue = computed(() =>
  props.danger ? 'var(--color-error)' : props.iconColor || 'var(--color-primary)',
);

// 处理点击
function handleClick() {
  if (props.disabled) return;
  emit('click');
}

// 处理开关变化
function handleSwitchChange(e: UniHelper.SwitchOnChangeEvent) {
  emit('switchChange', e.detail.value);
}
</script>

<style scoped lang="scss">
.u-menu-item {
  display: flex;
  position: relative;
  align-items: center;
  padding: 28rpx 32rpx;
  background: var(--color-bg-card);
  gap: 24rpx;

  &--border {
    &::after {
      content: '';
      position: absolute;
      right: 32rpx;
      bottom: 0;
      left: 88rpx;
      height: 1rpx;
      background: var(--color-border);
    }
  }

  &--hover {
    background: var(--color-bg-hover);
  }

  &--disabled {
    opacity: 0.5;
  }

  &--danger {
    .u-menu-item__title {
      color: var(--color-error);
    }

    .u-menu-item__icon {
      color: var(--color-error);
    }
  }

  &__icon {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 48rpx;
    height: 48rpx;
    font-size: 40rpx;
  }

  &__content {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
    gap: 4rpx;
  }

  &__title {
    overflow: hidden;
    color: var(--color-text);
    font-size: 30rpx;
    line-height: 1.4;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__label {
    overflow: hidden;
    color: var(--color-text-secondary);
    font-size: 24rpx;
    line-height: 1.4;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__right {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: 12rpx;
  }

  &__right-text {
    color: var(--color-text-secondary);
    font-size: 28rpx;
  }

  &__badge {
    padding: 4rpx 12rpx;
    border-radius: 20rpx;
    background: var(--color-error);
    color: var(--color-text-inverse);
    font-size: 22rpx;
  }

  &__arrow {
    flex-shrink: 0;
  }

  &__switch {
    transform: scale(0.8);
  }

  &__contact-btn {
    position: absolute;
    z-index: 1;
    inset: 0;
    opacity: 0;
  }
}
</style>
