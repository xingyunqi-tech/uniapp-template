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
        <view :class="['rule-item', { valid: isLengthValid }]">
          <uni-icons :type="isLengthValid ? 'checkmarkempty' : 'closeempty'" color="inherit" size="inherit" />
          <text>长度{{ minLength }}-{{ maxLength }}位</text>
        </view>
        <view v-if="requireLetter" :class="['rule-item', { valid: hasLetter }]">
          <uni-icons :type="hasLetter ? 'checkmarkempty' : 'closeempty'" color="inherit" size="inherit" />
          <text>包含字母</text>
        </view>
        <view v-if="requireNumber" :class="['rule-item', { valid: hasNumber }]">
          <uni-icons :type="hasNumber ? 'checkmarkempty' : 'closeempty'" color="inherit" size="inherit" />
          <text>包含数字</text>
        </view>
        <view v-if="requireSpecialChar" :class="['rule-item', { valid: hasSpecialChar }]">
          <uni-icons :type="hasSpecialChar ? 'checkmarkempty' : 'closeempty'" color="inherit" size="inherit" />
          <text>包含特殊字符</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
definePage({
  meta: {
    isComponent: true,
  },
});

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
  gap: var(--spacing-sm);
}

// 强度条
.strength-bar-section {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;

  .strength-label {
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }

  .strength-bars {
    display: flex;
    gap: var(--spacing-xs);

    .strength-bar {
      width: var(--spacing-xl);
      height: 6rpx;
      transition: background var(--duration-base);
      border-radius: var(--radius-sm);
      background: var(--color-border);

      &.active {
        background: var(--color-primary);
      }
    }
  }

  .strength-text {
    font-size: var(--font-size-sm);

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
    margin-bottom: var(--spacing-sm);
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }

  .rules-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);

    &.horizontal {
      flex-flow: row wrap;
      gap: var(--spacing-sm);
    }

    .rule-item {
      display: flex;
      gap: var(--spacing-xs);
      align-items: center;
      color: var(--color-text-placeholder);
      font-size: var(--font-size-sm);

      &.valid {
        color: var(--color-success);
      }
    }
  }
}
</style>
