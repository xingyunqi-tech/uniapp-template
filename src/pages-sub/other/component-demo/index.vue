<template>
  <view class="demo-page" :class="globalStore.themeClass">
    <USticky>
      <view class="demo-sticky">USticky 吸顶</view>
    </USticky>

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

    <view class="demo-title">UForm / UInput / UTextarea 表单校验</view>
    <UForm ref="demoFormRef" :model="demoForm" :rules="demoRules">
      <UMenuGroup class="demo-section">
        <UFormItem label="手机号" prop="phone">
          <UInput v-model="demoForm.phone" type="number" :maxlength="11" placeholder="失焦校验" />
        </UFormItem>
        <UFormItem label="昵称" prop="nickname">
          <UInput v-model="demoForm.nickname" :maxlength="20" show-count placeholder="请输入昵称" />
        </UFormItem>
        <UFormItem label="简介" prop="intro" align-top>
          <UTextarea v-model="demoForm.intro" :maxlength="100" auto-height :height="120" placeholder="选填" />
        </UFormItem>
      </UMenuGroup>
    </UForm>
    <view class="demo-row">
      <UButton size="small" type="primary" text="提交校验" @click="demoFormRef?.validate()" />
      <UButton size="small" text="重置" @click="demoFormRef?.resetFields()" />
    </view>

    <view class="demo-title">UCheckboxGroup / URadioGroup / UDatePicker / URegionPicker / UStepper</view>
    <UForm :model="pickerForm" :rules="pickerRules">
      <UMenuGroup class="demo-section">
        <UFormItem label="爱好" prop="hobbies">
          <UCheckboxGroup v-model="pickerForm.hobbies" :options="hobbyOptions" :max="2" />
        </UFormItem>
        <UFormItem label="性别" prop="gender">
          <URadioGroup v-model="pickerForm.gender" :options="genderOptions" />
        </UFormItem>
        <UFormItem label="日期" prop="date">
          <UDatePicker v-model="pickerForm.date" />
        </UFormItem>
        <UFormItem label="时间">
          <UDatePicker v-model="pickerForm.time" type="time" />
        </UFormItem>
        <UFormItem label="日期时间">
          <UDatePicker v-model="pickerForm.datetime" type="datetime" format="MM月DD日 HH:mm" />
        </UFormItem>
        <UFormItem label="日期范围">
          <UDatePicker v-model="pickerForm.range" type="daterange" />
        </UFormItem>
        <UFormItem label="地区">
          <URegionPicker v-model="region" />
        </UFormItem>
        <UFormItem label="数量">
          <UStepper v-model="pickerForm.count" :min="1" :max="10" @overlimit="handleOverlimit" />
        </UFormItem>
      </UMenuGroup>
    </UForm>

    <UCard class="demo-section" title="UCountdown 倒计时">
      <view class="demo-stack">
        <UCountdown :time="2 * 3600 * 1000" />
        <UCountdown :time="3 * 86400 * 1000" format="DD天HH时mm分ss秒" hide-zero-day />
        <UCountdown :time="30000" millisecond format="mm:ss:SS" />
      </view>
    </UCard>

    <view class="demo-title">USwipeAction 左滑操作</view>
    <UMenuGroup class="demo-section">
      <USwipeAction :options="swipeOptions" @click="handleSwipeClick">
        <UMenuItem title="左滑试试" />
      </USwipeAction>
    </UMenuGroup>

    <UCard class="demo-section" title="UPageState 页面状态">
      <view class="demo-row">
        <UButton size="small" text="加载中" @click="pageState = 'loading'" />
        <UButton size="small" text="出错" @click="pageState = 'error'" />
        <UButton size="small" text="空" @click="pageState = 'empty'" />
        <UButton size="small" text="内容" @click="pageState = 'content'" />
      </view>
      <UPageState
        :loading="pageState === 'loading'"
        :error="pageState === 'error'"
        :empty="pageState === 'empty'"
        @retry="pageState = 'content'"
      >
        <text class="demo-text">正常内容</text>
      </UPageState>
    </UCard>

    <UCard class="demo-section" title="USmsInput / UAgreementCheck">
      <view class="demo-stack">
        <USmsInput v-model="smsCode" />
        <UAgreementCheck v-model="agreed" prefix="我已阅读并同意" />
      </view>
    </UCard>

    <UCard class="demo-section" title="UPasswordStrength 密码强度">
      <UPasswordStrength password="abc12345" />
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

    <UCard class="demo-section" title="UPrice 金额">
      <view class="demo-row">
        <UPrice :value="129900" size="large" />
        <UPrice :value="159900" original size="small" />
        <UPrice :value="-2050" type="default" />
        <UPrice :value="99.5" unit="yuan" trim-zero type="primary" />
      </view>
    </UCard>

    <UCard class="demo-section" title="UDivider 分割线">
      <UDivider />
      <UDivider text="居中文字" />
      <UDivider text="左侧文字" align="left" dashed />
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
        <UButton size="small" text="useDialog 确认" @click="handleDialogConfirm" />
        <UButton size="small" text="useDialog 输入" @click="handleDialogPrompt" />
      </view>
    </UCard>

    <UPopup ref="popupRef" type="bottom" title="底部弹出层">
      <text class="demo-text">弹出层内容</text>
    </UPopup>
    <UPopup ref="dialogRef" type="dialog" dialog-mode="input" title="输入对话框" dialog-value="默认值" />
    <UActionSheet ref="actionSheetRef" title="操作菜单" :actions="actions" />
    <ULoading v-if="loadingVisible" visible text="加载中" />
    <UDialog />
    <UBackTop :scroll-top="scrollTop" :threshold="BACK_TOP_THRESHOLD" />
  </view>
</template>

<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: '组件演示',
  },
});

import { computed, reactive, ref } from 'vue';
import { onPageScroll } from '@dcloudio/uni-app';
import { useGlobalStore } from '@/store/modules/global';
import { THEME_TYPE, type ThemeType } from '@/constants';
import type {
  ActionItem,
  CheckboxOption,
  CheckboxValue,
  FormRules,
  PageStateType,
  RadioOption,
  RadioValue,
  RegionValue,
  StepperAction,
  SwipeActionOption,
  TabItem,
  UFormExpose,
} from '@/components';
import { useDialog } from '@/composables';
import { phoneRules } from '@/utils/form-rules';

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

const demoFormRef = ref<UFormExpose | null>(null);
const demoForm = reactive({ phone: '', nickname: '', intro: '' });
const demoRules: FormRules<typeof demoForm> = {
  phone: phoneRules(),
  nickname: [
    { required: true, message: '请输入昵称' },
    { min: 2, message: '昵称至少 2 个字' },
  ],
};

const hobbyOptions: CheckboxOption[] = [
  { label: '阅读', value: 'read' },
  { label: '运动', value: 'sport' },
  { label: '音乐', value: 'music' },
  { label: '旅行', value: 'travel', disabled: true },
];
const genderOptions: RadioOption[] = [
  { label: '男', value: 1 },
  { label: '女', value: 2 },
];
const pickerForm = reactive({
  hobbies: ['read'] as CheckboxValue[],
  gender: 1 as RadioValue,
  date: '',
  time: '',
  datetime: '',
  range: [] as string[],
  count: 1,
});
const pickerRules: FormRules<typeof pickerForm> = {
  hobbies: { required: true, message: '请至少选择一项', trigger: 'change' },
  date: { required: true, message: '请选择日期', trigger: 'change' },
};
const region = ref<RegionValue>({ province: '', city: '', district: '' });

function handleOverlimit(action: StepperAction) {
  uni.showToast({ title: action === 'plus' ? '已达上限' : '已达下限', icon: 'none' });
}

const swipeOptions: SwipeActionOption[] = [
  { text: '收藏', type: 'primary' },
  { text: '删除', type: 'danger' },
];

function handleSwipeClick({ option }: { index: number; option: SwipeActionOption }) {
  uni.showToast({ title: option.text, icon: 'none' });
}

const pageState = ref<PageStateType>('content');

const dialog = useDialog();

async function handleDialogConfirm() {
  const ok = await dialog.confirm({ title: '提示', content: '确定执行该操作吗？' });
  uni.showToast({ title: ok ? '已确认' : '已取消', icon: 'none' });
}

async function handleDialogPrompt() {
  const value = await dialog.prompt({ title: '修改昵称', defaultValue: '张三' });
  if (value !== null) uni.showToast({ title: value || '空', icon: 'none' });
}

const BACK_TOP_THRESHOLD = 400;
const scrollTop = ref(0);
// 只在越过阈值时更新，避免每次滚动都 setData
onPageScroll(e => {
  if (e.scrollTop > BACK_TOP_THRESHOLD !== scrollTop.value > BACK_TOP_THRESHOLD) {
    scrollTop.value = e.scrollTop;
  }
});

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

.demo-sticky {
  margin-bottom: var(--spacing-base);
  padding: var(--spacing-sm) var(--spacing-base);
  border-radius: var(--radius-base);
  background: var(--color-primary);
  color: var(--color-text-inverse);
  font-size: var(--font-size-sm);
}

.demo-text {
  color: var(--color-text);
  font-size: var(--font-size-base);
}
</style>
