<template>
  <view class="demo-page" :class="globalStore.themeClass">
    <!-- 主题切换 -->
    <UCard class="demo-section" title="主题">
      <view class="demo-row">
        <UButton size="small" :type="isDark ? 'default' : 'primary'" text="浅色" @click="setTheme('light')" />
        <UButton size="small" :type="isDark ? 'primary' : 'default'" text="深色" @click="setTheme('dark')" />
      </view>
    </UCard>

    <UCard class="demo-section" title="UButton 按钮">
      <view class="demo-row">
        <UButton type="primary" size="small" text="主色" />
        <UButton size="small" text="默认" />
        <UButton type="danger" size="small" text="危险" />
        <UButton type="text" size="small" text="文字" />
      </view>
      <view class="demo-row">
        <UButton type="primary" plain size="small" text="镂空" />
        <UButton type="danger" plain size="small" text="危险镂空" />
        <UButton type="primary" size="small" loading text="加载中" />
        <UButton type="primary" size="small" disabled text="禁用" />
      </view>
      <view class="demo-stack">
        <UButton type="primary" size="medium" block text="medium 撑满" />
        <UButton type="primary" block text="large 撑满" />
      </view>
    </UCard>

    <UCard class="demo-section" title="UCard 卡片" extra="右侧文字">
      <text class="demo-text">默认内边距与阴影</text>
    </UCard>
    <UCard class="demo-section" :padding="false" :shadow="false" title="无内边距、无阴影">
      <UMenuItem icon="gear" title="行自带内边距" show-arrow />
    </UCard>

    <view class="demo-title">UMenuGroup / UMenuItem 菜单</view>
    <UMenuGroup class="demo-section" title="分组标题">
      <UMenuItem icon="person" title="带箭头" show-arrow border />
      <UMenuItem icon="notification" title="带角标与右侧文字" badge="3" right-text="说明" show-arrow border />
      <UMenuItem
        icon="color"
        title="开关"
        show-switch
        :switch-checked="switchOn"
        border
        @switch-change="switchOn = $event"
      />
      <UMenuItem icon="trash" title="危险操作" danger />
    </UMenuGroup>

    <view class="demo-title">UFormItem 表单项</view>
    <UMenuGroup class="demo-section">
      <UFormItem label="输入" required>
        <input v-model="formText" class="u-form-input" placeholder-class="u-form-placeholder" placeholder="请输入" />
      </UFormItem>
      <UFormItem label="选择" show-arrow placeholder="请选择" :value="''" />
      <UFormItem label="多行" align-top>
        <textarea
          class="u-form-textarea"
          placeholder-class="u-form-placeholder"
          placeholder="多行内容与标签顶部对齐"
          :auto-height="true"
        />
      </UFormItem>
    </UMenuGroup>

    <UCard class="demo-section" title="USmsInput / UAgreementCheck">
      <view class="demo-stack">
        <USmsInput v-model="smsCode" />
        <UAgreementCheck v-model="agreed" prefix="我已阅读并同意" />
      </view>
    </UCard>

    <UCard class="demo-section" title="UPasswordStrength 密码强度">
      <UPasswordStrength
        :strength="2"
        strength-text="中"
        strength-class="medium"
        :is-length-valid="true"
        :has-letter="true"
        :has-number="false"
      />
    </UCard>

    <UCard class="demo-section" title="UTag 标签">
      <view class="demo-row">
        <UTag type="primary" text="主色" />
        <UTag type="success" text="成功" />
        <UTag type="warning" text="警告" />
        <UTag type="error" text="错误" />
        <UTag type="info" plain text="镂空" />
        <UTag type="primary" round size="small" text="圆角" />
      </view>
    </UCard>

    <UCard class="demo-section" title="UTabs 标签页">
      <UTabs v-model="tab" :tabs="tabs" />
    </UCard>

    <UCard class="demo-section" title="UNoticeBar 通知栏">
      <view class="demo-stack">
        <UNoticeBar type="info" text="这是一条普通通知" />
        <UNoticeBar type="warning" text="这是一条警告通知，内容较长时会滚动显示" scrollable />
      </view>
    </UCard>

    <UCard class="demo-section" title="USearchBar 搜索栏" :padding="false">
      <USearchBar v-model="keyword" placeholder="搜索" :hot-keywords="['示例', '组件']" />
    </UCard>

    <UCard class="demo-section" title="UImage 图片">
      <view class="demo-row">
        <UImage src="/static/images/logo.png" :width="160" :height="160" :radius="16" />
        <UImage src="/static/images/logo.png" :width="160" :height="160" round />
        <UImage src="/static/not-exist.png" :width="160" :height="160" />
      </view>
    </UCard>

    <UCard class="demo-section" title="USkeleton 骨架屏">
      <USkeleton loading type="list" :rows="2" avatar />
    </UCard>

    <view class="demo-title">UList 列表状态</view>
    <UCard class="demo-section" :padding="false">
      <UList :empty="true" :loading="true" />
    </UCard>
    <UCard class="demo-section" :padding="false">
      <UList :empty="true" empty-text="暂无数据" />
    </UCard>
    <UCard class="demo-section" :padding="false">
      <UList :empty="true" :error="true" />
    </UCard>
    <UCard class="demo-section">
      <UList :empty="false" :finished="true">
        <text class="demo-text">列表项</text>
      </UList>
    </UCard>

    <UCard class="demo-section" title="UEmpty / ULoadMore">
      <UEmpty type="search" text="没有搜索结果" />
      <ULoadMore status="loading" />
      <ULoadMore status="nomore" show-line />
    </UCard>

    <UCard class="demo-section" title="弹出类组件">
      <view class="demo-row">
        <UButton size="small" text="UPopup 底部" @click="popupRef?.open()" />
        <UButton size="small" text="UPopup 对话框" @click="dialogRef?.open()" />
        <UButton size="small" text="UActionSheet" @click="actionSheetRef?.open()" />
        <UButton size="small" text="ULoading" @click="showLoading" />
      </view>
    </UCard>

    <UPopup ref="popupRef" type="bottom" title="底部弹出层">
      <text class="demo-text">弹出层内容</text>
    </UPopup>
    <UPopup ref="dialogRef" type="dialog" dialog-mode="input" title="输入对话框" dialog-value="默认值" />
    <UActionSheet ref="actionSheetRef" title="操作菜单" :actions="actions" />
    <ULoading v-if="loadingVisible" visible text="加载中" />
  </view>
</template>

<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: '组件演示',
  },
});

import { computed, ref } from 'vue';
import { useGlobalStore } from '@/store/modules/global';
import { THEME_TYPE, type ThemeType } from '@/constants';
import type { ActionItem, TabItem } from '@/components';

const globalStore = useGlobalStore();
const isDark = computed(() => globalStore.currentTheme === THEME_TYPE.DARK);

const switchOn = ref(true);
const formText = ref('');
const smsCode = ref('');
const agreed = ref(false);
const keyword = ref('');
const tab = ref<string | number>('all');
const tabs: TabItem[] = [
  { label: '全部', value: 'all' },
  { label: '待处理', value: 'todo', badge: 2 },
  { label: '已完成', value: 'done' },
];
const actions: ActionItem[] = [{ label: '选项一' }, { label: '选项二' }, { label: '删除', value: 'delete' }];

const popupRef = ref<{ open: () => void } | null>(null);
const dialogRef = ref<{ open: () => void } | null>(null);
const actionSheetRef = ref<{ open: () => void } | null>(null);

const loadingVisible = ref(false);

function setTheme(theme: ThemeType) {
  globalStore.setTheme(theme);
}

function showLoading() {
  loadingVisible.value = true;
  setTimeout(() => {
    loadingVisible.value = false;
  }, 1500);
}
</script>

<style scoped lang="scss">
.demo-page {
  box-sizing: border-box;
  min-height: 100vh;
  padding: var(--spacing-base);
  background: var(--color-bg-grey);
}

.demo-section {
  margin-bottom: var(--spacing-base);
}

.demo-title {
  margin-bottom: var(--spacing-sm);
  padding-left: var(--spacing-xs);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.demo-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}

.demo-stack {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.demo-text {
  color: var(--color-text);
  font-size: var(--font-size-base);
}
</style>
