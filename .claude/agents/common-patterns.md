---
name: common-patterns
description: 项目通用开发模式和规范,供其他 agent 引用,作为单一真实来源
---

# 通用开发模式 (Common Patterns)

## 职责
提供项目通用的开发模式、规范和最佳实践,作为单一真实来源(Single Source of Truth),供其他 agent 文档引用,避免重复定义。

---

## 🎨 Vue 组件模式

### 图标使用规范 ⚠️ **禁止内联 SVG**

**核心原则**: 所有 SVG 必须下载为文件，使用 `<img>` 标签引用，严禁 `<svg>` 标签或 `v-html`

```vue
<!-- ✅ 正确 -->
<img src="@/assets/icons/home/icon-name.svg" alt="Icon" class="w-6 h-6" />

<!-- ❌ 错误 -->
<svg><path d="M..." /></svg>
<div v-html="svgContent"></div>
```

**动态图标**:
```vue
<img :src="iconSrc" alt="图标" />

<script setup lang="ts">
const iconSrc = computed(() =>
  props.type === 'primary'
    ? '@/assets/icons/home/icon-primary.svg'
    : '@/assets/icons/home/icon-secondary.svg'
);
</script>
```

**详见**: [component-development.md#svg-使用规范](component-development.md#svg-使用规范)

---

### Props 定义规范

#### 完整的 Props 定义模板
```typescript
// ✅ 正确：完整的 Props 定义
interface Props {
  /** 用户ID */
  userId: string;
  /** 显示模式 */
  mode?: 'card' | 'list';
  /** 是否显示操作按钮 */
  showActions?: boolean;
  /** 用户信息 */
  userInfo?: IUserInfo;
  /** 标签列表 */
  tags?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'card',
  showActions: true,
  tags: () => [],
});

// ❌ 错误：缺少类型定义
const props = defineProps(['userId', 'mode']);

// ❌ 错误：使用 any 类型
interface Props {
  data: any;  // 应该定义具体类型
}
```

#### Props 使用原则
1. **所有 Props 必须在模板中使用** - 避免定义未使用的参数
2. **Props 类型必须明确** - 不使用 `any` 类型
3. **可选属性使用 `?`** - 明确标识可选参数
4. **数组/对象默认值使用函数** - 避免引用类型共享

#### Props 命名规范
```typescript
// ✅ 正确：使用 camelCase
interface Props {
  userId: string;
  showActions: boolean;
  maxCount: number;
}

// ❌ 错误：使用 snake_case 或 PascalCase
interface Props {
  user_id: string;    // 应该是 userId
  ShowActions: boolean; // 应该是 showActions
}
```

### Emits 定义规范

#### 完整的 Emits 定义模板
```typescript
// ✅ 正确：完整的 Emits 定义
interface Emits {
  /** 更新事件 */
  (e: 'update', user: IUserInfo): void;
  /** 删除事件 */
  (e: 'delete', userId: string): void;
  /** v-model 更新事件 */
  (e: 'update:modelValue', value: string): void;
}

const emit = defineEmits<Emits>();

// 调用示例
emit('update', userInfo);
emit('delete', userId);
emit('update:modelValue', newValue);

// ❌ 错误：缺少类型定义
const emit = defineEmits(['update', 'delete']);
```

#### Emits 命名规范
```typescript
// ✅ 正确：使用小写和连字符
interface Emits {
  (e: 'submit', data: IFormData): void;
  (e: 'cancel'): void;
  (e: 'update:model-value', value: string): void;  // v-model 更新
}

// ❌ 错误：使用 camelCase
interface Emits {
  (e: 'onSubmit', data: IFormData): void;  // 应该是 'submit'
  (e: 'updateModelValue', value: string): void;  // 应该是 'update:model-value'
}
```

### 组件响应式数据规范

```typescript
// ✅ 正确：明确的类型定义
const userInfo = ref<IUserInfo | null>(null);
const loading = ref<boolean>(false);
const userList = ref<IUserInfo[]>([]);

// ✅ 正确：计算属性有返回类型
const displayName = computed((): string => {
  return userInfo.value?.username || '未知用户';
});

const isAdmin = computed((): boolean => {
  return userInfo.value?.roles.includes('admin') ?? false;
});

// ❌ 错误：缺少类型定义
const userInfo = ref(null);
const loading = ref(false);

// ❌ 错误：计算属性缺少返回类型
const displayName = computed(() => {
  return userInfo.value?.username || '未知用户';
});
```

### 组件嵌套规范 ⚠️ **重要**

**核心原则：避免过深嵌套**

- **避免组件层层嵌套**（优先拆分为平级组件）
- **避免 DOM 过深嵌套**
- **避免 SCSS 选择器过深嵌套**
- **使用 Flex/Grid 替代不必要的包装层**

> **详细规范**: [component-development.md#组件嵌套深度规范](component-development.md#组件嵌套深度规范)

### 骨架屏模式

#### 路由级骨架屏配置

在路由 `meta.skeleton` 中配置，页面组件加载时自动显示骨架屏。

```typescript
// ✅ 正确：使用预置类型 - 卡片型
{
  path: '/home',
  name: 'Home',
  component: () => import('@/views/home/index.vue'),
  meta: {
    title: '首页',
    skeleton: {
      type: 'card',
      props: {
        count: 4,      // 卡片数量
        rows: 3,       // 每个卡片的行数
        columns: 2,    // 每行卡片列数
      },
    },
  },
}

// ✅ 正确：使用预置类型 - 列表型
{
  path: '/user-list',
  name: 'UserList',
  component: () => import('@/views/user-list/index.vue'),
  meta: {
    title: '用户列表',
    skeleton: {
      type: 'list',
      props: {
        count: 10,          // 列表项数量
        rows: 3,            // 每项显示行数
        showSearchBar: true, // 是否显示搜索栏
        showAvatar: true,   // 是否显示头像
      },
    },
  },
}

// ✅ 正确：使用自定义组件
import LoginSkeleton from '@/components/Skeleton/LoginSkeleton/index.vue';

{
  path: '/login',
  name: 'Login',
  component: () => import('@/views/login/index.vue'),
  meta: {
    title: '登录',
    skeleton: {
      component: LoginSkeleton,
      props: {
        // 自定义组件的 props
      },
    },
  },
}

// ❌ 错误：type 和 component 同时使用
{
  meta: {
    skeleton: {
      type: 'card',              // 不能同时存在
      component: CustomSkeleton, // 不能同时存在
    },
  },
}

// ❌ 错误：使用不存在的 type
{
  meta: {
    skeleton: {
      type: 'unknown', // 只支持 'card'、'list'、'form'、'detail'、'grid'
    },
  },
}
```

#### 组件内骨架屏使用

在组件内部处理异步数据加载时使用 Vant 的 `van-skeleton`。

```vue
<script setup lang="ts">
import { ref } from 'vue';

const loading = ref(true);
const data = ref<IDataItem[]>([]);

const fetchData = async (): Promise<void> => {
  loading.value = true;
  try {
    const response = await api.getData();
    data.value = response;
  } catch (error) {
    console.error('获取数据失败:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="container">
    <!-- ✅ 正确：加载中显示骨架屏 -->
    <van-skeleton v-if="loading" :row="5" animated />

    <!-- 加载完成显示数据 -->
    <div v-else class="content">
      <div v-for="item in data" :key="item.id" class="item">
        {{ item.name }}
      </div>
    </div>
  </div>
</template>

<!-- ❌ 错误：没有骨架屏，直接显示空白 -->
<template>
  <div v-if="!loading" class="content">
    <!-- 数据内容 -->
  </div>
</template>
```

#### 骨架屏组件 Props 规范

开发自定义骨架屏组件时，遵循以下 Props 定义规范：

```typescript
// ✅ 正确：完整的骨架屏 Props 定义
interface CardSkeletonProps {
  /** 卡片数量 */
  count?: number;
  /** 每个卡片的行数 */
  rows?: number;
  /** 每行卡片列数 */
  columns?: number;
  /** 是否显示动画 */
  animated?: boolean;
}

const props = withDefaults(defineProps<CardSkeletonProps>(), {
  count: 4,
  rows: 4,
  columns: 2,
  animated: true,
});

// ✅ 正确：列表骨架屏 Props 定义
interface ListSkeletonProps {
  /** 列表项数量 */
  count?: number;
  /** 每项显示行数 */
  rows?: number;
  /** 是否显示搜索栏 */
  showSearchBar?: boolean;
  /** 是否显示头像 */
  showAvatar?: boolean;
  /** 是否显示标题 */
  showTitle?: boolean;
}

const props = withDefaults(defineProps<ListSkeletonProps>(), {
  count: 10,
  rows: 3,
  showSearchBar: true,
  showAvatar: true,
  showTitle: true,
});

// ❌ 错误：Props 缺少类型定义
const props = defineProps({
  count: Number,  // 应该使用 TypeScript 接口
  rows: Number,
});
```

#### 骨架屏类型定义

项目在 `src/interface/skeleton.ts` 中定义了完整的骨架屏类型系统：

```typescript
// 骨架屏配置类型（discriminated union 确保类型安全）
type SkeletonConfig =
  | { type: 'card'; props?: CardSkeletonProps }
  | { type: 'list'; props?: ListSkeletonProps }
  | { type: 'form'; props?: FormSkeletonProps }
  | { type: 'detail'; props?: DetailSkeletonProps }
  | { type: 'grid'; props?: GridSkeletonProps }
  | { component: Component; props?: Record<string, any> };

// 扩展路由 meta
interface RouteMeta {
  title?: string;
  roles?: string[];
  requiresAuth?: boolean;
  skeleton?: SkeletonConfig;  // 骨架屏配置
}
```

#### 骨架屏工具函数

项目提供了工具函数用于获取骨架屏组件和 props：

```typescript
import { getSkeletonComponent, getSkeletonProps } from '@/components/Skeleton';

// 在 Layout 或路由守卫中使用
const SkeletonComponent = getSkeletonComponent(route);
const skeletonProps = getSkeletonProps(route);

// ✅ 正确：检查组件是否存在
if (SkeletonComponent) {
  // 渲染骨架屏
}

// ❌ 错误：不检查直接使用
const SkeletonComponent = getSkeletonComponent(route);
// 如果返回 null 会报错
```

#### 骨架屏使用原则

1. **路由级优先** - 优先在路由配置中使用 `meta.skeleton`，适用于整个页面加载
2. **组件内备用** - 组件内异步数据加载使用 Vant `van-skeleton`，适用于局部数据加载
3. **动画增强** - 启用 `animated` 属性提升视觉效果
4. **尺寸匹配** - 骨架屏尺寸应与实际内容接近，避免布局跳动
5. **类型安全** - 使用 TypeScript discriminated union 确保配置类型安全

#### 预置骨架屏组件

| 组件 | 位置 | 说明 | 使用场景 |
|------|------|------|---------|
| **CardSkeleton** | `src/components/Skeleton/CardSkeleton/` | 卡片型骨架屏 | 首页卡片布局 |
| **ListSkeleton** | `src/components/Skeleton/ListSkeleton/` | 列表型骨架屏 | 列表数据页面 |
| **FormSkeleton** | `src/components/Skeleton/FormSkeleton/` | 表单型骨架屏 | 表单页面 |
| **DetailSkeleton** | `src/components/Skeleton/DetailSkeleton/` | 详情型骨架屏 | 详情页面 |
| **GridSkeleton** | `src/components/Skeleton/GridSkeleton/` | 网格型骨架屏 | 网格布局页面 |
| **LayoutSkeleton** | `src/components/Skeleton/LayoutSkeleton/` | Layout 整体骨架屏 | Layout 加载时显示 |
| **LoginSkeleton** | `src/components/Skeleton/LoginSkeleton/` | 登录页专用骨架屏 | 登录页加载时显示 |

---

## 🎨 数据驱动模式

### 列表渲染规范

#### 使用 v-for + 数据数组
```vue
<!-- ✅ 正确：数据驱动的列表 -->
<template>
  <div class="menu-list">
    <div
      v-for="item in menuItems"
      :key="item.id"
      class="menu-item"
      @click="handleMenuClick(item)"
    >
      {{ item.label }}
    </div>
  </div>
</template>

<script setup lang="ts">
interface MenuItem {
  id: string;
  label: string;
  icon?: string;
}

interface Props {
  menuItems: MenuItem[];
}

const props = defineProps<Props>();

const handleMenuClick = (item: MenuItem) => {
  console.log('Clicked:', item.label);
};
</script>

<!-- ❌ 错误：硬编码列表内容 -->
<template>
  <div class="menu-list">
    <div class="menu-item">首页</div>
    <div class="menu-item">用户管理</div>
    <div class="menu-item">设置</div>
  </div>
</template>
```

### 业务数据通过 Props 传入

#### 业务组件示例
```vue
<!-- ✅ 正确：统计数字通过 Props 传入 -->
<template>
  <div class="stats-card">
    <div class="label">{{ label }}</div>
    <div class="value">{{ value }}</div>
    <div class="trend">{{ trend }}</div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  /** 统计标签 */
  label: string;
  /** 统计值 */
  value: number | string;
  /** 趋势文本 */
  trend?: string;
}

const props = defineProps<Props>();
</script>

<!-- ❌ 错误：硬编码业务数据 -->
<template>
  <div class="stats-card">
    <div class="label">用户总数</div>
    <div class="value">1,234</div>
    <div class="trend">+12%</div>
  </div>
</template>
```

### 数据接口类型定义

```typescript
// ✅ 正确：完整的数据接口
interface IStatsCard {
  id: string;
  label: string;
  value: number | string;
  trend?: string;
  icon?: string;
}

interface MenuItem {
  id: string;
  label: string;
  path: string;
  icon?: string;
  badge?: number;
  children?: MenuItem[];
}

// 在组件中使用
interface Props {
  statsData: IStatsCard[];
  menuItems: MenuItem[];
}

// ❌ 错误：缺少类型定义
const statsData = ref([
  { label: '用户总数', value: 1234 },  // 没有类型约束
]);
```

---

## 🎨 CSS 变量使用规范

### 必须使用 public/theme.css 中定义的 CSS 变量

项目在 `public/theme.css` 中定义了完整的 CSS 变量系统,所有样式中的颜色**必须**使用这些变量,**禁止硬编码颜色值**。

**⚠️ Figma 设计稿还原例外**: 当还原 Figma 设计稿时,如果设计稿中明确标注了颜色和尺寸数值,**优先使用 Figma 标注的数值**。只有在 Figma 没有明确标注时,才使用 CSS 变量。

#### 文本颜色变量
```scss
.component {
  // ✅ 正确：使用 CSS 变量
  color: var(--colorTextHeading);        // 标题文本 rgba(0,0,0,0.88)
  color: var(--colorText);               // 普通文本 rgba(0,0,0,0.88)
  color: var(--colorTextSecondary);      // 次要文本 rgba(0,0,0,0.65)
  color: var(--colorTextTertiary);       // 三级文本 rgba(0,0,0,0.45)
  color: var(--colorTextPlaceholder);    // 占位符 rgba(0,0,0,0.25)
  color: var(--colorTextQuaternary);     // 四级文本 rgba(0,0,0,0.25)

  // ❌ 错误：硬编码颜色
  color: #333;
  color: rgba(0,0,0,0.88);
}
```

#### 背景颜色变量
```scss
.component {
  // ✅ 正确：使用 CSS 变量
  background: var(--colorBgContainer);   // 容器背景 #ffffff
  background: var(--colorBgLayout);      // 布局背景 #f5f5f5
  background: var(--colorBgElevated);    // 浮层背景 #ffffff
  background: var(--colorBgMask);        // 遮罩背景 rgba(0,0,0,0.45)
  background: var(--colorBgBase);        // 基础背景 #ffffff

  // ❌ 错误：硬编码颜色
  background: #fff;
  background: #f5f5f5;
}
```

#### 边框颜色变量
```scss
.component {
  // ✅ 正确：使用 CSS 变量
  border: 1px solid var(--colorBorder);           // 默认边框 #d9d9d9
  border: 1px solid var(--colorBorderSecondary);  // 次要边框 #eeeeee

  // ❌ 错误：硬编码颜色
  border: 1px solid #e0e0e0;
}
```

#### 主题色变量
```scss
.component {
  // ✅ 正确：使用 CSS 变量
  background: var(--colorPrimary);         // 主色 rgb(0,180,180)
  color: var(--colorPrimaryText);          // 主色文本
  border-color: var(--colorPrimaryBorder); // 主色边框
  background: var(--colorPrimaryBg);       // 主色浅背景

  // ❌ 错误：硬编码主题色
  background: rgb(0,180,180);
}
```

#### 状态颜色变量
```scss
.component {
  // ✅ 正确：使用 CSS 变量
  color: var(--colorSuccess);            // 成功色
  color: var(--colorWarning);            // 警告色
  color: var(--colorError);              // 错误色
  color: var(--colorInfo);               // 信息色

  // ❌ 错误：硬编码状态颜色
  color: #52c41a;  // 应该使用 var(--colorSuccess)
  color: #ff4d4f;  // 应该使用 var(--colorError)
}
```

#### 色板变量（辅助色）
```scss
.component {
  // ✅ 正确：使用色板变量
  background: var(--cyan-1);   // 青色系列 (1-10)
  background: var(--cyan-2);
  background: var(--blue-4);   // 蓝色系列
  background: var(--green-5);  // 绿色系列
  background: var(--red-6);    // 红色系列

  // ❌ 错误：硬编码辅助色
  background: #e6f7ff;
}
```

---

## 📦 CSS 盒模型规范

### ⚠️ 重要：Figma 尺寸包含 padding

**Figma 中标注的 width/height 是元素的整体尺寸，包含 padding 和 border**

#### 核心原则

```scss
// Figma 设计稿：
// height: 80px
// padding: 12px 0

// ✅ 正确实现（方案 1：推荐）
.element {
  box-sizing: border-box;  // 关键！让 padding 包含在 height 内
  height: 80px;            // 直接使用 Figma 值
  padding: 12px 0;         // 直接使用 Figma 值
}
// 结果：总高度 = 80px，内容区 = 56px (80 - 12 - 12)

// ✅ 正确实现（方案 2：不推荐）
.element {
  height: 56px;            // 手动计算：80 - 12 - 12
  padding: 12px 0;
}
// 结果：总高度 = 80px

// ❌ 错误实现
.element {
  height: 80px;            // ❌ 没有 box-sizing: border-box
  padding: 12px 0;
}
// 结果：总高度 = 104px (80 + 12 + 12) ❌ 不符合设计！
```

### CSS 盒模型详解

#### 两种盒模型

**1. content-box（CSS 默认）**
```scss
.element {
  box-sizing: content-box;  // 默认值
  width: 200px;
  height: 80px;
  padding: 12px;
  border: 1px solid;
}
// 内容区：200px × 80px
// 实际占用：224px × 104px (width/height + padding + border)
```

**2. border-box（推荐）**
```scss
.element {
  box-sizing: border-box;   // 推荐！
  width: 200px;
  height: 80px;
  padding: 12px;
  border: 1px solid;
}
// 整体尺寸：200px × 80px (包含 padding 和 border)
// 内容区：174px × 54px (width/height - padding - border)
```

### Figma 转 CSS 的正确流程

#### 步骤 1：读取 Figma 数据
```yaml
# Figma 设计稿数据
Frame 1000004439:
  dimensions:
    width: 200
    height: 80
  padding: 12px 20px
  border: 1px solid
```

#### 步骤 2：转换为 CSS（推荐方式）
```scss
.frame {
  box-sizing: border-box;  // ✅ 第一步：设置盒模型
  width: 200px;            // ✅ 直接使用 Figma 值
  height: 80px;            // ✅ 直接使用 Figma 值
  padding: 12px 20px;      // ✅ 直接使用 Figma 值
  border: 1px solid var(--colorBorder);
}
```

#### ❌ 常见错误

**错误 1：忘记 box-sizing**
```scss
.element {
  // ❌ 缺少 box-sizing: border-box
  height: 80px;
  padding: 12px 0;
}
// 实际高度 = 104px，不符合设计！
```

**错误 2：手动计算内容区高度**
```scss
.element {
  height: 56px;           // 80 - 12 - 12
  padding: 12px 0;
}
// ⚠️ 虽然结果正确，但不直观，维护困难
// 改 padding 需要重新计算 height
```

**错误 3：错误理解 Figma 尺寸**
```scss
// ❌ 错误理解：认为 Figma 的 80px 是内容区高度
.element {
  height: 80px;           // 内容区
  padding: 12px 0;        // 额外的 padding
}
// 实际高度 = 104px，不符合设计！
```

### 实战检查清单

**从 Figma 还原尺寸时，必须检查：**

- [ ] Figma 标注的 width/height 是多少？
- [ ] 是否有 padding？
- [ ] 是否有 border？
- [ ] ✅ 添加 `box-sizing: border-box`
- [ ] ✅ height/width 直接使用 Figma 值
- [ ] ✅ padding 直接使用 Figma 值
- [ ] ✅ border 直接使用 Figma 值
- [ ] 在浏览器 DevTools 验证实际尺寸
- [ ] 确认实际尺寸 = Figma 标注值

### 全局设置推荐

```scss
// 在项目全局样式中设置（推荐）
*, *::before, *::after {
  box-sizing: border-box;
}
```

**如果项目没有全局设置，每个有 padding/border 的元素都要单独设置！**

### 为什么使用 border-box

| 对比项 | content-box（默认） | border-box（推荐） |
|--------|--------------------|--------------------|
| **直观性** | ❌ width 不等于实际宽度 | ✅ width 就是实际宽度 |
| **可维护性** | ❌ 改 padding 影响总尺寸 | ✅ 改 padding 不影响总尺寸 |
| **与 Figma 一致** | ❌ 需要手动计算 | ✅ 直接使用 Figma 值 |
| **布局稳定性** | ❌ 容易溢出父容器 | ✅ 尺寸可控 |

---

## 🎨 样式选择器规范

### 禁止直接使用标签选择器

在组件样式中**禁止**直接使用标签名作为选择器,必须为每个元素添加语义化的 class。

```scss
// ❌ 错误：直接使用标签选择器
h1 {
  font-size: 24px;
  color: var(--colorTextHeading);
}

h2 {
  font-size: 20px;
}

p {
  color: var(--colorText);
}

div {
  padding: 20px;
}

// ✅ 正确：为每个元素添加 class
.page-title {
  font-size: 24px;
  color: var(--colorTextHeading);
}

.section-title {
  font-size: 20px;
  color: var(--colorTextHeading);
}

.text-content {
  color: var(--colorText);
}

.content-wrapper {
  padding: 20px;
}
```

### BEM 命名规范

推荐使用 BEM (Block-Element-Modifier) 命名规范:

```scss
// ✅ 正确：BEM 命名
.user-card {
  // Block
  padding: 20px;
  border: 1px solid var(--colorBorder);

  &__header {
    // Element
    display: flex;
    justify-content: space-between;
  }

  &__title {
    // Element
    font-size: 18px;
    color: var(--colorTextHeading);
  }

  &__content {
    // Element
    margin-top: 16px;
  }

  &--large {
    // Modifier
    padding: 32px;
  }

  &--highlighted {
    // Modifier
    border-color: var(--colorPrimary);
  }
}

// ❌ 错误：没有明确的命名规范
.card {
  .header {
    .title {
      span {
        // 嵌套过深
      }
    }
  }
}
```

### 选择器嵌套深度限制

样式嵌套深度不超过 3 层:

```scss
// ✅ 正确：嵌套不超过 3 层
.user-management {
  &__header {
    .search-input {
      // 2 层嵌套
      width: 100%;
    }
  }
}

// ❌ 错误：嵌套过深
.user-management {
  .container {
    .header {
      .search-bar {
        .input {
          // 5 层嵌套，过深
        }
      }
    }
  }
}
```

---

## 🎨 RGB 颜色函数规范

### 必须使用新语法形式

项目中使用 RGB 颜色时,**必须**使用新语法 `rgb(r g b / alpha)`,**禁止**使用旧语法 `rgba(r, g, b, alpha)`。

```scss
// ✅ 正确：使用新语法 rgb()
.component {
  color: rgb(0 0 0 / 0.880);
  background: rgb(255 255 255 / 0.500);
  border-color: rgb(0 180 180 / 1);
}

// ❌ 错误：使用旧语法 rgba()
.component {
  color: rgba(0, 0, 0, 0.88);
  background: rgba(255, 255, 255, 0.5);
}

// ❌ 错误：使用逗号分隔的 rgb()
.component {
  color: rgb(0, 0, 0);
}
```

### Alpha 通道规范

- **不透明色**: 可以省略 alpha 值或使用 `/ 1`
- **半透明色**: 必须使用 `/ alpha` 语法

```scss
// ✅ 正确：不透明色
.component {
  color: rgb(0 0 0);           // 省略 alpha
  color: rgb(0 0 0 / 1);       // 明确 alpha = 1
}

// ✅ 正确：半透明色
.component {
  color: rgb(0 0 0 / 0.880);
  background: rgb(255 255 255 / 0.500);
}

// ❌ 错误：使用逗号
.component {
  color: rgb(0, 0, 0, 0.88);
}
```

---

## 🎨 CSS 数值精度规范

### 小数保留 3 位精度

所有 CSS 数值中的小数必须保留 **3 位小数**,确保样式还原的精确性。

```scss
// ✅ 正确：小数保留 3 位
.component {
  font-size: 14.375px;
  line-height: 1.429em;
  opacity: 0.880;
  width: 123.456px;
  color: rgb(0 0 0 / 0.880);
}

// ❌ 错误：小数位数不一致
.component {
  line-height: 1.42em;     // 应为 1.420em
  opacity: 0.88;           // 应为 0.880
  width: 123.46px;         // 应为 123.460px
}

// ✅ 整数不加小数点
.component {
  width: 100px;
  height: 50px;
  margin: 20px;
}
```

### 特殊情况

- **整数值**: 不需要添加小数点
- **0 值**: 直接写 `0`,不需要单位和小数点
- **百分比**: 同样遵循 3 位小数规则

```scss
// ✅ 正确示例
.component {
  width: 100px;              // 整数不加小数
  margin: 0;                 // 0 值不需要单位
  opacity: 0.880;            // 小数 3 位
  transform: translateX(50%); // 整数百分比
  width: 33.333%;            // 小数百分比保留 3 位
}
```

---

## 🔧 错误处理模式

### 异步函数错误处理

```typescript
// ✅ 正确：完整的错误处理
const fetchUserInfo = async (): Promise<void> => {
  loading.value = true;
  error.value = null;

  try {
    const response = await getAuthUserInfo();
    userInfo.value = response;
  } catch (err) {
    error.value = err instanceof Error ? err.message : '获取用户信息失败';
    console.error('获取用户信息失败:', err);
    showToast('获取用户信息失败');
  } finally {
    loading.value = false;
  }
};

// ❌ 错误：缺少错误处理
const fetchUserInfo = async () => {
  const response = await getAuthUserInfo();
  userInfo.value = response;
};
```

### Store Actions 错误处理

```typescript
// ✅ 正确：Store Action 错误处理
const loginAction = async (credentials: ILoginRequest): Promise<void> => {
  loading.value = true;

  try {
    const response = await postAuthLogin(credentials);
    token.value = response.token;
    userInfo.value = response.userInfo;

    // 持久化存储
    localStorage.setItem('token', token.value);
  } catch (error) {
    console.error('登录失败:', error);
    throw error;  // 重新抛出,让调用方处理
  } finally {
    loading.value = false;
  }
};

// ❌ 错误：吞掉错误
const loginAction = async (credentials: ILoginRequest) => {
  try {
    const response = await postAuthLogin(credentials);
    token.value = response.token;
  } catch (error) {
    console.error(error);  // 只打印,不抛出,调用方无法知道失败
  }
};
```

---

## 📋 导入规范

> **完整的导入规范请查看:** [coding-standards.md#导入规范](coding-standards.md#导入规范)

**核心原则:**
- Vue 相关导入优先
- 第三方库次之
- 项目内部导入使用 `@/` 别名
- 类型导入使用 `type` 关键字

详细的导入顺序、类型导入规范和示例请查看 [coding-standards.md#导入规范](coding-standards.md#导入规范)。

---

## 📋 快速参考清单

### Vue 组件开发检查
- [ ] Props 和 Emits 有完整的 TypeScript 接口定义
- [ ] 所有 Props 都在模板中使用
- [ ] 响应式数据类型明确
- [ ] 计算属性有返回类型注解
- [ ] 异步函数有完善的错误处理

### 组件嵌套检查 ⚠️ **重要**
- [ ] 避免组件层层嵌套
- [ ] 避免 DOM 过深嵌套
- [ ] 避免 SCSS 选择器过深嵌套
- [ ] 优先拆分为平级组件，而不是嵌套更深
- [ ] 使用 Flex/Grid 替代不必要的包装层
- [ ] 删除所有无意义的包装元素

### 样式开发检查
- [ ] 所有颜色使用 `var(--colorXxx)` CSS 变量
- [ ] 不直接使用标签选择器 (`h1`, `p`, `div`)
- [ ] 每个元素都有语义化的 class 名称
- [ ] 避免样式选择器过深嵌套
- [ ] RGB 颜色使用新语法 `rgb(r g b / alpha)`

### 数据驱动检查
- [ ] 列表内容使用 `v-for` + 数据数组
- [ ] 业务数据通过 Props 传入
- [ ] 避免在模板中硬编码内容
- [ ] 定义了完整的数据接口类型

### 骨架屏使用检查
- [ ] 页面级路由配置了 `meta.skeleton`
- [ ] 组件内异步加载使用 `van-skeleton`
- [ ] 骨架屏启用了 `animated` 动画
- [ ] 骨架屏尺寸与实际内容匹配
- [ ] 使用 TypeScript 类型安全配置

---

## 📚 相关文档

本文档作为通用模式的单一真实来源,被以下 agent 文档引用:

- [coding-standards.md#编码规范概览](coding-standards.md#编码规范概览) - 编码规范
- [component-development.md#组件开发规范](component-development.md#组件开发规范) - 组件开发
- [store-development.md#store设计原则](store-development.md#store设计原则) - 状态管理
- [testing.md#测试策略](testing.md#测试策略) - 测试规范

当其他文档中需要使用这些通用模式时,应该引用本文档,避免重复定义。

**引用示例**:
```markdown
> **Props定义规范**: 详见 [common-patterns.md#props-定义规范](common-patterns.md#props-定义规范)
> **CSS变量使用规范**: 详见 [common-patterns.md#css-变量使用规范](common-patterns.md#css-变量使用规范)
```
