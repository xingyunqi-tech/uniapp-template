---
name: common-patterns
description: 项目通用开发模式和规范，供其他 agent 引用，作为单一真实来源 (Uni-app 版本)
tools: Read, Grep, Glob
model: inherit
---

# 通用开发模式 (Common Patterns)

## 职责
提供 Uni-app 项目通用的开发模式、规范和最佳实践，作为单一真实来源(Single Source of Truth)，供其他 agent 文档引用，避免重复定义。

**重要**: 本项目是 Uni-app 多端项目，使用 uni-ui 组件库，需要注意跨平台兼容性。

---

## 🎨 Vue 组件模式

### 图标使用规范

**Uni-app 图标使用方式**:

```vue
<!-- ✅ 正确 1: 使用 uni-icons 组件 -->
<uni-icons type="home" size="24" color="#333" />

<!-- ✅ 正确 2: 使用 image 标签 (静态资源) -->
<image src="/static/icons/home.png" mode="aspectFit" class="icon" />

<!-- ✅ 正确 3: 使用 iconfont -->
<text class="iconfont icon-home" />

<!-- ❌ 错误: 小程序不支持 img 标签 -->
<img src="@/assets/icons/home.svg" />

<!-- ❌ 错误: 内联 SVG -->
<svg><path d="M..." /></svg>
```

**动态图标**:
```vue
<image :src="iconSrc" mode="aspectFit" class="icon" />

<script setup lang="ts">
const iconSrc = computed(() =>
  props.type === 'primary'
    ? '/static/icons/icon-primary.png'
    : '/static/icons/icon-secondary.png'
);
</script>
```

**注意**: 小程序中静态资源路径必须以 `/static/` 开头或使用网络地址。

**详见**: [component-development.md#图标使用规范](component-development.md#图标使用规范)

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

#### 使用 USkeleton 组件

项目封装了 `USkeleton` 组件用于显示骨架屏：

```vue
<template>
  <view class="container">
    <!-- ✅ 正确：加载中显示骨架屏 -->
    <USkeleton v-if="loading" type="list" :rows="5" />

    <!-- 加载完成显示数据 -->
    <view v-else class="content">
      <view v-for="item in data" :key="item.id" class="item">
        {{ item.name }}
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

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

onLoad(() => {
  fetchData();
});
</script>
```

#### USkeleton Props

```typescript
interface SkeletonProps {
  /** 是否显示骨架屏 */
  loading?: boolean;
  /** 骨架屏类型 */
  type?: SkeletonType;
  /** 是否显示动画 */
  animated?: boolean;
  /** 是否显示头像 */
  avatar?: boolean;
  /** 头像形状 */
  avatarShape?: AvatarShape;
  /** 行数 (列表/卡片/表单的重复次数) */
  rows?: number;
  /** 段落行数 */
  paragraphRows?: number;
}```

#### 骨架屏使用原则

1. **异步加载必须有骨架屏** - 避免空白页面
2. **动画增强** - 启用 `animated` 属性提升视觉效果
3. **尺寸匹配** - 骨架屏尺寸应与实际内容接近，避免布局跳动
4. **easycom 自动导入** - 使用 `<USkeleton>` 无需 import（不支持 `<u-skeleton>` 写法）

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

### 必须使用 src/styles/theme.scss 中定义的 CSS 变量

项目在 `src/styles/theme.scss` 中定义了完整的 CSS 变量系统，支持 Light/Dark 主题切换。所有样式中的颜色**必须**使用这些变量，**禁止硬编码颜色值**。

**⚠️ Figma 设计稿还原例外**: 当还原 Figma 设计稿时，如果设计稿中明确标注了颜色和尺寸数值，**优先使用 Figma 标注的数值**。只有在 Figma 没有明确标注时，才使用 CSS 变量。

#### 文本颜色变量
```scss
.component {
  // ✅ 正确：使用 CSS 变量
  color: var(--color-text);               // 主文本 #323233
  color: var(--color-text-secondary);     // 次要文本 #969799
  color: var(--color-text-placeholder);   // 占位符 #c8c9cc
  color: var(--color-text-disabled);      // 禁用文本 #c8c9cc
  color: var(--color-text-inverse);       // 反色文本 #fff
  color: var(--color-text-link);          // 链接文本

  // ❌ 错误：硬编码颜色
  color: #333;
  color: #323233;
}
```

#### 背景颜色变量
```scss
.component {
  // ✅ 正确：使用 CSS 变量
  background: var(--color-bg);            // 背景色 #fff
  background: var(--color-bg-grey);       // 灰色背景 #f7f8fa
  background: var(--color-bg-hover);      // 悬浮背景 #f2f3f5
  background: var(--color-bg-active);     // 激活背景 #ededed
  background: var(--color-bg-mask);       // 遮罩背景 rgba(0 0 0 / 0.7)
  background: var(--color-bg-card);       // 卡片背景 #fff
  background: var(--color-bg-input);      // 输入框背景 #f7f8fa

  // ❌ 错误：硬编码颜色
  background: #fff;
  background: #f7f8fa;
}
```

#### 边框颜色变量
```scss
.component {
  // ✅ 正确：使用 CSS 变量 (注意使用 rpx 单位)
  border: 1rpx solid var(--color-border);        // 默认边框 #ebedf0
  border: 1rpx solid var(--color-border-light);  // 浅色边框 #f7f8fa
  border: 1rpx solid var(--color-border-dark);   // 深色边框 #dcdee0

  // ❌ 错误：硬编码颜色
  border: 1rpx solid #e0e0e0;
}
```

#### 主题色变量
```scss
.component {
  // ✅ 正确：使用 CSS 变量
  background: var(--color-primary);         // 主色 #1989fa
  background: var(--color-primary-light);   // 主色浅 #66b1ff
  background: var(--color-primary-dark);    // 主色深 #1677ff
  background: var(--color-primary-bg);      // 主色背景 rgba(25 137 250 / 0.1)

  // ❌ 错误：硬编码主题色
  background: #1989fa;
}
```

#### 状态颜色变量
```scss
.component {
  // ✅ 正确：使用 CSS 变量
  color: var(--color-success);            // 成功色 #07c160
  color: var(--color-warning);            // 警告色 #ff976a
  color: var(--color-error);              // 错误色 #ee0a24
  color: var(--color-info);               // 信息色 #909399

  // 带背景的状态色
  background: var(--color-success-bg);    // 成功背景
  background: var(--color-warning-bg);    // 警告背景
  background: var(--color-error-bg);      // 错误背景
  background: var(--color-info-bg);       // 信息背景

  // ❌ 错误：硬编码状态颜色
  color: #07c160;  // 应该使用 var(--color-success)
  color: #ee0a24;  // 应该使用 var(--color-error)
}
```

#### 阴影变量
```scss
.component {
  // ✅ 正确：使用 CSS 变量
  box-shadow: var(--shadow-sm);     // 小阴影
  box-shadow: var(--shadow-base);   // 基础阴影
  box-shadow: var(--shadow-lg);     // 大阴影
  box-shadow: var(--shadow-xl);     // 特大阴影
  box-shadow: var(--shadow-light);  // 轻阴影

  // ❌ 错误：硬编码阴影
  box-shadow: 0 2rpx 8rpx rgba(0 0 0 / 0.08);
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
  font-size: 48rpx;
  color: var(--color-text);
}

h2 {
  font-size: 40rpx;
}

p {
  color: var(--color-text);
}

div {
  padding: 40rpx;
}

// ✅ 正确：为每个元素添加 class
.page-title {
  font-size: 48rpx;
  color: var(--color-text);
}

.section-title {
  font-size: 40rpx;
  color: var(--color-text);
}

.text-content {
  color: var(--color-text);
}

.content-wrapper {
  padding: 40rpx;
}
```

### BEM 命名规范

推荐使用 BEM (Block-Element-Modifier) 命名规范:

```scss
// ✅ 正确：BEM 命名
.user-card {
  // Block
  padding: 40rpx;
  border: 2rpx solid var(--color-border);

  &__header {
    // Element
    display: flex;
    justify-content: space-between;
  }

  &__title {
    // Element
    font-size: 36rpx;
    color: var(--color-text);
  }

  &__content {
    // Element
    margin-top: 32rpx;
  }

  &--large {
    // Modifier
    padding: 64rpx;
  }

  &--highlighted {
    // Modifier
    border-color: var(--color-primary);
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
    const response = await getCurrentUser();
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
  const response = await getCurrentUser();
  userInfo.value = response;
};
```

### Store Actions 错误处理

```typescript
// ✅ 正确：Store Action 错误处理
const loginAction = async (credentials: AuthPhoneLoginDto): Promise<void> => {
  loading.value = true;

  try {
    const response = await loginWithPhone(credentials);
    token.value = response.token;
    userInfo.value = response.user;

    // 持久化存储
    uni.setStorageSync('token', token.value);
  } catch (error) {
    console.error('登录失败:', error);
    throw error;  // 重新抛出,让调用方处理
  } finally {
    loading.value = false;
  }
};

// ❌ 错误：吞掉错误
const loginAction = async (credentials: AuthPhoneLoginDto) => {
  try {
    const response = await loginWithPhone(credentials);
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
- [ ] 组件内异步加载使用 `USkeleton`
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
