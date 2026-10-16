---
name: component-development
description: Uni-app 组件开发指导，包括组件设计原则、开发模式、最佳实践，区分基础组件和业务组件的开发规范
tools: Read, Grep, Glob, WebFetch, WebSearch
model: inherit
---

# Uni-app 组件开发规范

## 职责
专门负责 Uni-app 组件开发指导，包括组件设计原则、开发模式、最佳实践，区分基础组件和业务组件的开发规范。

> **通用规范参考**: 本文档中使用的通用开发模式详见 [common-patterns.md](common-patterns.md)，包括:
> - [Props/Emits 定义规范](common-patterns.md#props-定义规范)
> - [数据驱动模式](common-patterns.md#数据驱动模式)
> - [CSS 变量使用规范](common-patterns.md#css-变量使用规范)
> - [CSS 盒模型规范](common-patterns.md#css-盒模型规范) - **重要**
> - [样式选择器规范](common-patterns.md#样式选择器规范)
> - [错误处理模式](common-patterns.md#错误处理模式)

## Uni-app 组件核心概念

### 1. 元素标签映射

Uni-app 使用小程序风格的标签，而非 HTML 标签：

| HTML 标签 | Uni-app 标签 | 说明 |
|-----------|-------------|------|
| `<div>` | `<view>` | 通用容器 |
| `<span>` | `<text>` | 文本容器 |
| `<img>` | `<image>` | 图片元素 |
| `<a>` | `<navigator>` | 导航链接 |
| `<input>` | `<input>` | 输入框（属性不同） |
| `<textarea>` | `<textarea>` | 多行输入 |
| `<button>` | `<button>` | 按钮 |
| `<select>` | `<picker>` | 选择器 |
| `<ul>/<li>` | `<view>` + `v-for` | 列表 |
| `<iframe>` | `<web-view>` | 网页容器 |

### 2. easycom 自动导入

项目配置了 easycom，符合规范的组件会自动导入，无需手动 import：

```typescript
// pages.config.ts 中的 easycom 配置（生成到 src/pages.json）
easycom: {
  autoscan: true,
  custom: {
    '^uni-(.*)': '@dcloudio/uni-ui/lib/uni-$1/uni-$1.vue',
    '^U(.*)': '@/components/U$1/index.vue',
    '^AuthLayout$': '@/components/AuthLayout/index.vue',
  },
},
```

自定义组件使用 PascalCase 标签（如 `<UNavBar />`），不支持 `<u-nav-bar>` 这类 kebab 写法。

**使用方式**：
```vue
<template>
  <!-- uni-ui 组件自动导入 -->
  <uni-icons type="home" size="24" />
  <uni-badge text="99+" />

  <!-- 自定义 U 前缀组件自动导入 -->
  <UNavBar title="页面标题" />
  <ULoading :visible="loading" />
  <USkeleton :loading="loading" />
</template>

<script setup lang="ts">
// 无需手动 import 组件！
</script>
```

### 3. 尺寸单位规范

**必须使用 rpx 单位**，基于 750rpx 设计稿：

```scss
// ✅ 正确：使用 rpx 单位
.container {
  width: 750rpx;           // 全屏宽度
  padding: 32rpx;          // 内边距
  font-size: 28rpx;        // 字体大小
  border-radius: 16rpx;    // 圆角
}

.button {
  width: 200rpx;
  height: 88rpx;
  line-height: 88rpx;
}

// ❌ 错误：使用 px 单位
.container {
  width: 375px;            // 禁止！
  padding: 16px;           // 禁止！
}
```

**换算公式**：`rpx = 设计稿px × 2`（基于 375px 设计稿）

---

## 组件设计原则

### 1. 单一职责原则
- **功能聚焦**: 每个组件只负责一个明确的功能
- **职责清晰**: 组件的作用和边界要明确定义
- **可测试性**: 单一职责使组件更容易测试

### 2. 可复用性原则
- **通用设计**: 基础组件应该具有通用性，避免业务耦合
- **配置灵活**: 通过 Props 提供灵活的配置选项
- **插槽支持**: 使用插槽提供内容定制能力

### 3. 组合优于继承
- **组合模式**: 通过组合小组件构建复杂功能
- **Composables 复用**: 使用 Composition API 实现逻辑复用

---

## 组件分类体系

### 基础组件 (Base Components)
- **位置**: `src/components/`
- **特点**: 纯 UI 组件，无业务逻辑，高度可复用
- **命名**: 使用 `U` 前缀，如 `UNavBar`、`ULoading`、`UEmpty`
- **导入**: 通过 easycom 自动导入

**现有基础组件**：
| 组件 | 说明 |
|------|------|
| `UNavBar` | 导航栏 |
| `ULoading` | 加载指示器 |
| `UEmpty` | 空状态 |
| `USkeleton` | 骨架屏 |
| `UImage` | 图片（支持懒加载） |
| `UImageUpload` | 图片上传 |
| `UTabs` | 标签页 |
| `UBanner` | 轮播图 |
| `UPopup` | 弹出层 |
| `UActionSheet` | 动作面板 |
| `UNoticeBar` | 通知栏 |
| `UMenuItem` | 菜单项 |
| `UMenuGroup` | 菜单组 |
| `UFormItem` | 表单项 |
| `UButton` | 按钮 |
| `UCard` | 卡片容器 |
| `UList` | 分页列表状态 |
| `UFixedButton` | 固定按钮 |
| `URichText` | 富文本 |
| `USmsInput` | 短信验证码输入 |
| `UPasswordStrength` | 密码强度 |
| `ULoadMore` | 加载更多 |
| `USearchBar` | 搜索栏 |
| `UTag` | 标签 |
| `UAgreementCheck` | 协议勾选 |
| `UPrivacyPopup` | 微信隐私授权弹窗 |
| `UPrice` | 金额展示 |
| `UDivider` | 分割线 |
| `USticky` | 吸顶容器 |
| `UBackTop` | 回到顶部 |

另有布局组件 `AuthLayout`（认证页面布局），同样通过 easycom 自动导入。

### 页面级组件 (Page-specific Components)
- **位置**: `src/pages/[page]/components/` 或 `src/pages-sub/[module]/[page]/components/`
- **特点**: 特定页面的专属组件，包含特定业务逻辑
- **命名**: 业务功能描述，如 `LoginForm`、`OrderCard`
- **导入**: 需要手动 import（不符合 easycom 规则）

### 页面组件 (Page Components)
- **位置**: `src/pages/` (主包) 或 `src/pages-sub/` (分包)
- **特点**: 完整的页面实现，路由对应的组件
- **配置**: 在页面中使用 `definePage({...})` 宏声明页面配置，由 `@uni-helper/vite-plugin-uni-pages` 自动生成 `src/pages.json`

---

## 视觉规范

### 1. 颜色使用 CSS 变量

所有颜色必须使用 `src/styles/theme.scss` 中定义的 CSS 变量：

```scss
// ✅ 正确：使用 CSS 变量
.container {
  color: var(--color-text);              // #323233
  background: var(--color-bg-grey);      // #f7f8fa
  border: 1rpx solid var(--color-border); // #ebedf0
}

.title {
  color: var(--color-text);              // 主文本
}

.subtitle {
  color: var(--color-text-secondary);    // 次要文本 #969799
}

.hint {
  color: var(--color-text-placeholder);  // 占位符 #c8c9cc
}

.link {
  color: var(--color-primary);           // 主题色 #1989fa
}

.error {
  color: var(--color-error);             // 错误色 #ee0a24
}

// ❌ 错误：硬编码颜色
.container {
  color: #323233;           // 禁止！
  background: #f7f8fa;      // 禁止！
}
```

### 2. 盒模型规范

- **Figma 尺寸包含 padding**: Figma 中标注的 width/height 是整体尺寸
- **必须使用 border-box**: 同时设置 width/height 和 padding 时必须声明
- **直接使用 Figma 值**: 不要手动计算内容区尺寸

```scss
// ✅ 正确
.card {
  box-sizing: border-box;
  width: 690rpx;
  height: 200rpx;
  padding: 32rpx;
}
```

### 3. 字体规范

```scss
// 默认字体（已全局配置）
// font-family: 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif;

// 常用字体大小
.text-xs { font-size: 20rpx; }   // 极小
.text-sm { font-size: 24rpx; }   // 小
.text-base { font-size: 28rpx; } // 默认
.text-lg { font-size: 32rpx; }   // 大
.text-xl { font-size: 36rpx; }   // 特大
```

---

## 图标和图片使用规范

### 1. uni-icons 图标

优先使用 uni-ui 内置图标：

```vue
<template>
  <!-- uni-icons 图标 -->
  <uni-icons type="home" size="24" color="#333" />
  <uni-icons type="search" size="20" />
  <uni-icons type="cart" size="28" color="var(--color-primary)" />
</template>
```

### 2. 自定义 SVG 图标

当 uni-icons 不满足需求时，使用 `<image>` 标签引用 SVG 文件：

```vue
<template>
  <!-- ✅ 正确：使用 image 标签 -->
  <image
    src="@/static/icons/[project]/icon-name.svg"
    class="icon"
    mode="aspectFit"
  />
</template>

<style lang="scss" scoped>
.icon {
  width: 48rpx;
  height: 48rpx;
}
</style>
```

**禁止内联 SVG**：
```vue
<!-- ❌ 错误：内联 SVG -->
<svg><path d="M..." /></svg>
<view v-html="svgContent"></view>
```

### 3. 图片资源规范

```
src/static/
├── icons/[project-name]/    # SVG 图标（kebab-case 命名）
│   ├── icon-home.svg
│   └── icon-user.svg
└── images/[project-name]/   # PNG/JPG 图片（kebab-case 命名）
    ├── banner-home.png
    └── avatar-default.png
```

**图片使用**：
```vue
<template>
  <!-- 使用 UImage 组件（支持懒加载） -->
  <UImage
    src="@/static/images/home/banner.png"
    width="750rpx"
    height="300rpx"
    mode="aspectFill"
  />

  <!-- 或使用原生 image -->
  <image
    src="@/static/images/home/banner.png"
    mode="aspectFill"
    lazy-load
  />
</template>
```

---

## 骨架屏组件

### USkeleton 组件使用

```vue
<template>
  <view class="page">
    <!-- 骨架屏 -->
    <USkeleton v-if="loading" type="list" :rows="5" />

    <!-- 实际内容 -->
    <view v-else class="content">
      <!-- ... -->
    </view>
  </view>
</template>

<script setup lang="ts">
const loading = ref(true);

onLoad(async () => {
  await fetchData();
  loading.value = false;
});
</script>
```

### USkeleton Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `loading` | `boolean` | `true` | 是否显示骨架屏 |
| `type` | `'card' \| 'list' \| 'form' \| 'detail'` | `'list'` | 预设类型 |
| `rows` | `number` | `3` | 行数 |
| `avatar` | `boolean` | `false` | 是否显示头像 |
| `title` | `boolean` | `true` | 是否显示标题 |
| `animate` | `boolean` | `true` | 是否开启动画 |

---

## 组件层级开发规范

### 复杂组件的开发顺序

当需要开发包含复杂交互的业务组件时，必须遵循以下开发顺序：

#### 步骤 1: 分析组件需求，识别基础能力
```
问题: 需要开发"订单卡片"组件
分析:
- 基础能力: 卡片展示、状态显示
- 业务能力: 订单数据展示、操作按钮
结论: 基于 UCard 开发 OrderCard
```

#### 步骤 2: 基于基础组件开发页面级组件
```vue
<!-- src/pages-sub/order/list/components/OrderCard.vue -->
<template>
  <view class="order-card">
    <view class="order-header">
      <text class="order-no">订单号: {{ order.orderNo }}</text>
      <text class="order-status">{{ statusText }}</text>
    </view>
    <view class="order-content">
      <!-- 订单商品列表 -->
    </view>
    <view class="order-footer">
      <text class="order-amount">¥{{ order.amount }}</text>
      <button class="order-btn" @click="handleAction">
        {{ actionText }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
interface OrderCardProps {
  order: Order;
}

const props = defineProps<OrderCardProps>();
const emit = defineEmits<{
  action: [order: Order];
}>();
</script>
```

#### 步骤 3: 在页面中使用业务组件
```vue
<!-- src/pages-sub/order/list/index.vue -->
<template>
  <view class="order-list-page">
    <OrderCard
      v-for="order in orders"
      :key="order.id"
      :order="order"
      @action="handleOrderAction"
    />
  </view>
</template>

<script setup lang="ts">
import OrderCard from './components/OrderCard.vue';
</script>
```

### 组件层级关系图
```
页面组件 (Page)
    ↓ 使用
业务组件 (Business)
    ↓ 基于
基础组件 (Base/U前缀)
```

---

## 组件开发最佳实践

### 1. Props 定义规范

```typescript
// ✅ 正确：完整的类型定义
interface UserCardProps {
  /** 用户信息 */
  user: User;
  /** 是否显示操作按钮 */
  showAction?: boolean;
  /** 卡片尺寸 */
  size?: 'small' | 'medium' | 'large';
}

const props = withDefaults(defineProps<UserCardProps>(), {
  showAction: true,
  size: 'medium',
});
```

### 2. Emits 定义规范

```typescript
// ✅ 正确：类型化的 emits
const emit = defineEmits<{
  /** 点击事件 */
  click: [user: User];
  /** 关注事件 */
  follow: [userId: string];
  /** 更新事件 */
  'update:modelValue': [value: string];
}>();
```

### 3. 数据驱动原则

```vue
<template>
  <!-- ✅ 正确：数据驱动 -->
  <view class="menu-list">
    <view
      v-for="item in menuItems"
      :key="item.id"
      class="menu-item"
      @click="handleClick(item)"
    >
      <uni-icons :type="item.icon" size="24" />
      <text>{{ item.label }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
interface MenuItem {
  id: string;
  icon: string;
  label: string;
  path: string;
}

const props = defineProps<{
  menuItems: MenuItem[];
}>();
</script>

<!-- ❌ 错误：硬编码 -->
<template>
  <view class="menu-list">
    <view class="menu-item">
      <uni-icons type="home" />
      <text>首页</text>
    </view>
    <view class="menu-item">
      <uni-icons type="person" />
      <text>我的</text>
    </view>
  </view>
</template>
```

### 4. 避免冗余 DOM 结构

```vue
<!-- ✅ 正确：简洁的 DOM 结构 -->
<template>
  <view class="user-card">
    <image :src="user.avatar" class="avatar" />
    <text class="name">{{ user.name }}</text>
  </view>
</template>

<!-- ❌ 错误：冗余的 DOM 层级 -->
<template>
  <view class="user-card-container">
    <view class="user-card-wrapper">
      <view class="user-card-inner">
        <view class="avatar-wrapper">
          <image :src="user.avatar" class="avatar" />
        </view>
        <view class="name-wrapper">
          <text class="name">{{ user.name }}</text>
        </view>
      </view>
    </view>
  </view>
</template>
```

### 5. 样式规范

```scss
// ✅ 正确：简洁的样式
.user-card {
  display: flex;
  align-items: center;
  padding: 24rpx 32rpx;
  background: var(--color-bg-card);
  border-radius: 16rpx;

  .avatar {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    margin-right: 24rpx;
  }

  .name {
    font-size: 28rpx;
    color: var(--color-text);
  }
}

// ❌ 错误：过度嵌套
.user-card-container {
  .user-card-wrapper {
    .user-card-inner {
      .avatar-wrapper {
        .avatar {
          // ...
        }
      }
    }
  }
}
```

---

## 平台兼容性

### 条件编译

当需要处理平台差异时，使用条件编译：

```vue
<template>
  <!-- #ifdef MP-WEIXIN -->
  <button open-type="share">分享</button>
  <!-- #endif -->

  <!-- #ifdef H5 -->
  <button @click="shareToH5">分享</button>
  <!-- #endif -->
</template>

<script setup lang="ts">
// #ifdef MP-WEIXIN
const onShareAppMessage = () => ({
  title: '分享标题',
  path: '/pages/index/index',
});
// #endif
</script>

<style lang="scss" scoped>
/* #ifdef MP-WEIXIN */
.weixin-only {
  /* 微信小程序专属样式 */
}
/* #endif */
</style>
```

### 常用平台标识

| 标识 | 平台 |
|------|------|
| `H5` | H5 网页 |
| `MP-WEIXIN` | 微信小程序 |
| `MP-ALIPAY` | 支付宝小程序 |
| `APP-PLUS` | App (iOS/Android) |
| `APP-ANDROID` | Android App |
| `APP-IOS` | iOS App |

---

## 组件开发检查清单

### 基础检查
- [ ] 使用 `<view>` 代替 `<div>`
- [ ] 使用 `<text>` 代替 `<span>`
- [ ] 使用 `<image>` 代替 `<img>`
- [ ] 使用 rpx 单位
- [ ] 使用 CSS 变量定义颜色
- [ ] Props 有完整的 TypeScript 类型定义
- [ ] Emits 有完整的类型定义

### 样式检查
- [ ] 所有颜色使用 `var(--color-xxx)` 变量
- [ ] 使用 rpx 单位（非 px）
- [ ] 避免样式嵌套超过 3 层
- [ ] 使用 scoped 样式避免污染

### 结构检查
- [ ] 避免 DOM 嵌套超过 3 层
- [ ] 每个元素都有明确的作用
- [ ] 使用 Flex/Grid 替代不必要的包装层
- [ ] 删除无意义的包装元素

### 图标图片检查
- [ ] 优先使用 uni-icons
- [ ] 自定义图标使用 `<image>` 标签
- [ ] 禁止内联 SVG
- [ ] 图片使用 lazy-load 属性

### 平台兼容检查
- [ ] 检查是否有平台特定代码
- [ ] 使用条件编译处理平台差异
- [ ] 测试主要目标平台（H5、微信小程序）

---

## 组件质量标准

| 指标 | 标准 |
|------|------|
| DOM 层级 | ≤ 3 层嵌套 |
| 样式嵌套 | ≤ 3 层 |
| 组件文件大小 | ≤ 300 行 |
| Props 数量 | ≤ 10 个 |
| 设计稿还原度 | ≥ 95% |

---

## 常见问题

### Q: 全局公用组件和页面级组件如何区分？
**A**:
- **全局公用组件 (U前缀)**: 不包含业务逻辑，可在多个页面复用，放在 `src/components/`，通过 easycom 自动导入
- **页面级组件**: 特定页面的专属组件，包含业务逻辑，放在 `src/pages[-sub]/[page]/components/`，需手动 import

### Q: 什么时候应该拆分组件？
**A**: 符合以下条件之一就应该拆分：
- 组件代码超过 200 行
- 组件职责超过一个
- 有独立的业务逻辑
- 需要在多处复用

### Q: 如何处理 H5 和小程序的样式差异？
**A**: 使用条件编译处理平台差异：
```scss
/* #ifdef H5 */
.h5-only { /* H5 专属样式 */ }
/* #endif */

/* #ifdef MP-WEIXIN */
.mp-only { /* 小程序专属样式 */ }
/* #endif */
```
