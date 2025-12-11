import { ref } from 'vue';

/**
 * 状态栏高度 composable
 * 用于自定义导航栏页面获取状态栏和导航栏高度
 *
 * @example
 * ```vue
 * <template>
 *   <view :style="{ paddingTop: statusBarHeight + 20 + 'px' }">
 *     <!-- 内容 -->
 *   </view>
 * </template>
 *
 * <script setup lang="ts">
 * import { useStatusBar } from '@/composables';
 *
 * const { statusBarHeight, navBarHeight, totalHeight } = useStatusBar();
 * </script>
 * ```
 */
export function useStatusBar() {
  /** 状态栏高度 (px) */
  const statusBarHeight = ref(0);

  /** 导航栏内容区高度 (px) */
  const navBarHeight = ref(44);

  /** 总高度 = 状态栏 + 导航栏 (px) */
  const totalHeight = ref(44);

  // 获取系统信息
  const systemInfo = uni.getSystemInfoSync();
  statusBarHeight.value = systemInfo.statusBarHeight || 20;

  // #ifdef MP-WEIXIN
  // 微信小程序：根据胶囊按钮计算导航栏高度
  const menuButton = uni.getMenuButtonBoundingClientRect?.();
  if (menuButton) {
    // 导航栏高度 = (胶囊顶部到状态栏底部的距离) * 2 + 胶囊高度
    navBarHeight.value = (menuButton.top - statusBarHeight.value) * 2 + menuButton.height;
  }
  // #endif

  totalHeight.value = statusBarHeight.value + navBarHeight.value;

  return {
    /** 状态栏高度 (px) */
    statusBarHeight,
    /** 导航栏内容区高度 (px) */
    navBarHeight,
    /** 总高度 = 状态栏 + 导航栏 (px) */
    totalHeight,
  };
}
