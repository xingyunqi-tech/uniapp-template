<template>
  <view class="rules-page" :class="globalStore.themeClass">
    <view class="rules-header">
      <text class="rules-header__desc">{{ DESCRIPTION }}</text>
    </view>
    <UPageState
      :loading="loading && rules.length === 0"
      :error="loadError"
      :empty="rules.length === 0"
      empty-text="暂无可用的组卷规则"
      @retry="load"
    >
      <UCard v-for="rule in rules" :key="rule.id" class="rule-card">
        <text class="rule-card__name">{{ rule.name }}</text>
        <view class="rule-card__meta">
          <text>约 {{ rule.questionCount }} 题</text>
          <text>{{ rule.durationMin }} 分钟</text>
          <text>满分约 {{ rule.totalScore }}</text>
        </view>
        <view class="rule-card__action">
          <UButton
            text="生成试卷"
            type="primary"
            size="small"
            :loading="generatingId === rule.id"
            :disabled="!!generatingId"
            @click="generate(rule)"
          />
        </view>
      </UCard>
    </UPageState>
  </view>
</template>

<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: '按规则组卷',
  },
});

import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { generatePaper, getSubjectPaperRules, type PaperRuleSummaryDto } from '@/api';
import { useRouter } from '@/composables';
import { PAGES } from '@/constants';
import { useGlobalStore } from '@/store/modules/global';
import { showToast } from '@/utils/toast';

const DESCRIPTION = '按规则随机抽题生成个人试卷，优先排除近 30 天做过的题目，以模拟考试方式作答';

const globalStore = useGlobalStore();
const router = useRouter();

const subjectId = ref('');
const rules = ref<PaperRuleSummaryDto[]>([]);
const loading = ref(false);
const loadError = ref(false);
const generatingId = ref('');

async function load() {
  if (!subjectId.value) {
    loadError.value = true;
    return;
  }
  loading.value = true;
  loadError.value = false;
  try {
    rules.value = await getSubjectPaperRules(subjectId.value);
  } catch (error) {
    loadError.value = true;
    console.error('加载组卷规则失败:', error);
  } finally {
    loading.value = false;
  }
}

async function generate(rule: PaperRuleSummaryDto) {
  generatingId.value = rule.id;
  try {
    const result = await generatePaper(rule.id);
    await router.push(PAGES.EXAM_PAPER, { paperId: result.paperId });
    showToast(result.insufficient ? `题量不足，已生成 ${result.questionCount} 题` : '试卷已生成');
  } catch (error) {
    console.error('生成试卷失败:', error);
  } finally {
    generatingId.value = '';
  }
}

onLoad(options => {
  subjectId.value = options?.subjectId ?? '';
  load();
});
</script>

<style scoped lang="scss">
.rules-page {
  min-height: 100vh;
  padding-bottom: calc(env(safe-area-inset-bottom) + 32rpx);
  background: var(--color-bg-grey);
}

.rules-header {
  padding: 24rpx;

  &__desc {
    color: var(--color-text-secondary);
    font-size: 24rpx;
    line-height: 1.6;
  }
}

.rule-card {
  margin: 0 24rpx 24rpx;

  &__name {
    display: block;
    color: var(--color-text);
    font-size: 30rpx;
    font-weight: 600;
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    margin-top: 12rpx;
    color: var(--color-text-secondary);
    font-size: 24rpx;
    gap: 24rpx;
  }

  &__action {
    display: flex;
    justify-content: flex-end;
    margin-top: 16rpx;
  }
}
</style>
