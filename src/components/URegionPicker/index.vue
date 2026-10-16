<template>
  <!--
    URegionPicker - 省市区选择
    基于 uni-data-picker 封装，自动加载地区数据，v-model 绑定省市区编码
  -->
  <!-- 覆盖 uni-data-picker 的样式挂在外层 view 上（支付宝中组件标签不是真实节点） -->
  <view class="u-region-picker" :class="{ 'u-region-picker--in-form-item': !!formItem }">
    <!-- @vue-ignore: uni-data-picker 类型定义不完整，实际支持数组值 -->
    <uni-data-picker
      :localdata="regionStore.regionTree"
      :popup-title="title"
      :value="pickerValue"
      :readonly="disabled"
      @change="handleChange"
    >
      <slot :text="text" :value="modelValue">
        <view class="u-region-picker__field" :class="{ 'u-region-picker__field--disabled': disabled }">
          <text class="u-region-picker__text" :class="{ 'u-region-picker__text--placeholder': !text }">
            {{ text || placeholder }}
          </text>
          <UIcon name="right" size="32rpx" color="var(--color-text-placeholder)" />
        </view>
      </slot>
    </uni-data-picker>
  </view>
</template>

<script setup lang="ts">
definePage({
  meta: {
    isComponent: true,
  },
});

import { computed, inject, onMounted, watch } from 'vue';
import { useRegionStore } from '@/store/modules/region';
import { U_FORM_ITEM_KEY, type UFormItemContext } from '../UForm/context';

defineOptions({
  name: 'URegionPicker',
  options: {
    virtualHost: true,
    styleIsolation: 'shared',
  },
});

export interface RegionValue {
  /** 省级编码 */
  province: string;
  /** 市级编码 */
  city: string;
  /** 区级编码 */
  district: string;
}

export interface RegionChangeDetail {
  /** 省市区编码 */
  value: RegionValue;
  /** 省市区名称 */
  names: RegionValue;
}

export interface URegionPickerProps {
  /** 省市区编码 */
  modelValue: RegionValue;
  /** 弹窗标题 */
  title?: string;
  /** 未选择时的占位文字 */
  placeholder?: string;
  /** 名称之间的分隔符 */
  separator?: string;
  /** 是否禁用 */
  disabled?: boolean;
}

const props = withDefaults(defineProps<URegionPickerProps>(), {
  title: '请选择所在地区',
  placeholder: '请选择省市区',
  separator: ' ',
  disabled: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: RegionValue];
  change: [detail: RegionChangeDetail];
}>();

const regionStore = useRegionStore();
const formItem = inject<UFormItemContext | null>(U_FORM_ITEM_KEY, null);

const isComplete = computed(() => {
  const { province, city, district } = props.modelValue;
  return !!(province && city && district);
});

const pickerValue = computed((): UniDataPickerValueArray => {
  if (!isComplete.value) return [];
  const { province, city, district } = props.modelValue;
  return [province, city, district];
});

const text = computed(() => {
  if (!isComplete.value) return '';
  const { province, city, district } = props.modelValue;
  const names = regionStore.codesToNamesSync(province, city, district);
  return [names.province, names.city, names.district].filter(Boolean).join(props.separator);
});

onMounted(() => {
  regionStore.fetchRegionTree().catch(error => {
    console.error('加载地区数据失败:', error);
  });
});

watch(
  () => [props.modelValue.province, props.modelValue.city, props.modelValue.district] as const,
  ([province, city, district]) => {
    if (!province || !city || !district) return;
    regionStore.codesToNames(province, city, district).catch(error => {
      console.error('加载地区名称失败:', error);
    });
  },
  { immediate: true },
);

interface DataPickerChangeEvent {
  detail: {
    value: Array<{ value: string; text: string }>;
  };
}

function handleChange(e: DataPickerChangeEvent) {
  const nodes = e.detail.value;
  if (!nodes || nodes.length < 3) return;

  const value: RegionValue = { province: nodes[0].value, city: nodes[1].value, district: nodes[2].value };
  const names: RegionValue = { province: nodes[0].text, city: nodes[1].text, district: nodes[2].text };
  emit('update:modelValue', value);
  emit('change', { value, names });
}
</script>

<style scoped lang="scss">
.u-region-picker {
  &--in-form-item {
    flex: 1;
    min-width: 0;
  }

  &__field {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-sm);

    &--disabled {
      opacity: 0.6;
    }
  }

  &__text {
    flex: 1;
    min-width: 0;
    color: var(--color-text);
    font-size: var(--font-size-base);

    &--placeholder {
      color: var(--color-text-placeholder);
    }
  }
}

// 覆盖 uni-data-picker 及 uni-data-pickerview 写死的颜色
.u-region-picker :deep(.uni-data-tree-cover) {
  background-color: var(--color-bg-mask-light);
}

.u-region-picker :deep(.uni-data-tree-dialog) {
  border-color: var(--color-border);
  background-color: var(--color-bg);
}

.u-region-picker :deep(.uni-popper__arrow) {
  border-bottom-color: var(--color-border);
}

.u-region-picker :deep(.uni-popper__arrow::after) {
  border-bottom-color: var(--color-bg);
}

.u-region-picker :deep(.dialog-title) {
  color: var(--color-text);
}

.u-region-picker :deep(.dialog-close-plus) {
  background-color: var(--color-text-secondary);
}

.u-region-picker :deep(.selected-list) {
  border-bottom-color: var(--color-border);
}

.u-region-picker :deep(.selected-item) {
  color: var(--color-text);
}

.u-region-picker :deep(.selected-item-active) {
  border-bottom-color: var(--color-primary);
}

.u-region-picker :deep(.item-text) {
  color: var(--color-text);
}

.u-region-picker :deep(.check) {
  border-color: var(--color-primary);
}

.u-region-picker :deep(.loading-cover) {
  background-color: var(--color-overlay-heavy);
}

.u-region-picker :deep(.error-message) {
  background-color: var(--color-bg);
}

.u-region-picker :deep(.error-text) {
  color: var(--color-error);
}
</style>
