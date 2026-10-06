# API 模块使用指南

## 概述

本项目 API 层基于 **Alova.js + Orval** 构建：

- **Alova.js**: 轻量级请求库，支持 UniApp 多端（H5/小程序/App）
- **Orval**: 从 OpenAPI 文档自动生成 TypeScript API 代码

### 核心特性

- **自动代码生成**: 从 OpenAPI 文档生成 TypeScript API 函数和类型
- **类型安全**: 完整的 TypeScript 支持
- **多端兼容**: 通过 `@alova/adapter-uniapp` 支持所有 UniApp 平台
- **请求合并**: 进行中的相同请求自动合并，响应结果默认不缓存
- **统一拦截**: Token 注入、错误处理、Loading 状态
- **灵活扩展**: 支持覆盖生成代码或添加自定义接口

---

## 目录结构

```
src/api/
├── core/                      # 核心层
│   ├── alova.ts              # Alova 实例配置
│   │                         # - 请求/响应拦截器
│   │                         # - Token 自动注入
│   │                         # - 401 统一处理
│   │                         # - 请求合并（不缓存）
│   ├── mutator.ts            # Orval 适配器
│   │                         # - 连接生成代码和 Alova
│   │                         # - 自动提取 data 字段
│   └── index.ts              # 统一导出
│
├── generated/                 # Orval 自动生成（禁止手动修改）
│   ├── auth/                 # 认证模块
│   ├── config/               # 配置模块
│   ├── ...                   # 其他按 tag 拆分的模块
│   └── model/                # 类型定义
│
├── custom/                    # 自定义扩展（手动编写）
│   ├── external.ts           # 外部 API 调用示例
│   └── override.ts           # 覆盖生成 API 示例
│
└── index.ts                  # API 模块统一导出（由 pnpm api:gen 生成）
```

OpenAPI 文档不在仓库中，`orval.config.ts` 的 `input.target` 直接拉取后端在线文档。

---

## 快速开始

### 1. 生成 API 代码

```bash
pnpm api:gen
```

### 2. 基础使用

```vue
<script setup lang="ts">
import { loginWithEmail, getCurrentUser } from '@/api';
import type { AuthEmailLoginDto } from '@/api';

const handleLogin = async () => {
  const loginData: AuthEmailLoginDto = {
    email: 'user@example.com',
    password: 'md5-encrypted-password',
  };
  const response = await loginWithEmail(loginData);
  console.log('Token:', response.token);
  const user = await getCurrentUser();
  console.log('昵称:', user.nickname);
};
</script>
```

### 3. 使用 Hooks（Alova 特性）

```vue
<template>
  <view v-if="loading">加载中...</view>
  <view v-else-if="error">{{ error.message }}</view>
  <view v-else>{{ data?.data?.nickname }}</view>
</template>

<script setup lang="ts">
import { useRequest, http } from '@/api';
import type { ApiResponse, User } from '@/api';

const { loading, data, error } = useRequest(
  http.Get<ApiResponse<User>>('/api/v1/auth/me')
);
</script>
```

`http` 实例返回完整的 `ApiResponse`（`{ code, data, message }`），业务数据在 `data` 字段；Orval 生成的函数经 `customMutator` 提取 `data`，直接返回业务数据。

---

## 三种使用场景

### 场景 1: 直接使用自动生成（80%）

```typescript
import { loginWithEmail, getCurrentUser } from '@/api';

await loginWithEmail({ email: 'user@example.com', password: 'md5-encrypted-password' });
await getCurrentUser();
```

### 场景 2: 自定义 API（15%）

OpenAPI 中不存在的接口（如外部 API），参考 `custom/external.ts`：第三方服务单独创建 alova 实例，不注入业务 Token、不走业务的 401 刷新与 code 校验。

```typescript
// src/api/custom/external.ts
const externalHttp = createAlova({
  timeout: 10000,
  ...AdapterUniapp(),
  responded: { /* 只校验 HTTP 状态码，返回原始响应体 */ },
  cacheFor: null,
});

export const getWeather = async (city: string): Promise<WeatherResponse> => {
  return externalHttp.Get<WeatherResponse>(`https://api.weather.example.com/weather/${encodeURIComponent(city)}`, {
    cacheFor: 10 * 60 * 1000, // 缓存 10 分钟
  });
};
```

### 场景 3: 覆盖生成 API（5%）

在生成的 API 基础上调整请求参数或添加业务逻辑，函数名与生成的保持一致（`pnpm api:gen` 会让 `src/api/index.ts` 跳过 generated 中的同名导出）。参考 `custom/override.ts`：

```typescript
// src/api/custom/override.ts
import { customMutator } from '../core/mutator';
import type { RefreshResponseDto } from '../generated/model';

export const refreshToken = (refreshTokenValue: string) => {
  return customMutator<RefreshResponseDto>(
    { url: `/api/v1/auth/refresh`, method: 'POST' },
    { headers: { Authorization: `Bearer ${refreshTokenValue}` }, skipAuthHandling: true, showError: false },
  );
};
```

---

## 核心配置

### http 实例 (alova.ts)

```typescript
import { http } from '@/api';

// GET 请求（不缓存，进行中的相同请求合并）
const data = await http.Get('/api/v1/users');

// POST 请求（不合并）
const result = await http.Post('/api/v1/users', { name: 'test' });

// 带配置
const list = await http.Get('/api/v1/users', {
  params: { page: 1 },
  meta: {
    showLoading: true,
    loadingText: '加载中...',
    showError: false,
  },
});
```

### 请求配置 (meta)

| 参数 | 类型 | 说明 |
|------|------|------|
| `showLoading` | boolean | 显示 loading |
| `loadingText` | string | loading 文字 |
| `showError` | boolean | 显示错误提示（默认 true） |
| `skipAuthHandling` | boolean | 401 时不刷新 Token、不清理登录态，直接抛错（刷新、登出等认证接口使用） |

### 缓存配置

`alova.ts` 中全局 `cacheFor: null`，不缓存响应结果；只有进行中的相同 GET/HEAD 请求会被合并（`shareRequest`），其他方法的请求不合并。

---

## Alova Hooks

从 `@/api` 导出的 Hooks（来自 `alova/client`）：

### useRequest

```typescript
import { useRequest, http } from '@/api';

const {
  loading,    // 加载状态
  data,       // 响应数据
  error,      // 错误信息
  send,       // 手动触发
  onSuccess,  // 成功回调
  onError,    // 失败回调
} = useRequest(http.Get('/api/v1/users'), {
  immediate: true, // 立即执行（默认 true）
});
```

### useWatcher

监听数据变化自动请求：

```typescript
import { useWatcher, http } from '@/api';

const keyword = ref('');
const { loading, data } = useWatcher(
  () => http.Get('/api/v1/regions', { params: { keyword: keyword.value } }),
  [keyword],
  { debounce: 300 }
);
```

### useFetcher

预加载数据：

```typescript
import { useFetcher, http } from '@/api';

const { fetch } = useFetcher();
fetch(http.Get('/api/v1/users/123')); // 预加载
```

---

## 注意事项

### 1. 不要修改生成代码

```
不要编辑 src/api/generated/ 目录
在 src/api/custom/ 创建覆盖文件
```

### 2. 统一从 @/api 导入

```typescript
// 正确
import { loginWithEmail } from '@/api';
import type { AuthEmailLoginDto } from '@/api';

// 错误
import { loginWithEmail } from '@/api/generated/auth/auth';
```

### 3. 自定义 API 使用 http

```typescript
// 正确：业务接口使用 http（隐藏 Alova 实现）
import { http } from '@/api';

// 避免：业务接口直接导入 alova（第三方服务的独立实例见 custom/external.ts）
import { createAlova } from 'alova';
```

---

## 常用命令

```bash
pnpm api:gen      # 生成 API 代码
pnpm type-check   # 类型检查
```

---

## 相关文件

| 文件 | 说明 |
|------|------|
| `core/alova.ts` | Alova 实例配置 |
| `core/mutator.ts` | Orval 适配器 |
| `orval.config.ts` | Orval 代码生成配置 |
| `custom/external.ts` | 外部 API 示例 |
| `custom/override.ts` | 覆盖 API 示例 |
