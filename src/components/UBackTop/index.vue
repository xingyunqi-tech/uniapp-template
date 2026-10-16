<template>
  <!--
    UBackTop - 回到顶部
    页面在 onPageScroll 中把 scrollTop 传入；scroll-view 场景设置 page-scroll 为 false，并在 click 中重置 scroll-top
  -->
  <view v-if="visible" class="u-back-top" :style="backTopStyle" hover-class="u-back-top--hover" @click="handleClick">
    <slot>
      <uni-icons type="top" size="40rpx" color="var(--color-text-secondary)" />
    </slot>
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
  name: 'UBackTop',
});

export interface UBackTopProps {
  /** 当前滚动距离 (px) */
  scrollTop: number;
  /** 滚动超过该距离时显示 (px) */
  threshold?: number;
  /** 点击时是否调用 uni.pageScrollTo 滚动页面 */
  pageScroll?: boolean;
  /** 滚动动画时长 (ms) */
  duration?: number;
  /** 距右侧距离 (rpx) */
  right?: number;
  /** 距底部距离 (rpx)，会叠加 H5 的 tabBar 高度与底部安全区 */
  bottom?: number;
}

const props = withDefaults(defineProps<UBackTopProps>(), {
  threshold: 400,
  pageScroll: true,
  duration: 300,
  right: 32,
  bottom: 160,
});

const emit = defineEmits<{
  click: [];
}>();

const visible = computed(() => props.scrollTop > props.threshold);

const backTopStyle = computed(() => ({
  right: `${props.right}rpx`,
  bottom: `calc(${props.bottom}rpx + var(--window-bottom, 0px) + var(--safe-area-inset-bottom))`,
}));

function handleClick() {
  if (props.pageScroll) {
    uni.pageScrollTo({ scrollTop: 0, duration: props.duration });
  }
  emit('click');
}
</script>

<style scoped lang="scss">
.u-back-top {
  display: flex;
  position: fixed;

  /* 低于 uni-popup 的 99，弹窗遮罩可覆盖 */
  z-index: 90;
  align-items: center;
  justify-content: center;
  width: 80rpx;
  height: 80rpx;
  border-radius: var(--radius-circle);
  background: var(--color-bg-card);
  box-shadow: var(--shadow-base);

  &--hover {
    opacity: var(--opacity-hover);
  }
}
</style>
