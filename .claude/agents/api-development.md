---
name: api-development
description: API接口开发指导，基于Orval自动生成，聚焦API模块使用、自定义扩展和最佳实践
---

# API开发规范 (基于Orval自动生成)

## 职责
专门负责API接口开发指导，基于Orval自动生成机制，指导如何正确使用自动生成的API、进行自定义扩展和遵循最佳实践。

## ⚠️ 重要警告

**绝对不要修改 src/api/generated/ 目录下的任何文件！**

这些文件由 Orval 从 OpenAPI 文档自动生成，任何手动修改都会在下次运行 `pnpm api:gen` 时被覆盖。

✅ **正确做法**: 在 `src/api/custom/` 目录创建文件进行覆盖或扩展
❌ **错误做法**: 直接修改 `src/api/generated/` 目录下的文件

## 🎯 核心架构理解

### 四层架构设计

项目API模块采用四层架构，实现了**自动生成 + 灵活扩展**的完美结合：

```
src/api/
├── core/                      # 1️⃣ 核心基础设施层
│   ├── http.ts               # HttpClient 类（Axios增强）
│   ├── mutator.ts            # Orval适配器（请求去重、实例切换）
│   ├── interceptors/         # 拦截器（request/response）
│   ├── instances/            # 多实例管理（default/download）
│   └── utils/                # 工具函数
│
├── generated/                 # 2️⃣ 代码生成层（Orval自动生成）
│   ├── auth/                 # 认证模块API
│   ├── config/               # 配置模块API
│   └── model/                # 类型定义（分文件存储）
│       ├── index.ts          # 统一导出
│       ├── loginRequest.ts   # 单个类型文件
│       └── ...
│
├── custom/                    # 3️⃣ 自定义扩展层（手动编写）
│   ├── override.ts           # ⭐ 示例：覆盖生成的 API (扩展场景)
│   └── external.ts           # ⭐ 示例：调用外部 API (新增场景)
│
├── openapi.json              # OpenAPI文档（数据源）
├── index.ts                  # API模块统一导出
└── README.md                 # 详细使用文档
```

### 层级职责说明

| 层级 | 职责 | 是否手动修改 |
|------|------|-------------|
| **core/** | 提供HTTP客户端、拦截器、实例管理等基础能力 | ❌ 通常不需要 |
| **generated/** | 自动生成API函数和类型定义 | ❌ 禁止修改 |
| **custom/** | 覆盖或扩展生成的API，添加业务逻辑 | ✅ 这里编写代码 |

## 📋 OpenAPI驱动的工作流

### 标准开发流程

```
1. 后端更新API
   ↓
2. 获取最新 openapi.json
   ↓
3. 替换 src/api/openapi.json
   ↓
4. 运行 pnpm api:gen （自动生成代码）
   ↓
5. 必要时在 custom/ 添加业务逻辑
   ↓
6. pnpm type-check （类型检查）
   ↓
7. pnpm test （测试验证）
```

### 常用命令

```bash
# 生成API代码（从openapi.json）
pnpm api:gen

# 监听模式（开发时使用）
pnpm api:watch

# 类型检查
pnpm type-check

# 构建（自动生成 + 构建）
pnpm build
```

## 🎨 三种使用场景（重要！）

AI开发时必须根据场景选择正确的方式：

### 场景1: 直接使用自动生成（80%情况）

大部分接口直接使用Orval生成的代码即可。

```typescript
// ✅ 正确：直接从 @/api 导入
import { postAuthLogin, getAuthUserInfo, postAuthLogout } from '@/api';
import type { LoginRequest, UserInfo } from '@/api';

// 使用
const handleLogin = async () => {
  const loginData: LoginRequest = {
    username: 'admin',
    password: '123456',
  };

  const response = await postAuthLogin(loginData);
  console.log('Token:', response.token); // 类型自动推导
};

const getUserInfo = async () => {
  const userInfo = await getAuthUserInfo();
  console.log('User:', userInfo); // UserInfo 类型
};
```

**何时使用**:
- 接口已在OpenAPI文档中定义
- 不需要额外的业务逻辑
- 直接调用即可满足需求

---

### 场景2: 覆盖自动生成（15%情况）

需要在自动生成的基础上添加额外业务逻辑。

**示例：登录后自动保存Token**

```typescript
import { postAuthLogin as generatedLogin } from '../generated/auth/auth';
import type { LoginRequest, LoginResponse } from '../generated/model';
import storage from '@/plugins/storage';

/**
 * 登录接口（覆盖版本）
 * 自动保存token到localStorage
 */
export const postAuthLogin = async (data: LoginRequest): Promise<LoginResponse> => {
  // 1. 调用原始生成的函数
  const response = await generatedLogin(data);

  // 2. 额外业务逻辑：自动保存token
  if (response.token) {
    storage('localStorage').set('token', response.token);
  }

  // 3. 记录登录日志（可选）
  console.log(`[Auth] User ${data.username} logged in at ${new Date().toISOString()}`);

  return response;
};

// ✅ 其他接口直接导出（不需要覆盖）
export { postAuthLogout, getAuthUserInfo } from '../generated/auth/auth';
```

**导出配置** (在 `src/api/index.ts`):

```typescript
// 1. 先导出所有生成的API
export * from './generated/auth/auth';
export * from './generated/config/config';

// 2. 再导出自定义API（会覆盖同名函数）
```

**何时使用**:
- 需要在API调用前后添加业务逻辑
- 需要数据转换或增强
- 需要自动保存数据、记录日志等

**关键原则**:
- ✅ 保持函数名不变（如 `postAuthLogin`）
- ✅ 调用原始生成的函数
- ✅ 添加业务逻辑
- ✅ 保持类型一致

---

### 场景3: 完全自定义（5%情况）

OpenAPI文档中不存在的接口，或需要特殊处理的功能。

**示例：调用外部 API**

```typescript
// ✅ 正确：在 custom/ 目录中自定义（如 external.ts）
import { defaultHttp } from '../core/instances';
import type { ApiResponse } from '../core/http';

/**
 * 文件上传（带进度）
 */
export const uploadWithProgress = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<ApiResponse<{ url: string }>> => {
  const formData = new FormData();
  formData.append('file', file);

  return defaultHttp.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 60000, // 60秒（文件上传需要更长时间）
    onUploadProgress: (event) => {
      if (event.total) {
        const progress = Math.round((event.loaded * 100) / event.total);
        onProgress?.(progress);
      }
    },
  });
};

/**
 * 文件下载（带进度）
 */
export const downloadFile = async (
  url: string,
  filename: string,
  onProgress?: (progress: number) => void
): Promise<void> => {
  const { downloadHttp } = await import('../core/instances');

  const response = await downloadHttp.get(url, {
    responseType: 'blob',
    onDownloadProgress: (event) => {
      if (event.total) {
        const progress = Math.round((event.loaded * 100) / event.total);
        onProgress?.(progress);
      }
    },
  });

  const blob = new Blob([response.data]);
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};

/**
 * 批量删除
 */
export const batchDelete = async (ids: string[]): Promise<ApiResponse<void>> => {
  return defaultHttp.post('/batch/delete', { ids });
};
```

**何时使用**:
- OpenAPI文档中不存在的接口
- 文件上传/下载（需要进度回调）
- 批量操作
- 外部API调用

---

## 🔌 HTTP实例使用

### 多实例管理

项目提供不同配置的HTTP实例：

| 实例 | 用途 | 配置特点 |
|------|------|----------|
| **defaultHttp** | 普通API请求 + 文件上传 | 超时6s，可自定义 |
| **downloadHttp** | 文件下载 | 超时120s，responseType: blob |

### 使用示例

```typescript
import { defaultHttp, downloadHttp } from '@/api/core/instances';

// 1. 普通请求（通常使用生成的API，不直接用实例）
const userInfo = await defaultHttp.get('/users/123');

// 2. 文件上传（使用自定义函数，见场景3）
import { uploadWithProgress } from '@/api';
await uploadWithProgress(file, (progress) => {
  console.log(`上传进度: ${progress}%`);
});

// 3. 文件下载（使用自定义函数）
import { downloadFile } from '@/api';
await downloadFile('/files/report.pdf', 'report.pdf');

// 4. 外部API调用
const weather = await defaultHttp.get('/weather/beijing', {
  baseURL: 'https://api.weather.com',
});
```

## 🎨 Pinia Store 状态管理（推荐）

### 优先使用 Store 管理状态

```vue
<script setup lang="ts">
import { useUserStore } from '@/store/modules/user';
import { computed } from 'vue';

const userStore = useUserStore();

// 获取响应式状态
const userInfo = computed(() => userStore.userInfo);
const isLoading = computed(() => userStore.loading);

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

const handleLogout = async () => {
  try {
    await userStore.logout();
    console.log('登出成功');
  } catch (error) {
    console.error('登出失败', error);
  }
};
</script>

<template>
  <div v-if="isLoading">加载中...</div>
  <div v-else>
    <p>用户名: {{ userInfo?.username }}</p>
    <button @click="handleLogin">登录</button>
    <button @click="handleLogout">登出</button>
  </div>
</template>
```

### Store 设计模式

```typescript
// src/store/modules/user.ts
import { defineStore } from 'pinia';
import { postAuthLogin, postAuthLogout, getAuthUserInfo } from '@/api';
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

  const logout = async () => {
    loading.value = true;
    try {
      await postAuthLogout();
      userInfo.value = null;
    } finally {
      loading.value = false;
    }
  };

  const fetchUserInfo = async () => {
    loading.value = true;
    try {
      userInfo.value = await getAuthUserInfo();
    } finally {
      loading.value = false;
    }
  };

  return { userInfo, loading, login, logout, fetchUserInfo };
});
```

## 📖 类型定义最佳实践

### 类型导入规范

```typescript
// ✅ 正确：从 @/api 统一导入
import type { LoginRequest, UserInfo, ConfigValue } from '@/api';

// ❌ 错误：从 generated 直接导入
import type { LoginRequest } from '@/api/generated/model';
import type { LoginRequest } from '@/api/generated/model/loginRequest';
```

### 类型复用

```typescript
// ✅ 正确：使用生成的类型
import type { LoginRequest, UserInfo } from '@/api';

const loginData: LoginRequest = {
  username: 'admin',
  password: '123456',
};

// ❌ 错误：重复定义类型
interface MyLoginRequest {  // 不要这样做！
  username: string;
  password: string;
}
```

### 类型分文件存储

项目将类型定义拆分为独立文件，避免单文件过大：

```
generated/model/
├── index.ts              # 统一导出
├── loginRequest.ts       # 单个类型
├── loginResponse.ts
├── userInfo.ts
└── ...
```

**优势**:
- ✅ 避免单文件过大
- ✅ 类型更易查找
- ✅ Git diff 更清晰
- ✅ 减少合并冲突

## 🛡️ 高级特性

### 1. 统一错误处理

项目使用集中式错误处理（`src/utils/errorHandler.ts`）：

```typescript
import { postAuthLogin } from '@/api';

try {
  const response = await postAuthLogin({ username, password });
  // 成功处理
} catch (error) {
  // ✅ 错误已被拦截器自动处理（显示提示、跳转等）
  // 这里只需处理组件特定逻辑
  console.error('Login failed:', error);
}
```

**自动处理的错误类型**:
- 🔴 网络错误：无法连接服务器
- 🟡 请求错误：超时、取消
- 🟠 认证错误：401自动跳转登录
- 🟣 权限错误：403无权限
- 🔵 业务错误：400参数错误
- ⚫ 服务器错误：500+

### 2. 请求去重（自动启用）

```typescript
import { postUserCreate } from '@/api';

// ✅ 默认启用去重
// 用户快速点击两次，第二次会复用第一次的请求
const handleSubmit = async () => {
  await postUserCreate({ username: 'test' });
};

// ✅ 手动禁用去重（某些场景需要）
import { customMutator } from '@/api/core/mutator';

await customMutator({
  method: 'post',
  url: '/logs',
  data: logData,
  disableDedup: true, // 禁用去重
});
```

### 3. 请求取消

```typescript
import { defaultHttp } from '@/api/core/instances';
import { HttpClient } from '@/api/core/http';

// 取消指定请求
defaultHttp.cancelRequest('GET-/users/list');

// 取消所有请求
defaultHttp.cancelAllRequests('用户退出登录');

// 判断是否为取消错误
try {
  await defaultHttp.get('/users');
} catch (error) {
  if (HttpClient.isCancel(error)) {
    console.log('请求已取消');
  }
}
```

### 4. 自动重试

```typescript
import { defaultHttp } from '@/api/core/instances';

const response = await defaultHttp.get('/api/data', {
  retry: {
    retries: 3,              // 重试3次
    retryDelay: 1000,        // 延迟1秒
    retryCondition: (error) => {
      // 自定义重试条件
      return error.response?.status === 503;
    },
  },
});
```

**默认重试条件**:
- 网络错误（无响应）
- 408 Request Timeout
- 429 Too Many Requests
- 500 Internal Server Error
- 502 Bad Gateway
- 503 Service Unavailable
- 504 Gateway Timeout

## 📋 AI开发快速检查清单

### 开始开发前

- [ ] 是否需要新接口？→ 确保OpenAPI文档已包含
- [ ] OpenAPI文档是否最新？→ 运行 `pnpm api:gen`

### 编写代码时

- [ ] 从 `@/api` 统一导入，不从 `generated/` 直接导入
- [ ] 优先使用 Pinia Store 管理状态
- [ ] 简单场景可直接调用生成的API函数
- [ ] 需要业务逻辑时，在 `custom/` 覆盖
- [ ] 完全自定义功能时，在 `custom/` 目录创建新文件编写

### 自定义扩展时

- [ ] **绝不修改** `generated/` 目录
- [ ] 在 `custom/` 创建文件
- [ ] 覆盖时保持函数名不变
- [ ] 调用原始生成的函数
- [ ] 在 `src/api/index.ts` 中正确导出

### 类型定义时

- [ ] 使用生成的类型，不重复定义
- [ ] 从 `@/api` 导入类型
- [ ] 避免使用 `any` 类型

### 提交前

- [ ] 运行 `pnpm type-check` 检查类型
- [ ] 运行 `pnpm lint` 检查代码规范
- [ ] 运行 `pnpm test` 验证测试通过
- [ ] 确认没有修改 `generated/` 目录

## 🌳 开发决策树

```
需要使用API？
│
├─ 接口是否在OpenAPI中？
│  ├─ 否 → 场景3: 在 custom/ 目录完全自定义
│  └─ 是 → 是否需要额外业务逻辑？
│      ├─ 否 → 场景1: 直接使用生成的API
│      └─ 是 → 场景2: 在 custom/ 覆盖扩展
│
└─ 状态管理方式？
   ├─ 需要状态管理 → 使用 Pinia Store
   └─ 简单场景 → 直接调用API函数
```

## ❓ 常见问题 FAQ

### Q: 如何添加一个新接口？

**A**:
1. 在后端OpenAPI文档中定义接口
2. 更新 `src/api/openapi.json`
3. 运行 `pnpm api:gen`
4. 接口会自动生成在 `generated/` 目录
5. 从 `@/api` 导入使用

---

### Q: 生成的接口不满足需求怎么办？

**A**: 在 `custom/` 目录创建同名函数覆盖：

```typescript
import { postAuthLogin as generatedLogin } from '../generated/auth/auth';

export const postAuthLogin = async (data) => {
  const response = await generatedLogin(data);
  // 添加业务逻辑
  return response;
};
```

---

### Q: 如何处理文件上传？

**A**: 在 `custom/` 目录中创建自定义函数，如 `upload.ts`：

```typescript
// src/api/custom/upload.ts
import { defaultHttp } from '../core/instances';

export const uploadWithProgress = async (
  file: File,
  onProgress?: (progress: number) => void
) => {
  const formData = new FormData();
  formData.append('file', file);

  return defaultHttp.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (event.total) {
        onProgress?.(Math.round((event.loaded * 100) / event.total));
      }
    },
  });
};

// 使用
import { uploadWithProgress } from '@/api';
await uploadWithProgress(file, (progress) => {
  console.log(`上传进度: ${progress}%`);
});
```

---

### Q: 为什么要分四层架构？

**A**:
- **core/**: 提供基础能力（拦截器、实例）
- **generated/**: 自动生成，减少80%样板代码
- **custom/**: 灵活扩展，满足业务需求

---

### Q: OpenAPI文档怎么获取？

**A**:
1. 后端提供 `openapi.json` 文件
2. 或访问后端 Swagger 文档导出
3. 放到 `src/api/openapi.json`

---

### Q: 什么时候需要修改 core/ 目录？

**A**: 通常不需要，以下情况除外：
- 修改全局拦截器逻辑
- 添加新的HTTP实例
- 调整HttpClient核心功能

---

### Q: generated/ 目录可以提交到Git吗？

**A**:
- **推荐做法**: 提交到Git（团队成员直接使用）
- **备选方案**: 添加到 `.gitignore`（团队成员自行生成）

建议提交，避免团队成员忘记运行 `pnpm api:gen`。

---

### Q: 如何调试API请求？

**A**:
1. 浏览器DevTools → Network面板
2. 查看控制台日志（拦截器会打印）
3. 使用Sentry（项目已集成）

## 🎯 总结

通过Orval自动化方案，可以：

1. ✅ **无需手写样板代码** - 自动生成，节省时间
2. ✅ **类型安全** - 编译时捕获错误
3. ✅ **多实例支持** - 不同场景不同配置
4. ✅ **请求去重** - 防止重复提交
5. ✅ **请求取消** - 支持主动取消
6. ✅ **自动重试** - 网络错误自动重试
7. ✅ **灵活定制** - 覆盖或新增任意接口
8. ✅ **Pinia Store集成** - 响应式状态管理
9. ✅ **统一错误处理** - 自动显示提示、跳转登录
10. ✅ **团队协作** - 统一规范，减少沟通成本

**核心原则**: **不要修改 generated/ 目录，在 custom/ 扩展！**

---

## 🔗 参考文档

- 详细使用文档: `src/api/README.md`
- Orval配置: `orval.config.ts`
- 错误处理: `src/utils/errorHandler.ts`
- Store开发规范: `.claude/agents/store-development.md`
