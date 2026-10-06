---
description: 快速提醒 PR 审查清单，确保代码质量和项目规范
---

# Pull Request 审查清单

请按照以下清单全面审查 Pull Request，确保代码符合项目规范和质量标准。

## 📋 审查清单

### 1. 代码质量

#### TypeScript 类型安全
- [ ] 所有函数、变量都有明确的类型定义
- [ ] 无 `any` 类型（除非有充分理由）
- [ ] Props/Emits 接口完整定义
- [ ] 运行 `pnpm type-check` 无错误

#### 代码规范
- [ ] 无 ESLint 错误和警告
- [ ] 代码格式符合 Prettier 规范
- [ ] 变量和函数命名清晰（camelCase）
- [ ] 无硬编码魔法数字（使用常量）
- [ ] 参考 `@coding-standards`

#### Vue 组件规范
- [ ] Props 定义使用 `defineProps<Props>()`
- [ ] Emits 定义使用 `defineEmits<Emits>()`
- [ ] 组件使用 `<script setup>` 语法
- [ ] 参考 `@component-development`

#### CSS 规范
- [ ] **所有颜色使用 CSS 变量**（`src/styles/theme.scss`）
- [ ] 无硬编码颜色值（#fff、rgb()、rgba()）
- [ ] 使用语义化 class 名称
- [ ] 无直接标签选择器（h1、p、view、text）
- [ ] 使用 rpx 单位（750rpx = 设计稿宽度）
- [ ] 参考 `@common-patterns`

---

### 2. 功能完整性

#### 功能实现
- [ ] 功能符合 PRD/需求文档
- [ ] 核心流程正常工作
- [ ] 边界情况处理完善
- [ ] 错误情况处理（try-catch）

#### 用户体验
- [ ] 加载状态提示（ULoading/Toast）
- [ ] 错误提示友好（uni.showToast）
- [ ] 交互反馈及时
- [ ] 多端适配（使用 rpx 单位，750rpx = 设计稿宽度）

#### API 调用
- [ ] 使用 Orval 生成的 API（从 `@/api` 导入）
- [ ] 优先使用 Pinia Store
- [ ] 完整的错误处理
- [ ] 参考 `@api-development`

---

### 3. 测试和文档

#### 单元测试
- [ ] 关键组件有单元测试
- [ ] 测试覆盖率 >= 80%
- [ ] 运行 `pnpm test` 全部通过
- [ ] 参考 `@testing`

#### 代码注释
- [ ] 复杂逻辑有注释说明
- [ ] 公共函数有 JSDoc 注释
- [ ] 必要的 TODO/FIXME 注释

#### 文档更新
- [ ] README.md 更新（如有新功能）
- [ ] CHANGELOG.md 更新
- [ ] API 文档更新（如有新接口）

---

### 4. 国际化和无障碍

#### 国际化 (i18n)
- [ ] 多语言文本使用 `$t('key')`，key 在 `src/locale/zh-CN.json`、`src/locale/en-US.json` 中同时定义
- [ ] 参考 `@coding-standards#国际化原则`

#### 无障碍支持
- [ ] 图片有 `alt` 属性
- [ ] 交互元素有 `aria-label`
- [ ] 键盘可访问（Tab 导航）

---

### 5. AI 生成代码专项检查

> **审查员宣言**: "LGTM 意味着我已验证逻辑，而非仅觉得代码格式漂亮。"

#### 幻觉代码验证 (最高优先级)
- [ ] **幻觉库检测**: 新增的 npm 包是否真实存在？版本是否过旧？
- [ ] **API 签名验证**: 调用的函数参数是否与当前版本匹配？
- [ ] **正则表达式实测**: 复杂正则是否在 [regex101](https://regex101.com) 验证过？

#### 凭证与敏感信息
- [ ] **无硬编码凭证**: 检查 API Key、Token、Password、内网 IP
- [ ] **无敏感日志**: console.log 中无用户 ID、Token 等敏感数据
- [ ] **环境变量使用**: 敏感配置通过 `.env` 文件管理

#### 逻辑完整性
- [ ] **边界情况**: null、空字符串、负数、超长输入是否处理？
- [ ] **循环终止**: while/递归是否有明确终止条件？
- [ ] **业务一致性**: 代码逻辑是否真正符合 PRD 需求？

#### 上下文一致性
- [ ] **轮子检测**: 是否重复实现了项目已有的工具函数？
  - 日期格式化 → `@/utils/datetime` (`formatDateTime`, `formatRelativeTime`)
  - 数据格式化 → `@/utils/formatters` (`formatMoney`, `formatPhone`, `formatFileSize`)
  - Toast 提示 → `@/utils/toast` (`showToast`, `showSuccess`, `showError`)
  - 存储操作 → `@/utils/storage` (`storage`, `STORAGE_KEYS`)
- [ ] **命名一致**: 命名风格是否与现有代码统一？
- [ ] **注释同步**: 注释是否与代码逻辑匹配（AI 常忘记更新注释）？

---

### 6. 性能和安全

#### 性能优化
- [ ] 无明显性能问题（大量计算、渲染）
- [ ] 列表使用虚拟滚动（长列表）
- [ ] 图片懒加载
- [ ] 非主流程页面放在分包（`src/pages-sub/`）

#### 安全检查
- [ ] 无 XSS 漏洞（v-html 使用 DOMPurify）
- [ ] 无 SQL 注入风险
- [ ] 敏感数据不在前端存储
- [ ] Token 安全存储（HttpOnly Cookie）

#### 依赖和构建
- [ ] 无新增不必要的依赖
- [ ] 运行 `pnpm build:h5` 成功
- [ ] 构建产物大小合理

---

### 7. Git 和提交规范

#### Commit Message
- [ ] 符合 Conventional Commits 规范
- [ ] 格式：`type(scope): subject`
- [ ] 类型正确（feat/fix/docs/style/refactor/test/chore）

#### 分支和合并
- [ ] 基于最新的 `main/master` 分支
- [ ] 无合并冲突
- [ ] 删除已合并的分支

---

## 🚀 自动化检查工具

在审查前，建议运行以下自动化检查：

```bash
# 1. 类型检查
pnpm type-check

# 2. 代码检查
pnpm lint

# 3. 运行测试
pnpm test

# 4. 构建检查
pnpm build:h5
```

---

## 📝 审查结果模板

### ✅ 通过
代码质量优秀，符合所有规范，建议合并。

### ⚠️ 需要修改
发现以下问题，请修改后再合并：
- [ ] 问题 1：描述
- [ ] 问题 2：描述

### ❌ 拒绝
存在重大问题，需要重新设计/实现：
- 问题描述...

---

## 🔗 相关文档

- [Coding Standards](.claude/agents/coding-standards.md)
- [Component Development](.claude/agents/component-development.md)
- [API Development](.claude/agents/api-development.md)
- [Common Patterns](.claude/agents/common-patterns.md)
- [Testing](.claude/agents/testing.md)

---

**开始审查吧！记得逐项检查，确保代码质量。**
