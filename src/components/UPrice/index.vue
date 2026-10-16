<template>
  <!--
    UPrice - 金额展示
    整数与小数分开字号，支持划线原价、负数与自定义货币符号
  -->
  <view class="u-price" :class="priceClasses">
    <text v-if="parts.negative" class="u-price__sign">-</text>
    <text class="u-price__symbol">{{ symbol }}</text>
    <text class="u-price__integer">{{ parts.integer }}</text>
    <text v-if="parts.decimal" class="u-price__decimal">.{{ parts.decimal }}</text>
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
  name: 'UPrice',
  options: {
    virtualHost: true,
  },
});

export type PriceUnit = 'fen' | 'yuan';
export type PriceType = 'danger' | 'primary' | 'default';
export type PriceSize = 'small' | 'medium' | 'large';

export interface UPriceProps {
  /** 金额，字符串可带千分位逗号 */
  value: number | string;
  /** 金额单位：fen 分（与 formatMoney 一致）| yuan 元 */
  unit?: PriceUnit;
  /** 保留小数位数，范围 0~10 */
  decimals?: number;
  /** 去掉小数末尾的 0 */
  trimZero?: boolean;
  /** 货币符号 */
  symbol?: string;
  /** 颜色类型 */
  type?: PriceType;
  /** 尺寸 */
  size?: PriceSize;
  /** 划线价（原价），使用次要文字色 */
  original?: boolean;
  /** 整数部分加粗 */
  bold?: boolean;
}

const props = withDefaults(defineProps<UPriceProps>(), {
  unit: 'fen',
  decimals: 2,
  trimZero: false,
  symbol: '¥',
  type: 'danger',
  size: 'medium',
  original: false,
  bold: true,
});

/** 按十进制四舍五入保留 decimals 位小数 */
function toFixedRound(value: number, decimals: number): string {
  const shifted = Number(`${value}e${decimals}`);
  if (!Number.isFinite(shifted)) return value.toFixed(decimals);
  return (Math.round(shifted) / 10 ** decimals).toFixed(decimals);
}

const parts = computed(() => {
  const amount = Number(String(props.value).replace(/,/g, ''));
  const yuan = Number.isFinite(amount) ? (props.unit === 'fen' ? amount / 100 : amount) : 0;
  const decimals = Math.min(Math.max(Math.trunc(props.decimals) || 0, 0), 10);
  const fixed = toFixedRound(Math.abs(yuan), decimals);
  const [integer, decimal = ''] = fixed.split('.');
  return {
    negative: yuan < 0 && Number(fixed) !== 0,
    integer: integer.replace(/\B(?=(\d{3})+(?!\d))/g, ','),
    decimal: props.trimZero ? decimal.replace(/0+$/, '') : decimal,
  };
});

const priceClasses = computed(() => [
  `u-price--${props.original ? 'original' : props.type}`,
  `u-price--${props.size}`,
  { 'u-price--bold': props.bold && !props.original },
]);
</script>

<style scoped lang="scss">
.u-price {
  display: inline-flex;
  align-items: baseline;
  line-height: 1;
  white-space: nowrap;

  &--danger {
    color: var(--color-error);
  }

  &--primary {
    color: var(--color-primary);
  }

  &--default {
    color: var(--color-text);
  }

  &--original {
    color: var(--color-text-secondary);
    text-decoration: line-through;
  }

  &--bold &__integer {
    font-weight: 600;
  }

  &--small {
    .u-price__sign,
    .u-price__symbol,
    .u-price__decimal {
      font-size: var(--font-size-xs);
    }

    .u-price__integer {
      font-size: var(--font-size-base);
    }
  }

  &--medium {
    .u-price__sign,
    .u-price__symbol,
    .u-price__decimal {
      font-size: var(--font-size-sm);
    }

    .u-price__integer {
      font-size: var(--font-size-lg);
    }
  }

  &--large {
    .u-price__sign,
    .u-price__symbol,
    .u-price__decimal {
      font-size: var(--font-size-lg);
    }

    .u-price__integer {
      font-size: var(--font-size-xxl);
    }
  }

  &__symbol {
    margin-right: 2rpx;
  }
}
</style>
