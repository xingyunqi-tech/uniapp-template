---
name: coding-standards
description: 编码规范和最佳实践，确保代码风格一致性、类型安全和高质量代码
---


# 编码规范 Agent

## 职责
负责制定和维护项目编码规范，确保代码风格一致性、类型安全和最佳实践，为AI生成高质量代码提供指导。

> **通用模式参考**: 本文档引用的通用开发模式详见 [common-patterns.md](common-patterns.md),包括:
> - [Vue 组件模式](common-patterns.md#vue-组件模式) - Props/Emits 定义规范
> - [数据驱动模式](common-patterns.md#数据驱动模式) - 列表渲染和数据接口
> - [CSS 变量使用规范](common-patterns.md#css-变量使用规范) - 颜色变量使用
> - [CSS 盒模型规范](common-patterns.md#css-盒模型规范) - **Figma 转 CSS 必读** ⚠️
> - [样式选择器规范](common-patterns.md#样式选择器规范) - BEM 命名和嵌套控制
> - [错误处理模式](common-patterns.md#错误处理模式) - 异步函数错误处理

## 🎯 编码原则

### 1. 类型优先原则
- **严格类型定义**: 所有变量、函数参数和返回值必须有明确的类型定义
- **避免any类型**: 除非特殊情况，禁止使用 `any` 类型
- **接口完整性**: 所有数据结构都要有对应的TypeScript接口
- **泛型合理使用**: 适当使用泛型提高代码复用性

### 2. 函数式原则
- **纯函数优先**: 工具函数应该是纯函数
- **副作用控制**: 明确标识和控制副作用
- **函数组合**: 通过函数组合构建复杂逻辑
- **错误处理**: 完善的错误处理机制

### 3. 国际化原则
- **禁止使用 i18n API**: AI 生成的代码中禁止使用 `$t`、`t()` 等国际化 API
- **使用明文文本**: 所有文本内容使用中文明文编写
- **统一翻译处理**: 国际化由 i18n 脚本统一扫描和处理，无需在代码中显式调用

### 4. 全局插件使用原则（重要）

#### 项目级别插件配置
项目在 `src/plugins/` 目录下已配置全局插件，**禁止在组件或页面中重复配置**。

##### 5.1 Dayjs 插件（日期处理）
```typescript
// ❌ 错误：在组件中重复配置 dayjs 插件
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import isToday from 'dayjs/plugin/isToday';

dayjs.extend(isoWeek);  // 禁止！已在全局配置
dayjs.extend(isToday);  // 禁止！已在全局配置

// ✅ 正确：直接使用已配置的 dayjs
import dayjs from 'dayjs';

// dayjs 已在 src/plugins/dayjs.ts 中全局配置了：
// - RelativeTime 插件
// - utc 插件
// - isoWeek 插件
// - isToday 插件
// - zh-cn 语言包
// - en 语言包

const today = dayjs();
const formatted = dayjs().format('YYYY-MM-DD');
const relative = dayjs().fromNow();  // RelativeTime 插件已配置
const weekStart = dayjs().startOf('isoWeek');  // isoWeek 插件已配置
const isTodayCheck = dayjs().isToday();  // isToday 插件已配置
```

**全局 Dayjs 配置位置**: `src/plugins/dayjs.ts`
```typescript
// src/plugins/dayjs.ts
import dayjs from 'dayjs';
import RelativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
import isoWeek from 'dayjs/plugin/isoWeek';
import isToday from 'dayjs/plugin/isToday';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/en';

// 使用插件
dayjs.extend(RelativeTime);
dayjs.extend(utc);
dayjs.extend(isoWeek);
dayjs.extend(isToday);

export default dayjs;
```

##### 5.2 国际化插件（i18n）
```typescript
// ❌ 错误：在组件中重新创建 i18n 实例
import { createI18n } from 'vue-i18n';

const i18n = createI18n({  // 禁止！已有全局实例
  locale: 'zh-CN',
  messages: {...}
});

// ✅ 正确：使用全局 i18n 实例
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n();
const message = t('common.submit');
```

**全局 i18n 配置位置**: `src/plugins/locale.ts`
```typescript
// src/plugins/locale.ts
import { createI18n } from 'vue-i18n';
import { DEFAULT_LOCALE } from '@/constants/system';

export const i18n = createI18n({
  legacy: false,
  locale: DEFAULT_LOCALE,
  fallbackLocale: 'zh-CN',
  messages: {...},
  globalInjection: true,
});
```

##### 5.3 Storage 插件（存储封装）
```typescript
// ❌ 错误：直接使用原生 localStorage
localStorage.setItem('token', token);  // 不推荐
localStorage.getItem('token');         // 不推荐

// ❌ 错误：直接使用原生 cookie
document.cookie = `token=${token}`;    // 不推荐

// ✅ 正确：使用项目封装的 Storage API
import storage from '@/plugins/storage';

// localStorage 操作
storage('localStorage').set('token', token);
const token = storage('localStorage').get('token');

// cookie 操作
storage('cookie').set('token', token, { expires: 7 });
const token = storage('cookie').get('token');

// sessionStorage 操作
storage('sessionStorage').set('tempData', data);
```

#### 全局插件使用检查清单
- [ ] 使用 dayjs 时不重复配置插件（RelativeTime、utc、isoWeek、isToday 已全局配置）
- [ ] 使用 i18n 时通过 `useI18n()` 获取实例，不重新创建
- [ ] 使用存储 API 时使用封装的 `@/plugins/storage`，不直接使用原生 API
- [ ] 查看 `src/plugins/` 目录了解已有的全局配置
- [ ] 新增全局插件时，添加到 `src/plugins/` 目录并导出

## 📝 TypeScript 编码规范

### 接口定义规范
```typescript
// ✅ 正确：完整的接口定义
interface IUserInfo {
  id: string;
  username: string;
  email: string;
  roles: string[];
  avatar?: string;
}

// ❌ 错误：使用any类型
interface IBadUserInfo {
  data: any; // 应该定义具体类型
}
```

### 函数类型定义规范
```typescript
// ✅ 正确：完整的函数类型定义
const getUserInfo = async (userId: string): Promise<IUserInfo> => {
  return (await UserApi.getInfo(userId)).data;
};

// ✅ 泛型函数
const apiRequest = async <T>(url: string, params?: Record<string, any>): Promise<ApiResponse<T>> => {
  return (await instance.get(url, { params })).data;
};
```

### 枚举和常量定义
```typescript
// ✅ 使用const断言
export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

export type UserStatus = typeof USER_STATUS[keyof typeof USER_STATUS];

// ✅ 使用枚举
export enum ApiErrorCode {
  SUCCESS = 200,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
}
```

### 类型守卫和断言
```typescript
// ✅ 类型守卫
function isUserInfo(obj: any): obj is IUserInfo {
  return obj && typeof obj.id === 'string' && typeof obj.username === 'string';
}

// ❌ 错误：过度使用类型断言
const userInfo = response.data as IUserInfo; // 应该使用类型守卫
```

## 🎨 Vue 组件编码规范

> **详细规范**: 完整的 Vue 组件模式详见 [common-patterns.md#vue-组件模式](common-patterns.md#vue-组件模式)

### Composition API 规范
```vue
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { UserApi } from '@/api/modules/user';
import type { IUserInfo } from '@/interface/Api';

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

// ==================== 响应式数据 ====================
const userInfo = ref<IUserInfo | null>(null);
const loading = ref(false);

// ==================== 计算属性 ====================
const displayName = computed(() => userInfo.value?.username || '未知用户');

// ==================== 方法定义 ====================
const fetchUserInfo = async (): Promise<void> => {
  if (!props.userId) return;
  loading.value = true;
  try {
    const response = await UserApi.getInfo(props.userId);
    userInfo.value = response.data;
  } catch (err) {
    console.error('获取用户信息失败:', err);
  } finally {
    loading.value = false;
  }
};

// ==================== 生命周期和监听器 ====================
onMounted(() => fetchUserInfo());
watch(() => props.userId, (newId) => newId && fetchUserInfo());

// ==================== 暴露方法 ====================
defineExpose({ fetchUserInfo });
</script>
```

## 📊 常量定义规范

### 常量组织和命名
```typescript
// src/constants/system.ts

// ✅ 正确：使用大写字母和下划线
export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const DEFAULT_LOCALE = 'zh-CN';

// ✅ 对象常量使用 as const
export const PROXY_URI = {
  API: '/apiService',
  LOCAL: '/localService',
} as const;

export const URI = {
  LOCAL_V1: `${PROXY_URI.LOCAL}/local/v1`,
};

// ✅ 使用枚举
export enum LOCALE_TYPE {
  ZH_CN = 'zh-CN',
  EN_US = 'en-US',
}

// ❌ 错误：使用小写命名
export const maxFileSize = 10 * 1024 * 1024;
```

## 🔤 TypeScript类型定义规范

### 类型组织和命名
```typescript
// src/interface/system.ts

// ✅ 使用I前缀或描述性名称
export interface IUserInfo {
  id: string;
  username: string;
}

export type UserStatus = 'active' | 'inactive';
export type LocaleKey = 'zh-CN' | 'en-US';

// ❌ 错误：命名不清晰
export interface User {
  data: any;
}
```

## 🔧 工具函数编码规范

### 函数组织和命名
```typescript
// utils/date.ts - 日期工具函数
export function formatDate(date: Date, fmt: string): string {
  // 实现日期格式化
}

// utils/locale.ts - 语言包工具
import type { LocaleKey } from '@/interface/system';

export const getElementPlusLocale = (locale: LocaleKey) => {
  return locales[locale] || locales['zh-CN'];
};

// ❌ 错误：命名不清晰
export function format(d: any, f: any) {
  // 不清楚在格式化什么
}

// utils/index.ts - 统一导出
export * from './date';
export * from './locale';
```

## 🏪 状态管理规范 (Pinia)

### Store定义规范
```typescript
// stores/modules/user.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { UserApi } from '@/api/modules/user';
import type { IUserInfo, ILoginRequest } from '@/interface/Api';

export const useUserStore = defineStore('user', () => {
  // ==================== 状态定义 ====================
  const token = ref<string>('');
  const userInfo = ref<IUserInfo | null>(null);
  const permissions = ref<string[]>([]);

  // ==================== 计算属性 ====================
  const isLoggedIn = computed(() => !!token.value);
  const hasPermission = computed(() => (permission: string) => permissions.value.includes(permission));

  // ==================== 动作定义 ====================
  const login = async (credentials: ILoginRequest): Promise<void> => {
    const response = await UserApi.login(credentials);
    token.value = response.data.token;
    userInfo.value = response.data.userInfo;
    permissions.value = response.data.permissions;
    localStorage.setItem('token', token.value);
  };

  const logout = async (): Promise<void> => {
    await UserApi.logout();
    token.value = '';
    userInfo.value = null;
    permissions.value = [];
    localStorage.removeItem('token');
  };

  return {
    token, userInfo, permissions,
    isLoggedIn, hasPermission,
    login, logout,
  };
});
```

## 🌐 API开发规范 (基于Orval自动生成)

### ⚠️ 核心原则

> **完整的 Orval API 架构说明**: 详见 [api-development.md#核心架构决策](api-development.md#核心架构决策)

**项目使用 Orval 从 OpenAPI 文档自动生成 API 代码，核心原则：**

1. 🚫 **绝不修改** `src/api/generated/` 目录
2. ✅ **从 `@/api` 统一导入**（不直接从 `generated/` 导入）
3. ✅ **在 `src/api/custom/` 扩展**（需要时）
4. ✅ **优先使用 Pinia Store**（智能缓存）

### 1. API 导入规范

> **详细的导入规范和使用场景**: 详见 [api-development.md#api-使用规范](api-development.md#api-使用规范)

#### 代码风格规范

```typescript
// ✅ 正确：从 @/api 统一导入（API 函数和类型）
import { postAuthLogin, getAuthUserInfo } from '@/api';
import type { LoginRequest, UserInfo } from '@/api';

// ✅ 正确：导入 Pinia Store
import { useUserStore } from '@/store/modules/user';

// ❌ 错误：直接从 generated 导入
import { postAuthLogin } from '@/api/generated/auth/auth';
import type { LoginRequest } from '@/api/generated/model';
```

### 2. API 使用规范（快速参考）

> **完整的使用场景和示例**: 详见 [api-development.md#api-使用场景](api-development.md#api-使用场景)

#### 推荐方式: 使用 Pinia Store

```typescript
import { useUserStore } from '@/store/modules/user';
import { storeToRefs } from 'pinia';

// 使用 Store 管理状态
const userStore = useUserStore();
const { userInfo, loading } = storeToRefs(userStore);

// 调用 Store action
await userStore.loginAction({ username, password });
await userStore.fetchUserInfo();
```

#### 备选方式: 直接调用 API

```typescript
import { postAuthLogin, getAuthUserInfo } from '@/api';

const response = await postAuthLogin({ username, password });
const userInfo = await getAuthUserInfo();
```

---

## 🌐 HTTP 实例使用规范

```typescript
// ✅ 普通请求：使用自动生成的API
import { getAuthUserInfo } from '@/api';

// ✅ 特殊场景：直接使用HTTP实例
import { defaultHttp, downloadHttp } from '@/api/core/instances';

// 文件上传
await defaultHttp.post('/upload', formData, { timeout: 60000 });

// 文件下载
await downloadHttp.get('/files/report.pdf');
```

### 4. 类型定义规范

```typescript
// ✅ 正确：使用自动生成的类型
import type { LoginRequest, UserInfo } from '@/api';

const loginData: LoginRequest = {
  username: 'admin',
  password: '123456',
};

// ❌ 错误：重复定义已有类型
interface MyLoginRequest {  // 禁止！
  username: string;
  password: string;
}
```

### 5. API开发流程

```
1. 后端更新 → 2. 更新openapi.json → 3. pnpm api:gen
   ↓
4. pnpm api:hooks (可选) → 5. 在 custom/ 扩展（可选）
   ↓
6. pnpm type-check → 7. pnpm test
```

### API开发检查清单

- [ ] **绝不修改** `generated/` 目录
- [ ] 从 `@/api` 统一导入
- [ ] 优先使用Pinia Store
- [ ] 需要扩展时在 `custom/` 目录编写
- [ ] 使用生成的类型，不重复定义
- [ ] 在 `src/api/index.ts` 中正确导出

## 🛠️ 工具函数规范

### 工具函数定义
```typescript
// utils/date.ts
import dayjs from 'dayjs';

export class DateUtils {
  static format(date: Date | string | number, format = 'YYYY-MM-DD HH:mm:ss'): string {
    return dayjs(date).format(format);
  }

  static fromNow(date: Date | string | number): string {
    return dayjs(date).fromNow();
  }

  static isToday(date: Date | string | number): boolean {
    return dayjs(date).isSame(dayjs(), 'day');
  }
}

// utils/validation.ts
export class ValidationUtils {
  static isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  static isValidPhone(phone: string): boolean {
    return /^1[3-9]\d{9}$/.test(phone);
  }

  static getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
    if (password.length < 6) return 'weak';
    const score = [/[a-z]/, /[A-Z]/, /\d/, /[!@#$%^&*]/].filter(r => r.test(password)).length;
    return score >= 3 ? 'strong' : score >= 2 ? 'medium' : 'weak';
  }
}
```

## 📋 代码注释规范

### JSDoc注释规范
```typescript
/**
 * 用户管理服务类
 */
export class UserService {
  /**
   * 获取用户列表
   * @param params 查询参数
   * @returns Promise<用户列表响应>
   */
  async getUserList(params: IUserListParams): Promise<IPaginationResponse<IUserInfo>> {
    // 实现代码...
  }
}
```

### 行内注释规范
```typescript
// ✅ 正确：解释复杂逻辑
const processUserData = (users: IUserInfo[]) => {
  // 过滤活跃用户并按创建时间排序
  return users.filter(u => u.status === 'active').sort((a, b) => b.createdAt - a.createdAt);
};

// ❌ 错误：显而易见的注释
const count = users.length; // 获取用户数量
```

## 🎨 样式编码规范

> **详细规范**: 完整的样式规范详见 [common-patterns.md](common-patterns.md),包括:
> - [CSS 变量使用规范](common-patterns.md#css-变量使用规范)
> - [样式选择器规范](common-patterns.md#样式选择器规范)
> - [RGB 颜色函数规范](common-patterns.md#rgb-颜色函数规范)
> - [CSS 数值精度规范](common-patterns.md#css-数值精度规范)

### CSS变量使用规范（重要）

> **详细内容**: 详见 [common-patterns.md#css-变量使用规范](common-patterns.md#css-变量使用规范)

#### 核心原则
所有样式中的颜色**必须**使用 `public/theme.css` 中定义的 CSS 变量，**禁止硬编码颜色值**。

**⚠️ Figma 设计稿还原例外**: 当还原 Figma 设计稿时,如果设计稿中明确标注了颜色和尺寸数值,**优先使用 Figma 标注的数值**。只有在 Figma 没有明确标注时,才使用 CSS 变量。

**常用变量速查**:
- 文本颜色: `--colorTextHeading`, `--colorText`, `--colorTextSecondary`
- 背景颜色: `--colorBgContainer`, `--colorBgLayout`
- 边框颜色: `--colorBorder`, `--colorBorderSecondary`
- 主题色: `--colorPrimary`, `--colorSuccess`, `--colorError`

**样式选择器规范**:
- ❌ 禁止直接使用标签选择器（如 `h1`, `p`, `div`）
- ✅ 为每个元素添加语义化的 class 名称
- ✅ 使用 BEM 命名规范
- ✅ 样式嵌套不超过 3 层

详细使用方法和示例见 [common-patterns.md#css-变量使用规范](common-patterns.md#css-变量使用规范) 和 [common-patterns.md#样式选择器规范](common-patterns.md#样式选择器规范)

### CSS数值精度规范（重要）

所有CSS数值中的小数必须保留3位小数，确保样式还原的精确性。

```scss
// ✅ 正确：小数保留3位
.component {
  font-size: 14.375px;
  line-height: 1.429em;
  opacity: 0.880;
  color: rgb(0 0 0 / 0.880);
}

// ❌ 错误：小数位数不一致
.component {
  line-height: 1.42em;    // 应为 1.420em
  opacity: 0.88;          // 应为 0.880
}

// ✅ 整数不加小数点
.component {
  width: 100px;
  height: 50px;
}
```

### Vue 3 :deep() 选择器规范

`:deep()` 内部禁止使用 BEM 后缀（`&--modifier`、`&__element`），会导致编译错误。

```scss
// ❌ 错误：编译为 :deep(.van-button)--primary (无效)
:deep(.van-button) {
  &--primary { ... }
}

// ✅ 正确：BEM 变体单独写
:deep(.van-button) { ... }
:deep(.van-button--primary) { ... }
:deep(.van-button__text) { ... }

// ✅ 允许：伪类、状态类、子选择器
:deep(.van-button) {
  &:hover { ... }      // ✅ 伪类
  &.is-active { ... }  // ✅ 状态类
  .icon { ... }        // ✅ 子选择器
}
```

### SCSS组织规范
```scss
// ❌ 不要定义颜色变量，使用 public/theme.css 中的CSS变量
// $primary-color: #409eff;  // 禁止！

// ✅ 可以定义非颜色的变量和混入
$spacing-sm: 8px;
$spacing-md: 16px;
$spacing-lg: 24px;

@mixin flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}

@mixin card-style {
  padding: $spacing-lg;
  border: 1px solid var(--colorBorder);
  border-radius: 8px;
  background: var(--colorBgContainer);
}

// ✅ 正确：组件样式使用BEM命名
.user-management {
  &__header {
    @include flex-center;
    justify-content: space-between;
  }

  &__content {
    @include card-style;
  }
}
```

## 🔍 错误处理规范

### 统一错误处理
```typescript
// utils/error.ts
export class AppError extends Error {
  constructor(message: string, public code: string, public statusCode = 500) {
    super(message);
    this.name = 'AppError';
  }
}

export const handleApiError = (error: any): AppError => {
  if (error.response) {
    return new AppError(error.response.data.message || '服务器错误', 'SERVER_ERROR', error.response.status);
  }
  if (error.request) {
    return new AppError('网络连接失败', 'NETWORK_ERROR', 0);
  }
  return new AppError(error.message || '未知错误', 'UNKNOWN_ERROR', 500);
};

// 在组件中使用
const fetchUserData = async () => {
  try {
    userList.value = (await UserApi.getUserList()).data;
  } catch (error) {
    showToast(handleApiError(error).message);
  }
};
```

## 📋 编码规范快速检查清单

### TypeScript 类型安全检查
- [ ] 所有变量都有明确的类型定义，避免使用 `any`
- [ ] 接口定义完整，包含所有必要字段和注释
- [ ] 函数参数和返回值类型明确
- [ ] 使用类型守卫而不是类型断言
- [ ] 泛型使用合理，提高代码复用性
- [ ] 导入类型时使用 `type` 关键字

### Vue组件规范检查
- [ ] Props 和 Emits 有完整的类型定义
- [ ] 响应式数据类型明确，避免类型推断错误
- [ ] 计算属性有返回类型注解
- [ ] 异步函数有完善的错误处理
- [ ] 生命周期钩子使用合理
- [ ] 模板中使用 `v-key` 进行列表渲染
- [ ] 列表内容使用数据驱动而非硬编码

### API接口规范检查
- [ ] 接口方法有完整的 JSDoc 注释
- [ ] 参数验证完善，包含边界条件检查
- [ ] 错误处理机制统一
- [ ] 返回值类型定义完整
- [ ] 使用统一的响应格式
- [ ] 异步操作有超时和重试机制

### 样式编码检查（强化）
- [ ] 使用 `public/theme.css` 中定义的 CSS 变量
- [ ] 所有颜色值使用 `var(--colorXxx)` 而非硬编码（Figma 设计稿还原除外：优先使用 Figma 标注值）
- [ ] CSS数值小数保留3位（如 14.375px、1.429em、0.880）
- [ ] 不直接使用标签名选择器（如 `h1`, `p`, `div`）
- [ ] 每个元素都有语义化的 class 名称
- [ ] 样式类名遵循 BEM 命名规范
- [ ] 响应式设计适配多种屏幕尺寸
- [ ] 使用语义化的样式组织
- [ ] 避免深层嵌套选择器（不超过3层）
- [ ] 样式性能优化（避免复杂选择器）

### 图片资源管理检查
- [ ] 图片按页面/功能分类存放在 `src/assets/images/` 目录
- [ ] 图标存放在 `src/assets/icons/` 目录
- [ ] 下载前检查本地是否已存在
- [ ] 使用导入方式加载图片而非硬编码路径
- [ ] 图片文件命名语义化

## 🛠️ 代码质量工具

### 常用命令
```bash
# ESLint 检查
pnpm lint
pnpm lint:fix

# TypeScript 类型检查
pnpm type-check

# Stylelint 样式检查
pnpm stylelint "src/**/*.{vue,scss,css}" --fix
```

---

通过遵循这些编码规范，可以确保代码的一致性、可读性和可维护性，为AI编程提供清晰的指导标准。
