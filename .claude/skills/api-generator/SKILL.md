---
name: api-generator
description: 生成自定义API代码,用于处理需要扩展业务逻辑、文件上传下载、特殊请求等20%场景,80%场景使用pnpm api:gen即可
license: MIT
compatibility: Requires Uni-app 3.x, Vue 3, TypeScript, Alova, Orval
metadata:
  author: uniapp-template
  version: "1.0.0"
  category: development
---

# API 生成器 Skill

## 功能概述

在项目基于 Orval 自动生成 API 的基础上,为 **20% 需要自定义扩展** 的场景生成符合规范的 API 代码模板。

**重要**: 80% 的场景直接使用 `pnpm api:gen` 自动生成即可,无需使用本 Skill。

> **技术栈**: Alova.js + @alova/adapter-uniapp

## 使用方式

```bash
# 覆盖生成的 API (添加业务逻辑)
/api-generator loginWithEmail --type override

# 完全自定义 API (不在 OpenAPI 中)
/api-generator uploadAttachment --type custom

# 交互式模式
/api-generator
```

## 使用场景判断

### 场景 1: 直接使用 Orval 生成 (80%)

```bash
pnpm api:gen

# 然后使用
import { getUsers, createUser } from '@/api';
```

### 场景 2: 覆盖生成的 API (15%)

需要添加业务逻辑时使用 `/api-generator --type override`

### 场景 3: 完全自定义 API (5%)

文件上传/下载、外部 API 时使用 `/api-generator --type custom`

---

## 代码模板

### 模板 1: 覆盖生成的 API

```typescript
// src/api/custom/override.ts
import { loginWithEmail as generatedLoginWithEmail } from '../generated/auth/auth';
import type { AuthEmailLoginDto, LoginResponseDto } from '../generated/model';
import { storage, STORAGE_KEYS } from '@/utils/storage';

/**
 * 邮箱登录 (覆盖自动生成)
 */
export const loginWithEmail = async (data: AuthEmailLoginDto): Promise<LoginResponseDto> => {
  // 1. 调用原始生成的 API
  const response = await generatedLoginWithEmail(data);

  // 2. 业务逻辑: 保存 Token
  if (response.token) {
    storage.set(STORAGE_KEYS.TOKEN, response.token);
  }

  return response;
};
```

> 项目 `src/api/custom/override.ts` 中已有 `refreshToken`、`logout` 的覆盖实现可作参考。custom 目录不要 import Store（会形成循环依赖）。

---

### 模板 2: 文件上传

> 项目 `src/api/custom/override.ts` 已提供 `uploadFileByPath` / `uploadFilesByPath`（上传到 `/api/v1/files/upload`），通用上传直接使用即可。

```typescript
// src/api/custom/upload.ts
import { http, type ApiResponse } from '../core';

export interface UploadResponse {
  url: string;
  filename: string;
  size: number;
}

/**
 * 文件上传
 */
export const uploadAttachment = async (filePath: string): Promise<UploadResponse> => {
  const response = await http.Post<ApiResponse<UploadResponse>>(
    '/upload',
    { filePath, name: 'file' },
    {
      requestType: 'upload',
      meta: { showLoading: true, loadingText: '上传中...' },
    } as any
  );
  return response.data as UploadResponse;
};

/**
 * 文件上传 (带进度) - 使用 useRequest Hook
 */
export const createUploadMethod = (filePath: string) => {
  return http.Post<ApiResponse<UploadResponse>>(
    '/upload',
    { filePath, name: 'file' },
    { requestType: 'upload' } as any
  );
};
```

**使用上传进度:**

```vue
<script setup lang="ts">
import { useRequest, createUploadMethod } from '@/api';

const { loading, uploading, send } = useRequest(
  (filePath: string) => createUploadMethod(filePath),
  { immediate: false }
);

const handleUpload = async (filePath: string) => {
  await send(filePath);
};
</script>

<template>
  <view v-if="loading">
    上传进度: {{ uploading.loaded / uploading.total * 100 }}%
  </view>
</template>
```

---

### 模板 3: 文件下载

```typescript
// src/api/custom/download.ts
import { http } from '../core';

/**
 * 文件下载
 */
export const downloadFile = async (url: string, filePath: string): Promise<string> => {
  const response = await http.Get(url, {
    requestType: 'download',
    filePath,
  } as any);
  return (response as any).tempFilePath;
};

/**
 * 创建下载方法 (用于 useRequest 获取进度)
 */
export const createDownloadMethod = (url: string, filePath: string) => {
  return http.Get(url, {
    requestType: 'download',
    filePath,
  } as any);
};
```

**使用下载进度:**

```vue
<script setup lang="ts">
import { useRequest, createDownloadMethod } from '@/api';

const { loading, downloading, send } = useRequest(
  (url: string) => createDownloadMethod(url, 'download.pdf'),
  { immediate: false }
);
</script>

<template>
  <view v-if="loading">
    下载进度: {{ downloading.loaded / downloading.total * 100 }}%
  </view>
</template>
```

---

### 模板 4: 外部 API

第三方接口不走业务实例的 Token 注入、401 刷新与 code 校验，使用独立的 alova 实例（参考 `src/api/custom/external.ts`）：

```typescript
// src/api/custom/external.ts
import { createAlova } from 'alova';
import AdapterUniapp from '@alova/adapter-uniapp';

const externalHttp = createAlova({
  timeout: 10000,
  ...AdapterUniapp(),
  responded: {
    onSuccess: response => {
      const { statusCode, data } = response as UniNamespace.RequestSuccessCallbackResult;
      if (statusCode >= 400) {
        throw new Error(`请求失败(${statusCode})`);
      }
      return data;
    },
  },
  cacheFor: null,
});

export interface WeatherResponse {
  city: string;
  temperature: number;
}

/**
 * 调用外部天气 API
 */
export const getWeather = async (city: string): Promise<WeatherResponse> => {
  return externalHttp.Get<WeatherResponse>(`https://api.weather.example.com/weather/${encodeURIComponent(city)}`, {
    cacheFor: 10 * 60 * 1000, // 缓存 10 分钟
  });
};
```

---

### 模板 5: 轮询 API

```typescript
// src/api/custom/polling.ts
import { http, type ApiResponse } from '../core';

/**
 * 轮询查询任务状态
 */
export const pollTaskStatus = async <T>(
  taskId: string,
  interval = 2000,
  timeout = 60000,
  condition: (data: T) => boolean
): Promise<T> => {
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const checkStatus = async () => {
      try {
        const response = await http.Get<ApiResponse<T>>(`/task/${taskId}/status`);

        if (condition(response.data as T)) {
          resolve(response.data as T);
          return;
        }

        if (Date.now() - startTime > timeout) {
          reject(new Error('轮询超时'));
          return;
        }

        setTimeout(checkStatus, interval);
      } catch (error) {
        reject(error);
      }
    };

    checkStatus();
  });
};
```

---

## 更新导出

`src/api/index.ts` 由 `scripts/api/update-api-exports.ts` 自动生成（`pnpm api:gen` 的 afterAllFilesWrite 钩子），请勿手写：

- 扫描 `src/api/custom/` 下的所有 `.ts` 文件，以 `export *` 导出
- generated 中与 custom 同名的函数自动剔除，custom 版本优先

新增 custom 文件后运行 `pnpm api:gen`（或 `pnpm tsx scripts/api/update-api-exports.ts`）刷新导出。

---

## 规范

### 文件组织

```
src/api/custom/
├── override.ts       # 覆盖生成的 API (refreshToken、logout、uploadFileByPath 等)
├── upload.ts         # 文件上传
├── download.ts       # 文件下载
├── external.ts       # 外部 API
└── polling.ts        # 轮询请求
```

### 函数命名

```typescript
// 正确: 保持与生成代码一致
export const loginWithEmail = async (data: AuthEmailLoginDto) => { ... };

// 错误: 改变函数名
export const customLogin = async (data: AuthEmailLoginDto) => { ... };
```

### 类型使用

```typescript
// 正确: 使用生成的类型
import type { AuthEmailLoginDto } from '@/api';

// 错误: 重复定义
interface MyLoginRequest { ... }
```

### http 导入

```typescript
// 正确: 业务接口使用 http (隐藏 Alova 实现)
import { http } from '../core';

// 错误: 业务接口另建 alova 实例 (第三方接口除外，见模板 4)
import { createAlova } from 'alova';
```

---

## 常见问题

### Q: 什么时候用 pnpm api:gen vs 本 Skill?

- **80%**: `pnpm api:gen` (标准 RESTful API)
- **15%**: `/api-generator --type override` (添加业务逻辑)
- **5%**: `/api-generator --type custom` (上传/下载/外部API)

### Q: 如何获取上传/下载进度?

使用 `useRequest` Hook + `uploading`/`downloading` 状态:

```typescript
const { uploading, downloading } = useRequest(method);
// uploading.loaded / uploading.total
// downloading.loaded / downloading.total
```

### Q: GET 请求会缓存吗?

不会。`src/api/core/alova.ts` 全局配置 `cacheFor: null`，不缓存响应结果；仅合并进行中的相同 GET/HEAD 请求（shareRequest）。如需单个请求不合并：

```typescript
http.Get('/users', { shareRequest: false })
```

---

## 相关文档

- [api-development.md](../../agents/api-development.md) - API 开发规范
- [src/api/README.md](../../../src/api/README.md) - API 模块文档
