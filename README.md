# Uni-app 多端应用模板

> 基于 Uni-app 3.x + Vue 3 + TypeScript + Vite 构建的多端应用模板，支持 H5、微信小程序、支付宝小程序、App 等多平台

[![Node.js](https://img.shields.io/badge/node-%3E%3D22-green)](https://nodejs.org/)
[![Vue.js](https://img.shields.io/badge/vue-3.x-brightgreen)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-6.x-blue)](https://www.typescriptlang.org/)
[![Uni-app](https://img.shields.io/badge/uni--app-3.x-green)](https://uniapp.dcloud.io/)

## 特性

- **多端支持**: H5 / 微信小程序 / 支付宝小程序 / App (iOS/Android)
- **现代化技术栈**: Uni-app 3.x + Vue 3 Composition API + TypeScript
- **Orval API 自动生成**: OpenAPI → 类型安全的 API 代码，自动化程度 80%+
- **分包优化**: `pages/` 主包 + `pages-sub/` 分包，优化小程序体积
- **easycom 自动注册**: 组件无需手动导入，开箱即用
- **主题系统**: CSS 变量支持 Light/Dark 主题切换
- **自定义组件库**: 25 个组件（24 个 `U` 前缀组件 + `AuthLayout`）
- **状态管理**: Pinia + 持久化插件
- **国际化**: vue-i18n 多语言支持
- **代码质量**: ESLint + Stylelint + markdownlint + Prettier + Husky
- **测试完善**: Vitest 单元测试，80% 覆盖率为建议目标（未配置阈值）

## 技术架构

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
| **测试** | Vitest | 80% 覆盖率建议目标（未配置阈值） |
| **国际化** | vue-i18n | 多语言支持 |

### 开发工具

- **代码检查**: ESLint 10 + typescript-eslint
- **样式检查**: Stylelint + SCSS
- **文档检查**: markdownlint-cli2
- **代码格式化**: Prettier
- **Git 钩子**: Husky + lint-staged
- **提交规范**: Commitizen + cz-git + commitlint (`commitlint.config.ts`)
- **拼写检查**: CSpell
- **测试框架**: Vitest + @vitest/ui

## 项目结构

```
uniapp-template/
├── .claude/                   # Claude AI 配置和文档
│   ├── agents/                # AI Agent 配置 (11 个专业 Agent)
│   ├── commands/              # 快速命令 (7 个)
│   ├── skills/                # Skills 代码生成 (9 个)
│   ├── hooks/                 # Hook 配置说明
│   └── settings.json          # Claude 权限和 Hook 配置
├── .husky/                    # Git hooks 配置
├── src/
│   ├── api/                   # API 接口层
│   │   ├── core/              # HTTP 客户端 (手动维护)
│   │   │   ├── alova.ts       # Alova 实例封装
│   │   │   ├── mutator.ts     # Orval 适配器
│   │   │   └── index.ts       # 导出
│   │   ├── generated/         # Orval 自动生成 (禁止修改!)
│   │   │   ├── auth/          # 认证 API
│   │   │   ├── config/        # 配置 API
│   │   │   ├── ...            # 其他按 tag 拆分的模块
│   │   │   └── model/         # 类型定义
│   │   ├── custom/            # 自定义扩展 (手动编写)
│   │   │   ├── external.ts    # 外部 API
│   │   │   └── override.ts    # 覆盖生成的 API
│   │   └── index.ts           # 统一导出
│   ├── components/            # 全局组件 (easycom 自动注册)
│   │   ├── UNavBar/           # 自定义导航栏
│   │   ├── UEmpty/            # 空状态
│   │   ├── ULoading/          # 加载动画
│   │   ├── USkeleton/         # 骨架屏
│   │   ├── UImage/            # 图片 (懒加载)
│   │   ├── UBanner/           # 轮播图
│   │   ├── UTabs/             # 标签页
│   │   ├── UPopup/            # 弹出层
│   │   ├── UActionSheet/      # 操作菜单
│   │   ├── UNoticeBar/        # 通知栏
│   │   ├── UMenuItem/         # 菜单项
│   │   ├── UMenuGroup/        # 菜单容器
│   │   ├── UFormItem/         # 表单项
│   │   ├── USmsInput/         # 短信验证码
│   │   ├── UImageUpload/      # 图片上传
│   │   ├── UPasswordStrength/ # 密码强度
│   │   ├── URichText/         # 富文本
│   │   ├── UButton/           # 按钮
│   │   ├── UFixedButton/      # 固定按钮
│   │   ├── ULoadMore/         # 加载更多
│   │   ├── USearchBar/        # 搜索栏
│   │   ├── UTag/              # 标签
│   │   ├── UAgreementCheck/   # 协议勾选
│   │   ├── UPrivacyPopup/     # 微信隐私授权弹窗
│   │   └── AuthLayout/        # 认证布局
│   ├── composables/           # Composition API
│   │   ├── useRouter.ts       # 路由导航封装
│   │   ├── useForm.ts         # 表单处理
│   │   ├── useCountdown.ts    # 倒计时
│   │   ├── useDebounce.ts     # 防抖
│   │   ├── useShare.ts        # 分享功能
│   │   └── usePasswordStrength.ts
│   ├── constants/             # 常量定义
│   │   ├── index.ts           # 统一导出
│   │   ├── pages.ts           # 页面路径常量、白名单
│   │   ├── form.ts            # 表单常量
│   │   ├── order.ts           # 订单常量
│   │   └── permission.ts      # 权限常量
│   ├── interface/             # TypeScript 接口
│   │   ├── common.ts          # 通用接口
│   │   └── user.ts            # 用户接口
│   ├── locale/                # 国际化
│   │   ├── zh-CN.json         # 中文
│   │   └── en-US.json         # 英文
│   ├── pages/                 # 主包页面 (7 个)
│   │   ├── index/             # 首页 (TabBar)
│   │   ├── mine/              # 我的 (TabBar)
│   │   ├── login/             # 登录
│   │   ├── register/          # 注册
│   │   ├── forgot-password/   # 忘记密码
│   │   ├── agreement/         # 协议
│   │   └── error/             # 错误页
│   ├── pages-sub/             # 分包页面 (3 个分包)
│   │   ├── order/             # 订单分包
│   │   │   ├── list/          # 订单列表
│   │   │   ├── detail/        # 订单详情
│   │   │   └── payment-result/ # 支付结果
│   │   ├── user/              # 用户分包
│   │   │   ├── address/       # 地址管理
│   │   │   ├── address-edit/  # 编辑地址
│   │   │   ├── favorite/      # 我的收藏
│   │   │   ├── notifications/ # 消息通知
│   │   │   ├── notification-settings/ # 通知设置
│   │   │   ├── password/      # 修改密码
│   │   │   ├── profile/       # 编辑资料
│   │   │   └── settings/      # 设置
│   │   └── other/             # 其他分包
│   │       ├── about/         # 关于我们
│   │       ├── contact/       # 联系客服
│   │       ├── feedback/      # 意见反馈
│   │       └── webview/       # Webview 容器
│   ├── static/                # 静态资源
│   │   ├── images/            # 图片资源
│   │   └── tabbar/            # TabBar 图标
│   ├── store/                 # Pinia 状态管理
│   │   ├── modules/           # 状态模块
│   │   │   ├── user.ts        # 用户状态
│   │   │   ├── global.ts      # 全局状态
│   │   │   └── ...            # address/favorite/order 等业务模块
│   │   ├── plugins/           # Store 插件
│   │   │   └── persist.ts     # 持久化插件
│   │   └── index.ts           # Store 导出
│   ├── styles/                # 全局样式
│   │   ├── theme.scss         # 主题变量 (CSS 变量)
│   │   ├── size.scss          # 尺寸变量
│   │   ├── mixin.scss         # SCSS Mixins
│   │   └── index.scss         # 样式入口
│   ├── utils/                 # 工具函数
│   │   ├── router.ts          # 路由工具
│   │   ├── router-interceptor.ts # 路由拦截
│   │   ├── storage.ts         # 存储封装
│   │   ├── toast.ts           # 提示封装
│   │   ├── modal.ts           # 弹窗封装
│   │   ├── validator.ts       # 表单验证
│   │   ├── formatters.ts      # 格式化工具
│   │   ├── platform.ts        # 平台判断
│   │   ├── network.ts         # 网络检测
│   │   ├── debounce.ts        # 防抖函数
│   │   ├── throttle.ts        # 节流函数
│   │   ├── locale.ts          # 语言工具
│   │   ├── update.ts          # 热更新
│   │   └── error-reporter.ts  # 错误上报
│   ├── App.vue                # 根组件
│   ├── main.ts                # 应用入口
│   ├── pages.json             # 路由配置 (由 pages.config.ts + definePage 生成)
│   └── manifest.json          # 平台配置 (由 manifest.config.ts 生成)
├── tests/                     # 测试文件
├── .mcp.json                  # Claude Code MCP 配置
├── pages.config.ts            # 全局路由配置 (easycom/分包/tabBar)
├── manifest.config.ts         # 平台配置
├── orval.config.ts            # Orval API 生成配置
├── vite.config.ts             # Vite 构建配置
├── tsconfig.json              # TypeScript 配置
├── eslint.config.ts           # ESLint 配置
└── package.json               # 项目依赖
```

## 快速开始

### 环境要求

- **Node.js**: >= 22.22.2（见 `.nvmrc`）
- **包管理器**: pnpm >= 11

### 安装依赖

```bash
# 使用 pnpm (推荐)
pnpm install
```

### 开发模式

```bash
# H5 开发
pnpm dev:h5

# 微信小程序开发
pnpm dev:mp-weixin

# 支付宝小程序开发
pnpm dev:mp-alipay

# App 开发
pnpm dev:app
```

### 构建部署

```bash
# H5 构建
pnpm build:h5

# 微信小程序构建
pnpm build:mp-weixin

# 支付宝小程序构建
pnpm build:mp-alipay

# App 构建
pnpm build:app
```

微信小程序上线前需在微信公众平台填写「用户隐私保护指引」，否则隐私授权弹窗 `UPrivacyPopup` 不会触发，选图、剪贴板等隐私接口无法使用。

## 脚本命令

### 开发相关

```bash
pnpm dev:h5           # H5 开发
pnpm dev:mp-weixin    # 微信小程序开发
pnpm dev:mp-alipay    # 支付宝小程序开发
pnpm dev:app          # App 开发
pnpm type-check       # TypeScript 类型检查
```

### API 相关

```bash
pnpm api:gen          # 生成 API 代码 (Orval)
```

### 代码质量

```bash
pnpm lint             # ESLint + Stylelint + markdownlint（自动 --fix）
pnpm lint:check       # 只检查不修复 (CI 使用)
pnpm lint:script      # JavaScript/TypeScript 检查并修复
pnpm lint:style       # 样式文件检查并修复
pnpm lint:md          # Markdown 检查
pnpm format           # Prettier 格式化
```

### 测试相关

```bash
pnpm test             # 运行测试
pnpm test:watch       # 测试监听模式
pnpm test:coverage    # 测试覆盖率
pnpm test:ui          # 测试 UI 界面
```

### 构建相关

```bash
pnpm build:h5         # H5 构建
pnpm build:mp-weixin  # 微信小程序构建
pnpm build:mp-alipay  # 支付宝小程序构建
pnpm build:app        # App 构建
pnpm clean            # 清理构建产物
```

### Git 提交

```bash
pnpm commit           # 交互式提交 (cz-git)
```

## 核心架构

### 1. 路由系统 (pages.json)

**重要**: Uni-app 使用 `pages.json` 配置路由，不使用 Vue Router。`src/pages.json` 由 `@uni-helper/vite-plugin-uni-pages` 生成，不要手动编辑：页面在各自文件中用 `definePage({ style: {...} })` 声明，easycom、分包、tabBar 等全局配置写在根目录 `pages.config.ts`。

```typescript
// ✅ 正确: 使用 uni API
uni.navigateTo({ url: '/pages/login/index' });
uni.switchTab({ url: '/pages/index/index' });
uni.redirectTo({ url: '/pages/error/index' });

// ✅ 推荐: 使用封装的 composable
import { useRouter } from '@/composables';
const router = useRouter();
router.push('/pages-sub/order/detail/index', { id: 1 });
router.replace('/pages/error/index');
router.switchTab('/pages/index/index');
router.back();

// ❌ 错误: 不要使用 Vue Router
import { useRouter } from 'vue-router';  // 禁止!
```

### 2. Orval API 自动生成

```
src/api/
├── core/              # HTTP 客户端 (手动维护)
├── generated/         # Orval 自动生成 (禁止修改!)
├── custom/            # 自定义扩展 (手动编写)
└── index.ts           # 统一导出 (custom 优先)
```

**关键规则**:

- **绝对禁止修改** `src/api/generated/` 目录
- 从 `@/api` 统一导入，不直接从 `generated/` 导入
- 需要扩展时在 `custom/` 目录编写

**工作流程**:

```bash
后端更新 API → 本地启动后端（开启 SWAGGER_ENABLED）→ pnpm api:gen（拉取 http://localhost:3000/docs-json）→ 自动生成代码
```

### 3. 组件系统 (easycom)

组件自动注册，无需手动 import:

```vue
<template>
  <!-- uni-ui 组件，自动导入 -->
  <uni-icons type="home" />

  <!-- 自定义组件，自动导入（使用 PascalCase 标签） -->
  <ULoading />
  <UEmpty />
  <UNavBar title="标题" />
</template>
```

### 4. 主题系统 (CSS 变量)

所有颜色必须使用 CSS 变量:

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
}
```

### 5. 尺寸单位

```scss
// ✅ 正确: 使用 rpx (750rpx = 设计稿宽度)
.box {
  width: 200rpx;
  height: 100rpx;
  font-size: 28rpx;
}

// ❌ 错误: 使用 px
.box {
  width: 100px;   // 禁止!
}
```

## 重要约定

### 禁止事项

| 禁止操作 | 说明 |
|---------|------|
| 修改 `src/api/generated/` | Orval 自动生成，修改会被覆盖 |
| 直接从 `generated/` 导入 | 破坏导出优先级 |
| 使用 Vue Router | Uni-app 使用 pages.json |
| 硬编码颜色值 | 必须使用 CSS 变量 |
| 使用 px 单位 | 小程序使用 rpx |
| 使用 window/document | 非 H5 平台不存在 |
| 使用 localStorage | 小程序使用 uni.setStorageSync |

### 必须遵守

| 规范 | 说明 |
|------|------|
| 使用 uni API | `uni.navigateTo` 等 |
| 使用 CSS 变量 | `var(--color-xxx)` |
| 使用 rpx 单位 | 750rpx = 设计稿宽度 |
| 平台条件编译 | `#ifdef MP-WEIXIN` |
| API 从 @/api 导入 | 统一入口 |

## 平台条件编译

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
```

### 平台标识

| 标识 | 平台 |
|------|------|
| `H5` | H5 网页 |
| `MP-WEIXIN` | 微信小程序 |
| `MP-ALIPAY` | 支付宝小程序 |
| `APP` | App (iOS/Android) |
| `APP-PLUS` | App (5+ App) |

## Claude Code 工具链

项目配置了完整的 Claude Code 工具链，详见 [.claude/README.md](.claude/README.md)。

### 快速命令

```bash
/review-pr        # PR 审查清单
/quick-fix        # 快速问题修复
/git-workflow     # Git 工作流规范
/optimize         # 性能优化指南
/security-check   # 安全检查清单
/refactor         # 重构最佳实践
/tools            # 查看所有工具
```

### Skills (代码生成)

```bash
/component-generator UserCard --type basic   # 生成组件
/store-generator UserStore --smart           # 生成 Store
/api-generator uploadFile --type upload      # 生成自定义 API
/architecture-designer docs/prd/user.md      # 架构设计
```

### AI Agent

| Agent | 适用场景 |
|-------|---------|
| common-patterns | Props/Emits/CSS 变量/盒模型 |
| api-development | Orval API 使用、自定义扩展 |
| component-development | 组件开发、样式规范 |
| router-development | pages.json 配置、分包、导航 |
| store-development | Pinia 状态管理 |
| coding-standards | 编码规范、代码风格 |
| testing | 测试策略、Vitest |

## MCP 服务器配置

项目级 `.mcp.json` 不内置服务器，按需在用户级配置中添加。常用服务器:

| 服务器 | 功能 | 使用场景 |
|--------|------|----------|
| figma | Figma 设计稿读取 | 提取设计数据、下载资源（Figma 相关 Skill/Agent 依赖） |
| context7 | 第三方库文档查询 | 获取最新库文档 |
| eslint | ESLint 代码检查 | 文件级别的 lint 检查 |
| chrome-devtools | Chrome 开发者工具 | 浏览器调试和性能分析 |

配置方式见 [.claude/README.md](.claude/README.md#mcp-服务器配置)

## 常见问题

### 依赖安装问题

```bash
# 清理缓存后重新安装
pnpm store prune
pnpm install
```

### Node 版本不匹配

```bash
# 检查 Node 版本 (需要 >= 22.22.2)
node -v

# 使用 nvm 切换版本
nvm install
nvm use
```

### 类型检查错误

```bash
# 运行类型检查
pnpm type-check
```

### API 代码过期

```bash
# 重新生成 API 代码
pnpm api:gen
```

### 构建失败

```bash
# 清理构建产物后重新构建
pnpm clean
pnpm build:h5  # 或其他平台
```

## 外部参考文档

- [Uni-app 官方文档](https://uniapp.dcloud.io/)
- [Vue 3 官方文档](https://vuejs.org/)
- [Vite 官方文档](https://vitejs.dev/)
- [TypeScript 官方文档](https://www.typescriptlang.org/)
- [Pinia 官方文档](https://pinia.vuejs.org/)
- [uni-ui 组件库](https://uniapp.dcloud.io/component/uniui/uni-ui.html)
- [Alova](https://alova.js.org/)
- [Orval 官方文档](https://orval.dev/)
- [Vitest 官方文档](https://vitest.dev/)

## 贡献指南

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`pnpm commit`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

**注意**:

- 确保所有测试通过 (`pnpm test`)
- 确保代码检查通过 (`pnpm lint`)
- 遵循项目的代码规范和提交规范

## License

本项目采用 MIT 协议
