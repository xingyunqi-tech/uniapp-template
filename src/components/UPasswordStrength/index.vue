<route lang="json5">
{
  meta: {
    isComponent: true,
  },
}
</route>

<template>
  <!--
    UPasswordStrength - 密码强度指示器组件
    显示密码强度条和规则验证状态
  -->
  <view class="u-password-strength">
    <!-- 强度条 -->
    <view v-if="showStrengthBar" class="strength-bar-section">
      <text class="strength-label">密码强度：</text>
      <view class="strength-bars">
        <view :class="['strength-bar', { active: strength >= 1 }]" />
        <view :class="['strength-bar', { active: strength >= 2 }]" />
        <view :class="['strength-bar', { active: strength >= 3 }]" />
      </view>
      <text :class="['strength-text', strengthClass]">{{ strengthText }}</text>
    </view>

    <!-- 规则提示 -->
    <view v-if="showRules" class="rules-section">
      <text v-if="showRulesTitle" class="rules-title">密码要求：</text>
      <view :class="['rules-list', { horizontal: horizontal }]">
        <text :class="['rule-item', { valid: isLengthValid }]">
          <text :class="isLengthValid ? 'i-carbon-checkmark' : 'i-carbon-close'" />
          长度{{ minLength }}-{{ maxLength }}位
        </text>
        <text v-if="requireLetter" :class="['rule-item', { valid: hasLetter }]">
          <text :class="hasLetter ? 'i-carbon-checkmark' : 'i-carbon-close'" />
          包含字母
        </text>
        <text v-if="requireNumber" :class="['rule-item', { valid: hasNumber }]">
          <text :class="hasNumber ? 'i-carbon-checkmark' : 'i-carbon-close'" />
          包含数字
        </text>
        <text v-if="requireSpecialChar" :class="['rule-item', { valid: hasSpecialChar }]">
          <text :class="hasSpecialChar ? 'i-carbon-checkmark' : 'i-carbon-close'" />
          包含特殊字符
        </text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from '@/constants/form';

defineOptions({
  name: 'UPasswordStrength',
});

withDefaults(
  defineProps<{
    /** 密码强度等级 (0-3) */
    strength: number;
    /** 强度文本 */
    strengthText: string;
    /** 强度 CSS 类名 */
    strengthClass: string;
    /** 长度是否有效 */
    isLengthValid: boolean;
    /** 是否包含字母 */
    hasLetter: boolean;
    /** 是否包含数字 */
    hasNumber: boolean;
    /** 是否包含特殊字符 */
    hasSpecialChar?: boolean;
    /** 最小长度 */
    minLength?: number;
    /** 最大长度 */
    maxLength?: number;
    /** 是否需要字母 */
    requireLetter?: boolean;
    /** 是否需要数字 */
    requireNumber?: boolean;
    /** 是否需要特殊字符 */
    requireSpecialChar?: boolean;
    /** 是否显示强度条 */
    showStrengthBar?: boolean;
    /** 是否显示规则 */
    showRules?: boolean;
    /** 是否显示规则标题 */
    showRulesTitle?: boolean;
    /** 规则是否水平排列 */
    horizontal?: boolean;
  }>(),
  {
    hasSpecialChar: false,
    minLength: PASSWORD_MIN_LENGTH,
    maxLength: PASSWORD_MAX_LENGTH,
    requireLetter: true,
    requireNumber: true,
    requireSpecialChar: false,
    showStrengthBar: true,
    showRules: true,
    showRulesTitle: false,
    horizontal: true,
  },
);
</script>

<style scoped lang="scss">
.u-password-strength {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

// 强度条
.strength-bar-section {
  display: flex;
  gap: 12rpx;
  align-items: center;

  .strength-label {
    color: var(--color-text-secondary);
    font-size: 24rpx;
  }

  .strength-bars {
    display: flex;
    gap: 8rpx;

    .strength-bar {
      width: 48rpx;
      height: 6rpx;
      transition: background 0.3s;
      border-radius: 3rpx;
      background: var(--color-border);

      &.active {
        background: var(--color-primary);
      }
    }
  }

  .strength-text {
    font-size: 24rpx;

    &.weak {
      color: var(--color-error);
    }

    &.medium {
      color: var(--color-warning);
    }

    &.strong {
      color: var(--color-success);
    }
  }
}

// 规则提示
.rules-section {
  .rules-title {
    display: block;
    margin-bottom: 12rpx;
    color: var(--color-text-secondary);
    font-size: 26rpx;
  }

  .rules-list {
    display: flex;
    flex-direction: column;
    gap: 12rpx;

    &.horizontal {
      flex-flow: row wrap;
      gap: 16rpx;
    }

    .rule-item {
      display: flex;
      gap: 4rpx;
      align-items: center;
      color: var(--color-text-placeholder);
      font-size: 24rpx;

      &.valid {
        color: var(--color-success);
      }
    }
  }
}
</style>
