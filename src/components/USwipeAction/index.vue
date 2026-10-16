<template>
  <!-- USwipeAction - 左滑操作单元，内置 uni-swipe-action 容器，同一页面同一时间只展开一个 -->
  <view class="u-swipe-action">
    <uni-swipe-action ref="groupRef">
      <uni-swipe-action-item :right-options="buttons" :disabled="disabled" @click="handleClick" @change="handleChange">
        <view class="u-swipe-action__content">
          <slot />
        </view>
      </uni-swipe-action-item>
    </uni-swipe-action>
  </view>
</template>

<script setup lang="ts">
definePage({
  meta: {
    isComponent: true,
  },
});

import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { getTopPage } from '@/composables/useDialog';
import { markClosed, markOpened } from './shared';

defineOptions({
  name: 'USwipeAction',
  options: {
    virtualHost: true,
    styleIsolation: 'shared',
  },
});

export type SwipeActionType = 'danger' | 'primary' | 'default';

export interface SwipeActionOption {
  text: string;
  type?: SwipeActionType;
  style?: {
    backgroundColor?: string;
    color?: string;
    fontSize?: string;
  };
}

export interface USwipeActionProps {
  /** 右侧按钮 */
  options?: SwipeActionOption[];
  /** 是否禁止滑动 */
  disabled?: boolean;
  /** 点击按钮后是否自动收起 */
  autoClose?: boolean;
}

const props = withDefaults(defineProps<USwipeActionProps>(), {
  options: () => [],
  disabled: false,
  autoClose: true,
});

const emit = defineEmits<{
  click: [payload: { index: number; option: SwipeActionOption }];
  open: [];
  close: [];
}>();

interface UniSwipeActionInstance {
  closeAll: () => void;
}

const BUTTON_BACKGROUND: Record<SwipeActionType, string> = {
  danger: 'var(--color-error)',
  primary: 'var(--color-primary)',
  default: 'var(--color-info)',
};

const groupRef = ref<UniSwipeActionInstance | null>(null);

/** 组件所在页面实例 */
let ownerPage: object | undefined;

onMounted(() => {
  ownerPage = getTopPage();
});

const buttons = computed(() =>
  props.options.map(option => ({
    text: option.text,
    style: {
      backgroundColor: BUTTON_BACKGROUND[option.type ?? 'default'],
      color: 'var(--color-text-inverse)',
      fontSize: 'var(--font-size-base)',
      ...option.style,
    },
  })),
);

/** 收起按钮 */
function close() {
  groupRef.value?.closeAll();
}

function handleClick(event: { index: number }) {
  const option = props.options[event.index];
  if (!option) return;
  emit('click', { index: event.index, option });
  if (props.autoClose) close();
}

function handleChange(position: 'left' | 'right' | 'none') {
  if (position === 'none') {
    markClosed(ownerPage, close);
    emit('close');
  } else {
    markOpened(ownerPage, close);
    emit('open');
  }
}

onBeforeUnmount(() => markClosed(ownerPage, close));

defineExpose({
  close,
});
</script>

<style scoped lang="scss">
.u-swipe-action {
  &__content {
    box-sizing: border-box;
    flex-shrink: 0;
    width: 100%;
    background: var(--color-bg);
    color: var(--color-text);
  }

  :deep(.uni-swipe_button) {
    padding: 0 var(--spacing-lg);
  }
}
</style>
