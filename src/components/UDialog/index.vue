<template>
  <!--
    UDialog - 页面级对话框承载组件
    放在页面模板中，接收本页面 useDialog() 的调用；默认插槽替代 content 文本
  -->
  <view class="u-dialog">
    <template v-if="current">
      <UPopup v-if="useSlot" v-bind="popupProps" @confirm="handleConfirm" @close="handleClose">
        <slot />
      </UPopup>
      <UPopup v-else v-bind="popupProps" @confirm="handleConfirm" @close="handleClose" />
    </template>
  </view>
</template>

<script setup lang="ts">
definePage({
  meta: {
    isComponent: true,
  },
});

import { computed, nextTick, onBeforeUnmount, onMounted, shallowRef, useSlots } from 'vue';
import { getTopPage, registerDialogHost, type DialogRequest } from '@/composables/useDialog';

defineOptions({
  name: 'UDialog',
  options: {
    styleIsolation: 'shared',
  },
});

export interface UDialogProps {
  /** 名称，与 useDialog(name) 对应，同一页面放多个 UDialog 时区分 */
  name?: string;
}

const props = withDefaults(defineProps<UDialogProps>(), {
  name: '',
});

/** 与 UPopup 关闭动画时长一致，关闭后再弹出队列中的下一个 */
const NEXT_DELAY_MS = 300;

const slots = useSlots();
const current = shallowRef<DialogRequest | null>(null);
const queue: DialogRequest[] = [];
let settled = false;
let nextTimer: ReturnType<typeof setTimeout> | undefined;
let switching = false;
let unmounted = false;
let unregister: (() => void) | undefined;

const useSlot = computed(() => !!slots.default && current.value?.mode !== 'prompt');

const popupProps = computed(() => {
  const request = current.value;
  return {
    modelValue: true,
    type: 'dialog' as const,
    title: request?.title,
    content: request?.content,
    dialogType: request?.type,
    dialogMode: request?.mode === 'prompt' ? ('input' as const) : ('base' as const),
    placeholder: request?.placeholder,
    dialogValue: request?.defaultValue,
    showCancel: request?.mode !== 'alert',
    confirmText: request?.confirmText,
    cancelText: request?.cancelText,
    beforeConfirm: request?.beforeConfirm,
  };
});

function show(request: DialogRequest) {
  settled = false;
  current.value = request;
}

function enqueue(request: DialogRequest) {
  if (current.value || switching) {
    queue.push(request);
    return;
  }
  show(request);
}

function settle(confirmed: boolean, value?: string) {
  if (settled || !current.value) return;
  settled = true;
  current.value.resolve({ confirmed, value });
}

function handleConfirm(value?: string) {
  settle(true, value ?? '');
}

/** 关闭动画结束后卸载 UPopup，队列中的下一个调用重新创建 */
function handleClose() {
  settle(false);
  if (switching) return;
  switching = true;
  nextTimer = setTimeout(async () => {
    nextTimer = undefined;
    current.value = null;
    if (queue.length) {
      await nextTick();
      if (unmounted) return;
      const next = queue.shift();
      if (next) show(next);
    }
    switching = false;
  }, NEXT_DELAY_MS);
}

onMounted(() => {
  const page = getTopPage();
  if (page) unregister = registerDialogHost(page, props.name, { enqueue });
});

onBeforeUnmount(() => {
  unmounted = true;
  unregister?.();
  clearTimeout(nextTimer);
  settle(false);
  queue.splice(0).forEach(request => request.resolve({ confirmed: false }));
  current.value = null;
});
</script>
