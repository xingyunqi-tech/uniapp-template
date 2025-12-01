---
name: component-generator
description: 【无设计稿时使用】根据项目规范纯代码生成Vue组件,支持基础/业务/页面组件。有Figma设计稿请用figma-to-component
---

# 组件生成器 Skill

## 功能概述

根据项目规范自动生成符合标准的 Vue 组件模板，包含完整的 TypeScript 类型定义、Props/Emits 接口、CSS 变量使用等最佳实践。

## 使用方式

### 基本用法

```bash
# 方式 1: 基础组件
/component-generator UserCard --type basic

# 方式 2: 业务组件
/component-generator OrderList --type business

# 方式 3: 页面组件
/component-generator UserManagement --type page

# 方式 4: 交互式模式
/component-generator
```

### 高级用法

```bash
# 🆕 智能模式 - 自动分析和集成依赖 (推荐)
/component-generator ProductList --type page --smart

# 🆕 指定 API 集成
/component-generator UserManagement --type page --api getUserList,createUser,updateUser

# 🆕 指定 Store 集成
/component-generator OrderManagement --type page --store order,product

# 页面组件 + 自动生成路由配置
/component-generator UserManagement --type page --with-router

# 包含表单验证
/component-generator UserForm --type business --with-form

# 🆕 智能模式 + 路由配置
/component-generator ProductManagement --type page --smart --with-router
```

## 组件类型说明

### 类型 1: 基础组件 (basic)

**特点:**
- 纯 UI 组件，无业务逻辑
- 高度可复用
- 不依赖 API 或 Store

**生成路径:** `src/components/<ComponentName>/`

**包含文件:**
- `index.vue` - 组件主文件
- `README.md` - 组件文档 (可选)

**类型定义策略:**
- ✅ **默认**: 在组件内定义 Props/Emits 接口（推荐）
- ⚠️ **可选**: 复杂组件（Props >= 8 个）可创建独立的 `types.ts`

**使用场景:**
- 按钮、输入框、卡片等通用 UI 组件
- 可在多个项目中复用的组件

---

### 类型 2: 业务组件 (business)

**特点:**
- 包含业务逻辑和数据处理
- 项目特定,可在项目内多个页面复用
- 可能依赖 API、Store 或业务规则
- 比基础组件更复杂,但比页面组件更独立

**生成路径:**
- 页面级组件 (仅在某个页面使用): `src/views/<page>/components/`
- 全局公用组件 (多个页面复用): `src/components/`

**包含文件:**
- `index.vue` - 组件主文件
- `README.md` - 组件文档 (可选)

**类型定义策略:**
- ✅ **默认**: 在组件内定义 Props/Emits 接口（推荐）
- ⚠️ **可选**: 复杂组件（Props >= 8 个）可创建独立的 `types.ts`

**使用场景:**
- 用户列表 (UserList)、订单卡片 (OrderCard) 等业务组件
- 表单组件 (UserForm、ProductForm)
- 数据展示组件 (统计图表、数据列表)
- 需要业务逻辑处理的组件

**示例:**
```bash
# 生成业务组件
/component-generator UserList --type business

# 生成带表单验证的业务组件
/component-generator UserForm --type business --with-form

# 智能模式 - 自动集成 API 和 Store
/component-generator OrderList --type business --smart
```

---

### 类型 3: 页面组件 (page)

**特点:**
- 完整的页面实现
- 路由对应的组件
- 包含完整的业务流程

**生成路径:** `src/views/<page-name>/`

**包含文件:**
- `index.vue` - 页面主文件
- `components/` - 页面专属组件目录 (可选)

**类型定义策略:**
- ✅ **默认**: 在页面内定义接口（推荐）
- ⚠️ **可选**: 复杂页面可创建独立的 `types.ts`

**其他文件:**
- `README.md` - 页面文档 (可选)

**额外生成 (使用 --with-router 时):**
- 自动添加路由配置到 `src/router/routes/async.ts` 或 `common.ts`
- 支持指定路由类型 (`async` / `common` / `base`)
- 支持配置权限角色 (`--roles admin,teacher`)

**使用场景:**
- 用户管理、订单列表、商品详情等页面
- 需要独立路由的功能页面

---

## 🆕 路由生成功能 (--with-router)

### 功能说明

使用 `--with-router` 选项时,会自动:
1. 生成页面组件文件
2. 分析路由配置需求
3. 自动添加路由到对应的路由文件
4. 支持配置权限角色

### 路由类型

**1. 异步路由 (async) - 默认**
- 需要登录
- 需要权限验证
- 动态注册
- 适用于管理功能页面

**2. 公共路由 (common)**
- 需要登录
- 无需权限验证
- 所有登录用户可访问
- 适用于首页、个人中心等

**3. 基础路由 (base)**
- 无需登录
- 无需权限验证
- 适用于登录页、404、403等

### 使用示例

```bash
# 示例 1: 生成异步路由页面 (默认 admin 权限)
/component-generator UserManagement --type page --with-router

# 示例 2: 指定路由类型为 common (公共路由)
/component-generator Dashboard --type page --with-router --route-type common

# 示例 3: 指定多个权限角色
/component-generator LabManagement --type page --with-router --roles admin,teacher

# 示例 4: 生成基础路由页面 (无需登录)
/component-generator About --type page --with-router --route-type base

# 示例 5: 完整流程 (页面 + 路由 + 智能集成)
/component-generator ProductManagement --type page --with-router --smart --roles admin
```

### 生成的路由配置示例

#### 异步路由 (async)

```typescript
// 自动添加到 src/router/routes/async.ts
import { ROLES } from '@/constants/roles';
import type { RouteRecordRaw } from 'vue-router';

export const asyncRoutes: RouteRecordRaw[] = [
  // ... 现有路由
  {
    path: '/user-management',
    name: 'UserManagement',
    component: () => import('@/views/user-management/index.vue'),
    meta: {
      title: 'route.user_management',
      requiresAuth: true,
      roles: [ROLES.ADMIN],
    },
  },
];
```

#### 公共路由 (common)

```typescript
// 自动添加到 src/router/routes/common.ts
import type { RouteRecordRaw } from 'vue-router';

export const commonRoutes: RouteRecordRaw[] = [
  // ... 现有路由
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/dashboard/index.vue'),
    meta: {
      title: 'route.dashboard',
      requiresAuth: true,
    },
  },
];
```

#### 基础路由 (base)

```typescript
// 自动添加到 src/router/routes/base.ts
import type { RouteRecordRaw } from 'vue-router';

export const baseRoutes: RouteRecordRaw[] = [
  // ... 现有路由
  {
    path: '/about',
    name: 'About',
    component: () => import('@/views/about/index.vue'),
    meta: {
      title: 'route.about',
    },
  },
];
```

### 智能参数选项说明

| 选项 | 说明 | 默认值 | 示例 |
|------|------|-------|------|
| `--smart` | 🆕 智能模式，自动分析依赖 | `false` | `--smart` |
| `--api` | 🆕 指定集成的 API 函数 (逗号分隔) | 无 | `--api getUserList,createUser` |
| `--store` | 🆕 指定使用的 Store (逗号分隔) | 无 | `--store user,product` |
| `--with-router` | 是否生成路由配置 | `false` | `--with-router` |
| `--route-type` | 路由类型 | `async` | `--route-type common` |
| `--roles` | 权限角色 (逗号分隔) | `admin` | `--roles admin,teacher` |
| `--parent-path` | 父路由路径 | 无 | `--parent-path /system` |
| `--with-form` | 包含表单验证 | `false` | `--with-form` |

---

## 执行流程

**重要**: 此 Skill 是 **AI 主导型 Skill**，完全由 AI 根据项目规范生成代码，无需专门的脚本。

### 步骤 1: 收集信息

解析用户输入或使用 AskUserQuestion 工具询问：

**必需信息:**
- 组件名称 (PascalCase，如 `UserCard`)
- 组件类型 (`basic` 基础组件 / `page` 页面组件)

**可选信息 (智能模式):**
- `--smart`: 智能分析组件名称，自动推断需要的 API 和 Store
- `--api`: 手动指定需要集成的 API 函数
- `--store`: 手动指定需要使用的 Store
- `--with-router`: 是否自动生成路由配置
- `--with-form`: 是否包含表单验证

如果用户只提供组件名称，使用 AskUserQuestion 工具询问：
```json
{
  "question": "请选择组件类型",
  "header": "组件类型",
  "options": [
    {"label": "基础组件", "description": "纯 UI 组件，无业务逻辑，可复用"},
    {"label": "页面组件", "description": "完整页面，路由对应，包含业务流程"}
  ],
  "multiSelect": false
}
```

**智能模式分析逻辑:**

当使用 `--smart` 参数时，根据组件名称自动推断：

1. **分析组件名称关键词**:
   - `UserManagement` / `UserList` → 使用 `useUserStore`, API: `getUserList`, `createUser`, `updateUser`, `deleteUser`
   - `ProductDetail` → 使用 `useProductStore`, API: `getProductById`, `updateProduct`
   - `OrderList` → 使用 `useOrderStore`, API: `getOrderList`, `deleteOrder`

2. **检查现有 Store 和 API**:
   - 扫描 `src/store/modules/` 目录，查找匹配的 Store
   - 扫描 `src/api/generated/` 目录，查找可用的 API 函数
   - 如果不存在，建议先运行 `pnpm api:gen` 和 `/store-generator`

3. **生成导入语句**:
   ```typescript
   // 自动添加 Store 导入
   import { useUserStore } from '@/store/modules/user';

   // 自动添加 API 导入
   import { getUserList, createUser } from '@/api';
   import type { UserDTO, UserCreateRequest } from '@/api';
   ```

### 步骤 2: 确定文件路径和结构

根据组件类型确定路径：
- 基础组件: `src/components/<ComponentName>/`
- 页面组件: `src/views/<kebab-case-name>/`

### 步骤 2.5: 验证 API 类型定义 ⭐ 重要

**如果组件需要使用 API 数据（如 DTO），必须先验证类型：**

#### 2.5.1 读取 API 类型定义

使用 Read 工具读取相关的 DTO 文件：

```bash
# 示例：竞赛管理组件
src/api/generated/model/competitionDTO.ts
src/api/generated/model/registrationDTO.ts
src/api/generated/model/awardDTO.ts
```

#### 2.5.2 分析可用字段

记录 DTO 中的实际字段：
- ✅ 字段名称（精确拼写）
- ✅ 字段类型（注意 `optional` 标记 `?`）
- ✅ 字段说明

**示例：CompetitionDTO 实际字段**
```typescript
interface CompetitionDTO {
  id?: number;                     // ✅ optional
  name?: string;                   // ✅ optional
  category?: string;               // ✅ 级别字段（不是 level）
  currentParticipants?: number;    // ✅ 报名人数（不是 registrationCount）
  registrationStartTime?: string;  // ✅ optional
  // ❌ 不存在: level, registrationCount, officialWebsite
}
```

#### 2.5.3 生成代码时严格遵守

**规则：**
1. ✅ **只使用 DTO 中存在的字段**
2. ✅ **对 optional 字段使用安全访问**
3. ✅ **提供默认值处理 undefined**

**正确示例：**
```typescript
// ✅ 正确：使用实际存在的字段
const category = row.category;  // category 存在
const participants = row.currentParticipants || 0;  // 处理 undefined

// ✅ 正确：optional 字段安全访问
const startTime = row.registrationStartTime
  ? dayjs(row.registrationStartTime).format('YYYY-MM-DD')
  : '-';

// ✅ 正确：类型守卫
if (row.id !== undefined) {
  await deleteCompetition(row.id);
}
```

**错误示例（禁止）：**
```typescript
// ❌ 错误：使用不存在的字段
const level = row.level;  // level 不存在，应该用 category

// ❌ 错误：直接传递 optional 值
await deleteCompetition(row.id);  // row.id 可能是 undefined

// ❌ 错误：没有处理 undefined
const time = dayjs(row.registrationStartTime).format('YYYY-MM-DD');
// registrationStartTime 可能是 undefined
```

### 步骤 3: 生成代码文件

使用 Write 工具创建文件，遵循以下规范：

#### 基础组件模板

```vue
<!-- src/components/UserCard/index.vue -->
<template>
  <div class="user-card" :class="{ 'user-card--disabled': disabled }">
    <div class="user-card__header">
      <slot name="header">
        <h3 class="user-card__title">{{ title }}</h3>
      </slot>
    </div>

    <div class="user-card__content">
      <slot></slot>
    </div>

    <div v-if="showActions" class="user-card__actions">
      <slot name="actions">
        <van-button @click="handleClick">查看详情</van-button>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * UserCard - 用户卡片组件
 * @author AI Assistant
 * @date {{DATE}}
 */

/**
 * UserCard 组件的 Props 接口
 */
interface Props {
  /** 卡片标题 */
  title?: string;

  /** 是否显示操作按钮 */
  showActions?: boolean;

  /** 是否禁用 */
  disabled?: boolean;
}

/**
 * UserCard 组件的 Emits 接口
 */
interface Emits {
  /** 点击事件 */
  (e: 'click', event: MouseEvent): void;
}

const props = withDefaults(defineProps<Props>(), {
  showActions: true,
  disabled: false,
});

const emit = defineEmits<Emits>();

const handleClick = (event: MouseEvent) => {
  if (props.disabled) return;
  emit('click', event);
};
</script>

<style scoped lang="scss">
.user-card {
  /* 使用 CSS 变量 */
  background: var(--colorBgContainer);
  border: 1px solid var(--colorBorder);
  border-radius: var(--borderRadius);
  padding: var(--paddingLG);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: var(--boxShadow);
    border-color: var(--colorPrimary);
  }

  &--disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &__header {
    margin-bottom: var(--marginMD);
  }

  &__title {
    margin: 0;
    color: var(--colorTextHeading);
    font-size: var(--fontSizeLG);
    font-weight: 500;
  }

  &__content {
    color: var(--colorTextBase);
    line-height: 1.6;
  }

  &__actions {
    margin-top: var(--marginMD);
    padding-top: var(--paddingMD);
    border-top: 1px solid var(--colorBorderSecondary);
  }
}
</style>
```

#### 页面组件模板 (基础版本)

```vue
<!-- src/views/user-management/index.vue -->
<template>
  <div class="user-management">
    <div class="user-management__header">
      <h1 class="user-management__title">用户管理</h1>
      <div class="user-management__actions">
        <van-button type="primary" @click="handleAddUser">
          添加用户
        </van-button>
      </div>
    </div>

    <div class="user-management__content">
      <!-- TODO: 添加页面内容 -->
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * UserManagement - 用户管理页面
 * @author AI Assistant
 * @date {{DATE}}
 */
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const handleAddUser = () => {
  // TODO: 实现添加用户逻辑
};
</script>

<style scoped lang="scss">
.user-management {
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--marginLG);
  }

  &__title {
    margin: 0;
    color: var(--colorTextHeading);
    font-size: var(--fontSizeXL);
    font-weight: 500;
  }

  &__content {
    background: var(--colorBgContainer);
    border: 1px solid var(--colorBorder);
    border-radius: var(--borderRadius);
    padding: var(--paddingLG);
  }
}
</style>
```

#### 🆕 页面组件模板 (智能模式 --smart)

```vue
<!-- src/views/user-management/index.vue -->
<template>
  <div class="user-management">
    <div class="user-management__header">
      <h1 class="user-management__title">用户管理</h1>
      <div class="user-management__actions">
        <van-button type="primary" @click="handleAddUser">
          添加用户
        </van-button>
      </div>
    </div>

    <!-- Loading 状态 -->
    <div v-if="isLoading" class="user-management__loading">
      <van-skeleton :row="5" animated />
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="user-management__error">
      <van-empty :description="error.message" />
    </div>

    <!-- 用户列表 -->
    <div v-else class="user-management__content">
      <van-cell-group inset>
        <van-cell
          v-for="user in userList"
          :key="user.id"
          :title="user.username"
          :label="user.email"
        >
          <template #right-icon>
            <van-button size="small" @click="handleEdit(user)">
              编辑
            </van-button>
            <van-button
              size="small"
              type="danger"
              @click="handleDelete(user.id)"
            >
              删除
            </van-button>
          </template>
        </van-cell>
      </van-cell-group>

      <!-- 下拉刷新 + 无限滚动 -->
      <van-pull-refresh v-model="refreshing" @refresh="handleRefresh">
        <van-list
          v-model:loading="listState.loading"
          :finished="listState.finished"
          finished-text="没有更多了"
          @load="handleLoadMore"
        />
      </van-pull-refresh>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * UserManagement - 用户管理页面
 * @description 用户列表展示、增删改查功能
 * @author AI Assistant
 * @date {{DATE}}
 */
import { ref, onMounted, computed } from 'vue';
import { showToast, showConfirmDialog } from 'vant';
import { useUserStore } from '@/store/modules/user';
import { getUserList, deleteUser } from '@/api';
import type { UserDTO } from '@/api';

// ========== Store ==========
const userStore = useUserStore();

// ========== 列表状态 (无限滚动) ==========
const listState = ref({
  list: [] as UserDTO[],
  loading: false,
  finished: false,
  page: 1,
  pageSize: 20,
});
const refreshing = ref(false);

// ========== API Hooks ==========
const { data, isLoading, error, refetch } = useUserList({
  page: listState.value.page,
  pageSize: listState.value.pageSize,
});

const deleteMutation = useUserDelete();

// ========== 事件处理 ==========
const handleAddUser = () => {
  // TODO: 打开添加用户弹出层
  showToast('添加用户功能开发中...');
};

const handleEdit = (user: UserDTO) => {
  // TODO: 打开编辑用户弹出层
  showToast(`编辑用户: ${user.username}`);
};

const handleDelete = async (id: string) => {
  try {
    await showConfirmDialog({
      title: '提示',
      message: '确定要删除这个用户吗？',
    });

    await deleteMutation.mutateAsync(id);
    showToast('删除成功');
    handleRefresh();
  } catch (error: any) {
    if (error !== 'cancel') {
      showToast(error.message || '删除失败');
    }
  }
};

// 加载更多 (van-list @load)
const handleLoadMore = async () => {
  listState.value.loading = true;
  try {
    const res = await refetch();
    const newList = res.data?.list || [];
    listState.value.list.push(...newList);
    listState.value.page++;
    listState.value.finished = newList.length < listState.value.pageSize;
  } finally {
    listState.value.loading = false;
  }
};

// 下拉刷新 (van-pull-refresh @refresh)
const handleRefresh = async () => {
  refreshing.value = true;
  listState.value.page = 1;
  listState.value.list = [];
  listState.value.finished = false;
  await handleLoadMore();
  refreshing.value = false;
};
</script>

<style scoped lang="scss">
.user-management {
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--marginLG);
  }

  &__title {
    margin: 0;
    color: var(--colorTextHeading);
    font-size: var(--fontSizeXL);
    font-weight: 500;
  }

  &__loading,
  &__error,
  &__content {
    background: var(--colorBgContainer);
    border: 1px solid var(--colorBorder);
    border-radius: var(--borderRadius);
    padding: var(--paddingLG);
  }
}
</style>
```

### 步骤 4: 生成路由配置 (使用 --with-router 时)

**当用户使用 `--with-router` 选项时:**

1. **读取现有路由文件**
   - 确定路由类型 (`--route-type`): async (默认) / common / base
   - 读取对应的路由文件 (`src/router/routes/async.ts` 等)

2. **生成路由配置代码**
   ```typescript
   {
     path: '/user-management',
     name: 'UserManagement',
     component: () => import('@/views/user-management/index.vue'),
     meta: {
       title: 'route.user_management',
       requiresAuth: true,
       roles: [ROLES.ADMIN, ROLES.TEACHER],
     },
   }
   ```

3. **自动插入路由配置**
   - 使用 Edit 工具将路由配置插入到数组中
   - 插入位置: 数组最后一项之前
   - 保持代码格式和缩进

**当用户未使用 `--with-router` 时:**

仅展示路由配置建议,让用户手动添加。

**国际化说明:**
- 生成的代码使用明文中文 (如 "用户管理", "添加用户")
- 项目使用 `pnpm i18n` 脚本统一提取和翻译
- 不在组件生成时处理 i18n

### 步骤 5: 类型检查和验证 ⭐ 重要

**生成组件后，必须立即执行类型检查：**

```bash
pnpm lint && pnpm type-check
```

**如果发现类型错误：**

1. **分析错误原因**
   - DTO 字段不存在？→ 检查 API 类型定义
   - optional 字段未处理？→ 添加默认值或类型守卫
   - 类型不匹配？→ 修正类型声明

2. **立即修复错误**
   ```typescript
   // ❌ 错误示例
   const level = row.level;  // Property 'level' does not exist

   // ✅ 修复方案 1: 使用正确的字段名
   const category = row.category;

   // ✅ 修复方案 2: 处理 optional 字段
   const participants = row.currentParticipants || 0;

   // ✅ 修复方案 3: 添加类型守卫
   if (row.id !== undefined) {
     await deleteCompetition(row.id);
   }
   ```

3. **重新运行检查直到通过**
   ```bash
   pnpm lint && pnpm type-check
   ```

### 步骤 6: 展示生成结果

向用户展示生成的文件和下一步操作建议。

**输出格式：**
```
✅ 组件生成成功！

📁 生成的文件:
   - src/components/UserCard/index.vue

📊 类型检查: ✅ 通过

💡 下一步:
   1. 查看生成的组件代码
   2. 在父组件中导入使用
   3. 运行开发服务器测试: pnpm start
```

---

## 遵守的规范

### 1. TypeScript 类型定义

- ✅ 完整的 Props 接口定义
- ✅ 完整的 Emits 接口定义
- ✅ 所有 Props 包含 JSDoc 注释
- ✅ 使用 `interface` 而非 `type`
- ✅ **默认在组件内定义类型**（就近原则）

### 2. 类型定义位置

```typescript
// ✅ 推荐：在组件内定义 (简单组件，Props < 8 个)
/**
 * UserCard 组件的 Props 接口
 */
interface Props {
  /** 卡片标题 */
  title?: string;
  /** 是否显示操作按钮 */
  showActions?: boolean;
}

/**
 * UserCard 组件的 Emits 接口
 */
interface Emits {
  (e: 'click', event: MouseEvent): void;
}

// ⚠️ 可选：独立文件 (复杂组件，Props >= 8 个)
// types.ts:
export interface ComplexComponentProps {
  // 8 个以上的 Props
}
// index.vue:
import type { ComplexComponentProps } from './types';
```

### 3. CSS 变量使用

```scss
// ✅ 正确：使用 CSS 变量
.component {
  color: var(--colorTextBase);
  background: var(--colorBgContainer);
}

// ❌ 错误：硬编码颜色
.component {
  color: #333;
  background: #fff;
}
```

### 4. 命名规范

- 组件名: PascalCase (UserCard, ProductList)
- 文件名: kebab-case (user-card, product-list) 或 index.vue
- CSS 类名: BEM 规范 (user-card__header, user-card__title--active)
- Props: camelCase (showActions, maxCount)
- Emits: kebab-case ('product-click', 'user-delete')

### 5. 样式规范

```scss
// ✅ 使用 BEM 规范
.user-card {
  &__header {
    // 块__元素
  }

  &--disabled {
    // 块--修饰符
  }
}

// ❌ 避免使用标签选择器
h1 {
  color: red;
}

// ❌ 避免深层嵌套
.a .b .c .d .e {
  color: red;
}
```

## 变量替换说明

生成组件时，以下变量会被自动替换：

| 变量 | 说明 | 示例 |
|------|------|------|
| `{{COMPONENT_NAME}}` | 组件名 (PascalCase) | UserCard |
| `{{COMPONENT_NAME_KEBAB}}` | 组件名 (kebab-case) | user-card |
| `{{COMPONENT_DESCRIPTION}}` | 组件描述 | 用户卡片组件 |
| `{{AUTHOR}}` | 作者 | AI Assistant |
| `{{DATE}}` | 生成日期 | 2025-11-03 |
| `{{COMPONENT_PATH}}` | 组件路径 | src/components/UserCard/ |

## 相关文档

- [component-development.md](../../agents/component-development.md) - 组件开发规范
- [common-patterns.md](../../agents/common-patterns.md) - 通用开发模式
- [coding-standards.md](../../agents/coding-standards.md) - 编码规范
- [api-development.md](../../agents/api-development.md) - API 开发规范 (智能模式)

## 常见问题

### Q1: 如何选择组件类型？

**A:** 根据以下标准选择：

- **基础组件**: 纯 UI，无业务逻辑，可在多个项目复用
- **业务组件**: 包含业务逻辑，项目特定，可在项目内复用
- **页面组件**: 完整页面，路由对应，包含完整业务流程

### Q2: 生成的代码可以修改吗？

**A:** 可以！生成的代码是模板，你可以根据实际需求修改。

### Q3: 如何添加更多功能？

**A:** 使用智能模式：

```bash
/component-generator MyComponent --type business --smart
```

### Q4: 如何生成测试文件？

**A:** 在交互模式中选择"生成单元测试文件"选项。

## 示例工作流

### 场景 1: 开发用户管理页面 (使用路由自动生成)

```bash
# 步骤 1: 生成页面组件 + 自动配置路由
/component-generator UserManagement --type page --with-router --roles admin,teacher

# 步骤 2: 生成用户列表业务组件
/component-generator UserList --type business --smart

# 步骤 3: 生成用户表单业务组件
/component-generator UserForm --type business --with-form

# 步骤 4: 在页面中使用组件
# 编辑 src/views/user-management/index.vue
# 导入并使用 UserList 和 UserForm 组件

# 步骤 5: 测试功能
pnpm start

# 步骤 6: 提交代码
pnpm commit
```

### 场景 2: 开发仪表盘页面 (公共路由)

```bash
# 生成公共路由页面 (所有登录用户可访问)
/component-generator Dashboard --type page --with-router --route-type common
```

### 场景 3: 传统方式 (手动配置路由)

```bash
# 步骤 1: 生成页面组件 (不自动生成路由)
/component-generator UserManagement --type page

# 步骤 2: 查看路由配置建议
# (AI 会展示路由配置示例)

# 步骤 3: 手动添加路由
# 编辑 src/router/routes/async.ts
```

---

**提示**: 生成的组件已包含所有最佳实践，可直接使用或作为起点继续开发！
