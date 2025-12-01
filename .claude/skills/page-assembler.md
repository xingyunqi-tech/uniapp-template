---
name: page-assembler
description: 将UI组件、Store、API自动集成到页面中,完成完整的功能拼装
---

# 页面拼装器 Skill

## 功能概述

将已经开发好的 UI 组件、Store、API 自动集成到页面中，完成完整的功能拼装，节省手动集成的时间。

## 使用方式

### 基本用法

```bash
# 方式 1: 智能拼装 - 自动分析页面需要的依赖
/page-assembler src/views/user-management/index.vue

# 方式 2: 指定组件和 Store
/page-assembler src/views/user-management/index.vue \
  --components UserList,UserForm \
  --store user

# 方式 3: 完整指定所有依赖
/page-assembler src/views/product/index.vue \
  --components ProductList,ProductFilter \
  --store product,cart \
  --api getProductList,createProduct
```

### 高级用法

```bash
# 拼装 + 添加骨架屏
/page-assembler src/views/dashboard/index.vue --with-skeleton

# 拼装 + 添加错误处理
/page-assembler src/views/order/index.vue --with-error-handling

# 拼装 + 添加无限滚动加载
/page-assembler src/views/user/index.vue --with-infinite-scroll

# 完整功能拼装
/page-assembler src/views/product/index.vue \
  --components ProductList,ProductFilter,ProductForm \
  --store product \
  --with-skeleton \
  --with-infinite-scroll \
  --with-error-handling
```

## 执行流程

### 步骤 1: 分析页面现状

**读取页面文件:**
- 使用 Read 工具读取页面文件
- 分析已有的导入语句
- 分析已有的组件使用
- 分析已有的 Store 使用
- 分析已有的 API 调用

**输出示例:**
```
🔍 分析页面: src/views/user-management/index.vue

📊 当前状态:
   ✓ 已导入组件: 无
   ✓ 已使用 Store: 无
   ✓ 已调用 API: 无
   ✓ 页面结构: 基础骨架

📋 待拼装内容:
   ☐ 导入组件: UserList, UserForm
   ☐ 使用 Store: useUserStore
   ☐ 集成 API: useUserList, useUserCreate, useUserDelete
   ☐ 添加 Loading 状态
   ☐ 添加错误处理
   ☐ 添加无限滚动加载
```

---

### 步骤 2: 检查依赖是否存在

**检查组件:**
```bash
# 检查组件文件是否存在
src/views/user-management/components/UserList.vue   # ✓ 存在
src/views/user-management/components/UserForm.vue   # ✓ 存在
```

**检查 Store:**
```bash
# 检查 Store 文件是否存在
src/store/modules/user.ts  # ✓ 存在
```

**检查 API:**
```bash
# 检查 API 函数是否存在
src/api/generated/user/user.ts  # ✓ 存在
src/api/hooks/user.ts           # ✓ 存在
```

**如果依赖不存在:**
```
❌ 缺少依赖:
   ✗ src/store/modules/user.ts 不存在

💡 建议:
   运行以下命令生成缺少的依赖:
   /store-generator UserStore --smart
```

---

### 步骤 3: 生成导入语句

根据分析结果，生成需要添加的导入语句：

```typescript
// ========== 组件导入 ==========
import UserList from './components/UserList.vue';
import UserForm from './components/UserForm.vue';

// ========== Store 导入 ==========
import { useUserStore } from '@/store/modules/user';

// ========== API 导入 ==========
import { getUserList, createUser, deleteUser } from '@/api';

// ========== 类型导入 ==========
import type { UserDTO, UserCreateRequest } from '@/api';

// ========== Vant 组件 ==========
import { showToast, showConfirmDialog } from 'vant';
```

---

### 步骤 4: 生成 <script setup> 代码

```typescript
// ========== Store 初始化 ==========
const userStore = useUserStore();

// ========== 状态管理 ==========
const popupVisible = ref(false);
const currentUser = ref<User | null>(null);
const listState = ref({
  list: [] as User[],
  loading: false,
  finished: false,
  page: 1,
  pageSize: 20,
});

// ========== API Hooks ==========
const {
  data: userListData,
  isLoading,
  error,
  refetch
} = useUserList({
  page: listState.value.page,
  pageSize: listState.value.pageSize,
});

const createMutation = useUserCreate();
const deleteMutation = useUserDelete();

// ========== 计算属性 ==========
const userList = computed(() => userListData.value?.list || []);

// ========== 事件处理 ==========
const handleAdd = () => {
  currentUser.value = null;
  popupVisible.value = true;
};

const handleEdit = (user: User) => {
  currentUser.value = user;
  popupVisible.value = true;
};

const handleDelete = async (id: string) => {
  try {
    await showConfirmDialog({
      title: '提示',
      message: '确定要删除吗？',
    });

    await deleteMutation.mutateAsync(id);
    showToast('删除成功');
    refetch();
  } catch (error: any) {
    if (error !== 'cancel') {
      showToast(error.message || '删除失败');
    }
  }
};

const handleSubmit = async (data: UserCreateRequest) => {
  try {
    await createMutation.mutateAsync(data);
    showToast('操作成功');
    popupVisible.value = false;
    handleRefresh();
  } catch (error: any) {
    showToast(error.message || '操作失败');
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
  listState.value.page = 1;
  listState.value.list = [];
  listState.value.finished = false;
  await handleLoadMore();
};
```

---

### 步骤 5: 生成 <template> 代码

```vue
<template>
  <div class="user-management">
    <!-- 页面头部 -->
    <div class="user-management__header">
      <h1 class="user-management__title">用户管理</h1>
      <div class="user-management__actions">
        <van-button type="primary" @click="handleAdd">
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
      <van-empty :description="error.message">
        <van-button type="primary" @click="refetch">
          重新加载
        </van-button>
      </van-empty>
    </div>

    <!-- 内容区域 -->
    <div v-else class="user-management__content">
      <!-- 下拉刷新 + 无限滚动 -->
      <van-pull-refresh v-model="refreshing" @refresh="handleRefresh">
        <van-list
          v-model:loading="listState.loading"
          :finished="listState.finished"
          finished-text="没有更多了"
          @load="handleLoadMore"
        >
          <!-- 用户列表 -->
          <van-cell-group inset>
            <van-cell
              v-for="user in listState.list"
              :key="user.id"
              :title="user.username"
              :label="user.email"
              is-link
              @click="handleEdit(user)"
            />
          </van-cell-group>
        </van-list>
      </van-pull-refresh>
    </div>

    <!-- 表单弹出层 -->
    <van-popup
      v-model:show="popupVisible"
      position="bottom"
      round
    >
      <UserForm
        :data="currentUser"
        :loading="createMutation.isLoading"
        @submit="handleSubmit"
        @cancel="popupVisible = false"
      />
    </van-popup>
  </div>
</template>
```

---

### 步骤 6: 应用更新

使用 Edit 工具将生成的代码集成到页面文件中：

1. **添加导入语句** (在 `<script setup>` 开始处)
2. **添加状态管理** (在导入后)
3. **添加 API Hooks** (在状态管理后)
4. **添加事件处理** (在 API Hooks 后)
5. **更新模板** (替换或扩展现有模板)

---

### 步骤 7: 输出拼装报告

```
✅ 页面拼装完成!
─────────────────────────────────────────

📄 页面: src/views/user-management/index.vue

📦 已集成内容:

   ✅ 组件集成 (2 个):
      - UserList
      - UserForm

   ✅ Store 集成 (1 个):
      - useUserStore

   ✅ API 集成 (3 个):
      - useUserList (查询)
      - useUserCreate (创建)
      - useUserDelete (删除)

   ✅ 功能增强:
      - Loading 状态处理
      - 错误状态处理
      - 下拉刷新 + 无限滚动
      - 底部弹出层表单

📊 代码统计:
   - 新增导入: 8 个
   - 新增函数: 5 个
   - 新增模板: 50 行

💡 下一步:
   1. 查看生成的代码? (y/n)
   2. 运行类型检查? (pnpm type-check)
   3. 启动开发服务器测试? (pnpm start)
```

---

## 高级选项

### 选项 1: 添加骨架屏 (--with-skeleton)

```vue
<!-- 添加骨架屏 Loading 状态 -->
<div v-if="isLoading" class="user-management__skeleton">
  <van-skeleton :row="5" animated />
</div>
```

---

### 选项 2: 添加错误处理 (--with-error-handling)

```typescript
// 添加全局错误处理
const { error, clearError } = useErrorHandler();

watch(error, (newError) => {
  if (newError) {
    showToast(newError.message);
  }
});

// 添加重试逻辑
const handleRetry = () => {
  clearError();
  refetch();
};
```

```vue
<!-- 添加错误状态展示 -->
<div v-else-if="error" class="user-management__error">
  <van-empty :description="error.message">
    <van-button type="primary" @click="handleRetry">
      重新加载
    </van-button>
  </van-empty>
</div>
```

---

### 选项 3: 添加无限滚动 (--with-infinite-scroll)

```typescript
// 添加列表状态
const listState = ref({
  list: [] as User[],
  loading: false,
  finished: false,
  page: 1,
  pageSize: 20,
});

// 加载更多 (van-list @load)
const handleLoadMore = async () => {
  listState.value.loading = true;
  try {
    const res = await fetchList({ page: listState.value.page, pageSize: listState.value.pageSize });
    listState.value.list.push(...res.list);
    listState.value.page++;
    listState.value.finished = res.list.length < listState.value.pageSize;
  } finally {
    listState.value.loading = false;
  }
};

// 下拉刷新 (van-pull-refresh @refresh)
const handleRefresh = async () => {
  listState.value.page = 1;
  listState.value.list = [];
  listState.value.finished = false;
  await handleLoadMore();
};
```

```vue
<!-- 移动端下拉刷新 + 无限滚动 -->
<van-pull-refresh v-model="refreshing" @refresh="handleRefresh">
  <van-list
    v-model:loading="listState.loading"
    :finished="listState.finished"
    finished-text="没有更多了"
    @load="handleLoadMore"
  >
    <!-- 列表内容 -->
  </van-list>
</van-pull-refresh>
```

---

## 智能分析模式

当没有指定 `--components` 和 `--store` 时，自动分析页面需要的依赖：

### 分析逻辑

1. **根据页面路径推断**:
   - `src/views/user-management/` → 查找 `src/views/user-management/components/`
   - 自动导入该目录下的所有组件

2. **根据页面名称推断 Store**:
   - `UserManagement` → `useUserStore`
   - `ProductList` → `useProductStore`

3. **根据 Store 推断 API**:
   - `useUserStore` → `useUserList`, `useUserCreate`, `useUserUpdate`, `useUserDelete`
   - `useProductStore` → `useProductList`, `useProductById`, `useProductCreate`

---

## 拼装模式

### 模式 1: 列表页拼装

**特点:**
- 列表组件 + 下拉刷新 + 无限滚动
- 搜索筛选组件
- 添加/编辑表单弹出层
- 删除确认

**示例:**
```bash
/page-assembler src/views/user/index.vue \
  --components UserList,UserFilter,UserForm \
  --store user \
  --with-infinite-scroll \
  --with-error-handling
```

---

### 模式 2: 详情页拼装

**特点:**
- 详情展示组件
- 编辑按钮
- 返回按钮

**示例:**
```bash
/page-assembler src/views/user/detail.vue \
  --components UserDetail,UserEdit \
  --store user \
  --api getUserById,updateUser
```

---

### 模式 3: 表单页拼装

**特点:**
- 表单组件
- 提交和取消按钮
- 表单验证

**示例:**
```bash
/page-assembler src/views/user/create.vue \
  --components UserForm \
  --api createUser \
  --with-error-handling
```

---

## 最佳实践

### 1. 先生成组件，再拼装

```bash
# 步骤 1: 生成组件
/component-generator UserList --type business
/component-generator UserForm --type business --with-form

# 步骤 2: 拼装页面
/page-assembler src/views/user/index.vue \
  --components UserList,UserForm \
  --store user
```

---

### 2. 渐进式拼装

```bash
# 第一次: 基础拼装
/page-assembler src/views/user/index.vue --components UserList

# 第二次: 添加表单
/page-assembler src/views/user/index.vue --components UserForm

# 第三次: 添加无限滚动
/page-assembler src/views/user/index.vue --with-infinite-scroll
```

---

### 3. 拼装后立即测试

```bash
# 拼装完成
/page-assembler src/views/user/index.vue --components UserList,UserForm

# 类型检查
pnpm type-check

# 启动开发服务器
pnpm start

# 访问页面测试
http://localhost:5173/user
```

---

## 与其他 Skills 配合

### 完整开发流程

```bash
# 步骤 1: 设计架构
/architecture-designer docs/prd/user.md --create-structure --create-todos

# 步骤 2: 同步 API
pnpm api:gen

# 步骤 3: 生成 Store
/store-generator UserStore --smart

# 步骤 4: 生成页面骨架
/component-generator UserManagement --type page --with-router

# 步骤 5: 生成组件
/component-generator UserList --type business
/component-generator UserForm --type business --with-form

# 步骤 6: 拼装页面 (重要!)
/page-assembler src/views/user-management/index.vue \
  --components UserList,UserForm \
  --store user \
  --with-infinite-scroll \
  --with-error-handling

# 步骤 7: 质量检查
/test-coverage-checker --auto-generate
pnpm lint
pnpm type-check
```

---

## 相关文档

- [component-development.md](../../agents/component-development.md) - 组件开发规范
- [store-development.md](../../agents/store-development.md) - Store 开发规范
- [api-development.md](../../agents/api-development.md) - API 开发规范

---

## 常见问题

### Q1: 拼装会覆盖我的代码吗？

**A:** 不会完全覆盖，会智能合并：
- 已有的导入不会重复
- 已有的函数不会覆盖
- 会在合适的位置插入新代码

### Q2: 拼装后的代码可以修改吗？

**A:** 当然可以！拼装生成的代码是基础模板，可以根据需求修改。

### Q3: 如何处理复杂的组件集成？

**A:** 分步拼装：
```bash
# 第一步: 基础拼装
/page-assembler src/views/user/index.vue --components UserList

# 第二步: 添加表单
/page-assembler src/views/user/index.vue --components UserForm

# 手动调整代码...
```

### Q4: 拼装失败了怎么办？

**A:**
1. 检查依赖是否存在
2. 检查文件路径是否正确
3. 使用 Git 回滚: `git restore src/views/user/index.vue`
4. 手动集成

---

## 示例工作流

### 场景: 用户管理页面拼装

```bash
# 步骤 1: 查看页面现状
cat src/views/user-management/index.vue

# 步骤 2: 拼装页面
/page-assembler src/views/user-management/index.vue \
  --components UserList,UserForm,UserFilter \
  --store user \
  --with-infinite-scroll \
  --with-error-handling

# 步骤 3: 查看拼装结果
cat src/views/user-management/index.vue

# 步骤 4: 类型检查
pnpm type-check

# 步骤 5: 启动开发服务器测试
pnpm start

# 步骤 6: 如果有问题，调整代码
# 编辑 src/views/user-management/index.vue

# 步骤 7: 提交代码
git add src/views/user-management/
git commit -m "feat: assemble user management page"
```

---

**提示**: 页面拼装器可以节省 60% 的手动集成时间，让你专注于业务逻辑！
