---
name: component-generator
description: 【无设计稿时使用】根据项目规范纯代码生成Uni-app组件,支持基础/业务/页面组件。有Figma设计稿请用figma-to-component
license: MIT
compatibility: Requires Uni-app 3.x, Vue 3, TypeScript
metadata:
  author: uniapp-template
  version: "1.0.0"
  category: development
---

# 组件生成器 Skill

## 功能概述

根据 Uni-app 项目规范自动生成符合标准的 Vue 组件模板，包含完整的 TypeScript 类型定义、Props/Emits 接口、CSS 变量使用等最佳实践。

## 使用方式

### 基本用法

```bash
# 方式 1: 基础组件 (全局公用，U 前缀)
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
/component-generator UserManagement --type page --api getUsers,createUser,updateUser

# 🆕 指定 Store 集成
/component-generator OrderManagement --type page --store order,product

# 页面组件 + 路由配置 (definePage)
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
- **使用 U 前缀**，通过 easycom 自动导入

**生成路径:** `src/components/U<ComponentName>/`

**包含文件:**
- `index.vue` - 组件主文件

**类型定义策略:**
- ✅ **默认**: 在组件内定义 Props/Emits 接口（推荐）
- ⚠️ **可选**: 复杂组件（Props >= 8 个）可创建独立的 `types.ts`

**使用场景:**
- 按钮、输入框、卡片等通用 UI 组件
- 可在多个页面中复用的组件

---

### 类型 2: 业务组件 (business)

**特点:**
- 包含业务逻辑和数据处理
- 项目特定，可在项目内多个页面复用
- 可能依赖 API、Store 或业务规则

**生成路径:** `src/components/U<Name>/`

> `src/pages/`、`src/pages-sub/` 下的 `.vue` 文件都会被 `@uni-helper/vite-plugin-uni-pages` 扫描为页面，组件不要放在页面目录内。

**使用场景:**
- 用户列表 (UserList)、订单卡片 (OrderCard) 等业务组件
- 表单组件 (UserForm、ProductForm)
- 数据展示组件 (统计图表、数据列表)

---

### 类型 3: 页面组件 (page)

**特点:**
- 完整的页面实现
- 通过 `definePage({...})` 声明页面配置，自动生成到 `src/pages.json`
- 包含完整的业务流程

**生成路径:**
- 主包页面: `src/pages/<page-name>/`
- 分包页面: `src/pages-sub/<module>/<page-name>/`

**包含文件:**
- `index.vue` - 页面主文件

**额外生成 (使用 --with-router 时):**
- 在页面中写入 `definePage({...})` 页面配置
- 支持指定分包 (`--subpackage user`)
- 支持配置页面标题

---

## 🆕 路由生成功能 (--with-router)

### 功能说明

使用 `--with-router` 选项时，会自动:
1. 生成页面组件文件
2. 分析路由配置需求
3. 在页面中写入 `definePage({...})`，由插件生成 `src/pages.json`

### 路由类型

**1. 主包页面 (main)**
- 直接放在 `src/pages/` 目录
- 适用于 TabBar 页面和高频页面
- 注意：主包不宜过大

**2. 分包页面 (sub) - 默认**
- 放在 `src/pages-sub/<module>/` 目录
- 新增分包时需在 `pages.config.ts` 的 `subPackages` 与 `vite.config.ts` 中 `UniPages({ subPackages })` 同时登记
- 适用于低频页面
- 优化小程序加载性能

### 使用示例

```bash
# 示例 1: 生成主包页面
/component-generator UserCenter --type page --with-router --route-type main

# 示例 2: 生成分包页面 (默认)
/component-generator UserProfile --type page --with-router --subpackage user

# 示例 3: 指定页面标题
/component-generator Settings --type page --with-router --title "设置"
```

### 生成的路由配置示例

#### 主包页面

```vue
<!-- src/pages/user-center/index.vue -->
<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: '个人中心',
  },
});
</script>
```

#### 分包页面

```vue
<!-- src/pages-sub/user/profile/index.vue -->
<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: '用户资料',
  },
});
</script>
```

### 参数选项说明

| 选项 | 说明 | 默认值 | 示例 |
|------|------|-------|------|
| `--smart` | 🆕 智能模式，自动分析依赖 | `false` | `--smart` |
| `--api` | 🆕 指定集成的 API 函数 | 无 | `--api getUsers,createUser` |
| `--store` | 🆕 指定使用的 Store | 无 | `--store user,product` |
| `--with-router` | 是否生成路由配置 | `false` | `--with-router` |
| `--route-type` | 路由类型 | `sub` | `--route-type main` |
| `--subpackage` | 分包名称 | 自动推断 | `--subpackage user` |
| `--title` | 页面标题 | 自动生成 | `--title "用户管理"` |
| `--with-form` | 包含表单验证 | `false` | `--with-form` |

---

## 执行流程

**重要**: 此 Skill 是 **AI 主导型 Skill**，完全由 AI 根据项目规范生成代码。

### 步骤 1: 收集信息

解析用户输入或使用 AskUserQuestion 工具询问：

**必需信息:**
- 组件名称 (PascalCase，如 `UserCard`)
- 组件类型 (`basic` 基础组件 / `business` 业务组件 / `page` 页面组件)

### 步骤 2: 确定文件路径和结构

根据组件类型确定路径：
- 基础组件: `src/components/U<ComponentName>/`
- 业务组件: `src/components/U<Name>/`
- 页面组件: `src/pages/<kebab-case-name>/` 或 `src/pages-sub/<module>/<name>/`

### 步骤 3: 生成代码文件

使用 Write 工具创建文件，遵循以下规范：

#### 基础组件模板

```vue
<!-- src/components/UUserCard/index.vue -->
<template>
  <view class="u-user-card" :class="{ 'u-user-card--disabled': disabled }">
    <view class="u-user-card__header">
      <slot name="header">
        <text class="u-user-card__title">{{ title }}</text>
      </slot>
    </view>

    <view class="u-user-card__content">
      <slot></slot>
    </view>

    <view v-if="showActions" class="u-user-card__actions">
      <slot name="actions">
        <button class="u-user-card__btn" @tap="handleClick">查看详情</button>
      </slot>
    </view>
  </view>
</template>

<script setup lang="ts">
/**
 * UUserCard - 用户卡片组件
 * @author AI Assistant
 * @date {{DATE}}
 */

/**
 * UUserCard 组件的 Props 接口
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
 * UUserCard 组件的 Emits 接口
 */
interface Emits {
  /** 点击事件 */
  (e: 'click'): void;
}

const props = withDefaults(defineProps<Props>(), {
  showActions: true,
  disabled: false,
});

const emit = defineEmits<Emits>();

const handleClick = () => {
  if (props.disabled) return;
  emit('click');
};
</script>

<style scoped lang="scss">
.u-user-card {
  /* 使用 CSS 变量 */
  background: var(--color-bg-card);
  border: 2rpx solid var(--color-border);
  border-radius: 16rpx;
  padding: 32rpx;
  transition: all 0.3s ease;

  &--disabled {
    opacity: 0.6;
  }

  &__header {
    margin-bottom: 24rpx;
  }

  &__title {
    color: var(--color-text);
    font-size: 32rpx;
    font-weight: 500;
  }

  &__content {
    color: var(--color-text-secondary);
    line-height: 1.6;
  }

  &__actions {
    margin-top: 24rpx;
    padding-top: 24rpx;
    border-top: 2rpx solid var(--color-border);
  }

  &__btn {
    background: var(--color-primary);
    color: var(--color-text-inverse);
    border: none;
    border-radius: 8rpx;
    padding: 16rpx 32rpx;
    font-size: 28rpx;
  }
}
</style>
```

#### 页面组件模板 (基础版本)

```vue
<!-- src/pages/user-management/index.vue -->
<template>
  <view class="user-management">
    <UNavBar title="用户管理" />

    <view class="user-management__header">
      <view class="user-management__actions">
        <button class="btn-primary" @tap="handleAddUser">
          添加用户
        </button>
      </view>
    </view>

    <view class="user-management__content">
      <!-- TODO: 添加页面内容 -->
    </view>
  </view>
</template>

<script setup lang="ts">
/**
 * UserManagement - 用户管理页面
 * @author AI Assistant
 * @date {{DATE}}
 */
import { ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { useRouter } from '@/composables';

definePage({
  style: {
    navigationBarTitleText: '用户管理',
  },
});

const router = useRouter();

// ========== 生命周期 ==========
onLoad((options) => {
  console.log('页面加载', options);
});

onShow(() => {
  console.log('页面显示');
});

// ========== 事件处理 ==========
const handleAddUser = () => {
  // TODO: 实现添加用户逻辑
};
</script>

<style scoped lang="scss">
.user-management {
  min-height: 100vh;
  background: var(--color-bg-grey);

  &__header {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 24rpx 32rpx;
  }

  &__content {
    padding: 24rpx 32rpx;
  }
}

.btn-primary {
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border: none;
  border-radius: 8rpx;
  padding: 16rpx 32rpx;
  font-size: 28rpx;
}
</style>
```

#### 🆕 页面组件模板 (智能模式 --smart)

```vue
<!-- src/pages-sub/user/management/index.vue -->
<template>
  <view class="user-management">
    <UNavBar title="用户管理" />

    <view class="user-management__header">
      <button class="btn-primary" @tap="handleAddUser">
        添加用户
      </button>
    </view>

    <!-- Loading 状态 -->
    <USkeleton v-if="loading" type="list" :rows="5" />

    <!-- 错误状态 -->
    <UEmpty v-else-if="error" :description="error.message" />

    <!-- 用户列表 -->
    <scroll-view
      v-else
      class="user-management__list"
      scroll-y
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="handleRefresh"
      @scrolltolower="handleLoadMore"
    >
      <view
        v-for="user in listState.list"
        :key="user.id"
        class="user-card"
        @tap="handleEdit(user)"
      >
        <text class="user-card__name">{{ user.username }}</text>
        <text class="user-card__email">{{ user.email }}</text>
        <view class="user-card__actions">
          <button size="mini" @tap.stop="handleDelete(user.id)">
            删除
          </button>
        </view>
      </view>

      <!-- 加载更多 -->
      <ULoading v-if="listState.loading" />
      <view v-if="listState.finished" class="no-more">没有更多了</view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
/**
 * UserManagement - 用户管理页面
 * @description 用户列表展示、增删改查功能
 * @author AI Assistant
 * @date {{DATE}}
 */
import { ref, computed } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { useUserStore } from '@/store/modules/user';
import { getUsers, deleteUser } from '@/api';
import type { User } from '@/api';
import { showToast } from '@/utils/toast';
import { confirm } from '@/utils/modal';

// ========== Store ==========
const userStore = useUserStore();

// ========== 状态 ==========
const loading = ref(false);
const error = ref<Error | null>(null);
const refreshing = ref(false);

const listState = ref({
  list: [] as User[],
  loading: false,
  finished: false,
  page: 1,
  pageSize: 20,
});

// ========== 生命周期 ==========
onLoad(() => {
  handleRefresh();
});

// ========== 事件处理 ==========
const handleAddUser = () => {
  showToast('添加用户功能开发中...');
};

const handleEdit = (user: User) => {
  showToast(`编辑用户: ${user.username}`);
};

const handleDelete = async (id: string) => {
  const confirmed = await confirm({
    title: '提示',
    content: '确定要删除这个用户吗？',
  });

  if (!confirmed) return;

  try {
    await deleteUser(id);
    showToast('删除成功');
    handleRefresh();
  } catch (err: any) {
    showToast(err.message || '删除失败');
  }
};

// 加载更多
const handleLoadMore = async () => {
  if (listState.value.loading || listState.value.finished) return;

  listState.value.loading = true;
  try {
    const res = await getUsers({
      page: listState.value.page,
      limit: listState.value.pageSize,
    });
    listState.value.list.push(...res.data);
    listState.value.page++;
    listState.value.finished = !res.hasNextPage;
  } finally {
    listState.value.loading = false;
  }
};

// 下拉刷新
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
  min-height: 100vh;
  background: var(--color-bg-grey);

  &__header {
    display: flex;
    justify-content: flex-end;
    padding: 24rpx 32rpx;
  }

  &__list {
    height: calc(100vh - 200rpx);
    padding: 0 32rpx;
  }
}

.user-card {
  background: var(--color-bg-card);
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;

  &__name {
    font-size: 32rpx;
    font-weight: 500;
    color: var(--color-text);
    display: block;
    margin-bottom: 8rpx;
  }

  &__email {
    font-size: 26rpx;
    color: var(--color-text-secondary);
    display: block;
  }

  &__actions {
    margin-top: 16rpx;
    display: flex;
    justify-content: flex-end;
  }
}

.btn-primary {
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border: none;
  border-radius: 8rpx;
  padding: 16rpx 32rpx;
  font-size: 28rpx;
}

.no-more {
  text-align: center;
  color: var(--color-text-placeholder);
  padding: 32rpx;
  font-size: 26rpx;
}
</style>
```

### 步骤 4: 生成路由配置 (使用 --with-router 时)

**当用户使用 `--with-router` 选项时:**

1. **在页面 `<script setup>` 中写入 `definePage({...})`**（不手动编辑 `src/pages.json`）
2. **分包页面确认分包已在 `pages.config.ts` 与 `vite.config.ts` 中登记**
3. **更新 constants/pages.ts 常量**

### 步骤 5: 类型检查和验证

**生成组件后，必须立即执行类型检查：**

```bash
pnpm lint && pnpm type-check
```

### 步骤 6: 展示生成结果

```
✅ 组件生成成功！

📁 生成的文件:
   - src/components/UUserCard/index.vue

📊 类型检查: ✅ 通过

💡 下一步:
   1. 查看生成的组件代码
   2. 在页面中直接使用 <UUserCard /> (easycom 自动导入)
   3. 运行开发服务器测试: pnpm dev:h5
```

---

## 遵守的规范

### 1. Uni-app 元素标签

```vue
<!-- ✅ 正确：使用 Uni-app 标签 -->
<view class="container">
  <text class="title">标题</text>
  <image src="/static/logo.png" mode="aspectFit" />
  <button @tap="handleClick">点击</button>
</view>

<!-- ❌ 错误：使用 HTML 标签 -->
<div class="container">
  <span class="title">标题</span>
  <img src="/static/logo.png" />
  <button @click="handleClick">点击</button>
</div>
```

### 2. 单位规范

```scss
// ✅ 正确：使用 rpx
.component {
  width: 750rpx;
  padding: 32rpx;
  font-size: 28rpx;
}

// ❌ 错误：使用 px
.component {
  width: 375px;
  padding: 16px;
  font-size: 14px;
}
```

### 3. CSS 变量使用

```scss
// ✅ 正确：使用 CSS 变量 (src/styles/theme.scss)
.component {
  color: var(--color-text);
  background: var(--color-bg-card);
  border: 2rpx solid var(--color-border);
}

// ❌ 错误：硬编码颜色
.component {
  color: #333;
  background: #fff;
}
```

### 4. 命名规范

- 组件名: PascalCase + U前缀 (UUserCard, UProductList)
- 文件名: index.vue
- CSS 类名: BEM 规范 (u-user-card__header)
- Props: camelCase (showActions, maxCount)
- Emits: kebab-case ('user-click', 'item-delete')

---

## 相关文档

- [component-development.md](../../agents/component-development.md) - 组件开发规范
- [common-patterns.md](../../agents/common-patterns.md) - 通用开发模式
- [coding-standards.md](../../agents/coding-standards.md) - 编码规范
- [project-structure.md](../../agents/project-structure.md) - 项目结构

---

**提示**: 生成的组件已包含所有最佳实践，可直接使用或作为起点继续开发！
