import { ref } from 'vue';

/** 自定义导航栏布局 (px) */
export interface NavBarLayout {
  /** 窗口宽度 */
  windowWidth: number;
  /** 状态栏高度 */
  statusBarHeight: number;
  /** 导航栏内容区高度 */
  navBarHeight: number;
  /** 微信胶囊按钮位置，其他平台为 undefined */
  menuButton?: UniApp.GetMenuButtonBoundingClientRectRes;
}

/**
 * 获取自定义导航栏布局，UNavBar 与 useStatusBar 共用
 */
export function getNavBarLayout(): NavBarLayout {
  const windowInfo = uni.getWindowInfo();
  const layout: NavBarLayout = {
    windowWidth: windowInfo.windowWidth,
    statusBarHeight: windowInfo.statusBarHeight ?? 20,
    navBarHeight: 44,
  };

  // #ifdef MP-ALIPAY
  // 支付宝小程序：原生导航栏透明时自己处理状态栏占位，否则页面已从导航栏下方开始
  const { transparentTitle } = uni.getSystemInfoSync() as { transparentTitle?: boolean };
  layout.statusBarHeight = transparentTitle ? windowInfo.safeArea?.top || windowInfo.statusBarHeight || 25 : 0;
  layout.navBarHeight = 48;
  // #endif

  // #ifdef MP-WEIXIN
  const menuButton = uni.getMenuButtonBoundingClientRect?.();
  if (menuButton?.height) {
    // 导航栏高度 = (胶囊顶部到状态栏底部的距离) * 2 + 胶囊高度
    layout.navBarHeight = (menuButton.top - layout.statusBarHeight) * 2 + menuButton.height;
    layout.menuButton = menuButton;
  }
  // #endif

  return layout;
}

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
  const layout = getNavBarLayout();

  return {
    /** 状态栏高度 (px) */
    statusBarHeight: ref(layout.statusBarHeight),
    /** 导航栏内容区高度 (px) */
    navBarHeight: ref(layout.navBarHeight),
    /** 总高度 = 状态栏 + 导航栏 (px) */
    totalHeight: ref(layout.statusBarHeight + layout.navBarHeight),
  };
}
