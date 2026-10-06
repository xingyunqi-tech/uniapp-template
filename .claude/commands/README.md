# Claude Code Commands

> **快速提示命令** | **7 个 Commands** | **轻量级、高频使用**

## 📖 简介

Commands 是轻量级的提示命令，用于快速调用重复使用的提示和工作流程。与 Skills 不同，Commands 更简单、更快速，适合日常高频使用的场景。

## 🆚 Commands vs Skills

| 维度 | Commands | Skills |
|------|----------|--------|
| **复杂度** | 简单提示（单个 .md 文件） | 复杂能力（多文件 + 目录） |
| **触发方式** | 显式调用 `/command` | 自动发现（基于上下文） |
| **适用场景** | 快速提醒、模板 | 结构化工作流 |
| **文件结构** | 单个 Markdown 文件 | 目录 + SKILL.md + 资源 |
| **使用频率** | 高频使用 | 按需使用 |

---

## 📋 可用 Commands（7 个）

### 🔍 代码质量类

#### 1. `/review-pr` - PR 审查清单

**用途:** 提供完整的 Pull Request 审查清单

**使用场景:**
- 审查代码前快速查看清单
- 确保审查的全面性
- 团队统一审查标准

**包含内容:**
- 代码质量检查（TypeScript、ESLint、CSS）
- 功能完整性检查
- 测试和文档检查
- 国际化和无障碍检查
- 性能和安全检查

**示例:**
```bash
/review-pr

# 会显示完整的审查清单，逐项检查
```

---

#### 2. `/security-check` - 安全检查清单

**用途:** 检查前端安全问题，覆盖 OWASP Top 10

**使用场景:**
- 提交敏感功能前的安全审查
- 定期安全检查
- 安全培训和学习

**包含内容:**
- XSS 防护检查
- 身份验证失效检查
- 敏感数据泄露检查
- 访问控制检查
- 依赖安全检查

**示例:**
```bash
/security-check

# 会显示完整的安全检查清单
```

---

### 🔧 开发辅助类

#### 3. `/refactor` - 重构代码提示

**用途:** 提供代码重构的最佳实践和流程

**使用场景:**
- 重构代码前查看原则和步骤
- 确保重构安全性
- 学习重构模式

**包含内容:**
- 重构原则（安全第一、小步快跑）
- 提升代码质量的方法
- 遵循项目规范的要点
- 重构后检查清单
- 常见重构模式

**示例:**
```bash
/refactor

# 会显示重构最佳实践和流程
```

---

#### 4. `/optimize` - 性能优化提示

**用途:** 提供性能优化的方法和技巧

**使用场景:**
- 优化性能前查看清单
- 定位性能瓶颈
- 学习优化技巧

**包含内容:**
- Vue 组件优化
- 列表和表格优化
- 图片和媒体优化
- API 调用优化
- 构建优化
- 性能目标和检查流程

**示例:**
```bash
/optimize

# 会显示完整的性能优化指南
```

---

#### 5. `/quick-fix` - 快速问题修复

**用途:** 快速定位和解决常见开发问题

**使用场景:**
- 遇到错误时快速查找解决方案
- 学习常见问题的解决方法
- 诊断疑难问题

**包含内容:**
- TypeScript 类型错误
- Vue 组件问题
- API 调用问题
- 路由问题
- 样式问题
- 构建和打包问题
- Pinia Store 问题
- 国际化问题
- 测试问题
- 性能问题

**示例:**
```bash
/quick-fix

# 会显示常见问题的分类和解决方案
```

---

#### 6. `/git-workflow` - Git 工作流规范

**用途:** 提供 Git 工作流的最佳实践和规范

**使用场景:**
- 创建分支前查看命名规范
- 提交代码前查看提交规范
- 创建 PR 前查看流程
- 学习 Git 最佳实践

**包含内容:**
- 分支策略（feature、fix、refactor、hotfix）
- 提交规范（Conventional Commits）
- 完整工作流程（开发、修复、重构）
- PR 流程和模板
- 紧急修复流程
- 常用 Git 命令
- 常见问题和解决方案

**示例:**
```bash
/git-workflow

# 会显示完整的 Git 工作流规范
```

---

#### 7. `/tools` - 工具索引

**用途:** 快速查看所有可用工具的索引

**使用场景:**
- 查找可用的 Skills、Commands、Agents
- 不确定使用哪个工具时
- 新手快速了解项目工具

**包含内容:**
- 9 个 Skills (代码生成和自动化)
- 7 个 Commands (快速提示)
- 11 个 Agents (深度指导)
- 工具使用建议和对比

**示例:**
```bash
/tools

# 会显示所有工具的完整索引
```

---

## 🚀 使用方式

### 基本用法

```bash
# 直接输入命令名（带 / 前缀）
/review-pr
/refactor
/optimize
/security-check
/quick-fix
/git-workflow
/tools
```

### 与 Skills 组合使用

```bash
# 场景 1: 查找工具
/tools                        # 查看所有可用工具

# 场景 2: 审查代码前
/review-pr                    # 查看审查清单
pnpm lint                     # ESLint + Stylelint + markdownlint（自动 --fix）
pnpm type-check               # TypeScript 类型检查

# 场景 3: 重构代码
/refactor                     # 查看重构原则
pnpm type-check               # 修复类型错误
pnpm lint                     # 代码审查

# 场景 4: 优化性能
/optimize                     # 查看优化指南
pnpm analyzer                 # 运行构建分析
```

---

## 💡 使用技巧

### 技巧 1: 快速查看清单

Commands 适合在执行任务前快速查看清单：

```bash
# 提交代码前
/review-pr       # 快速查看审查清单

# 重构代码前
/refactor        # 快速查看重构原则

# 优化性能前
/optimize        # 快速查看优化指南
```

### 技巧 2: 学习最佳实践

Commands 包含丰富的最佳实践和示例：

```bash
# 学习安全最佳实践
/security-check

# 学习性能优化技巧
/optimize
```

### 技巧 3: 快速定位问题

遇到问题时，使用 `/quick-fix` 快速定位：

```bash
# 遇到 TypeScript 错误
/quick-fix
# 查看 "TypeScript 类型错误" 章节

# 遇到路由问题
/quick-fix
# 查看 "路由问题" 章节
```

---

## 📊 Commands 优先级

| 优先级 | Command | 使用频率 | 推荐指数 |
|-------|---------|---------|---------|
| **高** | `/review-pr` | ⭐⭐⭐⭐⭐ | 提交前必用 |
| **高** | `/quick-fix` | ⭐⭐⭐⭐⭐ | 遇到问题时必用 |
| **高** | `/git-workflow` | ⭐⭐⭐⭐⭐ | 提交前查看规范 |
| **高** | `/tools` | ⭐⭐⭐⭐⭐ | 查找工具时必用 |
| **中** | `/refactor` | ⭐⭐⭐⭐ | 重构时使用 |
| **中** | `/optimize` | ⭐⭐⭐⭐ | 优化时使用 |
| **中** | `/security-check` | ⭐⭐⭐ | 安全审查时使用 |

---

## 🆕 自定义 Commands

### 创建自定义 Command

1. 在 `.claude/commands/` 目录创建 `.md` 文件
2. 添加 YAML frontmatter
3. 编写命令内容

**示例:**

```markdown
---
description: 你的命令描述
---

# 命令标题

命令内容...
```

### 命令命名规范

- 使用小写字母和连字符：`my-command.md`
- 文件名即为命令名：`/my-command`
- 描述要简洁清晰

---

## 📚 相关资源

### Skills
- `.claude/skills/` - 9 个自动化 Skills（包括 api-generator）
- `.claude/skills/README.md` - Skills 使用指南

### Agents
- `.claude/agents/` - 11 个专业 Agents
- `.claude/agents/common-patterns.md` - 通用开发模式

### 文档
- `CLAUDE.md` - AI 助手快速指南
- `README.md` - 完整开发文档

---

## 🎉 开始使用

现在就试试第一个 Command：

```bash
# 查看所有工具
/tools

# 查看 PR 审查清单
/review-pr

# 快速修复问题
/quick-fix
```

**祝你开发愉快！⚡**

---

**最后更新:** 2025-11-17
