# Agent 导航

> AI 开发助手专业领域指导文档索引

本目录包含 11 个专业 Agent 文档,覆盖项目开发的完整生命周期。每个 Agent 负责特定领域的指导,帮助 AI 生成高质量、符合项目规范的代码。

---

## 📚 文档使用说明

### 引用方式
在提示词中使用 `@agent-name` 引用特定 Agent:

```
@component-development 帮我创建一个用户卡片组件
@api-development 如何扩展 Orval 生成的登录接口?
```

### 自动触发
AI 会根据问题内容自动选择合适的 Agent,无需手动指定。

### 组合使用
可以同时引用多个 Agent:

```
@component-development @api-development 创建用户列表组件并接入 API
```

---

## 🎯 核心 Agent (日常必用)

### 🎨 [common-patterns.md](common-patterns.md)
**职责**: 项目通用开发模式,作为单一真实来源 (Single Source of Truth)

**适用场景**:
- ✅ 查询 Props/Emits 定义规范
- ✅ 查询数据驱动模式 (v-for + 数据数组)
- ✅ 查询 CSS 变量使用规范
- ✅ 查询 CSS 盒模型规范 (Figma 转 CSS 必读)
- ✅ 查询骨架屏配置和使用

**核心内容**:
- Vue 组件模式 (Props/Emits/响应式数据)
- 数据驱动模式 (列表渲染/业务数据传入)
- CSS 变量使用规范 (src/styles/theme.scss)
- CSS 盒模型规范 (box-sizing: border-box)
- 样式选择器规范 (BEM 命名)
- RGB 颜色函数规范 (新语法)
- 错误处理模式
- 骨架屏模式

---

### 🔌 [api-development.md](api-development.md)
**职责**: Orval 自动生成 API 开发指导

**适用场景**:
- ✅ 使用 Orval 自动生成的 API
- ✅ 扩展或覆盖生成的 API
- ✅ 完全自定义 API (文件上传/WebSocket)
- ✅ 使用 Pinia Store 管理状态

**核心内容**:
- ⚠️ **核心原则**: 🚫 绝不修改 `generated/` 目录
- Orval 三层架构 (core/generated/custom)
- 三种使用场景 (80%/15%/5%)
- 从 `@/api` 统一导入,不直接从 `generated/` 导入
- Pinia Store + Orval API 组合使用
- HTTP 实例 `http` 与 Alova Hooks (useRequest/useWatcher/useFetcher)
- 请求 meta 配置与 401 刷新处理

---

### 🧩 [component-development.md](component-development.md)
**职责**: Vue 组件开发指导,包括组件设计、视觉还原、布局规范

**适用场景**:
- ✅ 开发基础组件 (src/components/)
- ✅ 开发页面级组件 (src/pages/[page]/components/ 或 src/pages-sub/[module]/[page]/components/)
- ✅ 开发页面组件 (src/pages/ 或 src/pages-sub/)
- ✅ Figma 设计稿还原

**核心内容**:
- 组件三层体系 (基础/页面级/页面)
- 复杂组件开发顺序 (先基础,再业务)
- Figma 设计稿还原规范
- 视觉规范补充 (字体/间距/盒模型)
- 布局组件 (认证页面复用 AuthLayout)
- 避免冗余 DOM 和样式

---

### 🚦 [router-development.md](router-development.md)
**职责**: Uni-app 路由开发指导,包括页面配置 (definePage + pages.config.ts)、权限控制、路由拦截器

**适用场景**:
- ✅ 新增主包/分包页面
- ✅ 配置白名单 (无需登录的页面)
- ✅ 配置页面角色权限 (PAGE_ROLES)
- ✅ 配置路由拦截器

**核心内容**:
- definePage + pages.config.ts 生成 pages.json
- 分包配置 (pages-sub/)
- 路由拦截器实现 (src/utils/router-interceptor.ts)
- 路由跳转方式 (navigateTo/redirectTo/switchTab)
- 白名单与页面角色配置 (src/constants/pages.ts)
- 页面生命周期 (onLoad/onShow/onHide)

---

## 📦 专业 Agent (按需使用)

### 📦 [store-development.md](store-development.md)
**职责**: Pinia 状态管理开发指导

**适用场景**:
- ✅ 创建新的 Store 模块
- ✅ 实现 Store Actions 和 Getters
- ✅ 配置状态持久化
- ✅ 跨 Store 通信

**核心内容**:
- Store 设计原则 (单一职责/类型安全/性能优化)
- User Store 和 Global Store 示例
- Composition API 风格 Store 定义
- 状态持久化配置
- 状态重置和错误处理

---

### 📏 [coding-standards.md](coding-standards.md)
**职责**: 编码规范和最佳实践,确保代码风格一致性和类型安全

**适用场景**:
- ✅ 查询 TypeScript 编码规范
- ✅ 查询 Vue 组件编码规范
- ✅ 查询 API 导入规范
- ✅ 查询全局插件使用规范
- ✅ 查询样式编码规范

**核心内容**:
- TypeScript 类型定义规范
- Vue Composition API 规范
- API 导入规范 (从 `@/api` 统一导入)
- 国际化原则 (vue-i18n `$t`，同步维护语言包)
- 样式编码规范 (CSS 变量/BEM 命名)

---

### 🔍 [code-review.md](code-review.md)
**职责**: 代码质量检查、安全审查、性能优化建议

**适用场景**:
- ✅ 提交前代码审查
- ✅ 类型安全检查
- ✅ 性能优化检查
- ✅ 安全检查 (XSS/权限控制)

**核心内容**:
- TypeScript 类型检查清单
- Vue 组件检查清单
- API 接口检查清单 (Orval 架构)
- 状态管理检查清单
- 性能优化检查 (组件性能/网络请求)
- 安全检查 (输入验证/XSS 防护)
- 代码审查报告模板

---

### 🧪 [testing.md](testing.md)
**职责**: 测试策略制定、测试用例编写、测试工具配置

**适用场景**:
- ✅ 编写单元测试 (工具函数/Store/组件)
- ✅ 编写集成测试 (API/组件集成)
- ✅ 配置 Vitest 测试环境
- ✅ Mock API 请求

**核心内容**:
- 测试金字塔 (单元 > 集成 > E2E)
- Vitest 配置 (覆盖率阈值 70/68/67/70)
- API 测试 (vi.mock 模拟 API 模块或模拟 uni.request，Orval 架构)
- Vue 组件测试 (@vue/test-utils)
- Pinia Store 测试
- 测试最佳实践 (命名规范/数据管理)

---

### 🏗️ [project-structure.md](project-structure.md)
**职责**: 项目目录结构分析、文件组织规范和架构设计指导

**适用场景**:
- ✅ 理解项目整体架构
- ✅ 查询目录职责和文件组织规范
- ✅ 新增页面/组件/API 的目录选择
- ✅ 查询文件引用规范

**核心内容**:
- 项目技术栈和架构模式
- 目录结构详解 (src/api/、src/components/、src/pages/、src/pages-sub/ 等)
- Orval API 架构说明 (引用 api-development.md)
- 文件引用规范 (路径别名/@/api 统一导入)
- 目录创建指导 (新增页面/组件/API)
- AI 编程指导原则

---

### 🎨 [figma-extraction-guide.md](figma-extraction-guide.md)
**职责**: Figma MCP 技术指导,负责提取设计数据和下载资源

**适用场景**:
- ✅ 从 Figma 设计稿提取设计数据
- ✅ 下载 SVG 图标和 PNG 图片
- ✅ 提取设计 Token (间距/颜色/字体/特效)
- ✅ 处理 Figma MCP 异常

**核心内容**:
- 提取 fileKey 和 nodeId
- 使用 `mcp__figma__get_figma_data` 获取设计数据
- 提取设计 Token (间距/颜色/字体/特效)
- 区分 SVG 和 PNG (通过 `imageRef`)
- 使用 `mcp__figma__download_figma_images` 下载资源
- 异常处理 (数据过大/下载失败/路径错误)
- ⚠️ **不负责组件实现** (详见 component-development.md)

---

### 🚀 [deployment.md](deployment.md)
**职责**: 应用部署、运维监控、环境管理

**适用场景**:
- ✅ H5 / 小程序构建
- ✅ GitHub Actions 自动部署 (H5 rsync / 小程序上传)
- ✅ 本地上传小程序
- ✅ 故障排查

**核心内容**:
- 部署文件结构 (.github/workflows/、scripts/mp-upload.ts)
- 构建产物目录
- H5 与小程序部署流程及所需 Secrets
- 故障排查指南

---

## 🔗 Agent 依赖关系

```
common-patterns (单一真实来源)
    ↓
    ├── component-development (引用 Props/CSS 变量/盒模型)
    │   └── figma-extraction-guide (引用组件开发)
    ├── coding-standards (引用 Props/CSS 变量)
    │   └── api-development (引用编码规范)
    ├── router-development (引用骨架屏模式)
    └── testing (引用通用模式)
```

---

## 📋 快速查询表

| 问题 | 查询 Agent |
|------|-----------|
| 如何定义 Props/Emits? | @common-patterns |
| 如何使用 CSS 变量? | @common-patterns |
| Figma 尺寸如何转 CSS? | @common-patterns (盒模型规范) |
| 如何使用 Orval 生成的 API? | @api-development |
| 如何扩展 Orval API? | @api-development |
| 如何创建组件? | @component-development |
| 如何还原 Figma 设计稿? | @component-development |
| 如何配置路由? | @router-development |
| 如何实现权限控制? | @router-development |
| 如何创建 Pinia Store? | @store-development |
| 全局插件如何使用? | @coding-standards |
| 如何编写测试? | @testing |
| 项目目录如何组织? | @project-structure |
| 如何从 Figma 下载图标? | @figma-extraction-guide |
| 如何部署应用? | @deployment |

---

## 🎯 使用建议

### 新手入门推荐阅读顺序

1. **第一步**: [project-structure.md](project-structure.md) - 理解项目整体架构
2. **第二步**: [common-patterns.md](common-patterns.md) - 掌握通用开发模式
3. **第三步**: [api-development.md](api-development.md) - 理解 Orval API 架构
4. **第四步**: [component-development.md](component-development.md) - 学习组件开发规范
5. **第五步**: [router-development.md](router-development.md) - 掌握路由配置

### 开发流程中的 Agent 使用

```
需求分析
    ↓
@figma-extraction-guide → 提取设计数据和资源
    ↓
@component-development → 开发组件
    ↓
@api-development → 接入 API
    ↓
@router-development → 配置路由
    ↓
@store-development → 管理状态 (如需要)
    ↓
@testing → 编写测试
    ↓
@code-review → 代码审查
    ↓
@deployment → 部署上线
```

---

## 📚 相关文档

- **项目主文档**: [CLAUDE.md](../../CLAUDE.md) - AI 开发助手快速指南
- **用户文档**: [README.md](../../README.md) - 完整开发文档
- **Commands 索引**: [.claude/commands/README.md](../commands/README.md) - 快速提示命令
- **Skills 索引**: [.claude/skills/README.md](../skills/README.md) - 自动化工具

---

## 🔄 版本信息

- **当前版本**: v1.0.0
- **最后更新**: 2025-11-16
- **Agent 数量**: 11 个
- **维护状态**: ✅ 活跃维护

---

## 💡 贡献指南

### 新增 Agent

1. 在 `.claude/agents/` 目录创建 `{name}.md` 文件
2. 添加 YAML frontmatter:
   ```yaml
   ---
   name: agent-name
   description: Agent 职责描述
   version: 1.0.0
   updated: YYYY-MM-DD
   ---
   ```
3. 编写 Agent 内容
4. 在本文档中添加 Agent 索引

### 更新 Agent

1. 修改 Agent 文档内容
2. 更新 YAML frontmatter 中的 `version` 和 `updated`
3. 如有跨 Agent 引用变更,更新相关引用链接

---

## ❓ 常见问题

### Q: 如何选择合适的 Agent?

**A**: 根据问题类型选择:
- 组件开发 → `@component-development`
- API 调用 → `@api-development`
- 路由配置 → `@router-development`
- 不确定时,AI 会自动选择合适的 Agent

### Q: 可以同时使用多个 Agent 吗?

**A**: 可以。例如:
```
@component-development @api-development 创建用户列表组件并接入 API
```

### Q: Agent 文档之间有什么关系?

**A**:
- `common-patterns` 是单一真实来源 (SSoT)
- 其他 Agent 通过链接引用 `common-patterns`
- 避免重复定义,保持一致性

---

通过这些 Agent 文档,AI 可以生成高质量、符合项目规范的代码,提升开发效率。
