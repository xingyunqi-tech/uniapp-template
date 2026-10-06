---
name: store-generator
description: 快速生成Pinia Store,遵循Composition API风格,支持持久化和类型安全
license: MIT
compatibility: Requires Uni-app 3.x, Vue 3, TypeScript, Pinia
metadata:
  author: uniapp-template
  version: "1.0.0"
  category: development
---

# Store 生成器 Skill

## ⚠️ 重要提醒

**本项目 API 参数使用扁平结构，分页字段为 `page` + `limit`**

```typescript
// ✅ 标准参数结构
type GetUsersParams = {
  page?: number;
  limit?: number;
  filters?: string;
  sort?: string;
}

// ✅ 标准 Store 初始化
const queryParams = ref<GetUsersParams>({
  page: 1,
  limit: 10,
});
```

## 功能概述

根据项目的 Pinia 规范，快速生成符合 Composition API 风格的 Store，包含完整的 TypeScript 类型定义、持久化配置和最佳实践。

## 🚀 标准模板

```typescript
// State
const queryParams = ref<GetXxxsParams>({
  page: 1,
  limit: 10,
});

// Getters
const currentPage = computed(() => queryParams.value.page || 1);
const pageSize = computed(() => queryParams.value.limit || 10);

// Actions
function setQueryParams(params: Partial<GetXxxsParams>) {
  queryParams.value = { ...queryParams.value, ...params };
}

function resetQueryParams() {
  queryParams.value = { page: 1, limit: 10 };
}
```

## 使用方式

### 基本用法

```bash
# 方式 1: 生成基础 Store
/store-generator UserStore

# 方式 2: 生成带持久化的 Store
/store-generator SettingsStore --persist

# 方式 3: 生成完整的 Store (智能模式,自动集成 API)
/store-generator ProductStore --smart

# 方式 4: 交互式模式
/store-generator
```

### 高级用法

```bash
# 🆕 智能模式 - 自动分析和集成 API (推荐)
/store-generator ProductStore --smart

# 🆕 指定 API 集成
/store-generator UserStore --api getUsers,createUser,updateUser,deleteUser

# 指定持久化策略
/store-generator CartStore --persist

# 🆕 智能模式 + 持久化
/store-generator SettingsStore --smart --persist

# 生成完整示例
/store-generator ExampleStore --with-example
```

## 执行流程

**重要**: 此 Skill 是 **AI 主导型 Skill**，完全由 AI 根据项目规范生成 Pinia Store 代码，无需专门的脚本。

### 步骤 1: 收集 Store 信息

解析用户输入或使用 AskUserQuestion 工具询问：

**必需信息:**
- Store 名称 (PascalCase，如 `UserStore`，自动转换为 `useUserStore`)

**可选信息 (智能模式):**
- `--smart`: 智能分析 Store 名称，自动推断需要的 API 和功能
- `--api`: 手动指定需要集成的 API 函数
- `--persist`: 是否需要持久化
- `--storage`: 持久化存储类型 (Uni-app 使用 uni.setStorageSync)

如果用户只提供 Store 名称，询问是否需要持久化：
```json
{
  "question": "是否需要持久化存储？",
  "header": "持久化",
  "options": [
    {"label": "需要", "description": "数据保存到本地存储，刷新不丢失"},
    {"label": "不需要", "description": "只在内存中，刷新后重置"}
  ],
  "multiSelect": false
}
```

**智能模式分析逻辑:**

当使用 `--smart` 参数时，根据 Store 名称自动推断：

1. **分析 Store 名称关键词**:
   - `UserStore` → API: `getUsers`, `getUser`, `createUser`, `updateUser`, `deleteUser`
   - `OrderStore` → API: `getOrders`, `getOrder`, `createOrder`, `cancelOrder`
   - `SettingsStore` → 持久化到 uni storage，无需 API

2. **检查可用 API**:
   - 扫描 `src/api/generated/` 目录，查找匹配的 API 函数
   - 如果不存在，建议先运行 `pnpm api:gen`

3. **生成 State 和 Actions**:
   ```typescript
   // State
   const queryParams = ref<GetXxxsParams>({
     page: 1,
     limit: 10,
   });

   // Getters
   const currentPage = computed(() => queryParams.value.page || 1);
   const pageSize = computed(() => queryParams.value.limit || 10);

   // Actions
   function setQueryParams(params: Partial<GetXxxsParams>) {
     queryParams.value = { ...queryParams.value, ...params };
   }
   ```

### 步骤 2: 确定文件路径

Store 文件路径：`src/store/modules/<store-name>.ts`
- 文件名使用 kebab-case
- 例如: `UserStore` → `src/store/modules/user.ts`

### 步骤 3: 生成 Store 代码

**🔍 关键步骤：检测 API 参数类型结构（必须执行！）**

在生成代码前，必须先检测 API 参数类型的结构，以避免类型错误：

#### 3.1 读取类型定义文件

```typescript
// 使用 Read 工具读取参数类型文件
// 例如：UserStore → getUsersParams.ts
const paramsFilePath = `src/api/generated/model/get${storeName}sParams.ts`;
const paramsTypeContent = await Read(paramsFilePath);
```

#### 3.2 生成标准代码结构

使用项目标准的扁平参数结构：

```typescript
// State
const queryParams = ref<GetXxxsParams>({
  page: 1,
  limit: 10,
});

// Getters
const currentPage = computed(() => queryParams.value.page || 1);
const pageSize = computed(() => queryParams.value.limit || 10);

// Actions
function setQueryParams(params: Partial<GetXxxsParams>) {
  queryParams.value = { ...queryParams.value, ...params };
}

function resetQueryParams() {
  queryParams.value = { page: 1, limit: 10 };
}
```

**生成 Store 文件时必须包含：**
1. 完整的 TypeScript 类型定义
2. 使用 `defineStore` 定义 Store
3. Composition API 风格 (`ref`, `computed`, `watch`)
4. 如果需要持久化，配置 `persist` 选项
5. **⭐ 扁平参数结构（`{ page, limit }`）**
6. **⭐ 完整的错误处理（try-catch-finally）**

### 步骤 4: 展示生成结果

向用户展示生成的 Store 代码和使用示例。

## Store 代码模板

### 基础 Store 示例

```typescript
// src/store/modules/user.ts

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { UserInfo } from '@/interface';

/**
 * 用户信息管理 Store
 * @description 管理用户登录状态、用户信息等
 */
export const useUserStore = defineStore('user', () => {
  // ========== State ==========
  /** 访问令牌 */
  const token = ref<string>('');

  /** 用户信息 */
  const userInfo = ref<UserInfo | null>(null);

  /** 用户角色列表 */
  const roles = ref<string[]>([]);

  // ========== Getters ==========
  /** 是否已登录 */
  const isLoggedIn = computed(() => !!token.value);

  /** 用户名 */
  const username = computed(() => userInfo.value?.username || '');

  /** 是否是管理员 */
  const isAdmin = computed(() => roles.value.includes('admin'));

  // ========== Actions ==========
  /**
   * 设置访问令牌
   * @param newToken 新的访问令牌
   */
  function setToken(newToken: string) {
    token.value = newToken;
  }

  /**
   * 设置用户信息
   * @param info 用户信息
   */
  function setUserInfo(info: UserInfo) {
    userInfo.value = info;
  }

  /**
   * 设置用户角色
   * @param newRoles 角色列表
   */
  function setRoles(newRoles: string[]) {
    roles.value = newRoles;
  }

  /**
   * 重置 Store
   */
  function $reset() {
    token.value = '';
    userInfo.value = null;
    roles.value = [];
  }

  return {
    // State
    token,
    userInfo,
    roles,
    // Getters
    isLoggedIn,
    username,
    isAdmin,
    // Actions
    setToken,
    setUserInfo,
    setRoles,
    $reset,
  };
});
```

#### 带持久化的 Store 示例

```typescript
// src/store/modules/settings.ts

import { defineStore } from 'pinia';
import { ref } from 'vue';

/**
 * 功能模块 Store
 * @description 管理功能模块,包括主题、语言等
 */
export const useSettingsStore = defineStore(
  'settings',
  () => {
    // ========== State ==========
    /** 主题模式 */
    const theme = ref<'light' | 'dark'>('light');

    /** 语言 */
    const locale = ref<'zh-CN' | 'en-US'>('zh-CN');

    /** 字体大小 (移动端适配) */
    const fontSize = ref<'small' | 'normal' | 'large'>('normal');

    /** 是否显示底部导航 */
    const showTabbar = ref(true);

    // ========== Actions ==========
    /**
     * 切换主题
     */
    function toggleTheme() {
      theme.value = theme.value === 'light' ? 'dark' : 'light';
    }

    /**
     * 设置语言
     * @param newLocale 新的语言
     */
    function setLocale(newLocale: 'zh-CN' | 'en-US') {
      locale.value = newLocale;
    }

    /**
     * 设置字体大小
     */
    function setFontSize(size: 'small' | 'normal' | 'large') {
      fontSize.value = size;
    }

    /**
     * 重置设置
     */
    function $reset() {
      theme.value = 'light';
      locale.value = 'zh-CN';
      fontSize.value = 'normal';
      showTabbar.value = true;
    }

    return {
      // State
      theme,
      locale,
      fontSize,
      showTabbar,
      // Actions
      toggleTheme,
      setLocale,
      setFontSize,
      $reset,
    };
  },
  {
    // 持久化配置 (使用 pinia-plugin-persistedstate)
    persist: {
      // 选择式持久化 - 只持久化指定字段
      pick: ['theme', 'locale', 'fontSize', 'showTabbar'],

      // 或使用排除式持久化 - 排除指定字段，其余都持久化
      // omit: ['tempCache', 'loading'],
    },
  }
);
```

#### 带 API 集成的 Store 示例

```typescript
// src/store/modules/product.ts

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { getProductList, getProductById } from '@/api';
import type { Product, ProductListRequest } from '@/api';
import { showToast } from '@/utils/toast';

/**
 * 产品管理 Store
 * @description 管理产品列表、产品详情等
 */
export const useProductStore = defineStore('product', () => {
  // ========== State ==========
  /** 产品列表 */
  const productList = ref<Product[]>([]);

  /** 当前产品 */
  const currentProduct = ref<Product | null>(null);

  /** Loading 状态 */
  const loading = ref(false);

  /** 错误信息 */
  const error = ref<Error | null>(null);

  /** 总数 */
  const total = ref(0);

  // ========== Getters ==========
  /** 是否有产品 */
  const hasProducts = computed(() => productList.value.length > 0);

  /** 产品数量 */
  const productCount = computed(() => productList.value.length);

  // ========== Actions ==========
  /**
   * 获取产品列表
   * @param params 查询参数
   */
  async function fetchProductList(params?: ProductListRequest) {
    loading.value = true;
    error.value = null;

    try {
      const response = await getProductList(params);
      productList.value = response.data || [];
      total.value = response.total || 0;
    } catch (err: any) {
      error.value = err;
      showToast(err.message || '获取产品列表失败');
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 获取产品详情
   * @param id 产品 ID
   */
  async function fetchProductById(id: string) {
    loading.value = true;
    error.value = null;

    try {
      const product = await getProductById(id);
      currentProduct.value = product;
      return product;
    } catch (err: any) {
      error.value = err;
      showToast(err.message || '获取产品详情失败');
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 添加产品到列表
   * @param product 产品信息
   */
  function addProduct(product: Product) {
    productList.value.unshift(product);
    total.value += 1;
  }

  /**
   * 更新产品
   * @param id 产品 ID
   * @param updates 更新的字段
   */
  function updateProduct(id: string, updates: Partial<Product>) {
    const index = productList.value.findIndex((p) => p.id === id);
    if (index !== -1) {
      productList.value[index] = {
        ...productList.value[index],
        ...updates,
      };
    }
  }

  /**
   * 删除产品
   * @param id 产品 ID
   */
  function removeProduct(id: string) {
    const index = productList.value.findIndex((p) => p.id === id);
    if (index !== -1) {
      productList.value.splice(index, 1);
      total.value -= 1;
    }
  }

  /**
   * 重置 Store
   */
  function $reset() {
    productList.value = [];
    currentProduct.value = null;
    loading.value = false;
    error.value = null;
    total.value = 0;
  }

  return {
    // State
    productList,
    currentProduct,
    loading,
    error,
    total,
    // Getters
    hasProducts,
    productCount,
    // Actions
    fetchProductList,
    fetchProductById,
    addProduct,
    updateProduct,
    removeProduct,
    $reset,
  };
});
```

**使用示例：**

```vue
<script setup lang="ts">
import { useCompetitionStore } from '@/store/modules/competition';

const competitionStore = useCompetitionStore();

// 调用列表查询
await competitionStore.fetchCompetitionList({
  page: 1,
  limit: 10,
  name: '搜索关键词',
});
</script>
```

### 步骤 3: 生成类型定义文件

如果 Store 比较复杂，生成独立的类型定义文件：

```typescript
// src/store/modules/product/types.ts

/**
 * 产品 Store 的 State 接口
 */
export interface ProductState {
  productList: Product[];
  currentProduct: Product | null;
  loading: boolean;
  error: Error | null;
  total: number;
}

/**
 * 产品查询参数
 */
export interface ProductQueryParams {
  page?: number;
  limit?: number;
  keyword?: string;
  categoryId?: string;
}
```

### 步骤 4: 生成使用示例

```vue
<!-- src/pages-sub/product/index.vue -->
<template>
  <view class="product-list">
    <!-- Loading 状态 -->
    <view v-if="productStore.loading" class="loading">
      <USkeleton :row="5" animated />
    </view>

    <!-- 错误状态 -->
    <view v-else-if="productStore.error" class="error">
      <UEmpty :description="productStore.error.message" />
    </view>

    <!-- 产品列表 -->
    <view v-else class="content">
      <view
        v-for="product in productStore.productList"
        :key="product.id"
        class="product-item"
      >
        <text class="product-name">{{ product.name }}</text>
        <text class="product-desc">{{ product.description }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app';
import { useProductStore } from '@/store/modules/product';

const productStore = useProductStore();

onLoad(() => {
  // 获取产品列表
  productStore.fetchProductList({
    page: 1,
    limit: 20,
  });
});
</script>
```

### 步骤 5: 展示生成结果

```
✅ Store 生成完成!
─────────────────────────────────────────

📝 Store 信息:
   - 名称: ProductStore
   - 功能: 产品管理
   - 持久化: 否
   - API 集成: 是
   - 文件: src/store/modules/product.ts

📂 生成内容:
   ✓ Store 文件 (src/store/modules/product.ts)
   ✓ 类型定义 (src/store/modules/product/types.ts)
   ✓ 使用示例 (src/pages-sub/product/index.vue)

📋 Store 功能:
   ✅ Composition API 风格
   ✅ 完整的 TypeScript 类型
   ✅ Loading 状态管理
   ✅ 错误处理
   ✅ JSDoc 注释
   ✅ 符合项目规范

💡 使用方式:
```typescript
import { useProductStore } from '@/store/modules/product';

const productStore = useProductStore();

// 获取产品列表
await productStore.fetchProductList();

// 访问状态
console.log(productStore.productList);
console.log(productStore.loading);

// 调用方法
productStore.addProduct(newProduct);
```

💬 下一步:
   1. 查看生成的代码? (y/n)
   2. 添加更多功能? (y/n)
   3. 提交到 Git? (y/n)
```

## Store 设计规范

### 1. 命名规范

```typescript
// ✅ 正确: 使用 use + PascalCase + Store
export const useUserStore = defineStore('user', () => {});
export const useProductStore = defineStore('product', () => {});

// ❌ 错误: 不符合规范
export const userStore = defineStore('user', () => {});  // 缺少 use 前缀
export const UserStore = defineStore('user', () => {});  // 首字母大写
```

### 2. State 定义规范

```typescript
// ✅ 正确: 使用 ref/computed
const count = ref(0);
const userInfo = ref<UserInfo | null>(null);
const isLoggedIn = computed(() => !!token.value);

// ❌ 错误: 使用 reactive 包裹简单类型
const count = reactive(0);  // 简单类型应该用 ref
```

### 3. Actions 规范

```typescript
// ✅ 正确: 使用函数形式,添加 JSDoc
/**
 * 设置用户信息
 * @param info 用户信息
 */
function setUserInfo(info: UserInfo) {
  userInfo.value = info;
}

// ❌ 错误: 缺少注释,参数无类型
function setUserInfo(info) {
  userInfo.value = info;
}
```

### 4. 异步操作规范

```typescript
// ✅ 正确: 完整的 try-catch-finally
async function fetchData() {
  loading.value = true;
  error.value = null;

  try {
    const data = await api();
    list.value = data;
  } catch (err: any) {
    error.value = err;
    showToast(err.message);
    throw err;  // 重新抛出错误
  } finally {
    loading.value = false;
  }
}

// ❌ 错误: 没有错误处理
async function fetchData() {
  const data = await api();
  list.value = data;
}
```

## 持久化配置

### 核心原则

⚠️ **项目使用 `pinia-plugin-persistedstate` 插件，默认存储通过 uni.setStorageSync/uni.getStorageSync**

### 三种配置方式

#### 方式 1: 全部持久化（最简单）

```typescript
export const useUserStore = defineStore(
  'user',
  () => {
    const token = ref<string>('');
    const userInfo = ref<UserInfo | null>(null);
    // ...
    return { token, userInfo };
  },
  {
    persist: true, // 持久化所有返回的状态
  },
);
```

**适用场景**: 所有状态都需要持久化（如用户偏好设置 Store）

#### 方式 2: 选择式持久化 - pick（推荐）

```typescript
export const useCompetitionStore = defineStore(
  'competition',
  () => {
    const competitionList = ref<CompetitionDTO[]>([]);       // 列表数据
    const currentCompetition = ref<CompetitionDTO | null>(null); // 当前详情
    const total = ref<number>(0);                            // 总数
    const loading = ref<boolean>(false);                     // UI 状态

    return { competitionList, currentCompetition, total, loading };
  },
  {
    persist: {
      pick: ['currentCompetition'], // ✅ 只持久化当前竞赛详情
      // ❌ 不持久化 competitionList（列表数据，容易过期）
      // ❌ 不持久化 total（派生数据）
      // ❌ 不持久化 loading（UI 状态）
    },
  },
);
```

**适用场景**: 少数字段需要持久化（如列表页 Store，只持久化当前选中项）

**应该持久化**:
- ✅ 用户登录 token
- ✅ 用户基本信息
- ✅ 当前选中/编辑的详情数据
- ✅ 用户配置项（主题、语言、偏好设置）
- ✅ 缓存的关键数据（避免重复请求）

**不应该持久化**:
- ❌ 列表数据（容易过期，占用空间）
- ❌ UI 状态（loading、error）
- ❌ 临时计算结果
- ❌ 分页信息（total、currentPage）
- ❌ 查询参数（queryParams）

#### 方式 3: 排除式持久化 - omit

```typescript
export const useSettingsStore = defineStore(
  'settings',
  () => {
    const theme = ref<string>('light');
    const language = ref<string>('zh-CN');
    const fontSize = ref<number>(14);
    const showTabbar = ref<boolean>(true);   // 是否显示底部导航
    const tempCache = ref<any>(null);        // 临时缓存
    const isLoading = ref<boolean>(false);   // UI 状态

    return { theme, language, fontSize, showTabbar, tempCache, isLoading };
  },
  {
    persist: {
      omit: ['tempCache', 'isLoading'], // ✅ 排除这些字段，其余都持久化
    },
  },
);
```

**适用场景**: 多数字段需要持久化，少数字段不需要（如设置类 Store）

### 配置对比表

| 配置方式 | 语法 | 适用场景 | 示例 |
|---------|------|---------|------|
| **全部持久化** | `persist: true` | 所有状态都需要持久化 | 用户偏好设置 Store |
| **pick (选择式)** | `persist: { pick: [...] }` | 少数字段需要持久化 | 列表页 Store（只持久化当前选中项） |
| **omit (排除式)** | `persist: { omit: [...] }` | 多数字段需要持久化 | 设置类 Store（只排除临时状态） |

### 注意事项

⚠️ **配置要点**:
- 只支持 `pick` 和 `omit` 两个参数
- 插件自动处理 `key` 和 `storage`，无需手动配置
- 默认存储通过 uni.setStorageSync/uni.getStorageSync

## 最佳实践

### 1. 模块化设计

```
src/store/modules/
├── user/
│   ├── index.ts       # Store 主文件
│   ├── types.ts       # 类型定义
│   └── constants.ts   # 常量
├── product/
│   ├── index.ts
│   └── types.ts
└── settings/
    └── index.ts
```

### 2. 避免大型 Store

```typescript
// ❌ 错误: 一个 Store 管理所有状态
export const useAppStore = defineStore('app', () => {
  const user = ref({});
  const products = ref([]);
  const orders = ref([]);
  const settings = ref({});
  // ... 太多职责
});

// ✅ 正确: 按功能拆分 Store
export const useUserStore = defineStore('user', () => {});
export const useProductStore = defineStore('product', () => {});
export const useOrderStore = defineStore('order', () => {});
export const useSettingsStore = defineStore('settings', () => {});
```

### 3. Store 间通信

```typescript
// src/store/modules/cart.ts
import { showToast } from '@/utils/toast';

export const useCartStore = defineStore('cart', () => {
  const userStore = useUserStore();
  const productStore = useProductStore();

  function addToCart(productId: string) {
    // 检查用户是否登录
    if (!userStore.isLoggedIn) {
      showToast('请先登录');
      return;
    }

    // 获取产品信息
    const product = productStore.findProductById(productId);
    if (!product) {
      showToast('产品不存在');
      return;
    }

    // 添加到购物车
    items.value.push(product);
  }

  return { addToCart };
});
```

## 与其他 Skills 配合

### 1. Store + API 集成

```bash
# 步骤 1: 同步 API
pnpm api:gen

# 步骤 2: 生成 Store (智能模式,自动集成 API)
/store-generator ProductStore --smart

# 步骤 3: Store 会自动导入对应的 API
```

### 2. Store + 组件

```bash
# 步骤 1: 生成 Store
/store-generator UserStore

# 步骤 2: 生成使用 Store 的组件
/component-generator UserProfile --type business
```

## 相关文档

- [store-development.md](../../agents/store-development.md) - Store 开发规范
- [common-patterns.md](../../agents/common-patterns.md) - 通用开发模式
- [api-development.md](../../agents/api-development.md) - API 开发规范 (智能模式)
- [Pinia 官方文档](https://pinia.vuejs.org/)

## 常见问题

### Q1: 什么时候需要创建新的 Store？

**A:** 遵循单一职责原则：
- ✅ 每个业务模块一个 Store (user, product, order)
- ✅ 每个功能模块一个 Store (auth, settings, cache)
- ❌ 不要把所有状态放在一个 Store 中

### Q2: 是否所有 Store 都需要持久化？

**A:** 不是,根据数据特点选择：
- ✅ 需要持久化: 用户设置、主题配置、登录令牌
- ❌ 不需要持久化: 列表数据、临时状态、加载状态

### Q3: 如何在组件外使用 Store？

**A:**
```typescript
// ✅ 正确: 在函数内调用
function someFunction() {
  const userStore = useUserStore();
  console.log(userStore.token);
}

// ❌ 错误: 在顶层调用 (SSR 会有问题)
const userStore = useUserStore();
export function someFunction() {
  console.log(userStore.token);
}
```

### Q4: Store 可以修改吗？

**A:** 可以！生成的代码是模板，你可以根据需求修改和扩展。

### Q5: 为什么生成的 Store 有类型错误？

**A:** 运行类型检查并根据错误信息修复：

```bash
# 运行类型检查
pnpm type-check
```

**常见问题：**
1. 导入的类型路径错误
2. 字段名拼写错误
3. 缺少必需的类型导入

### Q6: 分页字段使用什么名称？

**A:** 本项目统一使用 `limit`（不是 `size` / `pageSize`）

```typescript
// ✅ 正确
const queryParams = ref<GetXxxsParams>({
  page: 1,
  limit: 10,
});

// ❌ 错误
const queryParams = ref<GetXxxsParams>({
  page: 1,
  size: 10,  // 错误：应该是 limit
});
```

## 示例工作流

### 场景: 创建用户管理 Store

```bash
# 步骤 1: 生成 Store (智能模式 + 持久化)
/store-generator UserStore --smart --persist

# 步骤 2: 查看生成的文件
# - src/store/modules/user.ts

# 步骤 3: 在组件中使用
# src/pages/login/index.vue
import { useUserStore } from '@/store/modules/user';

const userStore = useUserStore();

# 步骤 4: 调用 Store 方法
await userStore.login({ username, password });

# 步骤 5: 测试持久化
# 刷新页面,检查数据是否保留

# 步骤 6: 提交代码
git add src/store/modules/user.ts
git commit -m "feat: add user store with persistence"
```

---

**提示**: Store 是状态管理的核心，合理的设计可以让应用更易维护！
