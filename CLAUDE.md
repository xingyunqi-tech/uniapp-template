# CLAUDE.md - AI 开发助手快速指南

> 本文档专为 AI 助手设计，提供项目快速概览和文档导航。人类开发者请查看 [README.md](README.md)

## 🚀 AI 编程流程化操作系统

**项目配置了完整的 Skills，实现从 PRD 到部署的智能化工作流！**

### ⚡ 智能工作流 (6 模块)

```bash
# 模块 ①: PRD → 架构设计
/architecture-designer docs/prd/user-management.md --create-todos

# 模块 ②: API 同步
pnpm api:gen

# 模块 ③: Store 生成 (智能模式)
/store-generator UserStore --smart

# 模块 ④: 组件生成 + 页面拼装 (智能模式)
/component-generator UserManagement --type page --smart --with-router
/page-assembler src/views/user-management/index.vue

# 模块 ⑤: 代码优化 (自动提取常量/Composables) 🆕
/code-optimizer src/views/user-management/ --full

# 模块 ⑥: 质量保障
/test-coverage-checker --auto-generate
pnpm type-check
```

### 🔥 核心 Skills

| Skill | 说明 | 分类 |
|-------|------|------|
| **architecture-designer** 🆕 | PRD → 架构设计 | Development |
| **component-generator** ✨ | 智能组件生成 (`--smart`) | Development |
| **store-generator** ✨ | 智能 Store 生成 (`--smart`) | Development |
| **page-assembler** 🆕 | 页面拼装器 | Development |
| **api-generator** 🆕 | 自定义 API 生成 (20% 场景) | Development |
| **figma-to-component** | Figma → 组件 | Development |
| **code-optimizer** 🆕 | 代码优化器 (6维度: 常量/函数/Composables/组件/指令/类型) | Quality |
| **test-coverage-checker** ✨ | 覆盖率检查 + 自动生成测试 | Quality |
| **implementation-validator** 🆕 | 代码实现一致性校验 | Quality |

**效率提升:** 75% (4-6h vs 16-20h) | **完整文档:** [.claude/README.md](.claude/README.md)

### 🎯 Skill 选择指南

根据你的任务类型，选择正确的 Skill：

| 场景 | 推荐 Skill | 说明 |
|------|-----------|------|
| **有 PRD 文档，需要设计架构** | `architecture-designer` | 从 PRD 生成完整技术方案 |
| **有 Figma 设计稿** | `figma-to-component` | 从设计稿还原组件 |
| **无设计稿，纯代码生成组件** | `component-generator` | 根据规范生成组件模板 |
| **需要新增/扩展 API (20%)** | `api-generator` | 文件上传、WebSocket 等特殊场景 |
| **标准 API 同步 (80%)** | `pnpm api:gen` | Orval 自动生成，无需 Skill |
| **创建 Pinia Store** | `store-generator` | 生成符合规范的 Store |
| **组装已有组件到页面** | `page-assembler` | 集成组件、Store、API |
| **优化重复代码** | `code-optimizer` | 提取常量、Composables、工具函数 |
| **检查测试覆盖率** | `test-coverage-checker` | 覆盖率报告 + 自动生成测试 |
| **校验 PRD/API 一致性** | `implementation-validator` | 代码实现完整性检查 |

**组件生成的选择**:
- ✅ **有 Figma 设计稿** → `figma-to-component`
- ✅ **无设计稿，需要组件** → `component-generator`
- ❌ 不要混用，一个任务选一个

---

## 🔧 Commands 和 Hooks

**项目配置了 Commands 和 Hooks，进一步提升开发效率！**

### 📋 Commands (快速提示)

**Commands 是什么？** 轻量级提示命令，用于快速调用重复使用的清单和最佳实践。

| Command | 说明 | 使用场景 |
|---------|------|---------|
| `/review-pr` | PR 审查清单 | 代码审查前快速查看清单 |
| `/refactor` | 重构最佳实践 | 重构代码前查看原则和步骤 |
| `/optimize` | 性能优化指南 | 性能优化前查看方法和技巧 |
| `/security-check` | 安全检查清单 | 安全审查时查看 OWASP Top 10 |
| `/tools` | 工具索引 | 快速查看所有可用工具 |
| `/quick-fix` | 快速问题修复 | 遇到问题时快速定位解决方案 |
| `/git-workflow` | Git 工作流规范 | 查看分支管理、提交规范、PR 流程 |

**完整文档:** [.claude/README.md](.claude/README.md)

---

### 🎯 Hooks (自动化规则)

**Hooks 是什么？** 自动化执行机制，在特定事件触发时自动运行，确保关键规则每次都执行。

**当前配置:**
- `UserPromptSubmit` - 提交前自动显示 Git 状态
- `SessionStart` - 会话开始时显示重要提醒
- `PostToolUse (Write)` - 写文件后显示文件名确认
- `SessionEnd` - 会话结束时显示 Git 状态

**完整文档:** [.claude/README.md](.claude/README.md)

⚠️ **安全提醒:** Hooks 会自动运行，使用当前环境凭据。只运行安全的只读命令！

---

### 🆚 Skills vs Agents vs Commands

| 维度 | Skills | Agents | Commands |
|------|--------|--------|----------|
| **定位** | 代码生成器 | 规范指导者 | 快速清单 |
| **输入** | 任务描述 + 参数 | 规范问题 | 无 |
| **输出** | 生成代码文件 | 规范解答/指导 | 提示内容 |
| **适用场景** | "帮我生成 X" | "X 有什么规范?" | "查看 X 清单" |
| **示例** | `/component-generator` | `common-patterns` | `/review-pr` |

**选择指南:**
```
需要生成代码? → Skills (/component-generator, /store-generator)
需要查规范?   → Agents (common-patterns, api-development)
需要看清单?   → Commands (/review-pr, /quick-fix)
```

---

## 📊 3 分钟项目速读

### 核心技术栈
- **框架**: Vue 3 (Composition API + `<script setup>`)
- **语言**: TypeScript (严格类型检查)
- **构建**: Vite
- **测试**: Vitest + Vue Test Utils (jsdom 环境，80% 覆盖率目标)
- **状态**: Pinia (Composition API 风格)
- **路由**: Vue Router (动态权限路由)
- **UI**: Vant (移动端) + TailwindCSS v4
- **HTTP**: Axios + Orval (API 自动生成)

### 核心特性
1. 🤖 **Orval 驱动的 API 层** - OpenAPI → 自动生成类型安全的 API
2. 🔐 **三层路由体系** - 基础路由 + 公共路由 + 异步权限路由
3. 🌍 **AI 自动翻译** - 集成 AI 翻译工具，自动生成多语言包
4. 🎨 **主题系统** - 基于 CSS 变量的完整主题系统 (`public/theme.css`)
5. 📦 **组件分层** - 全局公用组件 (`components/`) + 页面级组件 (`views/[page]/components/`)
6. 🧪 **完整测试体系** - Vitest + 覆盖率阈值 + 自动化测试生成
7. ⚡ **Claude Code Skills** - 专业 Skills，75% 效率提升
8. 💀 **骨架屏系统** - 支持路由级和组件级骨架屏，提升加载体验

### 项目定位
移动端 Vue3 H5 应用模板，强调**类型安全**、**自动化**和**开发规范**。基于 375px 设计稿，使用 postcss-px-to-viewport 自动适配。

---

## 🏗️ 核心架构决策

### 1. Orval API 自动生成架构 ⭐⭐⭐

**最重要的架构决策 - 必读！**

```
src/api/
├── core/              # HTTP 客户端、拦截器 (手动维护)
├── generated/         # 🚫 Orval 自动生成 (禁止修改!)
│   ├── auth/
│   ├── model/         # 类型定义 (每个类型一个文件)
│   └── ...
├── custom/            # ✅ 自定义扩展 (手动编写)
│   ├── external.ts    # ⭐ 示例：调用外部 API (新增场景)
│   └── override.ts    # ⭐ 示例：覆盖生成的 API (扩展场景)
└── index.ts           # 统一导出 (custom 优先导出)
```

**关键规则**:
- 🚫 **绝对禁止修改** `src/api/generated/` 目录
- ✅ 从 `@/api` 统一导入，不直接从 `generated/` 导入
- ✅ 需要扩展时在 `custom/` 目录编写
- ✅ 优先使用 Pinia Store + Orval API 组合进行状态管理

**工作流程**:
```
后端更新 API → 更新 openapi.json → pnpm api:gen → 自动生成代码
```

**详细文档**: [.claude/agents/api-development.md](.claude/agents/api-development.md)

---

### 2. 三层路由体系 ⭐⭐

```
src/router/routes/
├── base.ts      # 基础路由 (登录、404、403) - 无需登录
├── common.ts    # 公共路由 (首页) - 所有登录用户可访问
└── async.ts     # 异步路由 (管理页面) - 需要角色权限，动态注册
```

**路由守卫流程**:
```
访问路由 → 白名单检查 → 登录检查 → 权限检查 → 动态添加异步路由 → 放行
```

**权限控制**:
- 使用 `meta.roles` 配置角色权限: `[ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]`
- `usePermissionStore` 负责根据用户角色过滤和动态注册路由

**详细文档**: [.claude/agents/router-development.md](.claude/agents/router-development.md)

---

### 3. 全局插件配置 ⭐

**重要**: 以下插件已全局配置，**禁止在组件中重复配置**

| 插件 | 配置位置 | 使用方式 |
|------|---------|---------|
| **Dayjs** | `src/plugins/dayjs.ts` | 直接 `import dayjs from 'dayjs'` |
| **i18n** | `src/plugins/locale.ts` | 使用 `useI18n()` 获取实例 |
| **Storage** | `src/plugins/storage` | 使用 `storage('localStorage').set/get` |

```typescript
// ✅ 正确: 直接使用已配置的 dayjs
import dayjs from 'dayjs';
const now = dayjs().format('YYYY-MM-DD');
const relative = dayjs().fromNow();  // RelativeTime 插件已配置

// ❌ 错误: 不要重复配置插件
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);  // 禁止! 已全局配置
```

**详细文档**: [.claude/agents/coding-standards.md#全局插件使用原则](.claude/agents/coding-standards.md#全局插件使用原则)

---

### 4. CSS 主题系统 ⭐

**所有颜色必须使用 `public/theme.css` 中定义的 CSS 变量**

```scss
// ✅ 正确: 使用 CSS 变量
.component {
  color: var(--colorTextHeading);      // 标题文本
  background: var(--colorBgContainer);  // 容器背景
  border: 1px solid var(--colorBorder); // 边框
}

// ❌ 错误: 硬编码颜色
.component {
  color: #333;              // 禁止!
  background: #fff;         // 禁止!
  border: 1px solid #e0e0e0; // 禁止!
}
```

**详细文档**: [.claude/agents/common-patterns.md#css-变量使用规范](.claude/agents/common-patterns.md#css-变量使用规范)

---

## 📁 关键目录速查

| 目录 | 职责 | 注意事项 |
|------|------|---------|
| `src/api/generated/` | Orval 自动生成的 API | 🚫 **禁止修改** |
| `src/api/custom/` | 自定义/扩展 API | ✅ 在这里扩展 API |
| `src/components/` | 全局公用组件 | 多页面复用的纯 UI 组件和业务组件 |
| `src/components/Skeleton/` | 骨架屏组件 | 4 种预置组件 + 工具函数 |
| `src/views/[page]/components/` | 页面级组件 | 特定页面的专属组件 |
| `src/views/` | 页面组件 | 路由对应的页面 |
| `src/router/routes/` | 路由配置 | 三层路由体系 |
| `src/store/modules/` | Pinia Store | Composition API 风格 |
| `src/plugins/` | 全局插件配置 | Dayjs、i18n、Storage |
| `src/interface/skeleton.ts` | 骨架屏类型定义 | SkeletonConfig、SkeletonType |
| `tests/` | 测试文件目录 | 单元测试、Mock 数据 |
| `vitest.config.ts` | Vitest 测试配置 | 覆盖率阈值 80% |
| `public/theme.css` | CSS 主题变量 | 所有颜色必须使用变量 |
| `.claude/agents/` | AI 专业指导文档 | 详细的开发规范 |
| `.claude/skills/` | Claude Code Skills | 自动化工具 |

---

## 🤖 AI Agent 导航

项目配置了专业 AI Agent，根据任务类型自动或手动触发。

### 核心 Agent (优先使用)

| Agent | 触发方式 | 适用场景 | 文档链接 |
|-------|---------|---------|---------|
| 🎨 **common-patterns** | `@common-patterns` | 查询通用开发模式 (Props、CSS、数据驱动) | [查看文档](.claude/agents/common-patterns.md) |
| 🔌 **api-development** | `@api-development` | Orval API 使用、自定义扩展 | [查看文档](.claude/agents/api-development.md) |
| 🧩 **component-development** | `@component-development` | 组件开发、Figma 还原、样式规范 | [查看文档](.claude/agents/component-development.md) |
| 🚦 **router-development** | `@router-development` | 路由配置、权限控制、路由守卫 | [查看文档](.claude/agents/router-development.md) |

### 设计还原 Agent

| Agent | 触发方式 | 适用场景 | 文档链接 |
|-------|---------|---------|---------|
| 🎨 **figma-extraction-guide** | `@figma-extraction-guide` | Figma MCP 使用、设计稿提取、资源下载 | [查看文档](.claude/agents/figma-extraction-guide.md) |

### 专业 Agent (按需使用)

| Agent | 触发方式 | 适用场景 | 文档链接 |
|-------|---------|---------|---------|
| 📦 **store-development** | `@store-development` | Pinia 状态管理、Store 设计 | [查看文档](.claude/agents/store-development.md) |
| 📏 **coding-standards** | `@coding-standards` | 编码规范、代码风格检查 | [查看文档](.claude/agents/coding-standards.md) |
| 🔍 **code-review** | `@code-review` | 代码审查、质量检查、性能优化 | [查看文档](.claude/agents/code-review.md) |
| 🧪 **testing** | `@testing` | 测试策略、单元测试、集成测试 | [查看文档](.claude/agents/testing.md) |
| 🏗️ **project-structure** | `@project-structure` | 项目结构、目录组织、架构设计 | [查看文档](.claude/agents/project-structure.md) |
| 🚀 **deployment** | `@deployment` | 应用部署、Docker、CI/CD | [查看文档](.claude/agents/deployment.md) |

### Agent 触发示例

```bash
# 方式 1: 明确调用
@component-development 帮我创建一个用户卡片组件

# 方式 2: 自动触发 (根据问题内容)
如何配置一个需要管理员权限的路由?  # 自动触发 router-development

# 方式 3: 组合使用
@component-development @api-development 创建用户列表组件并接入 API
```

---

## 🚀 常见开发任务

### 任务 1: 新增页面

```bash
# 步骤 1: 创建页面组件
mkdir src/views/UserManagement
touch src/views/UserManagement/index.vue

# 步骤 2: 配置路由
# 在 src/router/routes/async.ts 或 common.ts 中添加路由配置

# 步骤 3: 访问测试
http://localhost:5173/user-management
```

**详细指导**: `@router-development` 或查看 [router-development.md](.claude/agents/router-development.md)

---

### 任务 2: 新增组件

```bash
# 步骤 1: 确定组件类型
# - 全局公用组件 → src/components/ (多页面复用)
# - 页面级组件 → src/views/[page]/components/ (单页面使用)

# 步骤 2: 创建组件目录
mkdir src/components/UserCard
touch src/components/UserCard/index.vue

# 步骤 3: 定义 Props 和 Emits (使用 TypeScript)
# 参考 common-patterns.md 中的 Props 定义规范
```

**详细指导**: `@component-development` 或查看 [component-development.md](.claude/agents/component-development.md)

---

### 任务 3: 调用 API

```typescript
// 80%: 直接使用生成的 API
import { postAuthLogin } from '@/api';
await postAuthLogin({ username, password });

// 推荐: 使用 Pinia Store
import { useUserStore } from '@/store/modules/user';
await userStore.login({ username, password });

// 20%: 扩展 API → 在 custom/ 目录编写
```

**详细指导**: `@api-development` 或查看 [api-development.md](.claude/agents/api-development.md)

---

### 任务 4: 配置路由权限

```typescript
// 在 src/router/routes/async.ts 中配置
import { ROLES } from '@/constants/roles';

export const asyncRoutes: RouteRecordRaw[] = [
  {
    path: '/lab-management',
    component: Layout,
    children: [
      {
        path: '',
        name: 'LabManagement',
        component: () => import('@/views/lab-management/index.vue'),
        meta: {
          title: '实验室管理',
          roles: [ROLES.ADMIN, ROLES.TEACHER],  // 只有管理员和教师可访问
        },
      },
    ],
  },
];
```

**详细指导**: `@router-development` 或查看 [router-development.md](.claude/agents/router-development.md)

---

## ⚠️ 重要约定和禁忌

### 🚫 禁止事项

| 禁止操作 | 说明 | 后果 |
|---------|------|------|
| 🚫 修改 `src/api/generated/` | Orval 自动生成，会被覆盖 | 修改会丢失 |
| 🚫 直接从 `generated/` 导入 | 破坏导出优先级 | 自定义扩展不生效 |
| 🚫 使用内联 SVG 标签 | 直接用 `<svg>` 或 `v-html` 插入 SVG | 维护困难、无法复用、体积增大 |
| 🚫 硬编码颜色值 | 不使用 CSS 变量 | 主题切换失效 |
| 🚫 重复配置全局插件 | Dayjs、i18n 已全局配置 | 浪费资源，可能冲突 |
| 🚫 使用标签选择器 | 直接用 `h1`, `p`, `div` | 样式污染，维护困难 |

### ✅ 必须遵守

| 规范 | 说明 | 参考文档 |
|------|------|---------|
| ✅ SVG 使用 img 标签 | 下载为文件，用 `<img src="@/assets/icons/[project]/xxx.svg" />` | [common-patterns.md](.claude/agents/common-patterns.md#图标使用规范) |
| ✅ Props/Emits 类型定义 | 完整的 TypeScript 接口 | [common-patterns.md](.claude/agents/common-patterns.md#props-定义规范) |
| ✅ 使用 CSS 变量 | `var(--colorXxx)` | [common-patterns.md](.claude/agents/common-patterns.md#css-变量使用规范) |
| ✅ 数据驱动 | `v-for` + 数据数组 | [common-patterns.md](.claude/agents/common-patterns.md#数据驱动模式) |
| ✅ 错误处理 | try-catch + finally | [common-patterns.md](.claude/agents/common-patterns.md#错误处理模式) |
| ✅ RGB 新语法 | `rgb(r g b / alpha)` | [common-patterns.md](.claude/agents/common-patterns.md#rgb-颜色函数规范) |
| ✅ 禁用 i18n API | AI 生成代码使用明文，由脚本统一翻译 | [coding-standards.md](.claude/agents/coding-standards.md#国际化原则) |

---

## 📚 文档地图

### 核心文档

| 文档 | 目标读者 | 内容 |
|------|---------|------|
| **CLAUDE.md** (本文档) | AI 助手 | 快速概览、架构决策、Agent 索引 |
| [README.md](README.md) | 人类开发者 | 完整开发文档 (613 行) |
| [.claude/agents/](/.claude/agents/) | AI 助手 | 11 个专业领域的详细指导 |

### 专项文档

| 文档 | 说明 |
|------|------|
| [src/api/README.md](src/api/README.md) | Orval API 架构详细说明 |
| [deploy/README.md](deploy/README.md) | Docker 部署脚本使用说明 |
| [docs/README.md](docs/README.md) | API 接口文档 |
| [scripts/i18n/README.md](scripts/i18n/README.md) | AI 自动翻译工具说明 |
| [tests/README.md](tests/README.md) | 测试框架配置说明 |

### Agent 文档索引

| 文档 | 说明 |
|------|------|
| [common-patterns.md](.claude/agents/common-patterns.md) | 通用开发模式 (单一真实来源) |
| [api-development.md](.claude/agents/api-development.md) | Orval API 开发指导 |
| [component-development.md](.claude/agents/component-development.md) | Vue 组件开发规范 |
| [router-development.md](.claude/agents/router-development.md) | 路由配置和权限控制 |
| [figma-extraction-guide.md](.claude/agents/figma-extraction-guide.md) | Figma MCP 技术指导和资源提取 |
| [store-development.md](.claude/agents/store-development.md) | Pinia 状态管理 |
| [coding-standards.md](.claude/agents/coding-standards.md) | 编码规范和最佳实践 |
| [code-review.md](.claude/agents/code-review.md) | 代码审查清单 |
| [testing.md](.claude/agents/testing.md) | 测试策略和规范 |
| [project-structure.md](.claude/agents/project-structure.md) | 项目结构解析 |
| [deployment.md](.claude/agents/deployment.md) | 部署和运维指导 |

---

## 🎯 AI 助手使用建议

### 推荐工作流程

```
1. 收到任务
   ↓
2. 阅读本文档 (CLAUDE.md) 了解项目架构
   ↓
3. 识别任务类型，选择对应 Agent
   ↓
4. 读取 Agent 文档获取详细指导
   ↓
5. 需要通用模式时，查阅 common-patterns.md
   ↓
6. 生成符合规范的代码
```

### 关键提示

- ⚡ **优先阅读**: Orval API 架构 (本文档 "核心架构决策" 章节)
- 📚 **频繁引用**: `common-patterns.md` (Props、CSS、数据驱动)
- 🔗 **善用链接**: 文档间通过链接互相引用，快速定位
- ✅ **遵守禁忌**: 严格遵守 "重要约定和禁忌" 章节

---

## 📋 快速参考

### 常用命令

```bash
# 开发
pnpm start              # 启动开发服务器
pnpm build              # 构建生产版本

# API 相关
pnpm api:gen            # 生成 API 代码 (从 openapi.json)

# 代码质量
pnpm lint               # ESLint 检查
pnpm type-check         # TypeScript 类型检查

# 测试
pnpm test               # 运行测试
pnpm test:watch         # 测试监听模式
pnpm test:coverage      # 测试覆盖率报告
pnpm test:ui            # 测试 UI 界面

# 国际化
pnpm i18n               # 交互式国际化管理
pnpm i18n:translate     # AI 自动翻译
```

### 关键路径

```bash
# API 层
src/api/generated/      # 🚫 自动生成，禁止修改
src/api/custom/         # ✅ 自定义扩展
src/api/index.ts        # 统一导出

# 路由配置
src/router/routes/base.ts    # 基础路由
src/router/routes/common.ts  # 公共路由
src/router/routes/async.ts   # 异步路由

# 组件分类
src/components/              # 全局公用组件
src/views/[page]/components/ # 页面级组件
src/views/                   # 页面组件

# 测试
tests/                       # 测试文件
tests/setup.ts               # 测试全局设置
vitest.config.ts             # Vitest 配置

# 全局配置
src/plugins/                 # 全局插件
public/theme.css             # CSS 主题变量

# Claude Code
.claude/agents/              # Agent 文档
.claude/skills/              # Skills 文档
```
