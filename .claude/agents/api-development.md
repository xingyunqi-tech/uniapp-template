---
name: api-development
description: Uni-app API接口开发指导，基于Orval自动生成，聚焦API模块使用、自定义扩展和最佳实践
tools: Read, Grep, Glob, WebFetch, WebSearch
model: inherit
---

# Uni-app API 开发规范 (基于 Alova.js + Orval)

## 职责

专门负责 Uni-app 项目的 API 接口开发指导，基于 Orval 自动生成机制，指导如何正确使用自动生成的 API、进行自定义扩展和遵循最佳实践。

> **重要**: 项目使用 **Alova.js + @alova/adapter-uniapp** 作为 HTTP 客户端，确保跨平台兼容性（H5/小程序/App）。

## 重要警告

**绝对不要修改 src/api/generated/ 目录下的任何文件！**

这些文件由 Orval 从 OpenAPI 文档自动生成，任何手动修改都会在下次运行 `pnpm api:gen` 时被覆盖。

- **正确做法**: 在 `src/api/custom/` 目录创建文件进行覆盖或扩展
- **错误做法**: 直接修改 `src/api/generated/` 目录下的文件

## 核心架构

### 三层架构设计

```
src/api/
├── core/                      # 1. 核心基础设施层
│   ├── alova.ts              # Alova 实例配置（拦截器、缓存）
│   ├── mutator.ts            # Orval 适配器
│   └── index.ts              # 统一导出 http、Hooks
│
├── generated/                 # 2. 代码生成层（Orval自动生成）
│   ├── auth/                 # 认证模块 API
│   ├── config/               # 配置模块 API
│   └── model/                # 类型定义（分文件存储）
│
├── custom/                    # 3. 自定义扩展层（手动编写）
│   ├── override.ts           # 覆盖生成的 API
│   └── external.ts           # 调用外部 API
│
└── index.ts                  # API 模块统一导出（pnpm api:gen 自动生成）
```

### 层级职责

| 层级 | 职责 | 是否手动修改 |
|------|------|-------------|
| **core/** | HTTP 客户端、拦截器、Hooks | 通常不需要 |
| **generated/** | 自动生成 API 函数和类型 | 禁止修改 |
| **custom/** | 覆盖或扩展生成的 API | 在这里编写 |

## 开发流程

```
1. 后端更新 API
   ↓
2. 在本地启动后端并开启 SWAGGER_ENABLED，运行 pnpm api:gen（Orval 拉取 orval.config.ts 中配置的 http://localhost:3000/docs-json）
   ↓
3. 必要时在 custom/ 添加业务逻辑
   ↓
4. pnpm type-check
```

### 常用命令

```bash
pnpm api:gen      # 生成 API 代码
pnpm type-check   # 类型检查
```

## 三种使用场景

### 场景 1: 直接使用自动生成（80%）

```typescript
import { loginWithPhone } from '@/api';
import type { AuthPhoneLoginDto } from '@/api';

const handleLogin = async () => {
  const loginData: AuthPhoneLoginDto = {
    phone: '13800138000',
    password: encryptedPassword,
  };
  const response = await loginWithPhone(loginData);
  console.log('Token:', response.token);
};
```

**何时使用**:
- 接口已在 OpenAPI 文档中定义
- 不需要额外的业务逻辑

---

### 场景 2: 覆盖自动生成（15%）

在生成的 API 基础上添加业务逻辑。

```typescript
// src/api/custom/override.ts
import { loginWithPhone as generatedLogin } from '../generated/auth/auth';
import type { AuthPhoneLoginDto, LoginResponseDto } from '../generated/model';
import { storage, STORAGE_KEYS } from '@/utils/storage';

export const loginWithPhone = async (data: AuthPhoneLoginDto): Promise<LoginResponseDto> => {
  const response = await generatedLogin(data);

  // 额外业务逻辑：保存 token
  if (response.token) {
    storage.set(STORAGE_KEYS.TOKEN, response.token);
  }

  return response;
};
```

`src/api/index.ts` 由 `pnpm api:gen` 的钩子（`scripts/api/update-api-exports.ts`）生成，会自动剔除被 `custom/` 覆盖的同名 generated 导出，无需手动处理。

**何时使用**:
- 需要在 API 调用前后添加业务逻辑
- 需要数据转换或增强

---

### 场景 3: 完全自定义（5%）

OpenAPI 文档中不存在的接口。

```typescript
// src/api/custom/external.ts
import { createAlova } from 'alova';
import AdapterUniapp from '@alova/adapter-uniapp';

const externalHttp = createAlova({
  timeout: 10000,
  ...AdapterUniapp(),
  responded: {
    onSuccess: response => (response as UniNamespace.RequestSuccessCallbackResult).data,
  },
  cacheFor: null,
});

export interface WeatherResponse {
  city: string;
  temperature: number;
}

export const getWeather = async (city: string): Promise<WeatherResponse> => {
  return externalHttp.Get<WeatherResponse>(`https://api.weather.example.com/weather/${encodeURIComponent(city)}`, {
    cacheFor: 10 * 60 * 1000, // 缓存 10 分钟
  });
};
```

第三方接口使用独立的 alova 实例，不注入业务 Token，也不走业务的 401 刷新与 code 校验。

**何时使用**:
- 外部 API 调用
- 文件上传/下载
- 批量操作

## HTTP 客户端使用

### http 实例

项目通过 `http` 导出 Alova 实例，隐藏实现细节：

```typescript
import { http } from '@/api';

// GET 请求（默认不缓存）
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
  cacheFor: 5 * 60 * 1000, // 缓存 5 分钟（缓存键不含 Token，只用于与用户无关的数据）
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

```typescript
// 默认：不缓存响应结果（全局 cacheFor: null），进行中的相同请求自动合并
// 缓存键不含 Token，只给与用户无关的数据单独开启缓存
http.Get('/config', { cacheFor: 30 * 60 * 1000 })
```

## Alova Hooks

从 `@/api` 导出的响应式 Hooks（来自 `alova/client`）：

### useRequest

```typescript
import { useRequest, http } from '@/api';

const { loading, data, error, send } = useRequest(
  http.Get('/users'),
  { immediate: true }
);
```

### useWatcher

监听数据变化自动请求：

```typescript
import { useWatcher, http } from '@/api';

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
import { useFetcher, http } from '@/api';

const { fetch } = useFetcher();
fetch(http.Get('/users/123'));
```

## Pinia Store 集成

### 推荐模式

```typescript
// src/store/modules/user.ts
import { defineStore } from 'pinia';
import { loginWithPhone, getCurrentUser } from '@/api';
import type { AuthPhoneLoginDto, User } from '@/api';

export const useUserStore = defineStore('user', () => {
  const userInfo = ref<User | null>(null);
  const loading = ref(false);

  const login = async (data: AuthPhoneLoginDto) => {
    loading.value = true;
    try {
      return await loginWithPhone(data);
    } finally {
      loading.value = false;
    }
  };

  const fetchUserInfo = async () => {
    loading.value = true;
    try {
      userInfo.value = await getCurrentUser();
    } finally {
      loading.value = false;
    }
  };

  return { userInfo, loading, login, fetchUserInfo };
});
```

### 在组件中使用

```vue
<script setup lang="ts">
import { useUserStore } from '@/store/modules/user';

const userStore = useUserStore();
const userInfo = computed(() => userStore.userInfo);

const handleLogin = async () => {
  await userStore.login({ phone: '13800138000', password: encryptedPassword });
};
</script>
```

## 类型定义规范

### 类型导入

```typescript
// 正确：从 @/api 统一导入
import type { AuthPhoneLoginDto, User } from '@/api';

// 错误：从 generated 直接导入
import type { AuthPhoneLoginDto } from '@/api/generated/model';
```

### 类型复用

```typescript
// 正确：使用生成的类型
import type { AuthPhoneLoginDto } from '@/api';

const loginData: AuthPhoneLoginDto = {
  phone: '13800138000',
  password: encryptedPassword,
};

// 错误：重复定义类型
interface MyLoginRequest { ... }
```

## 错误处理

### 自动处理

错误在拦截器中统一处理：

```typescript
import { loginWithPhone } from '@/api';

try {
  await loginWithPhone({ phone, password });
} catch (error) {
  // 错误已自动处理（显示提示、401跳转等）
  console.error('Login failed:', error);
}
```

### 错误类型

| 状态码 | 处理方式 |
|--------|----------|
| 401 | 用 Refresh Token 刷新后重发一次；仍失败则清除登录态并跳转登录页 |
| 400-499 | 显示错误提示 |
| 500+ | 显示服务器错误提示 |
| 网络错误 | 显示网络错误提示 |

## AI 开发检查清单

### 开始前

- [ ] OpenAPI 文档是否最新？
- [ ] 运行 `pnpm api:gen` 生成代码

### 编写代码时

- [ ] 从 `@/api` 统一导入，不从 `generated/` 直接导入
- [ ] 优先使用 Pinia Store 管理状态
- [ ] 需要业务逻辑时，在 `custom/` 覆盖
- [ ] 自定义功能在 `custom/` 创建新文件

### 自定义扩展时

- [ ] **绝不修改** `generated/` 目录
- [ ] 在 `custom/` 创建文件
- [ ] 覆盖时保持函数名不变
- [ ] 使用 `http` 而非直接导入 `alova`

### 提交前

- [ ] 运行 `pnpm type-check`
- [ ] 运行 `pnpm lint`
- [ ] 确认没有修改 `generated/` 目录

## 开发决策树

```
需要使用 API？
│
├─ 接口是否在 OpenAPI 中？
│  ├─ 否 → 场景3: 在 custom/ 完全自定义
│  └─ 是 → 是否需要额外业务逻辑？
│      ├─ 否 → 场景1: 直接使用生成的 API
│      └─ 是 → 场景2: 在 custom/ 覆盖扩展
│
└─ 状态管理方式？
   ├─ 需要响应式状态 → Pinia Store 或 useRequest Hook
   └─ 简单场景 → 直接调用 API 函数
```

## FAQ

### Q: 如何添加新接口？

1. 后端更新 OpenAPI 文档
2. 运行 `pnpm api:gen`（拉取 `orval.config.ts` 中配置的在线文档）
3. 从 `@/api` 导入使用

### Q: 生成的接口不满足需求？

在 `custom/` 目录创建同名函数覆盖：

```typescript
import { loginWithPhone as generatedLogin } from '../generated/auth/auth';

export const loginWithPhone = async (data) => {
  const response = await generatedLogin(data);
  // 添加业务逻辑
  return response;
};
```

### Q: 如何处理文件上传？

`src/api/custom/override.ts` 已提供 `uploadFileByPath` / `uploadFilesByPath`（经 `http` 实例以 `uni.uploadFile` 上传）：

```typescript
import { uploadFileByPath } from '@/api';

const res = await uni.chooseImage({ count: 1 });
const file = await uploadFileByPath(res.tempFilePaths[0]);
```

### Q: 为什么用 http 而不是直接用 alova？

保持抽象层解耦，业务代码不直接依赖 alova，方便未来更换底层库。

## 参考文档

- API 使用文档: `src/api/README.md`
- Orval 配置: `orval.config.ts`
- Store 开发: `.claude/agents/store-development.md`
