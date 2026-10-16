<template>
  <!--
    USticky - 吸顶容器
    基于 position: sticky，只在父容器范围内吸顶，父元素不能设置 overflow: hidden
  -->
  <view class="u-sticky" :class="{ 'u-sticky--disabled': disabled }" :style="stickyStyle">
    <slot />
  </view>
</template>

<script setup lang="ts">
definePage({
  meta: {
    isComponent: true,
  },
});

import { computed } from 'vue';
import { useStatusBar } from '@/composables/useStatusBar';

defineOptions({
  name: 'USticky',
  options: {
    virtualHost: true,
  },
});

export interface UStickyProps {
  /** 吸顶距离，数字或纯数字字符串按 rpx 处理 */
  offsetTop?: number | string;
  /** 页面使用自定义导航栏（UNavBar）时，额外让出状态栏与导航栏高度 */
  customNavBar?: boolean;
  /** 层级 */
  zIndex?: number;
  /** 是否关闭吸顶 */
  disabled?: boolean;
}

const props = withDefaults(defineProps<UStickyProps>(), {
  offsetTop: 0,
  customNavBar: false,
  zIndex: undefined,
  disabled: false,
});

const { totalHeight } = useStatusBar();

const stickyStyle = computed(() => {
  if (props.disabled) return undefined;
  const offset = /^-?\d+(\.\d+)?$/.test(String(props.offsetTop)) ? `${props.offsetTop}rpx` : props.offsetTop;
  const navBar = props.customNavBar ? `${totalHeight.value}px` : '0px';
  return {
    // H5 原生导航栏高度通过 --window-top 提供
    top: `calc(var(--window-top, 0px) + ${navBar} + ${offset})`,
    ...(props.zIndex === undefined ? {} : { zIndex: props.zIndex }),
  };
});
</script>

<style scoped lang="scss">
.u-sticky {
  position: sticky;

  /* 低于 uni-popup 的 99，弹窗遮罩可覆盖 */
  z-index: 90;

  &--disabled {
    position: static;
  }
}
</style>
