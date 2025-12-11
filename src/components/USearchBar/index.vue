<route lang="json5">
{
  meta: {
    isComponent: true,
  },
}
</route>

<template>
  <!--
    USearchBar - 搜索栏组件
    支持搜索历史、热门搜索、防抖搜索
  -->
  <view class="u-search-bar" :class="globalStore.themeClass">
    <!-- 搜索输入区域 -->
    <view class="u-search-bar__input-wrapper">
      <!-- 搜索图标 -->
      <uni-icons type="search" size="18" color="var(--color-text-secondary)" class="u-search-bar__icon" />

      <!-- 输入框 -->
      <input
        class="u-search-bar__input"
        type="text"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :maxlength="maxLength"
        :focus="autoFocus"
        confirm-type="search"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @confirm="handleConfirm"
      />

      <!-- 清空按钮 -->
      <view v-if="modelValue && !disabled" class="u-search-bar__clear" @click="handleClear">
        <uni-icons type="clear" size="16" color="var(--color-text-placeholder)" />
      </view>
    </view>

    <!-- 取消按钮 -->
    <view v-if="showCancel && isFocused" class="u-search-bar__cancel" @click="handleCancel">
      <text class="u-search-bar__cancel-text">{{ cancelText }}</text>
    </view>
  </view>

  <!-- 搜索面板 (历史记录 + 热门搜索) -->
  <view v-if="showPanel" class="u-search-bar__panel" :class="globalStore.themeClass">
    <!-- 搜索历史 -->
    <view v-if="showHistory && searchHistory.length > 0" class="u-search-bar__section">
      <view class="u-search-bar__section-header">
        <text class="u-search-bar__section-title">搜索历史</text>
        <view class="u-search-bar__section-action" @click="handleClearHistory">
          <uni-icons type="trash" size="16" color="var(--color-text-secondary)" />
        </view>
      </view>
      <view class="u-search-bar__tags">
        <view
          v-for="(item, index) in searchHistory"
          :key="index"
          class="u-search-bar__tag"
          @click="handleSelectHistory(item)"
        >
          <text class="u-search-bar__tag-text">{{ item }}</text>
          <view class="u-search-bar__tag-close" @click.stop="handleRemoveHistory(item)">
            <uni-icons type="close" size="12" color="var(--color-text-placeholder)" />
          </view>
        </view>
      </view>
    </view>

    <!-- 热门搜索 -->
    <view v-if="hotKeywords && hotKeywords.length > 0" class="u-search-bar__section">
      <view class="u-search-bar__section-header">
        <text class="u-search-bar__section-title">热门搜索</text>
      </view>
      <view class="u-search-bar__tags">
        <view
          v-for="(item, index) in hotKeywords"
          :key="index"
          class="u-search-bar__tag u-search-bar__tag--hot"
          @click="handleSelectHot(item)"
        >
          <text class="u-search-bar__tag-text">{{ item }}</text>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view
      v-if="showHistory && searchHistory.length === 0 && (!hotKeywords || hotKeywords.length === 0)"
      class="u-search-bar__empty"
    >
      <text class="u-search-bar__empty-text">暂无搜索历史</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import { useGlobalStore } from '@/store/modules/global';
import { useSearchHistory } from '@/composables/useSearchHistory';

defineOptions({
  name: 'USearchBar',
});

const globalStore = useGlobalStore();

// ==================== Props ====================

interface Props {
  /** 搜索值 (v-model) */
  modelValue?: string;
  /** 占位文本 */
  placeholder?: string;
  /** 防抖时间 (毫秒，默认 300) */
  debounceTime?: number;
  /** 是否显示取消按钮 */
  showCancel?: boolean;
  /** 取消按钮文本 */
  cancelText?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否自动聚焦 */
  autoFocus?: boolean;
  /** 最大输入长度 */
  maxLength?: number;
  /** 是否显示搜索历史 */
  showHistory?: boolean;
  /** 历史记录存储键名 */
  historyKey?: string;
  /** 最大历史条数 */
  maxHistory?: number;
  /** 热门搜索关键词 */
  hotKeywords?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '搜索',
  debounceTime: 300,
  showCancel: true,
  cancelText: '取消',
  disabled: false,
  autoFocus: false,
  maxLength: 50,
  showHistory: true,
  historyKey: 'search_history',
  maxHistory: 10,
  hotKeywords: () => [],
});

// ==================== Emits ====================

const emit = defineEmits<{
  'update:modelValue': [value: string];
  /** 确认搜索 */
  search: [value: string];
  /** 点击取消 */
  cancel: [];
  /** 清空内容 */
  clear: [];
  /** 获得焦点 */
  focus: [];
  /** 失去焦点 */
  blur: [];
  /** 选择历史记录 */
  selectHistory: [value: string];
  /** 选择热门搜索 */
  selectHot: [value: string];
}>();

// ==================== State ====================

const isFocused = ref(false);
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// 搜索历史
const {
  history: searchHistory,
  add: addHistory,
  remove: removeHistory,
  clear: clearHistory,
} = useSearchHistory({
  key: props.historyKey,
  maxItems: props.maxHistory,
});

// ==================== Computed ====================

/** 是否显示搜索面板 */
const showPanel = computed(() => {
  return (
    isFocused.value && !props.modelValue && (props.showHistory || (props.hotKeywords && props.hotKeywords.length > 0))
  );
});

// ==================== Methods ====================

/**
 * 处理输入
 */
function handleInput(e: UniHelper.InputOnInputEvent) {
  const value = e.detail.value || '';
  emit('update:modelValue', value);

  // 防抖处理
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  if (props.debounceTime > 0) {
    debounceTimer = setTimeout(() => {
      if (value.trim()) {
        emit('search', value.trim());
      }
    }, props.debounceTime);
  }
}

/**
 * 处理聚焦
 */
function handleFocus() {
  isFocused.value = true;
  emit('focus');
}

/**
 * 处理失焦
 */
function handleBlur() {
  // 延迟关闭面板，防止点击面板时立即关闭
  setTimeout(() => {
    isFocused.value = false;
  }, 150);
  emit('blur');
}

/**
 * 处理确认搜索 (键盘回车)
 */
function handleConfirm() {
  const value = props.modelValue?.trim() || '';
  if (value) {
    // 添加到搜索历史
    if (props.showHistory) {
      addHistory(value);
    }
    emit('search', value);
  }
}

/**
 * 处理清空
 */
function handleClear() {
  emit('update:modelValue', '');
  emit('clear');
}

/**
 * 处理取消
 */
function handleCancel() {
  emit('update:modelValue', '');
  isFocused.value = false;
  emit('cancel');
}

/**
 * 选择历史记录
 */
function handleSelectHistory(keyword: string) {
  emit('update:modelValue', keyword);
  emit('selectHistory', keyword);
  // 触发搜索
  addHistory(keyword);
  emit('search', keyword);
  isFocused.value = false;
}

/**
 * 选择热门搜索
 */
function handleSelectHot(keyword: string) {
  emit('update:modelValue', keyword);
  emit('selectHot', keyword);
  // 触发搜索
  if (props.showHistory) {
    addHistory(keyword);
  }
  emit('search', keyword);
  isFocused.value = false;
}

/**
 * 删除单条历史记录
 */
function handleRemoveHistory(keyword: string) {
  removeHistory(keyword);
}

/**
 * 清空历史记录
 */
function handleClearHistory() {
  clearHistory();
}

// ==================== Lifecycle ====================

// 清理定时器
onUnmounted(() => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
});

// ==================== Expose ====================

defineExpose({
  /** 清空搜索历史 */
  clearHistory,
  /** 添加搜索历史 */
  addHistory,
});
</script>

<style scoped lang="scss">
.u-search-bar {
  display: flex;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-base);
  background-color: var(--color-bg);

  &__input-wrapper {
    display: flex;
    flex: 1;
    align-items: center;
    height: 72rpx;
    padding: 0 var(--spacing-sm);
    border-radius: var(--radius-lg);
    background-color: var(--color-input-bg);
  }

  &__icon {
    flex-shrink: 0;
    margin-right: var(--spacing-xs);
  }

  &__input {
    flex: 1;
    height: 100%;
    color: var(--color-text);
    font-size: var(--font-size-base);

    &::placeholder {
      color: var(--color-text-placeholder);
    }
  }

  &__clear {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    margin-left: var(--spacing-xs);
    padding: var(--spacing-xs);
    cursor: pointer;

    &:active {
      opacity: var(--opacity-hover);
    }
  }

  &__cancel {
    flex-shrink: 0;
    margin-left: var(--spacing-sm);
    padding: var(--spacing-xs) var(--spacing-sm);
    cursor: pointer;

    &:active {
      opacity: var(--opacity-hover);
    }
  }

  &__cancel-text {
    color: var(--color-primary);
    font-size: var(--font-size-base);
  }

  // 搜索面板
  &__panel {
    padding: var(--spacing-base);
    background-color: var(--color-bg);
  }

  &__section {
    margin-bottom: var(--spacing-lg);

    &:last-child {
      margin-bottom: 0;
    }
  }

  &__section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-sm);
  }

  &__section-title {
    color: var(--color-text);
    font-size: var(--font-size-base);
    font-weight: 500;
  }

  &__section-action {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-xs);
    cursor: pointer;

    &:active {
      opacity: var(--opacity-hover);
    }
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-sm);
  }

  &__tag {
    display: flex;
    align-items: center;
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--radius-base);
    background-color: var(--color-bg-grey);
    cursor: pointer;

    &:active {
      opacity: var(--opacity-hover);
    }

    &--hot {
      background-color: var(--color-primary-bg);
    }
  }

  &__tag-text {
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);

    .u-search-bar__tag--hot & {
      color: var(--color-primary);
    }
  }

  &__tag-close {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: var(--spacing-xs);
    padding: 4rpx;

    &:active {
      opacity: var(--opacity-hover);
    }
  }

  &__empty {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-xl) 0;
  }

  &__empty-text {
    color: var(--color-text-placeholder);
    font-size: var(--font-size-sm);
  }
}
</style>
