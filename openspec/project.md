# Project Context

## Purpose

Uni-app 多端应用模板 - 基于 Uni-app 3.x + Vue 3 + TypeScript + Vite 构建，支持 H5、微信小程序、支付宝小程序、App 等多平台。

**核心目标**：
- 提供生产就绪的多端应用开发模板
- 强调类型安全、自动化和开发规范
- 80%+ 的 API 代码自动生成 (Orval)
- 统一的组件库和样式系统

## Tech Stack

### 核心框架
- **Uni-app 3.x** - 跨平台框架 (3.0.0-alpha)
- **Vue 3** - Composition API + `<script setup>`
- **TypeScript 5.x** - 严格类型检查
- **Vite 6.x** - 构建工具 + @dcloudio/vite-plugin-uni

### 状态 & 数据
- **Pinia** - Composition API 风格状态管理 + 持久化
- **Alova** - 轻量级请求策略库
- **Orval** - OpenAPI → 类型安全 API 自动生成

### UI & 样式
- **@dcloudio/uni-ui** - 官方 UI 组件库
- **SCSS** - CSS 预处理器
- **CSS 变量** - 主题系统 (Light/Dark)

### 开发工具
- **ESLint 9.x** + typescript-eslint - 代码检查
- **Stylelint** - 样式检查
- **Prettier** - 代码格式化
- **Vitest** - 单元测试 (80% 覆盖率目标)
- **Husky + lint-staged** - Git 钩子
- **cz-git** - 交互式提交

### 国际化
- **vue-i18n 9.x** - 多语言支持

## Project Conventions

### Code Style

**TypeScript 规范**：
- 严格模式 (`strict: true`)
- 禁止未使用变量 (`noUnusedLocals`, `noUnusedParameters`)
- 组件 Props/Emits 必须有类型定义

**命名规范**：
- 组件：PascalCase，自定义组件 `U` 前缀 (如 `UNavBar`)
- 文件：kebab-case 目录，index.vue 入口
- 变量/函数：camelCase
- 常量：UPPER_SNAKE_CASE
- CSS 类名：kebab-case

**样式规范**：
- 必须使用 CSS 变量 (`var(--color-xxx)`)，禁止硬编码颜色
- 必须使用 rpx 单位 (750rpx = 设计稿宽度)，禁止 px
- 属性顺序遵循 SMACSS 规范

### Architecture Patterns

**路由系统** (非 Vue Router)：
- 使用 `pages.json` 配置路由
- 主包 `pages/` + 分包 `pages-sub/`
- 导航使用 `uni.navigateTo()` 等 API

**API 架构** (Orval 自动生成)：
```
src/api/
├── core/          # HTTP 客户端 (手动维护)
├── generated/     # Orval 自动生成 (禁止修改!)
├── custom/        # 自定义扩展 (手动编写)
└── index.ts       # 统一导出 (custom 优先)
```

**组件系统** (easycom)：
- 组件自动注册，无需手动 import
- uni-ui: `uni-xxx`
- 自定义: `u-xxx` → `@/components/UXxx/index.vue`

**状态管理**：
- Pinia Composition API 风格
- 模块化存放于 `src/store/modules/`
- 支持持久化

### Testing Strategy

- **框架**：Vitest + @vue/test-utils
- **覆盖率目标**：80%
- **测试文件**：`tests/` 目录
- **命令**：
  - `pnpm test` - 运行测试
  - `pnpm test:watch` - 监听模式
  - `pnpm test:coverage` - 覆盖率报告
  - `pnpm test:ui` - UI 界面

### Git Workflow

**分支策略**：
- `master` - 主分支
- `feature/*` - 功能分支
- `fix/*` - 修复分支

**提交规范** (自定义格式)：
```
[AI|Human][type]: subject

# 示例
[AI][feat]: 添加用户登录功能
[Human][fix]: 修复表单验证问题
```

**类型**：feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert

**Scope**：AI (AI 生成) | Human (人类编写)

## Domain Context

**多端差异处理**：
- 使用条件编译：`#ifdef MP-WEIXIN` / `#endif`
- 平台标识：H5, MP-WEIXIN, MP-ALIPAY, APP, APP-PLUS

**存储 API**：
- 使用 `uni.setStorageSync()` / `uni.getStorageSync()`
- 禁止使用 `localStorage` (小程序不支持)

**页面生命周期**：
- Uni-app 特有：`onLoad`, `onShow`, `onHide`, `onUnload`
- Vue 生命周期同样可用

## Important Constraints

### 禁止事项
| 禁止操作 | 原因 |
|---------|------|
| 修改 `src/api/generated/` | Orval 自动生成，修改会被覆盖 |
| 直接从 `generated/` 导入 | 破坏 custom 优先级 |
| 使用 Vue Router | Uni-app 使用 pages.json |
| 硬编码颜色值 | 主题切换失效 |
| 使用 px 单位 | 小程序适配问题 |
| 使用 window/document | 非 H5 平台不存在 |
| 使用 localStorage | 小程序不支持 |

### 环境要求
- Node.js >= 22.0.0
- 包管理器：pnpm (推荐)

## Key Directories

| 目录 | 职责 | 注意事项 |
|------|------|---------|
| `src/pages/` | 主包页面 (7 个) | TabBar 页面必须在主包 |
| `src/pages-sub/` | 分包页面 (3 个分包) | 优化小程序体积 |
| `src/pages.json` | 路由配置 | 所有页面必须在此注册 |
| `src/api/generated/` | Orval 自动生成 | 🚫 禁止修改 |
| `src/api/custom/` | 自定义 API | ✅ 在这里扩展 |
| `src/components/` | 全局组件 (20+) | easycom 自动注册，U 前缀 |
| `src/composables/` | Composition API | 可复用逻辑 |
| `src/store/modules/` | Pinia Store | 状态管理 |
| `src/styles/theme.scss` | 主题变量 | CSS 变量定义 |
| `src/constants/` | 常量定义 | 页面路径、权限等 |

## Common Commands

```bash
# 开发
pnpm dev:h5           # H5 开发
pnpm dev:mp-weixin    # 微信小程序开发

# 构建
pnpm build:h5         # H5 构建
pnpm build:mp-weixin  # 微信小程序构建

# API
pnpm api:gen          # Orval 生成 API 代码

# 质量
pnpm lint             # ESLint + Stylelint
pnpm type-check       # TypeScript 类型检查
pnpm test             # 运行测试

# Git
pnpm commit           # 交互式提交 (cz-git)
```

## External Dependencies

### 核心依赖
- **Uni-app CLI** - 多平台构建
- **OpenAPI 规范** - API 定义 (供 Orval 生成)

### MCP 服务器
| 服务器 | 功能 |
|--------|------|
| figma | Figma 设计稿读取 |
| context7 | 第三方库文档查询 |
| eslint | 代码检查 |
| chrome-devtools | 浏览器调试 |

### 外部文档
- [Uni-app 官方文档](https://uniapp.dcloud.io/)
- [Vue 3 官方文档](https://vuejs.org/)
- [Pinia 官方文档](https://pinia.vuejs.org/)
- [Orval 官方文档](https://orval.dev/)

## AI Agent References

详细开发指南请参考 `.claude/agents/` 目录：

| Agent | 职责 |
|-------|------|
| `common-patterns.md` | Props/Emits/CSS 变量/盒模型 |
| `api-development.md` | Orval API 使用、自定义扩展 |
| `component-development.md` | 组件开发、样式规范 |
| `router-development.md` | pages.json 配置、分包、导航 |
| `store-development.md` | Pinia 状态管理 |
| `coding-standards.md` | 编码规范、代码风格 |
