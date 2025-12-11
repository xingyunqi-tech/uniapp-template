---
name: project-structure
description: Uni-app 项目目录结构分析、文件组织规范和架构设计指导
---

# Uni-app 项目结构解析

## 职责
负责 Uni-app 项目目录结构分析、文件组织规范和架构设计指导，帮助 AI 理解项目布局和各目录的作用。

## 技术栈

- **框架**: Uni-app 3.x + Vue 3 (Composition API)
- **构建**: Vite
- **语言**: TypeScript
- **状态**: Pinia (持久化)
- **路由**: pages.json + useRouter composable
- **UI**: uni-ui + 自定义 U 前缀组件
- **HTTP**: Alova + Orval
- **样式**: SCSS + CSS 变量

## 目录结构详解

```
uniapp-template/
├── .claude/                    # Claude AI 配置和文档
│   ├── agents/                 # AI Agent 配置文件
│   ├── commands/               # 快捷命令
│   ├── skills/                 # 技能模板
│   └── settings.json           # Claude 设置
├── src/                        # 源代码目录
│   ├── api/                    # API 接口层
│   │   ├── core/               # HTTP 客户端核心
│   │   ├── generated/          # Orval 自动生成（禁止修改）
│   │   ├── custom/             # 自定义扩展
│   │   └── index.ts            # 统一导出
│   ├── assets/                 # 静态资源
│   │   ├── icons/              # SVG 图标
│   │   └── images/             # 图片资源
│   ├── components/             # 全局公用组件（U 前缀）
│   │   ├── UNavBar/            # 导航栏
│   │   ├── ULoading/           # 加载指示器
│   │   ├── UEmpty/             # 空状态
│   │   ├── USkeleton/          # 骨架屏
│   │   └── ...                 # 其他组件
│   ├── composables/            # 组合式函数
│   │   ├── useRouter.ts        # 路由导航
│   │   ├── useLoading.ts       # 加载状态
│   │   └── ...                 # 其他 composables
│   ├── constants/              # 常量定义
│   │   ├── pages.ts            # 页面路径常量
│   │   ├── permission.ts       # 权限常量
│   │   └── system.ts           # 系统常量
│   ├── interface/              # TypeScript 接口定义
│   ├── pages/                  # 主包页面
│   │   ├── index/              # 首页 (TabBar)
│   │   ├── mine/               # 我的 (TabBar)
│   │   ├── login/              # 登录
│   │   └── ...                 # 其他页面
│   ├── pages-sub/              # 分包页面
│   │   ├── order/              # 订单分包
│   │   ├── user/               # 用户分包
│   │   └── other/              # 其他分包
│   ├── store/                  # Pinia 状态管理
│   │   ├── modules/            # Store 模块
│   │   └── plugins/            # Store 插件
│   ├── styles/                 # 全局样式
│   │   ├── theme.scss          # 主题变量
│   │   └── index.scss          # 全局样式
│   ├── utils/                  # 工具函数
│   ├── App.vue                 # 根组件
│   ├── main.ts                 # 应用入口
│   ├── pages.json              # 页面路由配置
│   ├── manifest.json           # 应用配置
├── typings/                    # TypeScript 类型声明
├── package.json                # 项目配置
└── vite.config.ts              # Vite 配置
```

## 核心目录详解

### `src/pages/` - 主包页面

主包页面直接加载，包含 TabBar 页面和高频页面：

```
src/pages/
├── index/                  # 首页 (TabBar)
│   └── index.vue
├── mine/                   # 我的 (TabBar)
│   └── index.vue
├── login/                  # 登录
│   └── index.vue
├── register/               # 注册
│   └── index.vue
├── forgot-password/        # 忘记密码
│   └── index.vue
├── error/                  # 错误页
│   └── index.vue
└── agreement/              # 协议
    └── index.vue
```

**注意**：主包不宜过大，影响小程序启动速度。

### `src/pages-sub/` - 分包页面

分包用于优化小程序加载性能，按业务模块划分：

```
src/pages-sub/
├── order/                  # 订单分包
│   └── list/               # 订单列表
│       └── index.vue
├── user/                   # 用户分包
│   ├── address/            # 地址管理
│   ├── address-edit/       # 编辑地址
│   ├── profile/            # 编辑资料
│   ├── password/           # 修改密码
│   ├── settings/           # 设置
│   └── favorite/           # 收藏
└── other/                  # 其他分包
    ├── about/              # 关于我们
    ├── contact/            # 联系客服
    ├── feedback/           # 意见反馈
    └── webview/            # 网页容器
```

### `src/components/` - 全局组件

使用 `U` 前缀，通过 easycom 自动导入：

```
src/components/
├── UNavBar/                # 导航栏
│   └── index.vue
├── ULoading/               # 加载指示器
│   └── index.vue
├── UEmpty/                 # 空状态
│   └── index.vue
├── USkeleton/              # 骨架屏
│   └── index.vue
├── UImage/                 # 图片组件
│   └── index.vue
├── UImageUpload/           # 图片上传
│   └── index.vue
├── UTabs/                  # 标签页
│   └── index.vue
├── UBanner/                # 轮播图
│   └── index.vue
├── UPopup/                 # 弹出层
│   └── index.vue
├── UActionSheet/           # 动作面板
│   └── index.vue
├── UNoticeBar/             # 通知栏
│   └── index.vue
├── UMenuItem/              # 菜单项
│   └── index.vue
├── UMenuGroup/             # 菜单组
│   └── index.vue
├── UFormItem/              # 表单项
│   └── index.vue
├── UFixedButton/           # 固定按钮
│   └── index.vue
├── URichText/              # 富文本
│   └── index.vue
├── USmsInput/              # 短信验证码
│   └── index.vue
└── UPasswordStrength/      # 密码强度
    └── index.vue
```

**使用方式**：
```vue
<template>
  <!-- 无需 import，easycom 自动导入 -->
  <UNavBar title="页面标题" />
  <ULoading :visible="loading" />
</template>
```

### `src/composables/` - 组合式函数

封装可复用的业务逻辑：

| Composable | 说明 |
|------------|------|
| `useRouter` | 路由导航封装 |
| `useLoading` | 加载状态管理 |
| `useForm` | 表单处理 |
| `useList` | 列表加载（分页、刷新） |
| `useSendSms` | 发送短信验证码 |
| `useAsyncAction` | 异步操作封装 |
| `useDebounce` | 防抖 |
| `useThrottle` | 节流 |
| `useClipboard` | 剪贴板 |
| `useLocation` | 位置服务 |
| `useScanCode` | 扫码 |
| `useShare` | 分享 |
| `usePermission` | 权限检查 |
| `usePasswordStrength` | 密码强度 |

### `src/api/` - API 接口层

基于 Orval 自动生成：

```
src/api/
├── core/                   # HTTP 客户端核心
│   └── request.ts          # Alova 实例封装
├── generated/              # Orval 自动生成（🚫 禁止修改）
│   ├── auth/               # 认证模块
│   └── model/              # 类型定义
├── custom/                 # 自定义扩展
│   └── upload.ts           # 文件上传等
└── index.ts                # 统一导出
```

**核心原则**：
- 🚫 **绝不修改** `generated/` 目录
- ✅ 从 `@/api` 统一导入
- ✅ 扩展在 `custom/` 目录

### `src/store/` - 状态管理

```
src/store/
├── index.ts                # Store 入口
├── modules/                # Store 模块
│   ├── user.ts             # 用户状态
│   └── global.ts           # 全局状态
└── plugins/                # Store 插件
    └── persist.ts          # 持久化配置
```

### `src/constants/` - 常量定义

```
src/constants/
├── pages.ts                # 页面路径常量
├── permission.ts           # 权限角色常量
├── system.ts               # 系统配置常量
└── index.ts                # 统一导出
```

**页面路径常量示例**：
```typescript
export const PAGES = {
  HOME: '/pages/index/index',
  MINE: '/pages/mine/index',
  LOGIN: '/pages/login/index',
  ORDER: '/pages-sub/order/list/index',
  // ...
} as const;

export const WHITE_LIST = [
  PAGES.LOGIN,
  PAGES.REGISTER,
  PAGES.HOME,
  // ...
] as const;
```

### `src/styles/` - 全局样式

```
src/styles/
├── theme.scss              # 主题变量（颜色、间距）
└── index.scss              # 全局样式
```

**主题变量示例**：
```scss
// src/styles/theme.scss
:root {
  // 主题色
  --color-primary: #1989fa;
  --color-success: #07c160;
  --color-warning: #ff976a;
  --color-danger: #ee0a24;

  // 文本色
  --color-text: #323233;
  --color-text-secondary: #969799;
  --color-text-placeholder: #c8c9cc;

  // 背景色
  --color-bg-grey: #f7f8fa;
  --color-white: #ffffff;

  // 边框色
  --color-border: #ebedf0;
}
```

## 文件引用规范

### 导入路径规范

```typescript
// ✅ 正确：使用路径别名
import { useRouter } from '@/composables';
import { PAGES } from '@/constants';
import { useUserStore } from '@/store/modules/user';
import { postAuthLogin } from '@/api';

// ❌ 错误：相对路径过长
import { useRouter } from '../../../composables';
```

### 组件引用规范

```typescript
// ✅ 正确：全局组件无需 import（easycom）
<template>
  <UNavBar title="标题" />
</template>

// ✅ 正确：页面级组件手动 import
<script setup lang="ts">
import OrderCard from './components/OrderCard.vue';
</script>
```

## 目录创建指导

### 新增主包页面

```bash
# 1. 创建页面目录
mkdir src/pages/new-page

# 2. 创建页面文件
touch src/pages/new-page/index.vue

# 3. 在 pages.json 中注册
# {
#   "path": "pages/new-page/index",
#   "style": { "navigationBarTitleText": "新页面" }
# }

# 4. 在 constants/pages.ts 添加常量
# NEW_PAGE: '/pages/new-page/index',
```

### 新增分包页面

```bash
# 1. 创建分包页面目录
mkdir -p src/pages-sub/[module]/new-page

# 2. 创建页面文件
touch src/pages-sub/[module]/new-page/index.vue

# 3. 在 pages.json 的 subPackages 中注册
# {
#   "root": "pages-sub/[module]",
#   "pages": [
#     { "path": "new-page/index", "style": {...} }
#   ]
# }
```

### 新增全局组件

```bash
# 1. 创建组件目录（U 前缀）
mkdir src/components/UNewComponent

# 2. 创建组件文件
touch src/components/UNewComponent/index.vue

# 3. 无需注册，easycom 自动导入
# 在模板中直接使用 <UNewComponent />
```

### 新增 Composable

```bash
# 1. 创建文件（use 前缀）
touch src/composables/useNewFeature.ts

# 2. 在 src/composables/index.ts 导出
# export * from './useNewFeature';
```

## AI 编程指导原则

### 1. 目录选择原则

| 类型 | 目录 |
|------|------|
| 主包页面 | `src/pages/` |
| 分包页面 | `src/pages-sub/[module]/` |
| 全局组件 | `src/components/` (U 前缀) |
| 页面级组件 | `src/pages[-sub]/[page]/components/` |
| Composables | `src/composables/` |
| 工具函数 | `src/utils/` |
| 常量定义 | `src/constants/` |
| 类型定义 | `src/interface/` |
| Store | `src/store/modules/` |
| API 扩展 | `src/api/custom/` |

### 2. 文件命名原则

| 类型 | 命名规范 | 示例 |
|------|---------|------|
| 页面目录 | kebab-case | `forgot-password/` |
| 组件目录 | PascalCase + U前缀 | `UNavBar/` |
| 组件文件 | index.vue | `index.vue` |
| Composable | camelCase + use前缀 | `useRouter.ts` |
| 工具函数 | camelCase | `storage.ts` |
| 常量文件 | camelCase | `pages.ts` |

### 3. 代码组织原则

- **单一职责**: 每个文件只负责一个功能
- **模块化**: 按业务功能组织代码
- **类型安全**: 所有代码都要有类型定义
- **平台兼容**: 使用条件编译处理平台差异

### 4. 引用关系原则

- **向上引用**: 可以引用上层或同层模块
- **禁止循环引用**: 避免模块间循环依赖
- **页面隔离**: 页面间不能直接引用组件
- **组件复用**: 全局组件可被任意引用

## 平台兼容性

### 主要目标平台

| 平台 | 编译命令 | 说明 |
|------|---------|------|
| H5 | `pnpm build:h5` | 网页版 |
| 微信小程序 | `pnpm build:mp-weixin` | 主要平台 |
| 支付宝小程序 | `pnpm build:mp-alipay` | 次要平台 |

### 条件编译

```typescript
// #ifdef MP-WEIXIN
// 微信小程序专属代码
// #endif

// #ifdef H5
// H5 专属代码
// #endif
```

通过遵循这些目录结构和组织原则，可以确保 Uni-app 项目的可维护性和可扩展性。
