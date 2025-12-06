<route lang="json5">
{
  meta: {
    isComponent: true,
  },
}
</route>

<template>
  <!--
    UMenuItem - 基于 uni-list-item 的菜单项组件
    封装常用功能，简化 API，保持项目风格一致性
  -->
  <uni-list-item
    :title="title"
    :note="label"
    :right-text="rightText"
    :show-arrow="showArrow || !!to"
    :clickable="clickable || !!to"
    :disabled="disabled"
    :show-extra-icon="isUniIcon"
    :extra-icon="extraIconConfig"
    :show-badge="!!badge"
    :badge-text="badge"
    :badge-type="badgeType"
    :show-switch="showSwitch"
    :switch-checked="switchChecked"
    :thumb="thumb"
    :thumb-size="thumbSize"
    :link="linkType"
    :to="to"
    :border="border"
    :custom-style="customStyle"
    :class="{ 'u-menu-item--danger': danger }"
    @click="handleClick"
    @switch-change="handleSwitchChange"
  >
    <!-- 自定义左侧图标 (UnoCSS 图标或自定义 slot) -->
    <template v-if="$slots.icon || isCustomIcon" #header>
      <view class="u-menu-item__icon-slot">
        <slot name="icon">
          <text v-if="isCustomIcon" :class="[icon, 'u-menu-item__custom-icon']" :style="customIconStyle" />
        </slot>
      </view>
    </template>

    <!-- 自定义内容 -->
    <template v-if="$slots.default" #body>
      <slot />
    </template>

    <!-- 自定义右侧内容 -->
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </uni-list-item>
</template>

<script setup lang="ts">
import { computed } from 'vue';

defineOptions({
  name: 'UMenuItem',
});

// ==================== Props ====================

interface Props {
  /** 标题 */
  title: string;
  /** 标题下方描述 */
  label?: string;
  /** 右侧文字 */
  rightText?: string;
  /** 左侧图标 (uni-icons 类型或 UnoCSS 图标类名，如 i-carbon-*) */
  icon?: string;
  /** 图标颜色 */
  iconColor?: string;
  /** 图标大小 */
  iconSize?: number;
  /** 左侧缩略图 */
  thumb?: string;
  /** 缩略图大小 */
  thumbSize?: 'sm' | 'base' | 'lg';
  /** 是否显示右侧箭头 */
  showArrow?: boolean;
  /** 是否可点击 */
  clickable?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否显示下边框 */
  border?: boolean;
  /** 跳转链接 */
  to?: string;
  /** 跳转方式 */
  linkType?: 'navigateTo' | 'redirectTo' | 'reLaunch' | 'switchTab';
  /** 右侧角标文字 */
  badge?: string;
  /** 角标类型 */
  badgeType?: UniHelper.UniBadgeType;
  /** 是否显示开关 */
  showSwitch?: boolean;
  /** 开关状态 */
  switchChecked?: boolean;
  /** 是否为危险操作 */
  danger?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  rightText: '',
  icon: undefined,
  iconColor: '',
  iconSize: 24,
  thumb: '',
  thumbSize: 'base',
  showArrow: false,
  clickable: false,
  disabled: false,
  border: true,
  to: '',
  linkType: 'navigateTo',
  badge: '',
  badgeType: 'error',
  showSwitch: false,
  switchChecked: false,
  danger: false,
});

/** uni-list-item 点击事件数据 */
interface ListItemClickData {
  data: Record<string, unknown>;
}

const emit = defineEmits<{
  click: [event: ListItemClickData];
  switchChange: [checked: boolean];
}>();

/** 是否是自定义图标 (UnoCSS 图标类名，如 i-carbon-*) */
const isCustomIcon = computed(() => props.icon?.startsWith('i-') || false);

/** 是否是 uni-icons 图标 */
const isUniIcon = computed(() => !!props.icon && !isCustomIcon.value);

// uni-icons 图标配置
const extraIconConfig = computed(() => ({
  type: props.icon as UniHelper.UniIconsType,
  color: props.danger ? 'var(--color-error)' : props.iconColor || 'var(--color-primary)',
  size: props.iconSize,
}));

// 自定义图标样式
const customIconStyle = computed(() => ({
  color: props.danger ? 'var(--color-error)' : props.iconColor || 'var(--color-primary)',
  fontSize: `${props.iconSize}px`,
}));

// 自定义样式
const customStyle = computed(() => ({
  backgroundColor: 'var(--color-bg)',
}));

// 处理点击
function handleClick(e: ListItemClickData) {
  emit('click', e);
}

// 处理开关变化
function handleSwitchChange(e: { value: boolean }) {
  emit('switchChange', e.value);
}
</script>

<style scoped lang="scss">
.u-menu-item__icon-slot {
  display: flex;
  align-items: center;
  margin-right: 24rpx;
}

.u-menu-item__custom-icon {
  display: block;
}

// 危险操作样式覆盖
.u-menu-item--danger {
  :deep(.uni-list-item__content-title) {
    color: var(--color-error);
  }
}
</style>
