# Claude Code 配置指南

> Uni-app 项目的 Claude Code 完整配置，包括 Agents、Skills、Commands 和 Hooks

**重要**: 本项目是 Uni-app 多端项目，使用 pages.json 配置路由（非 Vue Router），使用 uni-ui 组件库。

---

## 四层工具体系

| 层级 | 职责 | 触发方式 | 复杂度 |
|------|------|----------|--------|
| **Commands** | 快速提示/清单 | `/command-name` 手动调用 | 简单 |
| **Skills** | 代码生成/自动化 | Claude 自动发现，根据任务匹配 | 复杂 |
| **Agents** | 深度指导/规范 | Task 工具 `subagent_type` 参数 | 深入 |
| **Hooks** | 自动化规则 | 事件驱动，自动执行 | 确定性 |

**工作机制:**
- **Commands**: 用户输入 `/review-pr` 等命令，Claude 读取对应 `.md` 文件作为提示
- **Skills**: Claude 根据任务自动匹配 `.claude/skills/` 中的能力描述
- **Agents**: Claude 通过 Task 工具调用专业子代理处理复杂任务
- **Hooks**: `settings.json` 中配置，在特定事件时自动执行 shell 命令

**使用原则:**
- **日常开发**: 优先使用 Skills（快速自动化）
- **查看清单**: 使用 Commands（快速提醒）
- **学习规范**: 使用 Agents（深度指导）
- **强制规则**: Hooks 自动执行

---

## Skills - 代码生成和自动化

Skills 是命令式工具，用于快速完成重复性开发任务，效率提升 75%。

### 完整 Skills 列表

#### 开发辅助类

| Skill | 功能 | 常用命令 |
|-------|------|----------|
| `/architecture-designer` | PRD → 架构设计，生成完整开发计划和 Todo 清单 | `/architecture-designer docs/prd/user.md --create-todos` |
| `/component-generator` | 智能组件生成，支持基础/业务/页面组件 | `/component-generator UserList --type page --smart` |
| `/store-generator` | 智能 Pinia Store 生成，自动集成 API | `/store-generator UserStore --smart` |
| `/page-assembler` | 页面拼装器，组装组件为完整页面 | `/page-assembler src/pages-sub/user/profile/index.vue` |
| `/api-generator` | 自定义 API 生成 (Orval 无法覆盖的 20% 场景) | `/api-generator uploadFile --type upload` |
| `/figma-to-component` | 从 Figma 设计稿生成 Vue 组件 | `/figma-to-component <figma-url>` |

#### 质量保障类

| Skill | 功能 | 常用命令 |
|-------|------|----------|
| `/test-coverage-checker` | 测试覆盖率检查，自动生成测试模板 | `/test-coverage-checker --auto-generate` |
| `/implementation-validator` | 代码实现一致性校验 (API + PRD) | `/implementation-validator --all docs/prd/feature.md src/pages-sub/feature/` |
| `/code-optimizer` | 6 维度代码优化 (常量/函数/Composables/组件/指令/类型) | `/code-optimizer src/pages-sub/user/ --full` |

### 命名规范

| 类型 | 命名模式 | 示例 |
|------|----------|------|
| 生成类 | `/xxx-generator` | `/component-generator`, `/store-generator`, `/api-generator` |
| 检查类 | `/xxx-checker` / `/xxx-validator` | `/test-coverage-checker`, `/implementation-validator` |
| 设计类 | `/xxx-designer` | `/architecture-designer` |
| 优化类 | `/xxx-optimizer` | `/code-optimizer` |
| 拼装类 | `/xxx-assembler` | `/page-assembler` |

### 使用说明

Skills 根据任务自动匹配，也可以通过描述任务来触发：

```bash
# 示例 1: 生成组件
"帮我生成一个用户列表组件"  → 自动使用 /component-generator

# 示例 2: 生成 Store
"创建用户管理的 Store"  → 自动使用 /store-generator

# 示例 3: 代码优化
"优化 src/pages-sub/user/ 目录的代码"  → 自动使用 /code-optimizer

# 示例 4: 从 PRD 开始设计
"根据 docs/prd/user.md 设计架构"  → 自动使用 /architecture-designer
```

### 常用参数速查

| Skill | 参数 | 说明 |
|-------|------|------|
| `/component-generator` | `--type basic/business/page` | 组件类型 |
| `/component-generator` | `--smart` | 智能模式，自动分析依赖 |
| `/component-generator` | `--with-router` | 同时生成路由配置 |
| `/store-generator` | `--smart` | 智能模式，自动集成 API |
| `/code-optimizer` | `--full` | 6 维度全量优化 |
| `/architecture-designer` | `--create-todos` | 生成 Todo 清单 |
| `/test-coverage-checker` | `--auto-generate` | 自动生成测试模板 |
| `/implementation-validator` | `--all` | 完整校验 (API + PRD) |

### 智能化工作流

```bash
# 完整开发流程: PRD → 实现 (效率提升 75%)
/architecture-designer docs/prd/user.md --create-todos  # 1. 架构设计
pnpm api:gen                                             # 2. API 同步
/store-generator UserStore --smart                       # 3. 生成 Store
/component-generator UserManagement --type page --smart  # 4. 生成页面
/page-assembler src/pages/user/index.vue                 # 5. 页面拼装
/code-optimizer src/pages/user/ --full                   # 6. 代码优化
/test-coverage-checker --auto-generate                   # 7. 质量检查
pnpm commit                                              # 8. 提交代码
```

---

## Commands - 快速提示和清单

Commands 是轻量级提示命令，用于快速查看清单和最佳实践。

### 完整 Commands 列表

| Command | 文件 | 功能 | 使用场景 |
|---------|------|------|----------|
| `/review-pr` | `review-pr.md` | PR 审查清单，包含代码质量、安全性、测试等检查项 | 代码审查前 |
| `/git-workflow` | `git-workflow.md` | Git 工作流规范，分支策略、提交规范、PR 流程 | 提交前查看规范 |
| `/quick-fix` | `quick-fix.md` | 快速问题修复索引，按错误类型分类解决方案 | 遇到问题时 |
| `/refactor` | `refactor.md` | 重构最佳实践，安全重构原则和步骤 | 重构代码前 |
| `/optimize` | `optimize.md` | 性能优化指南，Vue/API/构建优化技巧 | 优化性能前 |
| `/security-check` | `security-check.md` | 安全检查清单，覆盖 OWASP Top 10 | 安全审查时 |
| `/tools` | `tools.md` | 工具索引，快速查找所有可用工具 | 查找工具时 |

### 使用示例

```bash
/review-pr        # 提交前查看审查清单
/quick-fix        # 遇到问题时快速定位
/git-workflow     # 查看 Git 提交规范
/security-check   # 安全审查检查清单
```

---

## Agents - 深度指导

Agents 提供专业领域的深度指导，Claude 根据任务内容自动选择合适的 Agent。

### 完整 Agents 列表

#### 核心 Agents (日常必用)

| Agent | 文件 | 职责 | 适用场景 |
|-------|------|------|----------|
| `common-patterns` | `common-patterns.md` | 通用开发模式 (SSoT)，Props/Emits/CSS变量/盒模型 | 查询通用模式和规范 |
| `api-development` | `api-development.md` | Orval API 开发，四层架构/自定义扩展/工作流 | API 使用和扩展 |
| `component-development` | `component-development.md` | 组件开发规范，设计原则/Figma 还原/样式规范 | 组件设计和开发 |
| `router-development` | `router-development.md` | **Uni-app 路由**，pages.json 配置/分包/导航 | 路由和页面配置 |

#### 专业 Agents (按需使用)

| Agent | 文件 | 职责 | 适用场景 |
|-------|------|------|----------|
| `store-development` | `store-development.md` | Pinia 状态管理，Store 设计原则/持久化/最佳实践 | Store 设计和实现 |
| `coding-standards` | `coding-standards.md` | 编码规范，TypeScript/Vue/命名/导入规范 | 代码风格检查 |
| `code-review` | `code-review.md` | 代码审查，质量检查/安全审查/性能优化建议 | 代码审查和优化 |
| `testing` | `testing.md` | 测试策略，单元测试/集成测试/Mock/覆盖率 | 测试编写和策略 |
| `project-structure` | `project-structure.md` | 项目结构，目录组织规范/架构设计指导 | 架构设计和组织 |
| `figma-extraction-guide` | `figma-extraction-guide.md` | Figma MCP 技术专家，设计数据提取/资源下载 | Figma 设计还原 |
| `deployment` | `deployment.md` | 部署运维，Docker/CI/CD/环境管理/监控 | 应用部署和运维 |

### Agent 依赖关系

```
common-patterns (单一真实来源 SSoT)
    ├── component-development (引用 Props/CSS/盒模型)
    │   └── figma-extraction-guide
    ├── coding-standards (引用 Props/CSS)
    │   └── api-development
    ├── router-development (引用骨架屏)
    └── testing
```

### 使用说明

Agents 通过 Task 工具自动调用，你只需描述任务，Claude 会自动选择合适的 Agent：

```bash
# 示例 1: 直接描述任务，Claude 自动匹配 Agent
"帮我创建用户卡片组件"  → Claude 自动使用 component-development agent

# 示例 2: 询问规范问题
"Props 定义有什么规范?"  → Claude 自动使用 common-patterns agent

# 示例 3: 复杂任务
"如何扩展 Orval 生成的 API?"  → Claude 自动使用 api-development agent
```

> **技术细节**: Agents 是 Task 工具的 `subagent_type` 参数，Claude 根据任务内容自动选择。

---

## Hooks - 自动化规则

Hooks 是自动化执行机制，在特定事件触发时自动运行，配置在 `settings.json` 中。

### 当前配置

| Hook | 触发时机 | 作用 | 命令 |
|------|----------|------|------|
| `SessionStart` | 会话开始 | 显示欢迎信息、分支、未提交文件数、规范提醒 | `printf` 输出信息 |
| `UserPromptSubmit` | 提交提示时 | 显示 Git 状态，了解当前改动 | `git status --short` |
| `PostToolUse(Write)` | 写文件后 | 确认文件路径，避免写错位置 | `printf '✅ 文件已写入'` |
| `SessionEnd` | 会话结束 | 显示 Git 状态提醒，避免遗漏提交 | `git status --short` |

### 可用的 Hook 事件

| 事件 | 触发时机 | 适用场景 |
|------|----------|----------|
| `PreToolUse` | 工具调用前 | 阻止危险操作、参数校验 |
| `PostToolUse` | 工具调用后 | 自动格式化、通知确认 |
| `UserPromptSubmit` | 提交提示时 | 显示状态、规范提醒 |
| `SessionStart` | 会话开始 | 初始化、欢迎信息 |
| `SessionEnd` | 会话结束 | 清理、状态保存 |
| `Notification` | 发送通知时 | 自定义通知 |

### Hook 配置示例

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "git status --short || true"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "printf '✅ 文件已写入: %s\\n' \"$CLAUDE_FILE_PATH\"",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

### 安全原则

```bash
# ✅ 安全：只读命令
git status --short || true
pnpm type-check || true

# ❌ 危险：修改操作 (禁止在 Hook 中使用)
rm -rf dist/
git reset --hard
git push  # 自动推送
```

**关键点:**
- 使用 `|| true` 避免阻塞会话
- 使用 `printf` 替代 `echo` (跨平台兼容)
- 设置 `timeout` 防止长时间执行
- 只运行只读命令，不修改文件或仓库状态

---

## MCP 服务器配置

MCP (Model Context Protocol) 服务器扩展 Claude 的能力。

### 配置文件

| 文件 | 用途 | 说明 |
|------|------|------|
| `.mcp.json` | Claude Code 配置 | 项目根目录，Claude Code 读取 |
| `.cursor/mcp.json` | Cursor 配置 | Cursor 编辑器读取 |
| `settings.json` | 启用控制 | `enabledMcpjsonServers` 字段控制启用哪些 |

### 当前配置的 MCP 服务器

| 服务器 | NPM 包 | 功能 | 使用场景 |
|--------|--------|------|----------|
| `figma` | `figma-developer-mcp` | Figma 设计稿读取 | 提取设计数据、下载 SVG/PNG |
| `context7` | `@upstash/context7-mcp` | 第三方库文档查询 | 获取最新库文档和 API 参考 |
| `eslint` | `@eslint/mcp@latest` | ESLint 代码检查 | 文件级别的 lint 检查 |
| `chrome-devtools` | `chrome-devtools-mcp@latest` | Chrome 开发者工具 | 浏览器调试和性能分析 |

### 完整 MCP 配置 (.mcp.json)

```json
{
  "mcpServers": {
    "figma": {
      "command": "npx",
      "args": ["-y", "figma-developer-mcp", "--stdio"],
      "env": {
        "FIGMA_API_KEY": "${FIGMA_API_KEY}"
      }
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    },
    "eslint": {
      "command": "npx",
      "args": ["@eslint/mcp@latest"]
    },
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest"]
    }
  }
}
```

### 在 settings.json 中启用

```json
{
  "enabledMcpjsonServers": ["figma", "context7", "eslint", "chrome-devtools"]
}
```

### MCP 工具使用示例

```bash
# Figma - 提取设计数据
mcp__figma__get_figma_data  # 获取 Figma 文件数据
mcp__figma__download_figma_images  # 下载图片资源

# Context7 - 查询库文档
mcp__context7__resolve-library-id  # 解析库 ID
mcp__context7__get-library-docs    # 获取库文档

# ESLint - 代码检查
mcp__eslint__lint-files  # 检查指定文件
```

### 环境变量配置

需要配置以下环境变量：

| 变量 | 服务器 | 获取方式 |
|------|--------|----------|
| `FIGMA_API_KEY` | figma | [Figma 开发者设置](https://www.figma.com/developers/api#access-tokens) |

**配置方式**:

1. **系统环境变量** (推荐): 在系统或 shell 配置中设置
2. **项目 .env 文件**: 创建 `.env` 文件并添加到 `.gitignore`

```bash
# .env (添加到 .gitignore)
FIGMA_API_KEY=figd_xxxxxxxxxxxxxxxxxxxxxxx
```

> **安全提醒**: 绝对不要将真实的 API Key 提交到代码仓库！

---

## Permissions 权限配置

Permissions 控制 Claude 可以自动执行哪些命令（无需确认），配置在 `settings.json` 的 `permissions` 字段。

### 当前允许的命令

| 分类 | 命令 | 说明 |
|------|------|------|
| **开发脚本** | `pnpm start:*`, `pnpm build:*` | 启动和构建 |
| **代码生成** | `pnpm api:gen:*` | Orval API 生成 |
| **代码质量** | `pnpm lint:*`, `pnpm lint:fix:*`, `pnpm lint:script:*`, `pnpm type-check:*` | ESLint 和 TypeScript 检查 |
| **测试** | `pnpm test:*` | 单元测试 |
| **Git 操作** | `git status`, `git diff`, `git log` 等 | 常用 Git 命令 |
| **提交** | `git add`, `git commit`, `pnpm commit:*` | 代码提交 |

### 配置示例

```json
{
  "permissions": {
    "allow": [
      "Bash(pnpm start:*)",
      "Bash(pnpm lint:*)",
      "Bash(git status:*)",
      "Bash(git commit:*)"
    ],
    "deny": []
  }
}
```

### 安全说明

- **allow**: 列出的命令 Claude 可以直接执行，无需用户确认
- **deny**: 明确禁止的命令（当前为空）
- 使用 `*` 通配符匹配命令参数
- 未列出的命令需要用户手动确认

---

## 问题诊断决策树

```
问题 → 能自动修复?
        ├─ 是 → Skills (自动修复)
        └─ 否 → 知道解决方案?
                ├─ 是 → 手动修复
                └─ 否 → Commands (快速索引)
                        └─ 仍不清楚? → Agents (深度学习)
```

### 常见场景速查

| 场景 | 首选工具 | 备选 |
|------|----------|------|
| TypeScript 类型错误 | `/quick-fix` → `pnpm type-check` | coding-standards agent |
| Vue 组件问题 | `/quick-fix` → `pnpm lint` | component-development agent |
| API 调用失败 | `pnpm api:gen` → `/quick-fix` | api-development agent |
| 样式/CSS 问题 | common-patterns agent | `pnpm lint` |
| 路由 404/403 | `/quick-fix` | router-development agent |
| 代码提交前 | `/review-pr` → `pnpm type-check` | `/git-workflow` |
| 性能优化 | `/optimize` → `pnpm analyzer` | component-development agent |
| 测试覆盖率不足 | `/test-coverage-checker` | testing agent |

---

## 快速开始

```bash
# 1. 查看工具索引
/tools

# 2. 使用 Command 查看清单
/review-pr

# 3. 直接描述任务，Claude 自动选择 Skill 或 Agent
"帮我创建一个用户列表组件"      # → 自动使用 component-generator skill
"Props 定义有什么规范?"         # → 自动查阅 common-patterns agent
"如何扩展 Orval 生成的 API?"   # → 自动查阅 api-development agent
```

---

## 自定义扩展

### 新增 Command

在 `commands/` 目录创建 `.md` 文件:

```markdown
---
description: 命令描述 (必需)
---

# 命令标题

命令内容...
```

### 新增 Skill

在 `skills/` 目录创建 `.md` 文件:

```markdown
---
name: skill-name
description: Skill 功能描述
---

# Skill 标题

## 功能概述
...

## 使用方式
...

## 执行流程
...
```

### 新增 Agent

在 `agents/` 目录创建 `.md` 文件:

```markdown
---
name: agent-name
description: Agent 职责描述
---

# Agent 标题

## 职责
...

## 规范详情
...
```

### 新增 Hook

在 `settings.json` 的 `hooks` 字段中添加配置:

```json
{
  "hooks": {
    "EventName": [
      {
        "matcher": "ToolName",  // 可选，仅 PreToolUse/PostToolUse 使用
        "hooks": [
          {
            "type": "command",
            "command": "your-command || true",
            "timeout": 10  // 可选，单位秒
          }
        ]
      }
    ]
  }
}
```
