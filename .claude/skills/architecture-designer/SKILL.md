---
name: architecture-designer
description: 根据PRD文档设计完整的技术架构,包括目录结构、路由配置、数据流设计和开发计划
license: MIT
compatibility: Requires Uni-app 3.x, Vue 3, TypeScript
metadata:
  author: uniapp-template
  version: "1.0.0"
  category: architecture
---

# 架构设计器 Skill

## 功能概述

根据 PRD (Product Requirements Document) 文档，设计完整的技术架构方案，输出目录结构、路由配置、Store 设计、API 规划和开发计划。

## 使用方式

### 基本用法

```bash
# 方式 1: 从 PRD 文件生成架构设计
/architecture-designer docs/prd/user-management.md

# 方式 2: 从 PRD 文本生成架构设计
/architecture-designer "用户管理功能：支持用户列表、用户详情、添加用户、编辑用户、删除用户"

# 方式 3: 交互式模式
/architecture-designer
```

### 高级用法

```bash
# 生成架构设计 + 自动创建目录结构
/architecture-designer docs/prd/product.md --create-structure

# 生成架构设计 + 自动创建开发任务
/architecture-designer docs/prd/order.md --create-todos

# 完整流程: 设计 + 创建目录 + 创建任务
/architecture-designer docs/prd/dashboard.md --create-structure --create-todos
```

## 执行流程

### 步骤 1: 读取和分析 PRD

**输入来源:**
- PRD 文件路径 (Markdown 格式)
- PRD 文本内容
- 交互式输入

**分析内容:**
1. **功能需求**: 识别核心功能和子功能
2. **用户角色**: 识别涉及的用户角色和权限
3. **数据模型**: 识别需要的数据实体
4. **API 需求**: 识别需要的 API 接口
5. **页面结构**: 识别需要的页面和组件

**分析示例:**

```markdown
# PRD 示例: 用户管理功能

## 功能概述
实现完整的用户管理功能，包括用户列表、用户详情、添加用户、编辑用户、删除用户。

## 用户角色
- 管理员: 完整的增删改查权限
- 教师: 查看和编辑权限

## 功能详情

### 1. 用户列表页面
- 显示用户列表 (表格形式)
- 支持下拉加载更多 (移动端无限滚动)
- 支持搜索 (用户名、邮箱)
- 支持筛选 (角色、状态)
- 操作: 编辑、删除

### 2. 用户详情页面
- 显示用户基本信息
- 显示用户权限信息
- 显示用户操作日志

### 3. 添加/编辑用户
- 表单字段: 用户名、邮箱、角色、状态
- 表单验证: 必填项、格式验证
- 提交成功后返回列表页

## 数据模型
- User: id, username, email, role, status, createdAt
```

**AI 分析结果:**
```
📊 PRD 分析结果:

✅ 核心功能:
   - 用户列表 (下拉加载、搜索、筛选)
   - 用户详情
   - 添加用户
   - 编辑用户
   - 删除用户

✅ 用户角色:
   - admin (完整权限)
   - user (查看和编辑)

✅ 数据实体:
   - User (id, username, email, role, status, createdAt)

✅ API 需求:
   - GET /api/user/list (列表)
   - GET /api/user/:id (详情)
   - POST /api/user (创建)
   - PUT /api/user/:id (更新)
   - DELETE /api/user/:id (删除)

✅ 页面需求:
   - 用户列表页 (pages-sub/user/management/index)
   - 用户详情页 (pages-sub/user/management-detail/index)
```

---

### 步骤 2: 设计目录结构

基于分析结果，设计完整的目录结构：

```
📁 目录结构设计:

src/
├── pages-sub/
│   └── user/                         # user 分包 (已在 pages.config.ts 与 vite.config.ts 中登记)
│       ├── management/
│       │   └── index.vue             # 用户列表页 (definePage 声明页面配置)
│       └── management-detail/
│           └── index.vue             # 用户详情页
│
├── components/                       # 全局组件 (U 前缀，easycom 自动注册)
│   ├── UUserList/index.vue           # 用户列表 (移动端使用列表而非表格)
│   ├── UUserForm/index.vue           # 用户表单 (添加/编辑)
│   └── UUserFilter/index.vue         # 用户筛选器
│
├── store/
│   └── modules/
│       └── user.ts                   # 用户状态管理
│
├── api/
│   └── generated/                    # (运行 pnpm api:gen 自动生成)
│       └── users/
│           └── users.ts
│
└── constants/
    └── pages.ts                      # 添加页面路径常量与页面角色配置 (PAGE_ROLES)
```

> 页面配置通过各页面的 `definePage({...})` 宏声明，由 `@uni-helper/vite-plugin-uni-pages` 生成 `src/pages.json`，不手动编辑 `pages.json`。`pages/`、`pages-sub/` 下的 `.vue` 文件都会被扫描为页面，组件放在 `src/components/`。

---

### 步骤 3: 设计路由配置

```vue
<!-- src/pages-sub/user/management/index.vue -->
<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: '用户管理',
    enablePullDownRefresh: true,
  },
});
</script>
```

```typescript
// src/constants/pages.ts

export const PAGES = {
  // ... 现有页面
  USER_MANAGEMENT: '/pages-sub/user/management/index',
  USER_MANAGEMENT_DETAIL: '/pages-sub/user/management-detail/index',
} as const;

export const PAGE_ROLES: Record<string, ROLE[]> = {
  [PAGES.USER_MANAGEMENT]: [ROLE.ADMIN, ROLE.USER],
  [PAGES.USER_MANAGEMENT_DETAIL]: [ROLE.ADMIN, ROLE.USER],
};
```

**权限控制**: 路由拦截器 `src/utils/router-interceptor.ts` 拦截 `navigateTo` / `redirectTo` / `reLaunch` 等跳转：`WHITE_LIST`（`src/constants/pages.ts`）中的页面直接放行，未登录跳转登录页，再按 `PAGE_ROLES` 检查角色。详情页通过查询参数传 id：`router.push(PAGES.USER_MANAGEMENT_DETAIL, { id })`。

---

### 步骤 4: 设计数据流

```
📊 数据流设计:

┌─────────────────────────────────────────┐
│ 1. 用户访问列表页                       │
│    /pages-sub/user/management/index      │
└────────────┬────────────────────────────┘
             ▼
┌─────────────────────────────────────────┐
│ 2. 页面加载，调用 useList              │
│    useList({ fetchPage: getUsers })     │
└────────────┬────────────────────────────┘
             ▼
┌─────────────────────────────────────────┐
│ 3. 调用 Orval 生成的 API 请求数据       │
│    GET /api/user/list                   │
└────────────┬────────────────────────────┘
             ▼
┌─────────────────────────────────────────┐
│ 4. 数据返回，存入 Store (可选)          │
│    userStore.setUserList(data)          │
└────────────┬────────────────────────────┘
             ▼
┌─────────────────────────────────────────┐
│ 5. 组件渲染列表                         │
│    <UUserList :data="list" />           │
└─────────────────────────────────────────┘

用户操作流程:
┌──────────────┐
│ 点击添加按钮 │
└──────┬───────┘
       ▼
┌────────────────────┐
│ 打开表单弹出层     │
│ <UUserForm />      │
└────────┬───────────┘
         ▼
┌──────────────────────────┐
│ 填写表单 → 提交          │
│ await createUser(form)   │
└────────┬─────────────────┘
         ▼
┌──────────────────────────┐
│ API 请求成功             │
│ POST /api/user           │
└────────┬─────────────────┘
         ▼
┌──────────────────────────┐
│ 刷新列表                 │
│ refresh()                │
└──────────────────────────┘
```

---

### 步骤 5: 生成开发计划

```
📋 开发计划 (按优先级):

阶段 1: 基础设施 (1-2h)
  ☐ 运行 pnpm api:gen 同步 API
  ☐ 生成 User Store: /store-generator UserStore --smart
  ☐ 创建目录结构: src/pages-sub/user/management/

阶段 2: 页面开发 (2-3h)
  ☐ 生成列表页: /component-generator UserManagement --type page --smart --with-router
  ☐ 生成详情页: /component-generator UserDetail --type page --api getUserById
  ☐ 配置路由权限

阶段 3: 组件开发 (2-3h)
  ☐ 生成用户列表: /component-generator UserList --type business
  ☐ 生成用户表单: /component-generator UserForm --type business --with-form
  ☐ 生成用户筛选器: /component-generator UserFilter --type business

阶段 4: 集成测试 (1-2h)
  ☐ 联调 API 接口
  ☐ 测试增删改查功能
  ☐ 测试权限控制
  ☐ 测试下拉加载和搜索

阶段 5: 优化和审查 (1h)
  ☐ 生成单元测试: /test-coverage-checker --auto-generate
  ☐ 代码审查: pnpm lint
  ☐ 类型检查: pnpm type-check
  ☐ 国际化处理: 更新 src/locale/ 下的语言文件

总计: 7-11 小时
```

---

### 步骤 6: 生成输出文档

在 `docs/architecture/` 目录下生成设计文档：

```markdown
# 用户管理功能 - 技术架构设计

生成时间: 2025-11-17
PRD 来源: docs/prd/user-management.md

## 1. 功能概述
[从 PRD 提取]

## 2. 目录结构
[步骤 2 的输出]

## 3. 路由配置
[步骤 3 的输出]

## 4. 数据流设计
[步骤 4 的输出]

## 5. 开发计划
[步骤 5 的输出]

## 6. API 规范
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/user/list | 获取用户列表 |
| GET | /api/user/:id | 获取用户详情 |
| POST | /api/user | 创建用户 |
| PUT | /api/user/:id | 更新用户 |
| DELETE | /api/user/:id | 删除用户 |

## 7. Store 设计
[UserStore 的 State、Actions、Getters]

## 8. 组件设计
[各个组件的职责和 Props]

## 9. 下一步
1. 运行 pnpm api:gen 同步 API
2. 按照开发计划执行
3. 定期运行质量检查工具
```

---

## 高级选项

### 选项 1: 自动创建目录结构 (--create-structure)

```bash
/architecture-designer docs/prd/user.md --create-structure
```

**执行内容:**
```bash
# 自动创建以下目录和文件
mkdir -p src/pages-sub/user/management src/pages-sub/user/management-detail
touch src/pages-sub/user/management/index.vue
touch src/pages-sub/user/management-detail/index.vue
```

---

### 选项 2: 自动创建开发任务 (--create-todos)

```bash
/architecture-designer docs/prd/user.md --create-todos
```

**生成 TODO 列表:**
```
✅ 已创建 15 个开发任务:

📌 阶段 1: 基础设施
   [ ] 运行 pnpm api:gen 同步 API
   [ ] 生成 User Store
   [ ] 创建目录结构

📌 阶段 2: 页面开发
   [ ] 生成列表页组件
   [ ] 生成详情页组件
   [ ] 配置路由

📌 阶段 3: 组件开发
   [ ] 生成 UserList 组件
   [ ] 生成 UserForm 组件
   [ ] 生成 UserFilter 组件

📌 阶段 4: 集成测试
   [ ] 联调 API
   [ ] 测试功能
   [ ] 测试权限

📌 阶段 5: 优化审查
   [ ] 生成测试
   [ ] 代码审查
   [ ] 质量检查
```

---

## PRD 模板

如果用户没有 PRD 文档，可以提供模板：

```markdown
# PRD 模板: [功能名称]

## 1. 功能概述
[简要描述功能的目的和价值]

## 2. 用户角色
- 管理员: [权限说明]
- 普通用户: [权限说明]

## 3. 功能详情

### 3.1 功能点 1
- 描述
- 交互流程
- 数据要求

### 3.2 功能点 2
- 描述
- 交互流程
- 数据要求

## 4. 数据模型
- 实体 1: 字段列表
- 实体 2: 字段列表

## 5. API 需求
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/xxx | xxx |

## 6. 非功能需求
- 性能要求
- 安全要求
- 兼容性要求
```

---

## 最佳实践

### 1. PRD 质量决定架构质量

```bash
# ✅ 好的 PRD: 详细、清晰、结构化
- 明确的功能需求
- 清晰的数据模型
- 完整的 API 列表
- 用户角色和权限

# ❌ 差的 PRD: 模糊、简略
- "做一个用户管理功能"
- 缺少细节
```

### 2. 架构设计后立即创建任务

```bash
# 推荐工作流
/architecture-designer docs/prd/user.md --create-structure --create-todos

# 然后按任务列表执行
```

### 3. 设计文档保存和版本控制

```bash
# 自动保存到 docs/architecture/
docs/architecture/user-management-v1.md
docs/architecture/user-management-v2.md

# 提交到 Git
git add docs/architecture/user-management-v1.md
git commit -m "docs: add user management architecture design"
```

---

## 与其他 Skills 配合

### 完整开发流程

```bash
# 步骤 1: 设计架构
/architecture-designer docs/prd/user-management.md --create-structure --create-todos

# 步骤 2: 同步 API
pnpm api:gen

# 步骤 3: 生成 Store
/store-generator UserStore --smart --persist

# 步骤 4: 生成页面
/component-generator UserManagement --type page --smart --with-router

# 步骤 5: 生成组件
/component-generator UserList --type business
/component-generator UserForm --type business --with-form

# 步骤 6: 质量检查
/test-coverage-checker --auto-generate
pnpm type-check
pnpm lint

# 步骤 7: 提交代码
pnpm commit
```

---

## 输出示例

### 控制台输出

```
🎨 架构设计器 - Architecture Designer
─────────────────────────────────────────

📄 PRD 文档: docs/prd/user-management.md

🔍 分析中...
   ✓ 功能需求分析完成 (5 个核心功能)
   ✓ 角色权限分析完成 (2 个角色)
   ✓ 数据模型分析完成 (1 个实体)
   ✓ API 需求分析完成 (5 个接口)
   ✓ 页面结构分析完成 (2 个页面)

📁 目录结构设计完成
   ✓ src/pages-sub/user/management/
   ✓ src/store/modules/user.ts
   ✓ src/constants/pages.ts (页面路径与 PAGE_ROLES)

🚦 路由配置设计完成
   ✓ /pages-sub/user/management/index (列表页)
   ✓ /pages-sub/user/management-detail/index (详情页)

📊 数据流设计完成
   ✓ 用户访问流程
   ✓ 用户操作流程

📋 开发计划生成完成
   ✓ 5 个阶段，15 个任务
   ✓ 预计耗时: 7-11 小时

📝 设计文档已生成
   文件: docs/architecture/user-management-v1.md

─────────────────────────────────────────

💡 下一步:
   1. 查看设计文档? (y/n)
   2. 创建目录结构? (--create-structure)
   3. 创建开发任务? (--create-todos)
   4. 开始开发? (按照开发计划执行)
```

---

## 相关文档

- [project-structure.md](../../agents/project-structure.md) - 项目结构规范
- [router-development.md](../../agents/router-development.md) - 路由开发规范
- [store-development.md](../../agents/store-development.md) - Store 开发规范
- [api-development.md](../../agents/api-development.md) - API 开发规范
- [component-development.md](../../agents/component-development.md) - 组件开发规范

---

## 常见问题

### Q1: PRD 文档格式有要求吗？

**A:** Markdown 格式即可，建议包含：
- 功能概述
- 用户角色
- 功能详情
- 数据模型
- API 需求

### Q2: 生成的架构设计可以修改吗？

**A:** 可以！架构设计是起点，可以根据实际情况调整。

### Q3: 如何处理复杂的多页面功能？

**A:** 将 PRD 拆分成多个模块，分别设计架构：
```bash
/architecture-designer docs/prd/user-list.md
/architecture-designer docs/prd/user-detail.md
/architecture-designer docs/prd/user-settings.md
```

### Q4: 设计完成后直接开发还是先评审？

**A:** 建议先评审设计文档，确认无误后再开发。

---

**提示**: 好的架构设计是成功开发的基础，花时间做好设计可以节省 50% 的开发时间！
