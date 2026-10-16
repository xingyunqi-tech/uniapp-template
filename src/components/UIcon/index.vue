<template>
  <!--
    UIcon - 图标
    基于 uni-icons 封装，尺寸默认 rpx，颜色默认跟随父级文字
  -->
  <uni-icons :type="name" :size="iconSize" :color="color" @click="emit('click', $event)" />
</template>

<script setup lang="ts">
definePage({
  meta: {
    isComponent: true,
  },
});

import { computed } from 'vue';

defineOptions({
  name: 'UIcon',
});

export type IconName = UniIconsType;

export interface UIconProps {
  /** 图标名称 */
  name: IconName;
  /** 尺寸，数字按 rpx 处理，也可传带单位的字符串或 inherit */
  size?: number | string;
  /** 颜色，默认跟随父级文字颜色 */
  color?: string;
}

const props = withDefaults(defineProps<UIconProps>(), {
  size: 'inherit',
  color: 'inherit',
});

const emit = defineEmits<{
  click: [event: unknown];
}>();

const iconSize = computed(() => {
  const { size } = props;
  return typeof size === 'number' || /^\d+(\.\d+)?$/.test(size) ? `${size}rpx` : size;
});
</script>
