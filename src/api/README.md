# API 模块使用指南

## 概述

本项目 API 层基于 **Alova.js + Orval** 构建：

- **Alova.js**: 轻量级请求库，支持 UniApp 多端（H5/小程序/App）
- **Orval**: 从 OpenAPI 文档自动生成 TypeScript API 代码

### 核心特性

- **自动代码生成**: 从 OpenAPI 文档生成 TypeScript API 函数和类型
- **类型安全**: 完整的 TypeScript 支持
- **多端兼容**: 通过 `@alova/adapter-uniapp` 支持所有 UniApp 平台
- **请求缓存**: GET 请求自动缓存 5 分钟
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
│   │                         # - 缓存配置
│   ├── mutator.ts            # Orval 适配器
│   │                         # - 连接生成代码和 Alova
│   │                         # - 自动提取 data 字段
│   └── index.ts              # 统一导出
│
├── generated/                 # Orval 自动生成（禁止手动修改）
│   ├── auth/                 # 认证模块
│   ├── config/               # 配置模块
│   └── model/                # 类型定义
│
├── custom/                    # 自定义扩展（手动编写）
│   ├── external.ts           # 外部 API 调用示例
│   └── override.ts           # 覆盖生成 API 示例
│
├── openapi.json              # OpenAPI 文档
└── index.ts                  # API 模块统一导出
```

---

## 快速开始

### 1. 生成 API 代码

```bash
pnpm api:gen
```

### 2. 基础使用

```vue
<script setup lang="ts">
import { postAuthLogin, getAuthUserInfo } from '@/api';
import type { LoginRequest } from '@/api';

const handleLogin = async () => {
  const loginData: LoginRequest = {
    username: 'admin',
    password: '123456',
  };
  const response = await postAuthLogin(loginData);
  console.log('Token:', response.token);
};
</script>
```

### 3. 使用 Hooks（Alova 特性）

```vue
<template>
  <view v-if="loading">加载中...</view>
  <view v-else-if="error">{{ error.message }}</view>
  <view v-else>{{ data?.username }}</view>
</template>

<script setup lang="ts">
import { useRequest, http } from '@/api/core';

const { loading, data, error } = useRequest(
  http.Get('/auth/userinfo')
);
</script>
```

---

## 三种使用场景

### 场景 1: 直接使用自动生成（80%）

```typescript
import { postAuthLogin, getAuthUserInfo } from '@/api';

await postAuthLogin({ username: 'admin', password: '123' });
await getAuthUserInfo();
```

### 场景 2: 自定义 API（15%）

OpenAPI 中不存在的接口（如外部 API）：

```typescript
// src/api/custom/weather.ts
import { http, type ApiResponse } from '../core';

export const getWeather = async (city: string) => {
  const response = await http.Get<ApiResponse<WeatherData>>(
    `https://api.weather.com/weather/${city}`,
    {
      cacheFor: 10 * 60 * 1000, // 缓存 10 分钟
    }
  );
  return response.data;
};
```

### 场景 3: 覆盖生成 API（5%）

在生成的 API 基础上添加业务逻辑：

```typescript
// src/api/custom/auth.ts
import { postAuthLogin as generatedLogin } from '../generated/auth/auth';
import { storage } from '@/utils/storage';

export const postAuthLogin = async (data: LoginRequest) => {
  const response = await generatedLogin(data);
  if (response.token) {
    storage.set('token', response.token);
  }
  return response;
};
```

---

## 核心配置

### http 实例 (alova.ts)

```typescript
import { http } from '@/api/core';

// GET 请求（默认缓存 5 分钟）
const data = await http.Get('/users');

// POST 请求（不缓存）
const result = await http.Post('/users', { name: 'test' });

// 带配置
const data = await http.Get('/users', {
  params: { page: 1 },
  meta: {
    showLoading: true,
    loadingText: '加载中...',
    showError: false,
  },
  cacheFor: 0, // 禁用缓存
});
```

### 请求配置 (meta)

| 参数 | 类型 | 说明 |
|------|------|------|
| `showLoading` | boolean | 显示 loading |
| `loadingText` | string | loading 文字 |
| `showError` | boolean | 显示错误提示（默认 true） |

### 缓存配置

```typescript
// 默认配置（alova.ts）
cacheFor: {
  GET: 5 * 60 * 1000,  // GET 缓存 5 分钟
}

// 单个请求禁用缓存
http.Get('/users', { cacheFor: 0 })

// 单个请求自定义缓存
http.Get('/config', { cacheFor: 30 * 60 * 1000 }) // 30 分钟
```

---

## Alova Hooks

从 `@/api/core` 导出的 Hooks：

### useRequest

```typescript
import { useRequest, http } from '@/api/core';

const {
  loading,    // 加载状态
  data,       // 响应数据
  error,      // 错误信息
  send,       // 手动触发
  onSuccess,  // 成功回调
  onError,    // 失败回调
} = useRequest(http.Get('/users'), {
  immediate: true, // 立即执行（默认 true）
});
```

### useWatcher

监听数据变化自动请求：

```typescript
import { useWatcher, http } from '@/api/core';

const keyword = ref('');
const { loading, data } = useWatcher(
  () => http.Get('/search', { params: { keyword: keyword.value } }),
  [keyword],
  { debounce: 300 }
);
```

### useFetcher

预加载数据：

```typescript
import { useFetcher, http } from '@/api/core';

const { fetch } = useFetcher();
fetch(http.Get('/users/123')); // 预加载
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
import { postAuthLogin } from '@/api';
import type { LoginRequest } from '@/api';

// 错误
import { postAuthLogin } from '@/api/generated/auth/auth';
```

### 3. 自定义 API 使用 http

```typescript
// 正确：使用 http（隐藏 Alova 实现）
import { http } from '@/api/core';

// 避免：直接导入 alova
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
