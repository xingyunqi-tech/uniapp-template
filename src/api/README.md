# API 模块使用指南

## 📖 概述

本项目构建了一套完整的 API 管理体系，基于 **Orval** 自动生成 + **自定义扩展**，实现了：

### 核心特性

- ✅ **自动代码生成**：从 OpenAPI 文档生成 TypeScript API 函数和类型定义
- ✅ **类型安全**：完整的 TypeScript 支持，编译时捕获错误
- ✅ **模块化架构**：类型定义分文件存储，避免单文件过大
- ✅ **多实例管理**：default（普通请求）、download（文件下载）
- ✅ **请求拦截器**：自动注入 Token、统一错误处理
- ✅ **请求去重**：防止短时间内重复提交
- ✅ **请求取消**：支持主动取消请求
- ✅ **重试机制**：网络错误、超时自动重试
- ✅ **灵活扩展**：支持覆盖生成代码或添加自定义接口
- ✅ **错误处理**：统一的错误处理机制，自动显示提示
- ✅ **开发效率**：减少 80% 的样板代码

---

## 📁 目录结构

```
src/api/
├── core/                      # 核心基础设施层
│   ├── http.ts               # HttpClient 类（Axios 增强封装）
│   │                         # - 支持拦截器链
│   │                         # - 请求取消机制
│   │                         # - 自动重试（网络错误、超时）
│   │                         # - 多实例管理
│   ├── mutator.ts            # Orval 适配器
│   │                         # - 连接生成代码和 HttpClient
│   │                         # - 请求去重（防止重复提交）
│   │                         # - 实例切换（default/download）
│   │                         # - 自动提取 result 字段
│   ├── interceptors/         # 拦截器
│   │   ├── request.ts       # 请求拦截器（自动注入 Token）
│   │   └── response.ts      # 响应拦截器（业务错误处理）
│   ├── instances/            # 多实例管理
│   │   ├── default.ts       # 默认实例（普通 API，6s 超时）
│   │   ├── download.ts      # 下载实例（文件下载，120s 超时，blob）
│   │   └── index.ts         # 实例统一导出
│   ├── utils/
│   │   └── requestKey.ts    # 请求唯一键生成（支持哈希优化）
│   └── index.ts              # 核心模块统一导出
│
├── generated/                 # 代码生成层（Orval 自动生成）
│   ├── auth/                 # 认证模块
│   │   └── auth.ts           # 登录、登出、获取用户信息等接口
│   ├── config/               # 配置模块
│   │   └── config.ts         # 系统配置相关接口
│   └── model/                # 类型定义（分文件存储）
│       ├── index.ts          # 统一导出所有类型
│       ├── loginRequest.ts   # 登录请求类型
│       ├── loginResponse.ts  # 登录响应类型
│       ├── userInfo.ts       # 用户信息类型
│       ├── configValue.ts    # 配置值类型
│       ├── apiResponse.ts    # 通用响应类型
│       └── ...               # 其他类型文件（自动生成）
│
├── custom/                    # 自定义扩展层（手动编写）
│   ├── external.ts           # ⭐ 示例：调用外部 API
│   └── override.ts           # ⭐ 示例：覆盖生成的 API
│                             #
│                             # 注意：这些是示例文件，实际使用时可根据需要替换或新增
│
├── openapi.json              # OpenAPI 文档
├── index.ts                  # API 模块统一导出
└── README.md                 # 本文档
```

---

## 🏗️ 架构设计

### 四层架构

#### 1. 核心基础设施层 (core/)

**HttpClient 类** (`http.ts:59-478`)
- 基于 Axios 的增强型 HTTP 客户端
- 支持多种拦截器（请求、响应、错误）
- 请求取消机制（基于 AbortController）
- 自动重试机制（可配置重试次数、延迟、条件）
- 请求唯一键管理（用于取消和去重）

**Mutator 适配器** (`mutator.ts:109-175`)
- 连接 Orval 生成代码和 HttpClient
- 请求去重管理（防止重复提交）
- 实例切换（default/download）
- 自动提取 `result` 字段

**拦截器系统** (`interceptors/`)
- 请求拦截器：自动注入 Token (`request.ts:12-25`)
- 响应拦截器：业务错误处理 (`response.ts:12-41`)

**多实例管理** (`instances/`)
- default：普通 API 请求（6s 超时）
- download：文件下载（120s 超时，responseType: blob）
- 支持扩展自定义实例

#### 2. 代码生成层 (generated/)

- 由 Orval 从 OpenAPI 文档自动生成
- 按模块（tag）拆分文件
- 类型定义独立文件存储
- **不要手动修改**

#### 3. 自定义扩展层 (custom/)

- **新增场景**：OpenAPI 中不存在的接口（如 `external.ts` 调用外部 API）
- **覆盖场景**：扩展生成的 API（如 `override.ts` 覆盖登录逻辑）

**注意**: `external.ts` 和 `override.ts` 是示例文件，实际使用时可根据需要替换或新增

---

## 🚀 快速开始

### 1. 生成 API 代码

```bash
# 自动生成 API 代码（从 openapi.json）
pnpm api:gen

# 监听模式（开发时使用）
pnpm api:watch
```

### 2. 基础使用

```vue
<script setup lang="ts">
import { postAuthLogin, getAuthUserInfo } from '@/api';
import type { LoginRequest } from '@/api';

// ✅ 类型安全的登录
const handleLogin = async () => {
  const loginData: LoginRequest = {
    username: 'admin',
    password: '123456',
  };

  const response = await postAuthLogin(loginData);
  console.log('Token:', response.token); // ✅ 自动类型推导
};

// ✅ 获取用户信息
const getUserInfo = async () => {
  const userInfo = await getAuthUserInfo();
  console.log('User:', userInfo); // ✅ UserInfo 类型
};
</script>
```

---

## 📝 三种使用场景

### 场景 1: 直接使用自动生成（80% 情况）

大部分接口直接使用 Orval 生成的代码即可。

```typescript
// 直接从 @/api 导入
import { postAuthLogin, getAuthUserInfo, postAuthLogout } from '@/api';

// 使用
await postAuthLogin({ username: 'admin', password: '123' });
await getAuthUserInfo();
await postAuthLogout();
```

### 场景 2: 新增自定义 API（15% 情况）

OpenAPI 文档中不存在的接口，如调用外部 API、WebSocket 等。

**示例：调用外部天气 API** (参考 `custom/external.ts`)

```typescript
// src/api/custom/weather.ts
import { defaultHttp } from '../core/instances';

export const getWeather = async (city: string) => {
  return defaultHttp.get(`/weather/${city}`, {
    baseURL: 'https://api.weather.example.com',
    headers: {
      'X-API-Key': process.env.VITE_WEATHER_API_KEY || '',
    },
  });
};
```

**使用：**

```typescript
import { getWeather } from '@/api';

const weather = await getWeather('beijing');
console.log(weather);
```

---

### 场景 3: 覆盖生成的 API（5% 情况）

在生成的 API 基础上添加额外业务逻辑。

**示例：覆盖登录 API 添加自动存储 Token** (参考 `custom/override.ts`)

```typescript
// src/api/custom/auth.ts
import { login as generatedLogin } from '../generated/user-management/user-management';
import { storage } from '@/utils/storage';

export const login = async (data: LoginRequest) => {
  const response = await generatedLogin(data);

  // 添加业务逻辑
  if (response.token) {
    storage.set('token', response.token);
  }

  return response;
};
```

**使用：**

```typescript
import { login } from '@/api';  // 自动使用覆盖版本

await login({ username: 'admin', password: '123456' });
// Token 已自动存储
```

---

## 🎨 多实例使用

项目提供 2 种不同配置的 HTTP 实例，用于不同场景：

| 实例 | 用途 | 配置特点 |
|------|------|----------|
| **defaultHttp** | 普通 API 请求 + 文件上传 | 默认超时 6s，可自定义 |
| **downloadHttp** | 文件下载 | 超时 120s，responseType: blob |

### 使用示例

#### 1. 默认实例（普通请求 + 文件上传）

```typescript
import { defaultHttp } from '@/api/core/instances';

// 普通请求
const userInfo = await defaultHttp.get('/users/123');
const result = await defaultHttp.post('/users', { username: 'admin' });

// 文件上传（使用自定义超时）
import { uploadWithProgress } from '@/api';

await uploadWithProgress(file, (progress) => {
  console.log(`上传进度: ${progress}%`);
});
```

#### 2. 下载实例（文件下载）

```typescript
import { downloadFile } from '@/api';

await downloadFile('/files/report.pdf', 'report.pdf');
```

#### 3. 外部 API 调用

对于外部第三方 API，可以使用 defaultHttp 实例并指定 baseURL：

```typescript
import { defaultHttp } from '@/api/core/instances';

const weather = await defaultHttp.get('/weather/beijing', {
  baseURL: 'https://api.weather.com',
});
```

### 自定义实例配置

如需添加新实例，在 `core/instances/` 目录创建新文件：

```typescript
// core/instances/microservice.ts

import { HttpClient } from '../http';
import { requestInterceptor, requestErrorInterceptor } from '../interceptors/request';
import { responseSuccessInterceptor, responseErrorInterceptor } from '../interceptors/response';

// 使用构造函数直接传入拦截器（推荐）
export const microserviceHttp = new HttpClient(
  {
    baseURL: '/microservice-a',
    timeout: 10000,
  },
  {
    requestInterceptor,
    requestErrorInterceptor,
    responseInterceptor: responseSuccessInterceptor,
    responseErrorInterceptor,
  }
);
```

然后在 `core/instances/index.ts` 中导出：

```typescript
export { microserviceHttp } from './microservice';

export const instances = {
  default: defaultHttp,
  download: downloadHttp,
  microservice: microserviceHttp, // 新增
} as const;

export type InstanceType = keyof typeof instances;
```

---

## 🛡️ 高级特性

### 1. 统一错误处理

项目使用集中式错误处理机制（`src/utils/errorHandler.ts`），所有 API 错误都会被自动处理：

**错误类型分类：**
- 🔴 **网络错误**（NETWORK）：无法连接服务器、DNS 解析失败等
- 🟡 **请求错误**（REQUEST）：请求配置错误、超时、取消等
- 🟠 **认证错误**（AUTH）：401 未登录，自动跳转登录页
- 🟣 **权限错误**（PERMISSION）：403 无权限访问
- 🔵 **业务错误**（BUSINESS）：400 参数错误等业务异常
- ⚫ **服务器错误**（SERVER）：500+ 服务器内部错误

**自动处理：**
- ✅ 自动显示错误提示（Vant showToast/showNotify）
- ✅ 认证错误自动清除 Token 并跳转登录页
- ✅ 服务器错误使用通知而非消息（更醒目）
- ✅ 记录详细错误日志到控制台

**使用示例：**

```typescript
import { postAuthLogin } from '@/api';

try {
  const response = await postAuthLogin({ username, password });
  // 成功处理
} catch (error) {
  // 错误已被拦截器自动处理（显示提示、跳转等）
  // 这里只需处理组件特定逻辑即可
  console.error('Login failed:', error);
}
```

**自定义错误处理：**

```typescript
import { handleError, handleErrorSilently, ErrorType } from '@/utils/errorHandler';

// 显示自定义错误消息
handleError(error, {
  message: '自定义错误提示',
  type: ErrorType.BUSINESS,
  useNotification: true, // 使用通知而非消息
});

// 静默处理（不显示提示）
handleErrorSilently(error);
```

### 2. 类型定义分模块存储

为避免单个 `index.schemas.ts` 文件过大，项目将类型定义拆分为独立文件：

**目录结构：**
```
generated/
└── model/
    ├── index.ts              # 统一导出所有类型
    ├── loginRequest.ts       # 单个类型文件
    ├── loginResponse.ts
    ├── userInfo.ts
    ├── configValue.ts
    └── ...
```

**优势：**
- ✅ 避免单文件过大，提升编辑器性能
- ✅ 类型更易查找和维护
- ✅ Git diff 更清晰，减少冲突
- ✅ 每个类型独立文件，便于版本控制

**使用方式：**
```typescript
// ✅ 推荐：从 @/api 统一导入
import type { LoginRequest, UserInfo, ConfigValue } from '@/api';

// ✅ 也可以从 model 直接导入（高级用法）
import type { LoginRequest } from '@/api/generated/model';
```

### 3. 请求去重（Request Deduplication）

**自动防止重复提交** (`mutator.ts:80-175`)

项目内置请求去重机制，防止短时间内发起相同的请求（例如用户快速双击提交按钮）。

**特性：**
- ✅ 自动启用（POST/PUT/PATCH/DELETE 请求）
- ✅ 基于请求特征（method + url + params + data）生成唯一键
- ✅ 相同请求共享同一个 Promise
- ✅ 请求完成后自动清理
- ✅ 支持手动禁用

**使用示例：**

```typescript
import { postUserCreate } from '@/api';

// ✅ 默认启用去重
// 如果用户快速点击两次，第二次会复用第一次的请求
const handleSubmit = async () => {
  await postUserCreate({ username: 'test' });
};

// ✅ 手动禁用去重（某些场景需要允许重复请求）
import { customMutator } from '@/api/core/mutator';

await customMutator({
  method: 'post',
  url: '/logs',
  data: logData,
  disableDedup: true, // 禁用去重
});
```

**手动清理所有待处理请求：**

```typescript
import { clearPendingRequests } from '@/api/core/mutator';

// 路由切换时清理所有待处理的请求
router.beforeEach(() => {
  clearPendingRequests();
});
```

### 4. 请求取消 (Request Cancellation)

**主动取消请求** (`http.ts:277-296`)

支持取消单个或所有正在进行的请求：

```typescript
import { defaultHttp } from '@/api/core/instances';

// 取消指定请求
defaultHttp.cancelRequest('GET-/users/list');

// 取消所有请求
defaultHttp.cancelAllRequests('用户退出登录');

// 判断是否为取消错误
import { HttpClient } from '@/api/core/http';

try {
  await defaultHttp.get('/users');
} catch (error) {
  if (HttpClient.isCancel(error)) {
    console.log('请求已取消');
  }
}
```

### 5. 自动重试机制

**网络错误自动重试** (`http.ts:322-406`)

HttpClient 支持配置重试机制：

```typescript
import { defaultHttp } from '@/api/core/instances';

// 使用重试配置
const response = await defaultHttp.get('/api/data', {
  retry: {
    retries: 3,              // 重试 3 次
    retryDelay: 1000,        // 延迟 1 秒
    retryCondition: (error) => {
      // 自定义重试条件
      return error.response?.status === 503;
    },
  },
});
```

**默认重试条件：**
- 网络错误（无响应）
- 408 Request Timeout
- 429 Too Many Requests
- 500 Internal Server Error
- 502 Bad Gateway
- 503 Service Unavailable
- 504 Gateway Timeout

---

## 🎨 Pinia Store 状态管理

本项目使用 **Pinia** 进行状态管理，配合 Orval 自动生成的 API 函数。

### 使用 Store 管理状态

```vue
<script setup lang="ts">
import { useUserStore } from '@/store/modules/user';
import { computed } from 'vue';

const userStore = useUserStore();

// 获取状态
const userInfo = computed(() => userStore.userInfo);
const isLoading = computed(() => userStore.loading);

// 调用 action
const handleLogin = async () => {
  try {
    await userStore.login({
      username: 'admin',
      password: '123456',
    });
    console.log('登录成功');
  } catch (error) {
    console.error('登录失败', error);
  }
};
</script>

<template>
  <div v-if="isLoading">加载中...</div>
  <div v-else>{{ userInfo?.username }}</div>
</template>
```

### Store 设计模式

```typescript
// src/store/modules/user.ts
import { defineStore } from 'pinia';
import { postAuthLogin, getAuthUserInfo } from '@/api';
import type { LoginRequest, UserInfo } from '@/api';

export const useUserStore = defineStore('user', () => {
  const userInfo = ref<UserInfo | null>(null);
  const loading = ref(false);

  const login = async (data: LoginRequest) => {
    loading.value = true;
    try {
      const response = await postAuthLogin(data);
      // 处理登录逻辑
      return response;
    } finally {
      loading.value = false;
    }
  };

  return { userInfo, loading, login };
});
```

**优势：**
- ✅ 完整的 TypeScript 支持
- ✅ Composition API 风格，易于理解
- ✅ 响应式状态管理
- ✅ 完全类型安全（从 Orval 生成的类型）

---

## 🔧 开发流程

### 后端 API 有更新

```bash
# 1. 更新 OpenAPI 文档（手动替换或从后端拉取）
# 将新的 openapi.json 放到 src/api/openapi.json

# 2. 重新生成代码
pnpm api:gen

# 3. 检查生成的代码
# 查看 src/api/generated/ 目录

# 4. 如果需要自定义某个接口
# 在 src/api/custom/ 创建对应文件
```

### 添加自定义接口

```bash
# 1. 在 custom/ 目录创建文件
# src/api/custom/my-feature.ts

# 2. 编写自定义逻辑
# 可以覆盖或新增接口

# 3. 在 index.ts 中导出
# export * from './custom/my-feature';

# 4. 在组件中使用
# import { myCustomFunction } from '@/api';
```

---

## ⚠️ 注意事项

### 1. 不要手动修改生成的代码

```
❌ 不要编辑 src/api/generated/ 目录下的文件
✅ 如需自定义，在 src/api/custom/ 创建覆盖文件
```

### 3. 类型导入

```typescript
// ✅ 正确：从 @/api 导入类型
import type { LoginRequest, UserInfo } from '@/api';

// ❌ 错误：不要从 generated 直接导入
import type { LoginRequest } from '@/api/generated/model';
```

### 4. 构建前自动生成

```bash
# package.json 中已配置
"build": "... && npm run api:gen && vite build"

# 确保构建前代码是最新的
```

---

## 🎯 最佳实践

### 1. 函数命名规范

Orval 自动生成的函数遵循：`{method}{Path}` 格式

```typescript
postAuthLogin      // POST /auth/login
getAuthUserInfo    // GET /auth/userinfo
deleteUserById     // DELETE /user/{id}
```

### 2. 覆盖时保持导出一致

```typescript
// ✅ 好的做法
export const postAuthLogin = async (...) => { ... };
export { postAuthLogout, getAuthUserInfo } from '../generated/auth/auth';

// ❌ 避免
export const login = async (...) => { ... }; // 改了函数名
```

### 3. 类型复用

```typescript
// ✅ 使用生成的类型
import type { LoginRequest, LoginResponse } from '@/api';

// ❌ 避免重复定义
interface MyLoginRequest { ... }
```

### 4. 错误处理

```typescript
import { postAuthLogin } from '@/api';

try {
  const response = await postAuthLogin({ username, password });
  // 成功处理
} catch (error) {
  // 错误已被响应拦截器处理
  console.error('Login failed:', error);
}
```

### 5. 使用 Pinia Store 管理状态

```typescript
// ✅ 推荐：使用 Pinia Store 管理状态
import { useUserStore } from '@/store/modules/user';

const userStore = useUserStore();
await userStore.fetchUserInfo();
const userInfo = userStore.userInfo;

// ⚠️ 可选：直接调用 API 函数（简单场景）
import { getAuthUserInfo } from '@/api';

const userInfo = await getAuthUserInfo();
```

---

## 📚 常用命令

```bash
# 生成 API 代码
pnpm api:gen

# 监听模式（开发时）
pnpm api:watch

# 类型检查
pnpm type-check

# 构建（自动生成 + 构建）
pnpm build
```

---

## 🔗 相关文件

### 核心模块
- `core/http.ts` - HttpClient 类定义
- `core/mutator.ts` - Orval 适配器
- `core/interceptors/request.ts` - 请求拦截器
- `core/interceptors/response.ts` - 响应拦截器
- `core/instances/` - HTTP 实例配置
- `core/utils/requestKey.ts` - 请求键生成工具

### 配置文件
- `orval.config.ts` - Orval 代码生成配置
- `scripts/api/generate-hooks.ts` - Hooks 生成脚本

### 自定义扩展
- `custom/external.ts` - 外部 API 调用示例
- `custom/override.ts` - 覆盖生成 API 示例

### 生成代码
- `generated/auth/auth.ts` - 认证模块 API
- `generated/config/config.ts` - 配置模块 API
- `generated/model/` - 类型定义

---

## 🎉 总结

通过 Orval 自动化方案，你可以：

1. ✅ **无需手写样板代码** - 自动生成，节省时间
2. ✅ **类型安全** - 编译时捕获错误
3. ✅ **多实例支持** - 不同场景使用不同配置
4. ✅ **请求去重** - 防止重复提交
5. ✅ **请求取消** - 支持主动取消
6. ✅ **自动重试** - 网络错误自动重试
7. ✅ **灵活定制** - 覆盖或新增任意接口
8. ✅ **Pinia Store 集成** - 响应式状态管理
9. ✅ **统一错误处理** - 自动显示提示、跳转登录
10. ✅ **团队协作** - 统一规范，减少沟通成本

开始享受自动化带来的便利吧！ 🚀
