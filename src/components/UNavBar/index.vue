<route lang="json5">
{
  meta: {
    isComponent: true,
  },
}
</route>

<template>
  <!--
    UNavBar - 自定义导航栏组件
    用于 navigationStyle: custom 的页面
    支持自定义标题、左右按钮、背景透明等
  -->
  <view class="u-nav-bar" :class="[navBarClasses, globalStore.themeClass]" :style="navBarStyle">
    <!-- 状态栏占位 -->
    <view class="u-nav-bar__status" :style="{ height: statusBarHeight }" />

    <!-- 导航栏内容 -->
    <view class="u-nav-bar__content" :style="{ height: navBarHeight }">
      <!-- 左侧区域 -->
      <view class="u-nav-bar__left" @click="handleLeftClick">
        <slot name="left">
          <view v-if="showBack" class="u-nav-bar__back">
            <uni-icons type="left" size="22" :color="backIconColor" class="u-nav-bar__back-icon" />
            <text v-if="backText" class="u-nav-bar__back-text">{{ backText }}</text>
          </view>
        </slot>
      </view>

      <!-- 标题区域 -->
      <view class="u-nav-bar__title">
        <slot name="title">
          <text class="u-nav-bar__title-text">{{ title }}</text>
        </slot>
      </view>

      <!-- 右侧区域 -->
      <view class="u-nav-bar__right" @click="handleRightClick">
        <slot name="right" />
      </view>
    </view>
  </view>

  <!-- 占位元素，防止内容被导航栏遮挡 -->
  <view v-if="placeholder" class="u-nav-bar__placeholder" :style="placeholderStyle" />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useGlobalStore } from '@/store/modules/global';

defineOptions({
  name: 'UNavBar',
});

const globalStore = useGlobalStore();

// ==================== Props ====================

interface Props {
  /** 导航栏标题 */
  title?: string;
  /** 是否显示返回按钮 */
  showBack?: boolean;
  /** 返回按钮文字 */
  backText?: string;
  /** 是否固定在顶部 */
  fixed?: boolean;
  /** 是否显示占位元素 */
  placeholder?: boolean;
  /** 是否透明背景 */
  transparent?: boolean;
  /** 自定义背景色 */
  backgroundColor?: string;
  /** 文字颜色: light 白色 | dark 黑色 */
  textColor?: 'light' | 'dark';
  /** 是否显示底部边框 */
  border?: boolean;
  /** 自定义返回事件 (默认调用 uni.navigateBack) */
  customBack?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  showBack: true,
  backText: '',
  fixed: true,
  placeholder: true,
  transparent: false,
  backgroundColor: '',
  textColor: 'dark',
  border: true,
  customBack: false,
});

// ==================== Emits ====================

const emit = defineEmits<{
  back: [];
  clickLeft: [];
  clickRight: [];
}>();

// ==================== State ====================

const statusBarHeight = ref('0px');
const navBarHeight = ref('44px');

// ==================== Computed ====================

const navBarClasses = computed(() => ({
  'u-nav-bar--fixed': props.fixed,
  'u-nav-bar--transparent': props.transparent,
  'u-nav-bar--light': props.textColor === 'light',
  'u-nav-bar--border': props.border && !props.transparent,
}));

const navBarStyle = computed(() => {
  const style: Record<string, string> = {};
  if (props.backgroundColor && !props.transparent) {
    style.backgroundColor = props.backgroundColor;
  }
  return style;
});

const placeholderStyle = computed(() => ({
  height: `calc(${statusBarHeight.value} + ${navBarHeight.value})`,
}));

// 返回按钮图标颜色 - 使用 CSS 变量，自动适配主题
const backIconColor = computed(() => {
  // textColor === 'light' 时 (透明背景、深色背景场景)，使用反色文字
  if (props.textColor === 'light') {
    return 'var(--color-text-inverse)';
  }
  // 默认使用正常文字颜色 (自动适配深色/浅色主题)
  return 'var(--color-text)';
});

// ==================== Lifecycle ====================

onMounted(() => {
  const windowInfo = uni.getWindowInfo();
  statusBarHeight.value = `${windowInfo.statusBarHeight || 20}px`;

  // #ifdef MP-WEIXIN
  // 微信小程序获取胶囊按钮位置
  const menuButtonInfo = uni.getMenuButtonBoundingClientRect?.();
  if (menuButtonInfo) {
    // 导航栏高度 = 胶囊按钮高度 + 上下边距
    const navHeight = (menuButtonInfo.top - (windowInfo.statusBarHeight || 0)) * 2 + menuButtonInfo.height;
    navBarHeight.value = `${navHeight}px`;
  }
  // #endif

  // #ifdef MP-ALIPAY
  // 支付宝小程序：固定导航栏高度为 48px（支付宝标准高度）
  // 支付宝小程序没有胶囊按钮，但状态栏高度可能不同
  navBarHeight.value = '48px';
  // #endif
});

// ==================== Methods ====================

function handleLeftClick() {
  emit('clickLeft');
  if (props.showBack) {
    if (props.customBack) {
      emit('back');
    } else {
      uni.navigateBack({
        fail: () => {
          // 返回失败时跳转首页
          uni.switchTab({ url: '/pages/index/index' });
        },
      });
    }
  }
}

function handleRightClick() {
  emit('clickRight');
}
</script>

<style scoped lang="scss">
.u-nav-bar {
  background-color: var(--color-bg);

  &--fixed {
    position: fixed;
    z-index: 999;
    top: 0;
    right: 0;
    left: 0;
  }

  &--transparent {
    background-color: transparent;
  }

  &--border {
    border-bottom: var(--border-width-base) solid var(--color-border);
  }

  &--light {
    .u-nav-bar__back-icon,
    .u-nav-bar__back-text,
    .u-nav-bar__title-text {
      color: var(--color-text-inverse);
    }
  }

  &__status {
    width: 100%;
  }

  &__content {
    display: flex;
    position: relative;
    align-items: center;
    justify-content: center;
    padding: 0 var(--spacing-sm);
  }

  &__left,
  &__right {
    display: flex;
    position: absolute;
    z-index: 1;
    top: 50%;
    align-items: center;
    min-width: 80rpx;
    height: 100%;
    transform: translateY(-50%);
  }

  &__left {
    left: var(--spacing-sm);
  }

  &__right {
    right: var(--spacing-sm);
    justify-content: flex-end;
  }

  &__back {
    display: flex;
    align-items: center;
    padding: var(--spacing-xs);
    cursor: pointer;

    &:active {
      opacity: var(--opacity-hover);
    }
  }

  &__back-icon {
    display: flex;
    align-items: center;
  }

  &__back-text {
    margin-left: var(--spacing-xs);
    color: var(--color-text);
    font-size: var(--font-size-base);
  }

  &__title {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    max-width: 60%;
  }

  &__title-text {
    overflow: hidden;
    color: var(--color-text);
    font-size: var(--font-size-xl);
    font-weight: 500;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__placeholder {
    width: 100%;
  }
}
</style>
