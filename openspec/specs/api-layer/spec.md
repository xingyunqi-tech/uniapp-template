# Capability: API Layer Architecture

## Purpose

基于 Orval 自动生成的类型安全 API 层，结合 luch-request HTTP 客户端，提供统一的 API 调用体验。

## Requirements

### Requirement: Orval Code Generation

系统 SHALL 使用 Orval 从 OpenAPI 规范自动生成 API 代码。

#### Scenario: Generate API code
- **GIVEN** 后端更新了 OpenAPI 规范文件
- **WHEN** 执行 `pnpm api:gen`
- **THEN** Orval 读取 OpenAPI 规范
- **AND** 生成类型安全的 API 函数到 `src/api/generated/`
- **AND** 生成对应的 TypeScript 类型定义

#### Scenario: Generated code structure
- **GIVEN** Orval 生成代码
- **THEN** 代码结构如下：
  - `generated/auth/` - 认证相关 API
  - `generated/config/` - 配置相关 API
  - `generated/model/` - 所有类型定义

#### Scenario: Prohibit manual modification
- **GIVEN** `src/api/generated/` 目录
- **THEN** 禁止手动修改任何文件
- **AND** 修改会在下次生成时被覆盖

---

### Requirement: Custom Mutator Integration

系统 SHALL 使用自定义 Mutator 让 Orval 生成的代码使用项目的 HTTP 客户端。

#### Scenario: Request routing
- **GIVEN** Orval 生成的 API 函数
- **WHEN** 调用 API 函数（如 `postAuthLogin()`）
- **THEN** 请求通过 `customMutator` 路由
- **AND** 使用 luch-request 实例发送请求
- **AND** 经过统一的拦截器处理

#### Scenario: Response extraction
- **GIVEN** API 返回 `ApiResponse<T>` 格式
- **WHEN** customMutator 处理响应
- **THEN** 自动提取 `data` 字段
- **AND** 返回类型为 `ExtractResult<T>`

#### Scenario: Request methods support
- **GIVEN** customMutator
- **THEN** 支持以下 HTTP 方法：
  - GET - 查询请求
  - POST - 创建请求
  - PUT - 更新请求
  - DELETE - 删除请求
  - PATCH - 部分更新请求

---

### Requirement: Unified API Export

系统 SHALL 从 `@/api` 统一导出所有 API。

#### Scenario: Import API functions
- **GIVEN** 需要调用 API
- **WHEN** 导入 API 函数
- **THEN** 从 `@/api` 导入：`import { postAuthLogin } from '@/api'`
- **AND** 禁止直接从 `generated/` 导入

#### Scenario: Import types
- **GIVEN** 需要使用 API 类型
- **WHEN** 导入类型定义
- **THEN** 从 `@/api` 导入：`import type { LoginRequest } from '@/api'`

#### Scenario: Export priority
- **GIVEN** API 导出策略
- **THEN** 导出顺序如下：
  1. `generated/model/` 中的类型定义（优先）
  2. `generated/*/` 中的 API 函数（只导出函数）
  3. `custom/` 中的自定义扩展

---

### Requirement: Custom API Extensions

系统 SHALL 支持在 `custom/` 目录添加自定义 API。

#### Scenario: External API
- **GIVEN** 需要调用外部第三方 API
- **WHEN** API 不在 OpenAPI 规范中
- **THEN** 在 `custom/external.ts` 中手动编写
- **AND** 从 `@/api` 统一导出

#### Scenario: Override generated API
- **GIVEN** 需要扩展或覆盖生成的 API
- **WHEN** 需要添加额外逻辑
- **THEN** 在 `custom/override.ts` 中编写
- **AND** custom 导出优先于 generated

---

### Requirement: HTTP Client Configuration

系统 SHALL 使用 luch-request 作为 HTTP 客户端。

#### Scenario: Request interceptor
- **GIVEN** 发送 API 请求
- **WHEN** 请求经过拦截器
- **THEN** 自动添加 Token 到 Authorization 头
- **AND** 可配置显示/隐藏 loading
- **AND** 可配置显示/隐藏错误提示

#### Scenario: Response interceptor
- **GIVEN** API 返回响应
- **WHEN** 响应经过拦截器
- **THEN** 统一处理错误码
- **AND** Token 过期时触发登出流程
- **AND** 显示错误提示（如配置）

#### Scenario: Request options
- **GIVEN** 调用 API
- **WHEN** 需要自定义行为
- **THEN** 可配置以下选项：
  - `showLoading` - 是否显示加载状态
  - `loadingText` - 加载提示文字
  - `showError` - 是否显示错误提示
  - `headers` - 自定义请求头

---

### Requirement: Type Safety

系统 SHALL 确保 API 调用的类型安全。

#### Scenario: Request type checking
- **GIVEN** 调用 API 函数
- **WHEN** 传入请求参数
- **THEN** TypeScript 检查参数类型
- **AND** 类型不匹配时编译报错

#### Scenario: Response type inference
- **GIVEN** API 函数返回
- **WHEN** 使用返回值
- **THEN** TypeScript 自动推断响应类型
- **AND** 提供完整的代码补全

## Technical Notes

### Directory Structure
```
src/api/
├── core/              # HTTP 客户端（手动维护）
│   ├── index.ts       # 导出
│   ├── request.ts     # luch-request 封装
│   └── mutator.ts     # Orval 适配器
├── generated/         # Orval 自动生成（禁止修改）
│   ├── auth/          # 认证 API
│   ├── config/        # 配置 API
│   └── model/         # 类型定义
├── custom/            # 自定义扩展（手动编写）
│   ├── external.ts    # 外部 API
│   └── override.ts    # 覆盖生成的 API
└── index.ts           # 统一导出
```

### Workflow
```
后端更新 API → 更新 openapi.json → pnpm api:gen → 自动生成代码
```

### Configuration File
- Orval 配置：`orval.config.ts`
- OpenAPI 规范：项目根目录或远程 URL

### Restrictions
- 🚫 禁止修改 `src/api/generated/` 目录
- 🚫 禁止直接从 `generated/` 导入
- ✅ 所有导入必须从 `@/api`
- ✅ 自定义扩展放在 `custom/` 目录
