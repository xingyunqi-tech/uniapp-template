---
name: coding-standards
description: Uni-app 编码规范和最佳实践，确保代码风格一致性、类型安全和高质量代码
tools: Read, Grep, Glob
model: inherit
---

# Uni-app 编码规范

## 职责
负责制定和维护 Uni-app 项目编码规范，确保代码风格一致性、类型安全和最佳实践，为 AI 生成高质量代码提供指导。

> **通用模式参考**: 本文档引用的通用开发模式详见 [common-patterns.md](common-patterns.md)，包括:
> - [Props/Emits 定义规范](common-patterns.md#props-定义规范)
> - [数据驱动模式](common-patterns.md#数据驱动模式)
> - [CSS 变量使用规范](common-patterns.md#css-变量使用规范)
> - [CSS 盒模型规范](common-patterns.md#css-盒模型规范)
> - [样式选择器规范](common-patterns.md#样式选择器规范)
> - [错误处理模式](common-patterns.md#错误处理模式)

---

## 编码原则

### 1. 类型优先原则
- **严格类型定义**: 所有变量、函数参数和返回值必须有明确的类型定义
- **避免 any 类型**: 除非特殊情况，禁止使用 `any` 类型
- **接口完整性**: 所有数据结构都要有对应的 TypeScript 接口
- **泛型合理使用**: 适当使用泛型提高代码复用性

### 2. Uni-app 规范原则
- **使用 Uni-app 标签**: `<view>` 代替 `<div>`，`<text>` 代替 `<span>`
- **使用 rpx 单位**: 基于 750rpx 设计稿
- **使用 uni API**: 优先使用 `uni.xxx` 而非浏览器 API
- **平台兼容**: 使用条件编译处理平台差异

### 3. 国际化原则
- **使用 vue-i18n**: 需要多语言的文本在模板中使用 `$t('key')`（实例见 `src/utils/locale.ts`）
- **同步维护语言包**: 新增 key 时同时添加到 `src/locale/zh-CN.json` 与 `src/locale/en-US.json`

### 4. 函数式原则
- **纯函数优先**: 工具函数应该是纯函数
- **副作用控制**: 明确标识和控制副作用
- **错误处理**: 完善的错误处理机制

---

## Uni-app 特有规范

### 1. 元素标签使用

```vue
<!-- ✅ 正确：使用 Uni-app 标签 -->
<template>
  <view class="container">
    <text class="title">标题</text>
    <image src="@/static/logo.png" mode="aspectFit" />
    <navigator url="/pages/detail/index">跳转</navigator>
  </view>
</template>

<!-- ❌ 错误：使用 HTML 标签 -->
<template>
  <div class="container">
    <span class="title">标题</span>
    <img src="@/static/logo.png" />
    <a href="/pages/detail/index">跳转</a>
  </div>
</template>
```

### 2. 尺寸单位规范

```scss
// ✅ 正确：使用 rpx 单位
.container {
  width: 750rpx;           // 全屏宽度
  padding: 32rpx;          // 内边距
  font-size: 28rpx;        // 字体大小
  border-radius: 16rpx;    // 圆角
  margin-bottom: 24rpx;    // 外边距
}

// ❌ 错误：使用 px 单位
.container {
  width: 375px;            // 禁止！
  padding: 16px;           // 禁止！
}
```

**换算公式**: `rpx = 设计稿px × 2`（基于 375px 设计稿）

### 3. uni API 使用规范

```typescript
// ✅ 正确：使用 uni API
uni.showToast({ title: '成功', icon: 'success' });
uni.showLoading({ title: '加载中' });
uni.hideLoading();
uni.showModal({ title: '提示', content: '确定删除？' });

// 存储
uni.setStorageSync('token', token);
const token = uni.getStorageSync('token');

// 导航
uni.navigateTo({ url: '/pages/detail/index' });
uni.switchTab({ url: '/pages/index/index' });
uni.navigateBack();

// 网络状态
uni.getNetworkType({
  success: (res) => console.log(res.networkType)
});

// ❌ 错误：使用浏览器 API
alert('成功');                              // 禁止！
localStorage.setItem('token', token);       // 禁止！
window.location.href = '/pages/detail';     // 禁止！
```

### 4. 页面生命周期

```typescript
import { onLoad, onShow, onHide, onUnload, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';

// 页面加载（获取参数）
onLoad((options) => {
  const id = options?.id;
});

// 页面显示
onShow(() => {
  // 每次显示时执行
});

// 页面隐藏
onHide(() => {
  // 页面隐藏时执行
});

// 页面卸载
onUnload(() => {
  // 清理资源
});

// 下拉刷新（需在页面 definePage 的 style 中启用 enablePullDownRefresh）
onPullDownRefresh(async () => {
  await fetchData();
  uni.stopPullDownRefresh();
});

// 触底加载
onReachBottom(() => {
  loadMore();
});
```

### 5. 条件编译

```vue
<template>
  <!-- #ifdef MP-WEIXIN -->
  <button open-type="share">分享给好友</button>
  <button open-type="contact">联系客服</button>
  <!-- #endif -->

  <!-- #ifdef H5 -->
  <button @click="shareToH5">分享</button>
  <!-- #endif -->

  <!-- #ifndef MP-WEIXIN -->
  <view>非微信小程序显示的内容</view>
  <!-- #endif -->
</template>

<script setup lang="ts">
// #ifdef MP-WEIXIN
import { onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app';

onShareAppMessage(() => ({
  title: '分享标题',
  path: '/pages/index/index',
}));
// #endif

// #ifdef H5
const shareToH5 = () => {
  // H5 分享逻辑
};
// #endif
</script>

<style lang="scss" scoped>
/* #ifdef MP-WEIXIN */
.mp-only { /* 小程序专属样式 */ }
/* #endif */

/* #ifdef H5 */
.h5-only { /* H5 专属样式 */ }
/* #endif */
</style>
```

---

## TypeScript 编码规范

### 接口定义规范

```typescript
// ✅ 正确：完整的接口定义
interface UserInfo {
  id: string;
  username: string;
  avatar?: string;
  phone: string;
  createTime: string;
}

interface LoginParams {
  username: string;
  password: string;
}

// ❌ 错误：使用 any 类型
interface BadUserInfo {
  data: any; // 应该定义具体类型
}
```

### 函数类型定义规范

```typescript
// ✅ 正确：完整的函数类型定义
const getUserInfo = async (userId: string): Promise<UserInfo> => {
  const res = await getUserInfoApi(userId);
  return res.data;
};

// ✅ 泛型函数
const request = async <T>(url: string, data?: Record<string, unknown>): Promise<T> => {
  const res = await uni.request({ url, data });
  return res.data as T;
};
```

### 枚举和常量定义

```typescript
// ✅ 使用 const 断言
export const ORDER_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  SHIPPED: 'shipped',
  COMPLETED: 'completed',
} as const;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

// ✅ 使用枚举
export enum ApiErrorCode {
  SUCCESS = 200,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
}
```

---

## Vue 组件编码规范

### Composition API 规范

```vue
<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { useRouter } from '@/composables';
import type { UserInfo } from '@/interface';

// ==================== 接口定义 ====================
interface Props {
  userId: string;
  showActions?: boolean;
}

interface Emits {
  (e: 'edit', userId: string): void;
  (e: 'delete', userId: string): void;
}

// ==================== Props 和 Emits ====================
const props = withDefaults(defineProps<Props>(), {
  showActions: true,
});
const emit = defineEmits<Emits>();

// ==================== Composables ====================
const router = useRouter();

// ==================== 响应式数据 ====================
const userInfo = ref<UserInfo | null>(null);
const loading = ref(false);

// ==================== 计算属性 ====================
const displayName = computed(() => userInfo.value?.username || '未知用户');

// ==================== 方法定义 ====================
const fetchUserInfo = async (): Promise<void> => {
  if (!props.userId) return;
  loading.value = true;
  try {
    const res = await getUserInfoApi(props.userId);
    userInfo.value = res.data;
  } catch (err) {
    uni.showToast({ title: '获取用户信息失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
};

// ==================== 生命周期 ====================
onLoad(() => {
  fetchUserInfo();
});

// ==================== 监听器 ====================
watch(() => props.userId, (newId) => {
  if (newId) fetchUserInfo();
});

// ==================== 暴露方法 ====================
defineExpose({ fetchUserInfo });
</script>
```

### 代码组织顺序

```vue
<script setup lang="ts">
// 1. 导入
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

// 2. 接口定义
interface Props { /* ... */ }

// 3. Props 和 Emits
const props = defineProps<Props>();
const emit = defineEmits</* ... */>();

// 4. Composables
const router = useRouter();

// 5. 响应式数据
const loading = ref(false);

// 6. 计算属性
const isValid = computed(() => /* ... */);

// 7. 方法定义
const handleSubmit = async () => { /* ... */ };

// 8. 生命周期
onLoad(() => { /* ... */ });

// 9. 监听器
watch(/* ... */);

// 10. 暴露方法
defineExpose({ /* ... */ });
</script>
```

---

## 状态管理规范 (Pinia)

### Store 定义规范

```typescript
// src/store/modules/user.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { loginWithPhone, getCurrentUser } from '@/api';
import type { UserInfo, LoginParams } from '@/interface';

export const useUserStore = defineStore('user', () => {
  // ==================== 状态定义 ====================
  const token = ref<string>('');
  const userInfo = ref<UserInfo | null>(null);

  // ==================== 计算属性 ====================
  const isLoggedIn = computed(() => !!token.value);
  const userId = computed(() => userInfo.value?.id || '');

  // ==================== 动作定义 ====================
  const login = async (params: LoginParams): Promise<void> => {
    const res = await loginWithPhone(params);
    token.value = res.token;
    uni.setStorageSync('token', token.value);
    await fetchUserInfo();
  };

  const fetchUserInfo = async (): Promise<void> => {
    if (!token.value) return;
    const res = await getCurrentUser();
    userInfo.value = mapUserToUserInfo(res);
  };

  const logout = (): void => {
    token.value = '';
    userInfo.value = null;
    uni.removeStorageSync('token');
  };

  // ==================== 初始化 ====================
  const initToken = (): void => {
    const savedToken = uni.getStorageSync('token');
    if (savedToken) {
      token.value = savedToken;
    }
  };

  return {
    // 状态
    token,
    userInfo,
    // 计算属性
    isLoggedIn,
    userId,
    // 动作
    login,
    fetchUserInfo,
    logout,
    initToken,
  };
});
```

---

## API 开发规范

### 核心原则

项目使用 Orval 从 OpenAPI 文档自动生成 API 代码：

1. **绝不修改** `src/api/generated/` 目录
2. **从 `@/api` 统一导入**
3. **在 `src/api/custom/` 扩展**（需要时）
4. **优先使用 Pinia Store**

### API 导入规范

```typescript
// ✅ 正确：从 @/api 统一导入
import { loginWithPhone, getCurrentUser } from '@/api';
import type { AuthPhoneLoginDto, User } from '@/api';

// ✅ 正确：使用 Pinia Store
import { useUserStore } from '@/store/modules/user';
const userStore = useUserStore();
await userStore.login(params);

// ❌ 错误：直接从 generated 导入
import { loginWithPhone } from '@/api/generated/auth/auth';
```

### API 调用规范

```typescript
// ✅ 正确：完整的错误处理
const fetchData = async () => {
  loading.value = true;
  try {
    const res = await getOrderList({ page: 1, size: 10 });
    orderList.value = res.data.list;
  } catch (error) {
    uni.showToast({ title: '获取数据失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
};
```

---

## 样式编码规范

### CSS 变量使用规范

所有颜色必须使用 `src/styles/theme.scss` 中定义的 CSS 变量：

```scss
// ✅ 正确：使用 CSS 变量
.container {
  color: var(--color-text);              // #323233
  background: var(--color-bg-grey);      // #f7f8fa
  border: 1rpx solid var(--color-border); // #ebedf0
}

.title {
  color: var(--color-text);              // 主文本
}

.link {
  color: var(--color-primary);           // 主题色 #1989fa
}

.error {
  color: var(--color-error);             // 错误色 #ee0a24
}

// ❌ 错误：硬编码颜色
.container {
  color: #323233;           // 禁止！
  background: #f7f8fa;      // 禁止！
}
```

### 样式选择器规范

```scss
// ✅ 正确：使用 class 选择器
.user-card {
  padding: 24rpx;

  .user-name {
    font-size: 28rpx;
    color: var(--color-text);
  }

  .user-avatar {
    width: 80rpx;
    height: 80rpx;
  }
}

// ❌ 错误：使用标签选择器
view {
  padding: 24rpx;
}

text {
  font-size: 28rpx;
}
```

### BEM 命名规范

```scss
// Block（块）
.user-card { }

// Element（元素）
.user-card__header { }
.user-card__content { }
.user-card__footer { }

// Modifier（修饰符）
.user-card--large { }
.user-card--highlighted { }
```

### 样式嵌套规范

```scss
// ✅ 正确：嵌套不超过 3 层
.user-card {
  .card-header {
    .title {
      // 最多到这里
    }
  }
}

// ❌ 错误：嵌套过深
.user-card {
  .card-wrapper {
    .card-inner {
      .card-content {
        .title {
          // 嵌套过深！
        }
      }
    }
  }
}
```

---

## Composables 规范

### 命名规范

```typescript
// ✅ 正确：use 前缀
export function useRouter() { /* ... */ }
export function useLoading() { /* ... */ }
export function useForm() { /* ... */ }

// ❌ 错误：非标准命名
export function router() { /* ... */ }
export function getLoading() { /* ... */ }
```

### 结构规范

```typescript
// src/composables/useLoading.ts
import { ref } from 'vue';

export function useLoading(initialValue = false) {
  const loading = ref(initialValue);

  const startLoading = () => {
    loading.value = true;
  };

  const stopLoading = () => {
    loading.value = false;
  };

  const withLoading = async <T>(fn: () => Promise<T>): Promise<T> => {
    startLoading();
    try {
      return await fn();
    } finally {
      stopLoading();
    }
  };

  return {
    loading,
    startLoading,
    stopLoading,
    withLoading,
  };
}
```

---

## 错误处理规范

### 统一错误处理

```typescript
// utils/error.ts
export const handleError = (error: unknown, defaultMessage = '操作失败'): void => {
  console.error(error);

  let message = defaultMessage;
  if (error instanceof Error) {
    message = error.message;
  }

  uni.showToast({
    title: message,
    icon: 'none',
    duration: 2000,
  });
};

// 在组件中使用
const fetchData = async () => {
  try {
    const res = await getData();
    data.value = res.data;
  } catch (error) {
    handleError(error, '获取数据失败');
  }
};
```

### try-catch-finally 模式

```typescript
// ✅ 正确：完整的错误处理
const submitForm = async () => {
  loading.value = true;
  try {
    await postData(formData.value);
    uni.showToast({ title: '提交成功', icon: 'success' });
    uni.navigateBack();
  } catch (error) {
    handleError(error, '提交失败');
  } finally {
    loading.value = false;
  }
};
```

---

## 编码规范检查清单

### Uni-app 规范检查
- [ ] 使用 `<view>` 代替 `<div>`
- [ ] 使用 `<text>` 代替 `<span>`
- [ ] 使用 `<image>` 代替 `<img>`
- [ ] 使用 rpx 单位
- [ ] 使用 uni API 而非浏览器 API
- [ ] 平台差异使用条件编译

### TypeScript 类型安全检查
- [ ] 所有变量都有明确的类型定义
- [ ] 避免使用 `any` 类型
- [ ] 接口定义完整
- [ ] 函数参数和返回值类型明确
- [ ] 导入类型时使用 `type` 关键字

### Vue 组件规范检查
- [ ] Props 和 Emits 有完整的类型定义
- [ ] 代码组织顺序正确
- [ ] 使用 Uni-app 生命周期钩子
- [ ] 异步函数有完善的错误处理
- [ ] 列表内容使用数据驱动

### 样式编码检查
- [ ] 所有颜色使用 CSS 变量
- [ ] 使用 rpx 单位
- [ ] 使用 class 选择器，避免标签选择器
- [ ] 遵循 BEM 命名规范
- [ ] 样式嵌套不超过 3 层

### API 接口规范检查
- [ ] 从 `@/api` 统一导入
- [ ] 不修改 `generated/` 目录
- [ ] 优先使用 Pinia Store
- [ ] 完善的错误处理

---

## 常用命令

```bash
# ESLint + Stylelint + markdownlint（自动修复）
pnpm lint
# 只检查不修复
pnpm lint:check

# TypeScript 类型检查
pnpm type-check

# API 代码生成
pnpm api:gen

# 构建
pnpm build:h5          # H5
pnpm build:mp-weixin   # 微信小程序
pnpm build:mp-alipay   # 支付宝小程序
```

---

通过遵循这些编码规范，可以确保 Uni-app 项目代码的一致性、可读性和可维护性。
