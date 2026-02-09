<template>
  <!--
    UBanner - 轮播横幅组件
    封装 swiper，提供简化 API 和统一样式
  -->
  <swiper
    class="u-banner"
    :style="bannerStyle"
    :indicator-dots="indicatorDots"
    :autoplay="autoplay"
    :interval="interval"
    :duration="duration"
    :circular="circular"
    :indicator-color="indicatorColor"
    :indicator-active-color="indicatorActiveColor"
    :current="current"
    @change="handleChange"
  >
    <swiper-item v-for="(item, index) in list" :key="item[keyField] ?? index" @click="handleClick(item, index)">
      <view class="u-banner__item">
        <image class="u-banner__image" :src="item[imageField] ?? ''" :mode="imageMode" />
        <!-- 自定义内容插槽 -->
        <slot name="content" :item="item" :index="index" />
      </view>
    </swiper-item>
  </swiper>
</template>

<script setup lang="ts">
definePage({
  meta: {
    isComponent: true,
  },
});

import { computed, ref, watch } from 'vue';

defineOptions({
  name: 'UBanner',
});

export interface Props {
  /** Banner 数据列表 */
  list: Record<string, any>[];
  /** 图片字段名 */
  imageField?: string;
  /** 唯一标识字段名 */
  keyField?: string;
  /** Banner 高度 */
  height?: string | number;
  /** 图片裁剪模式 */
  imageMode?: 'scaleToFill' | 'aspectFit' | 'aspectFill' | 'widthFix' | 'heightFix';
  /** 是否显示指示点 */
  indicatorDots?: boolean;
  /** 指示点颜色 */
  indicatorColor?: string;
  /** 当前选中指示点颜色 */
  indicatorActiveColor?: string;
  /** 是否自动播放 */
  autoplay?: boolean;
  /** 自动切换间隔时间 (ms) */
  interval?: number;
  /** 滑动动画时长 (ms) */
  duration?: number;
  /** 是否循环播放 */
  circular?: boolean;
  /** 当前显示索引 */
  modelValue?: number;
}

const props = withDefaults(defineProps<Props>(), {
  imageField: 'image',
  keyField: 'id',
  height: 300,
  imageMode: 'aspectFill',
  indicatorDots: true,
  indicatorColor: 'rgba(255, 255, 255, 0.5)',
  indicatorActiveColor: '#fff',
  autoplay: true,
  interval: 3000,
  duration: 500,
  circular: true,
  modelValue: 0,
});

const emit = defineEmits<{
  'update:modelValue': [index: number];
  click: [item: Record<string, any>, index: number];
  change: [index: number];
}>();

// 当前索引
const current = ref(props.modelValue);

// 监听外部值变化
watch(
  () => props.modelValue,
  val => {
    current.value = val;
  },
  { immediate: true },
);

// 计算样式
const bannerStyle = computed(() => {
  const height = typeof props.height === 'number' ? `${props.height}rpx` : props.height;
  return { height };
});

/** swiper change 事件类型 */
interface SwiperChangeEvent {
  detail: {
    current: number;
    source: string;
  };
}

// 切换事件
function handleChange(e: SwiperChangeEvent) {
  const index = e.detail.current;
  current.value = index;
  emit('update:modelValue', index);
  emit('change', index);
}

// 点击事件
function handleClick(item: Record<string, any>, index: number) {
  emit('click', item, index);
}
</script>

<style scoped lang="scss">
.u-banner {
  width: 100%;

  &__item {
    position: relative;
    width: 100%;
    height: 100%;
  }

  &__image {
    width: 100%;
    height: 100%;
  }
}
</style>
