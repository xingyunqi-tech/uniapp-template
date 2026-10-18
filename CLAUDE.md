<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

> 本文档专为 AI 助手设计，提供 Uni-app 项目快速概览和文档导航。人类开发者请查看 [README.md](README.md)

## Git 提交规则

- **提交格式**: `type: subject` 或 `type(scope): subject`
- **语言**: commit subject 推荐使用中文
- **示例**: `feat: 添加用户登录功能` 或 `fix(auth): 修复登录验证问题`
- **AI 标识**: 提交代码时不要添加 Co-Authored-By 签名，改为在 commit 末尾添加：🤖 Generated with AI

---

## 3 分钟项目速读

### 项目定位

**Uni-app 多端应用模板** - 支持 H5、微信小程序、支付宝小程序、App 等多平台。强调**类型安全**、**自动化**和**开发规范**。

### 核心技术栈

| 分类 | 技术 | 说明 |
|------|------|------|
| **框架** | Uni-app 3.x + Vue 3 | Composition API + `<script setup>` |
| **语言** | TypeScript | 严格类型检查 |
| **构建** | Vite + @dcloudio/vite-plugin-uni | 多平台构建 |
| **状态** | Pinia | Composition API 风格 + 持久化 |
| **路由** | pages.json | 由 `definePage` + `pages.config.ts` 生成 (非 Vue Router) |
| **UI** | @dcloudio/uni-ui | 官方 UI 组件库 |
| **HTTP** | Alova | 轻量级请求策略库 |
| **API** | Orval | OpenAPI → 自动生成类型安全的 API |
| **测试** | Vitest | 覆盖率阈值 70/68/67/70（语句/分支/函数/行） |
| **国际化** | vue-i18n | 多语言支持 |

### 核心特性

1. **多端支持** - H5 / 微信小程序 / 支付宝小程序 / App
2. **Orval 驱动的 API 层** - OpenAPI → 自动生成类型安全的 API
3. **分包优化** - `pages/` 主包 + `pages-sub/` 分包，优化小程序体积
4. **easycom 自动注册** - 组件无需手动导入
5. **主题系统** - CSS 变量支持 Light/Dark 主题切换
6. **自定义组件库** - `U` 前缀通用组件 + `AuthLayout`，完整列表见下方「组件系统」

---

## 核心架构决策

### 1. 路由系统 (pages.json) ⭐⭐⭐

**与 Vue Router 的核心区别** - 使用 `pages.json` 配置路由，而非 Vue Router

`src/pages.json` 由 `@uni-helper/vite-plugin-uni-pages` 生成，不要手动编辑：页面路由与样式写在各页面的 `definePage({...})` 宏中，全局配置（easycom、subPackages、globalStyle、tabBar）写在根目录 `pages.config.ts`。`src/manifest.json` 同样由根目录 `manifest.config.ts` 生成。

```
src/
├── pages.json           # 路由配置 (由 pages.config.ts + definePage 生成)
├── pages/               # 主包页面 (7 个)
│   ├── index/           # 首页 (TabBar)
│   ├── mine/            # 我的 (TabBar)
│   ├── login/           # 登录
│   ├── register/        # 注册
│   ├── forgot-password/ # 忘记密码
│   ├── agreement/       # 协议
│   └── error/           # 错误页
│
└── pages-sub/           # 分包页面 (3 个分包)
    ├── order/           # 订单分包
    │   ├── list/        # 订单列表
    │   ├── detail/      # 订单详情
    │   └── payment-result/ # 支付结果
    ├── user/            # 用户分包
    │   ├── address/     # 地址管理
    │   ├── address-edit/# 编辑地址
    │   ├── favorite/    # 我的收藏
    │   ├── notifications/ # 消息通知
    │   ├── notification-settings/ # 通知设置
    │   ├── password/    # 修改密码
    │   ├── profile/     # 编辑资料
    │   └── settings/    # 设置
    └── other/           # 其他分包
        ├── about/       # 关于我们
        ├── contact/     # 联系客服
        ├── feedback/    # 意见反馈
        └── webview/     # Webview 容器
```

**路由跳转方式**:

```typescript
// ✅ 正确: 使用 uni API
uni.navigateTo({ url: '/pages/login/index' });
uni.switchTab({ url: '/pages/index/index' });
uni.redirectTo({ url: '/pages/error/index' });

// ✅ 推荐: 使用封装的 composable
import { useRouter } from '@/composables';
const router = useRouter();
router.push('/pages-sub/order/detail/index', { id: 1 }); // navigateTo
router.replace('/pages/error/index');                    // redirectTo
router.switchTab('/pages/index/index');
router.back();

// ❌ 错误: 没有 Vue Router
import { useRouter } from 'vue-router';  // 禁止!
```

**新增页面** (在页面文件中声明，自动扫描生成 pages.json):

```vue
<!-- src/pages-sub/order/list/index.vue -->
<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: '我的订单',
  },
});
</script>
```

**分包配置** (pages.config.ts，分包目录还需在 vite.config.ts 的 `UniPages({ subPackages })` 中声明):

```ts
subPackages: [
  { root: 'pages-sub/order', pages: [] },
  { root: 'pages-sub/user', pages: [] },
  { root: 'pages-sub/other', pages: [] },
],
```

**详细文档**: [.claude/agents/router-development.md](.claude/agents/router-development.md)

---

### 2. Orval API 自动生成架构 ⭐⭐⭐

**最重要的架构决策 - 必读！**

```
src/api/
├── core/              # HTTP 客户端、请求封装 (手动维护)
│   ├── index.ts       # 导出
│   ├── alova.ts       # Alova 实例封装
│   └── mutator.ts     # Orval 适配器
├── generated/         # 🚫 Orval 自动生成 (禁止修改!)
│   ├── auth/          # 认证 API
│   ├── config/        # 配置 API
│   ├── ...            # 其他按 tag 拆分的模块
│   └── model/         # 类型定义
├── custom/            # ✅ 自定义扩展 (手动编写)
│   ├── external.ts    # 外部 API (新增场景)
│   └── override.ts    # 覆盖生成的 API (扩展场景)
└── index.ts           # 统一导出 (custom 优先)
```

**关键规则**:

- 🚫 **绝对禁止修改** `src/api/generated/` 目录
- ✅ 从 `@/api` 统一导入，不直接从 `generated/` 导入
- ✅ 需要扩展时在 `custom/` 目录编写
- ✅ 优先使用 Pinia Store + Orval API 组合

**工作流程**:

```bash
后端更新 API → 本地启动后端（开启 SWAGGER_ENABLED）→ pnpm api:gen（拉取 http://localhost:3000/docs-json）→ 自动生成代码
```

**详细文档**: [.claude/agents/api-development.md](.claude/agents/api-development.md)

---

### 3. 组件系统 (easycom) ⭐⭐

**自动注册机制** - 无需手动 import

```ts
// pages.config.ts（生成 src/pages.json）
easycom: {
  autoscan: true,
  custom: {
    '^uni-(.*)': '@dcloudio/uni-ui/lib/uni-$1/uni-$1.vue',
    '^U(.*)': '@/components/U$1/index.vue',
    '^AuthLayout$': '@/components/AuthLayout/index.vue',
  },
},
```

**组件使用**:

```vue
<template>
  <!-- uni-ui 组件，自动导入 -->
  <uni-badge text="99+" />

  <!-- 自定义组件，自动导入（使用 PascalCase 标签） -->
  <UIcon name="home" size="44rpx" />
  <ULoading />
  <UEmpty />
  <UNavBar title="标题" />
</template>

<!-- 无需 import！easycom 自动注册 -->
```

**自定义组件列表** (src/components/):

| 组件 | 说明 | 组件 | 说明 |
|------|------|------|------|
| `UNavBar` | 自定义导航栏 | `ULoading` | 加载动画 |
| `UEmpty` | 空状态 | `USkeleton` | 骨架屏 |
| `UImage` | 图片 (懒加载) | `UBanner` | 轮播图 |
| `UTabs` | 标签页 | `UPopup` | 弹出层 |
| `UActionSheet` | 操作菜单 | `UNoticeBar` | 通知栏 |
| `UMenuItem` | 菜单项 | `UMenuGroup` | 菜单容器 |
| `UFormItem` | 表单项 | `USmsInput` | 短信验证码 |
| `UImageUpload` | 图片上传 | `UPasswordStrength` | 密码强度 |
| `URichText` | 富文本 | `UFixedButton` | 固定按钮 |
| `ULoadMore` | 加载更多 | `USearchBar` | 搜索栏 |
| `UAgreementCheck` | 协议勾选 | `UPrivacyPopup` | 微信隐私授权弹窗 |
| `UTag` | 标签 | `AuthLayout` | 认证布局 |
| `UIcon` | 图标（尺寸默认 rpx） | `URegionPicker` | 省市区选择 |
| `UButton` | 按钮 | `UCard` | 卡片容器 |
| `UList` | 分页列表状态 | `UPrice` | 金额展示 |
| `UDivider` | 分割线 | `USticky` | 吸顶容器 |
| `UBackTop` | 回到顶部 | `UForm` | 表单容器（规则校验） |
| `UInput` | 输入框 | `UTextarea` | 多行输入框 |
| `UPageState` | 页面状态容器 | `UDialog` | 页面内对话框（配合 `useDialog`） |
| `UCheckboxGroup` | 多选框组 | `URadioGroup` | 单选框组 |
| `UDatePicker` | 日期/时间选择 | `UStepper` | 步进器 |
| `UCountdown` | 倒计时 | `USwipeAction` | 左滑操作 |
| `UQuestionContent` | 题目内容（Markdown + LaTeX、图片预览、材料题、音频） | | |
| `UQuestionActions` | 题目收藏与笔记入口 | `UNoteEditor` | 题目笔记编辑弹层 |

**详细文档**: [.claude/agents/component-development.md](.claude/agents/component-development.md)

---

### 4. 主题系统 (CSS 变量) ⭐⭐

**所有颜色必须使用 `src/styles/theme.scss` 中定义的 CSS 变量**

```scss
// ✅ 正确: 使用 CSS 变量
.component {
  color: var(--color-text);
  background: var(--color-bg);
  border: 1rpx solid var(--color-border);
}

// ❌ 错误: 硬编码颜色
.component {
  color: #323233;        // 禁止!
  background: #fff;      // 禁止!
}
```

**主题变量速查**:

| 变量 | 浅色值 | 用途 |
|------|--------|------|
| `--color-primary` | #1989fa | 主题色 |
| `--color-text` | #323233 | 主文本 |
| `--color-text-secondary` | #969799 | 次要文本 |
| `--color-bg` | #fff | 背景色 |
| `--color-bg-grey` | #f7f8fa | 灰色背景 |
| `--color-border` | #ebedf0 | 边框色 |
| `--color-success` | #07c160 | 成功色 |
| `--color-error` | #ee0a24 | 错误色 |
| `--color-warning` | #ff976a | 警告色 |

**主题切换**:

```typescript
import { useGlobalStore } from '@/store';
const globalStore = useGlobalStore();
globalStore.setTheme('dark');  // 切换到深色主题
```

**详细文档**: [.claude/agents/common-patterns.md](.claude/agents/common-patterns.md)

---

## 关键目录速查

| 目录 | 职责 | 注意事项 |
|------|------|---------|
| `src/pages/` | 主包页面 | TabBar 页面必须在主包 |
| `src/pages-sub/` | 分包页面 | 优化小程序体积 |
| `src/pages.json` | 路由配置 | 自动生成，页面用 `definePage` 声明，全局配置改 `pages.config.ts` |
| `src/api/generated/` | Orval 自动生成 | 🚫 **禁止修改** |
| `src/api/custom/` | 自定义 API | ✅ 在这里扩展 |
| `src/components/` | 全局组件 | easycom 自动注册 |
| `src/composables/` | Composition API | 可复用的逻辑 |
| `src/store/modules/` | Pinia Store | 状态管理 |
| `src/styles/` | 全局样式 | theme.scss 主题变量 |
| `src/utils/` | 工具函数 | 平台兼容工具 |
| `src/constants/` | 常量定义 | 页面路径、权限等 |
| `src/interface/` | 类型定义 | TypeScript 接口 |
| `src/locale/` | 国际化 | i18n 翻译文件 |

---

## 常用命令

```bash
# 开发
pnpm dev:h5           # H5 开发
pnpm dev:mp-weixin    # 微信小程序开发
pnpm dev:mp-alipay    # 支付宝小程序开发
pnpm dev:app          # App 开发

# 构建
pnpm build:h5         # H5 构建
pnpm build:mp-weixin  # 微信小程序构建
pnpm build:mp-alipay  # 支付宝小程序构建
pnpm build:app        # App 构建

# API 相关
pnpm api:gen          # 生成 API 代码 (Orval)

# 代码质量
pnpm lint             # ESLint + Stylelint + markdownlint（自动 --fix）
pnpm lint:check       # 只检查不修复
pnpm type-check       # TypeScript 类型检查

# 测试
pnpm test             # 运行测试
pnpm test:watch       # 测试监听模式
pnpm test:coverage    # 测试覆盖率
pnpm test:ui          # 测试 UI 界面

# Git
pnpm commit           # 交互式提交 (cz-git)
```

---

## 重要约定和禁忌

### 🚫 禁止事项

| 禁止操作 | 说明 | 后果 |
|---------|------|------|
| 🚫 修改 `src/api/generated/` | Orval 自动生成 | 修改会被覆盖 |
| 🚫 直接从 `generated/` 导入 | 破坏导出优先级 | 自定义扩展不生效 |
| 🚫 使用 Vue Router | Uni-app 使用 pages.json | 运行时错误 |
| 🚫 硬编码颜色值 | 不使用 CSS 变量 | 主题切换失效 |
| 🚫 使用 px 单位 | 小程序使用 rpx | 适配问题 |
| 🚫 使用 window/document | 非 H5 平台不存在 | 跨平台兼容问题 |
| 🚫 手动 import easycom 组件 | easycom 自动注册 | 重复导入 |

### ✅ 必须遵守

| 规范 | 说明 | 参考 |
|------|------|------|
| ✅ 使用 uni API | `uni.navigateTo` 等 | Uni-app 官方文档 |
| ✅ 使用 CSS 变量 | `var(--color-xxx)` | theme.scss |
| ✅ 使用 rpx 单位 | 小程序适配 | 750rpx = 设计稿宽度 |
| ✅ 平台条件编译 | `#ifdef MP-WEIXIN` | 多端差异处理 |
| ✅ Props/Emits 类型定义 | TypeScript 接口 | common-patterns.md |
| ✅ API 从 @/api 导入 | 统一入口 | api-development.md |

---

## AI Agent 导航

### 核心 Agent

| Agent | 适用场景 | 文档 |
|-------|---------|------|
| **common-patterns** | Props/Emits/CSS 变量/盒模型 | [查看](.claude/agents/common-patterns.md) |
| **api-development** | Orval API 使用、自定义扩展 | [查看](.claude/agents/api-development.md) |
| **component-development** | 组件开发、样式规范 | [查看](.claude/agents/component-development.md) |
| **router-development** | pages.json 配置、分包、导航 | [查看](.claude/agents/router-development.md) |

### 专业 Agent

| Agent | 适用场景 | 文档 |
|-------|---------|------|
| **store-development** | Pinia 状态管理 | [查看](.claude/agents/store-development.md) |
| **coding-standards** | 编码规范、代码风格 | [查看](.claude/agents/coding-standards.md) |
| **testing** | 测试策略、Vitest | [查看](.claude/agents/testing.md) |
| **figma-extraction-guide** | Figma 设计还原 | [查看](.claude/agents/figma-extraction-guide.md) |

---

## Uni-app 特有注意事项

### 1. 平台条件编译

```vue
<template>
  <!-- #ifdef MP-WEIXIN -->
  <button open-type="getPhoneNumber">微信获取手机号</button>
  <!-- #endif -->

  <!-- #ifdef H5 -->
  <input type="tel" placeholder="请输入手机号" />
  <!-- #endif -->
</template>

<script setup lang="ts">
// #ifdef MP-WEIXIN
const getPhoneNumber = (e) => { /* 微信专属逻辑 */ };
// #endif
</script>

<style lang="scss">
/* #ifdef H5 */
.web-only { display: block; }
/* #endif */
</style>
```

### 2. 生命周期

```typescript
import { onLoad, onShow, onHide, onUnload } from '@dcloudio/uni-app';

// 页面生命周期 (Uni-app 特有)
onLoad((options) => {
  console.log('页面加载，参数:', options);
});

onShow(() => {
  console.log('页面显示');
});

// Vue 生命周期也可用
import { onMounted, onUnmounted } from 'vue';
```

### 3. 尺寸单位

```scss
// ✅ 正确: 使用 rpx (750rpx = 设计稿宽度)
.box {
  width: 200rpx;
  height: 100rpx;
  font-size: 28rpx;
}

// ❌ 错误: 使用 px (小程序不推荐)
.box {
  width: 100px;   // 禁止!
}
```

### 4. 存储 API

```typescript
// ✅ 正确: 使用 uni 存储 API
uni.setStorageSync('token', 'xxx');
const token = uni.getStorageSync('token');

// ❌ 错误: 使用 localStorage (小程序不存在)
localStorage.setItem('token', 'xxx');  // 禁止!
```

### 5. 微信隐私授权

调用选图、剪贴板、定位、头像昵称等隐私接口的页面，需在页面模板中放置 `<UPrivacyPopup />`（仅微信小程序渲染），并在微信公众平台填写「用户隐私保护指引」。

---

## 快速参考

### 关键路径

```bash
# 页面目录
src/pages/               # 主包页面
src/pages-sub/           # 分包页面
src/pages.json           # 路由配置 (自动生成)
pages.config.ts          # 全局路由配置 (easycom/分包/tabBar)

# API 层
src/api/generated/       # 🚫 自动生成
src/api/custom/          # ✅ 自定义扩展
src/api/index.ts         # 统一导出

# 组件
src/components/          # 全局组件 (easycom)

# 状态
src/store/modules/       # Pinia Store

# 样式
src/styles/theme.scss    # 主题变量
src/styles/size.scss     # 尺寸变量

# 配置
manifest.config.ts       # 平台配置 (生成 src/manifest.json)
vite.config.ts           # Vite 配置
orval.config.ts          # API 生成配置
```

### 平台编译标识

| 标识 | 平台 |
|------|------|
| `H5` | H5 网页 |
| `MP-WEIXIN` | 微信小程序 |
| `MP-ALIPAY` | 支付宝小程序 |
| `APP` | App (iOS/Android) |
| `APP-PLUS` | App (5+ App) |

---

## Skills、Commands、Hooks

项目配置了完整的 Claude Code 工具链，详见 [.claude/README.md](.claude/README.md)

### 快速命令

```bash
/review-pr        # PR 审查清单
/quick-fix        # 快速问题修复
/git-workflow     # Git 工作流规范
/optimize         # 性能优化指南
/security-check   # 安全检查清单
/tools            # 查看所有工具
```

### Skills (代码生成)

```bash
/component-generator UserCard --type basic   # 生成组件
/store-generator UserStore --smart           # 生成 Store
/api-generator uploadFile --type upload      # 生成自定义 API
```
