<template>
  <!--
    UFixedButton - 固定底部按钮组件
    用于表单提交、确认操作等场景
  -->
  <view class="u-fixed-button">
    <view v-if="placeholder" class="u-fixed-button__placeholder" :style="placeholderStyle" />
    <view class="u-fixed-button__bar">
      <slot>
        <UButton
          :type="type"
          block
          :text="loading ? loadingText : text"
          :loading="loading"
          :disabled="disabled"
          @click="handleClick"
        />
      </slot>
    </view>
  </view>
</template>

<script setup lang="ts">
definePage({
  meta: {
    isComponent: true,
  },
});

import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onMounted, onUpdated, ref } from 'vue';

defineOptions({
  name: 'UFixedButton',
});

const props = withDefaults(
  defineProps<{
    /** 按钮文字 */
    text?: string;
    /** 加载中文字 */
    loadingText?: string;
    /** 是否加载中 */
    loading?: boolean;
    /** 是否禁用 */
    disabled?: boolean;
    /** 按钮类型 */
    type?: 'primary' | 'danger' | 'default';
    /** 是否在原位置生成等高占位，避免遮挡页面底部内容 */
    placeholder?: boolean;
  }>(),
  {
    text: '确定',
    loadingText: '提交中...',
    loading: false,
    disabled: false,
    type: 'primary',
    placeholder: true,
  },
);

const emit = defineEmits<{
  click: [];
}>();

const instance = getCurrentInstance();
const barHeight = ref(0);

const placeholderStyle = computed(() => (barHeight.value > 0 ? { height: `${barHeight.value}px` } : {}));

/** 未取到高度时的重试次数与间隔 (ms) */
const MEASURE_RETRIES = 3;
const MEASURE_RETRY_DELAY = 100;
let retryTimer: ReturnType<typeof setTimeout> | undefined;

function measureBar(retries = MEASURE_RETRIES) {
  if (!props.placeholder) return;
  uni
    .createSelectorQuery()
    .in(instance?.proxy)
    .select('.u-fixed-button__bar')
    .boundingClientRect(rect => {
      const height = (rect as UniApp.NodeInfo | null)?.height;
      if (height) {
        if (height !== barHeight.value) barHeight.value = height;
      } else if (retries > 0) {
        retryTimer = setTimeout(() => measureBar(retries - 1), MEASURE_RETRY_DELAY);
      }
    })
    .exec();
}

onMounted(() => nextTick(() => measureBar()));
onUpdated(() => nextTick(() => measureBar(0)));
onBeforeUnmount(() => clearTimeout(retryTimer));

function handleClick() {
  if (props.disabled || props.loading) return;
  emit('click');
}
</script>

<style scoped lang="scss">
.u-fixed-button {
  &__placeholder {
    height: calc(96rpx + var(--spacing-base) * 2 + var(--safe-area-inset-bottom));
  }

  &__bar {
    position: fixed;
    z-index: var(--z-index-fixed);
    right: 0;
    bottom: 0;
    left: 0;
    padding: var(--spacing-base);
    padding-bottom: calc(var(--spacing-base) + var(--safe-area-inset-bottom));
    background: var(--color-bg);
    box-shadow: var(--shadow-light);
  }
}
</style>
