---
description: 快速查看所有可用工具的索引,包括 Skills、Commands、Agents
---

# 工具索引

快速查找项目中所有可用的开发工具。详细说明请查看 [.claude/README.md](../README.md)

---

## Skills (9 个) - 代码生成和自动化

### 开发辅助 (6 个)

| Skill | 功能 | 常用命令 |
|-------|------|----------|
| `/architecture-designer` | PRD → 架构设计 | `--create-todos` |
| `/component-generator` | 智能组件生成 | `--type page --smart` |
| `/store-generator` | 智能 Store 生成 | `--smart` |
| `/page-assembler` | 页面拼装器 | - |
| `/api-generator` | 自定义 API 生成 | `--type upload` |
| `/figma-to-component` | Figma → 组件 | - |

### 质量保障 (3 个)

| Skill | 功能 | 常用命令 |
|-------|------|----------|
| `/test-coverage-checker` | 测试覆盖率检查 | `--auto-generate` |
| `/code-optimizer` | 代码优化器 | `--full` |
| `/implementation-validator` | 代码实现校验 | `--all` |

---

## Commands (7 个) - 快速提示

| Command | 功能 |
|---------|------|
| `/review-pr` | PR 审查清单 |
| `/git-workflow` | Git 工作流规范 |
| `/quick-fix` | 快速问题修复 |
| `/refactor` | 重构最佳实践 |
| `/optimize` | 性能优化指南 |
| `/security-check` | 安全检查清单 |
| `/tools` | 工具索引 |

---

## Agents (11 个) - 深度指导

### 核心 Agents

| Agent | 职责 |
|-------|------|
| `common-patterns` | 通用开发模式 (SSoT) |
| `api-development` | Orval API 开发 |
| `component-development` | 组件开发规范 |
| `router-development` | 路由配置指导 |

### 专业 Agents

| Agent | 职责 |
|-------|------|
| `store-development` | Pinia 状态管理 |
| `coding-standards` | 编码规范 |
| `code-review` | 代码审查标准 |
| `testing` | 测试策略 |
| `project-structure` | 项目结构解析 |
| `figma-extraction-guide` | Figma MCP 技术 |
| `deployment` | 部署指导 |

---

## 快速使用

```bash
# 日常开发
/architecture-designer docs/prd/user.md --create-todos
/component-generator UserList --type page --smart
/store-generator UserStore --smart

# 质量检查
/test-coverage-checker --auto-generate
pnpm type-check && pnpm lint

# 提交前
/review-pr
pnpm commit
```

---

## 问题诊断

| 场景 | 首选工具 | 备选 |
|------|----------|------|
| TypeScript 错误 | `/quick-fix` → `pnpm type-check` | coding-standards |
| Vue 组件问题 | `/quick-fix` → `pnpm lint` | component-development |
| API 调用失败 | `pnpm api:gen` → `/quick-fix` | api-development |
| 测试覆盖率不足 | `/test-coverage-checker` | testing |
| 代码提交前 | `/review-pr` | `/git-workflow` |

---

**详细文档:** [.claude/README.md](../README.md)
