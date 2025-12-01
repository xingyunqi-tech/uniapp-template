# Vue3 移动端 H5 模板

> 基于 Vue3 + TypeScript + Vite + Vant 构建的移动端 H5 应用模板，集成完整的开发工具链和最佳实践

[![Node.js](https://img.shields.io/badge/node-%3E%3D22-green)](https://nodejs.org/)
[![Vue.js](https://img.shields.io/badge/vue-3.x-brightgreen)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.x-blue)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/vite-latest-646CFF)](https://vitejs.dev/)

## ✨ 特性

- 🚀 **现代化技术栈**: Vue3 + TypeScript + Vite + Pinia
- 📱 **移动端优先**: 基于 375px 设计稿，postcss-px-to-viewport 自动适配
- 🎨 **UI组件库**: Vant 4 + TailwindCSS，支持组件自动导入
- 🌍 **国际化**: 完整的i18n解决方案，支持AI自动翻译和交互式管理
- 📦 **状态管理**: Pinia 状态管理，支持持久化
- 💀 **骨架屏系统**: 路由级和组件级骨架屏，提升加载体验
- 🔧 **开发工具**: ESLint + Prettier + Stylelint + Husky + lint-staged
- 📊 **监控集成**: Sentry 错误监控和性能追踪
- 🐳 **容器化**: Docker 一键部署，支持Nginx反向代理
- 🔒 **类型安全**: 完整的TypeScript类型定义
- ✅ **测试完善**: Vitest 单元测试，支持覆盖率报告
- 🎯 **代码质量**: 完整的代码检查、格式化和拼写检查工具链
- 🔍 **开发体验**: 代码检查器插件，快速定位组件源码

## 🏗️ 技术架构

### 核心技术栈
- **框架**: Vue 3 (Composition API)
- **构建工具**: Vite
- **语言**: TypeScript
- **状态管理**: Pinia
- **路由**: Vue Router
- **UI库**: Vant 4 (移动端)
- **样式**: TailwindCSS v4 + SCSS
- **HTTP客户端**: Axios

### 开发工具
- **代码检查**: ESLint
- **代码格式化**: Prettier
- **样式检查**: Stylelint
- **Git钩子**: Husky
- **提交规范**: Commitizen + cz-git
- **拼写检查**: CSpell
- **测试框架**: Vitest + @vitest/ui
- **监控工具**: Sentry

## 📁 项目结构

```md
vue-admin-template/
├── .claude/                   # Claude AI 配置和文档
│   └── agents/                # AI Agent 配置文件
├── .husky/                    # Git hooks 配置
├── .vscode/                   # VS Code 编辑器配置
│   └── extensions.json        # 推荐插件列表
├── config/                    # 项目配置文件
│   ├── devServer.ts           # 开发服务器配置
│   ├── host.ts                # 主机配置
│   └── proxy.ts               # 代理配置
├── deploy/                    # 部署相关文件
│   ├── manage.sh              # Docker 容器管理脚本
│   ├── nginx.conf             # Nginx 配置文件
│   └── README.md              # 部署说明文档
├── public/                    # 静态资源
│   ├── favicon.ico            # 网站图标
│   ├── loading.css            # 加载动画样式
│   └── theme.css              # CSS 主题变量
├── scripts/                   # 构建和工具脚本
│   ├── i18n/                  # 国际化自动化脚本
│   │   ├── index.ts           # 交互式国际化管理
│   │   ├── translate.ts       # AI 自动翻译
│   │   ├── exportLocale.ts    # 导出语言包
│   │   ├── generate.ts        # 生成国际化文件
│   │   ├── merge.ts           # 合并翻译
│   │   ├── pick.ts            # 提取待翻译文本
│   │   └── restore.ts         # 恢复翻译
│   ├── cssVars/               # CSS 变量检查脚本
│   ├── husky/                 # 提交信息检查
│   │   ├── commit-msg.ts      # 提交信息检查
│   │   ├── pre-commit.ts      # 提交前检查
│   │   └── pre-push.ts        # 推送前检查
├── src/                       # 源代码目录
│   ├── api/                   # API 接口层
│   │   ├── instance.ts        # Axios 实例配置
│   │   └── modules/           # API 模块
│   │       └── login.ts       # 登录接口
│   ├── assets/                # 静态资源
│   │   ├── icons/             # SVG 图标资源
│   │   └── images/            # 图片资源
│   ├── components/            # 全局公用组件
│   │   ├── BaseInput/         # 基础输入组件
│   │   └── Skeleton/          # 骨架屏组件
│   ├── constants/             # 常量定义
│   ├── interface/             # TypeScript 接口定义
│   ├── layout/                # 布局组件
│   ├── locales/               # 国际化语言包
│   ├── router/                # 路由配置
│   ├── store/                 # Pinia 状态管理
│   │   └── modules/           # 状态模块
│   ├── styles/                # 全局样式文件
│   ├── utils/                 # 工具函数
│   ├── views/                 # 页面组件
│   │   ├── Home/              # 首页
│   │   ├── Login/             # 登录页
│   │   ├── Setting/           # 设置页
│   │   ├── LabReservation/    # 实验室预约页
│   │   └── 404.vue            # 404 页面
│   ├── App.vue                # 根组件
│   └── main.ts                # 应用入口
├── tests/                     # 测试文件
│   └── setup.ts               # 测试环境配置
├── typings/                   # TypeScript 全局类型声明
├── package.json               # 项目依赖配置
├── package.sh                 # 部署打包脚本
├── vite.config.ts             # Vite 构建配置
├── tsconfig.json              # TypeScript 配置
├── eslint.config.ts           # ESLint 配置
├── tailwind.config.ts         # TailwindCSS 配置
├── Dockerfile                 # Docker 镜像配置
└── index.html                 # HTML 入口文件
```

## 🚀 快速开始

### 环境要求

- **Node.js**: >= 22.0.0
- **包管理器**: pnpm (推荐) / npm / yarn

### 安装依赖

```bash
# 使用 pnpm (推荐)
pnpm install

# 或使用 npm
npm install

# 或使用 yarn
yarn install
```

### 开发模式

```bash
# 启动开发服务器
pnpm start

# 启动 HTTPS 开发服务器
pnpm start:https
```

### 构建部署

```bash
# 构建生产版本
pnpm build

# 预览构建结果
pnpm preview

# 构建并分析包大小
pnpm analyzer
```

## 🛠️ 开发工具配置

### VS Code 插件推荐

本项目推荐安装以下 VS Code 插件（已配置在 `.vscode/extensions.json`）：

#### 核心插件
- **Vue - Official** (`Vue.volar`): Vue 3 官方语言支持
- **Vue VSCode Snippets** (`sdras.vue-vscode-snippets`): Vue 代码片段

#### 代码质量
- **ESLint** (`dbaeumer.vscode-eslint`): JavaScript/TypeScript 代码检查
- **Stylelint** (`stylelint.vscode-stylelint`): CSS/SCSS 代码检查
- **Prettier** (`esbenp.prettier-vscode`): 代码格式化
- **Code Spell Checker** (`streetsidesoftware.code-spell-checker`): 拼写检查

#### 开发增强
- **i18n Ally** (`lokalise.i18n-ally`): 国际化开发辅助
- **CSS Variable Autocomplete** (`vunguyentuan.vscode-css-variables`): CSS 变量自动补全
- **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`): TailwindCSS 智能提示
- **VSC NVM** (`henrynguyen5-vsc.vsc-nvm`): Node 版本管理

**快速安装**: 打开项目后，VS Code 会自动提示安装推荐的插件

## 📜 脚本命令

### 开发相关
```bash
# 启动开发服务器
pnpm start

# 启动 HTTPS 开发服务器
pnpm start:https

# 类型检查
pnpm type-check
```

### 测试相关
```bash
# 运行所有测试
pnpm test

# 监听模式运行测试
pnpm test:watch

# 生成测试覆盖率报告
pnpm test:coverage

# 启动测试 UI 界面
pnpm test:ui
```

### 代码质量
```bash
# 完整代码检查
pnpm lint

# 分类检查
pnpm lint:script    # JavaScript/TypeScript 检查
pnpm lint:style     # 样式文件检查
pnpm lint:md        # Markdown 文档检查

# 代码格式化
pnpm format

# 拼写检查
pnpm cspell

# 规范化提交
pnpm commit
```

### 国际化
```bash
# 交互式国际化管理（推荐）
pnpm i18n

# 导出语言包（构建时自动执行）
pnpm i18n:exportLocale
```

**国际化功能说明**:
- 支持多语言管理和切换
- AI 自动翻译（使用 DeepSeek API）
- 交互式命令行工具
- 自动提取待翻译文本
- 支持语言包导入导出
- 翻译结果合并和恢复

### 骨架屏

项目支持在路由配置中使用骨架屏，提升页面加载体验。

**路由配置示例**:

```typescript
// 使用预置类型 - 卡片型
{
  path: '/home',
  name: 'Home',
  component: () => import('@/views/home/index.vue'),
  meta: {
    title: '首页',
    skeleton: {
      type: 'card',
      props: { count: 4, rows: 3, columns: 2 },
    },
  },
}

// 使用预置类型 - 表格型
{
  path: '/user-list',
  name: 'UserList',
  component: () => import('@/views/user-list/index.vue'),
  meta: {
    title: '用户列表',
    skeleton: {
      type: 'table',
      props: { columns: 6, rows: 10 },
    },
  },
}
```

**骨架屏功能说明**:
- 支持路由级和组件级骨架屏
- 预置 4 种骨架屏组件（Card、List、Layout、Login）
- 支持自定义骨架屏组件
- TypeScript 类型安全
- 基于 Vant van-skeleton

**详细配置**: 参见 [.claude/agents/router-development.md#骨架屏配置](.claude/agents/router-development.md#骨架屏配置)

### 构建相关
```bash
# 构建生产版本
pnpm build

# 预览构建结果
pnpm preview

# 分析构建产物
pnpm analyzer

# 上传到 Sentry
pnpm uploadToSentry

# 清理构建产物
pnpm clean
```

## 🐳 Docker 部署

本项目提供了完整的 Docker 部署方案，支持快速部署和版本管理。

### 方式一：本地开发部署（推荐）

使用 Docker 快速启动本地开发环境：

```bash
# 进入部署目录
cd deploy

# 启动容器（默认端口 31180）
./manage.sh start

# 使用自定义端口启动
PORT=3000 ./manage.sh start

# 查看容器状态
./manage.sh status

# 查看容器日志
./manage.sh logs

# 停止容器
./manage.sh stop

# 重启容器
./manage.sh restart

# 清理容器和镜像
./manage.sh clean

# 查看所有可用命令
./manage.sh help
```

**访问地址**:
- 应用首页: http://localhost:31180
- 版本信息: http://localhost:31180/web/version

**详细说明**: 查看 [deploy/README.md](./deploy/README.md)

### 方式二：生产环境部署

构建完整的部署包用于生产环境：

```bash
# 1. 构建标准部署包
./package.sh

# 2. 构建完整部署包（包含静态资源包，用于热更新）
./package.sh --full

# 3. 将生成的部署包上传到服务器
# vue-admin-web_<git-hash>_<timestamp>.tar.gz

# 4. 在服务器上解压并部署
tar -xzf vue-admin-web_*.tar.gz
cd vue_admin_web
./manage.sh start
```

**部署包内容**:
- Docker 镜像（tar 格式）
- Nginx 配置文件
- 部署管理脚本
- 构建信息和版本文件

**部署特性**:
- 基于 Nginx Alpine 镜像，体积小巧
- 自动生成版本信息（Git hash、构建时间、分支信息）
- 支持静态资源包生成，便于热更新
- 完整的容器管理脚本

## 🔧 配置说明

### 环境变量

项目支持多环境配置，通过不同的 `.env` 文件管理：

**开发环境** (`.env.development`):
```bash
# API 基础地址
VITE_BASEURL=http://localhost:3001/
```

**生产环境** (`.env.production`):
```bash
# API 基础地址
VITE_BASEURL=//127.0.0.1:3001/

# Sentry 配置
VITE_SENTRY_ORG=your_org
VITE_SENTRY_PROJECT=your_project
VITE_SENTRY_AUTH_TOKEN=your_auth_token
```

**本地覆盖配置** (`.env.local` - 可选):
```bash
# 是否启用 HTTPS
VITE_ENABLE_HTTPS=false

# 是否启用构建分析
VITE_ENABLE_ANALYZER=false

```

### 代理配置

在 `config/proxy.ts` 中配置开发服务器代理：

```typescript
export const proxy = {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/api/, '')
  }
};
```

### Vite 构建配置

项目在 `vite.config.ts` 中配置了以下功能：

- **插件系统**: Vue、JSX、自动导入、组件自动导入
- **开发工具**: HTTPS支持、代码检查器、Vue MCP
- **生产优化**: Legacy浏览器支持、Gzip压缩、代码分割
- **监控集成**: Sentry错误上报和源码映射
- **构建分析**: 可视化分析构建产物
- **测试配置**: Vitest 单元测试和覆盖率

### 测试配置

项目使用 Vitest 作为测试框架，配置了完整的测试环境：

**测试覆盖率要求**:
- 分支覆盖率: 80%
- 函数覆盖率: 80%
- 代码行覆盖率: 80%
- 语句覆盖率: 80%

**测试环境**:
- 基于 jsdom 模拟浏览器环境
- 支持 Vue 组件测试（@vue/test-utils）
- 内联 Vant 避免样式导入问题
- 测试文件放在 `tests/` 目录下
## 💡 最佳实践

### 代码组织
- **组件**: 全局公用组件放在 `src/components/`，页面级组件放在 `src/views/[page]/components/`
- **API**: 按功能模块划分，放在 `src/api/modules/` 目录下
- **状态管理**: 使用 Pinia，按功能划分 Store 模块
- **类型定义**: 全局类型放在 `typings/`，模块类型放在 `src/interface/`

### 开发规范
- **提交规范**: 使用 `pnpm commit` 进行规范化提交
- **代码检查**: 提交前自动运行 ESLint 和 Stylelint
- **类型安全**: 充分利用 TypeScript 类型系统
- **国际化**: 所有文本使用 i18n，支持多语言

### 性能优化
- **组件按需导入**: Vant 组件自动按需导入
- **路由懒加载**: 使用动态 import 进行路由懒加载
- **图片优化**: 小于 10KB 的图片自动转 base64
- **代码分割**: 自动按模块分割打包，控制包体积

## 🆘 常见问题

### 依赖安装问题

**依赖安装失败**:
```bash
# 清理缓存后重新安装
pnpm store prune
pnpm install
```

**Node 版本不匹配**:
```bash
# 检查 Node 版本 (需要 >= 22)
node -v

# 使用 nvm 切换版本
nvm install 22
nvm use 22
```

### 开发问题

**类型检查错误**:
```bash
# 运行类型检查
pnpm type-check

# VS Code 中重启 TypeScript 服务
# Cmd/Ctrl + Shift + P -> "TypeScript: Restart TS Server"
```

**热更新失效**:
```bash
# 检查文件路径大小写
# 确保导入路径与文件名大小写一致

# 重启开发服务器
# Ctrl + C 停止，然后重新运行 pnpm start
```

### 构建问题

**构建失败**:
```bash
# 清理构建产物后重新构建
pnpm clean
pnpm build
```

**内存溢出**:
```bash
# 构建时已设置 max-old-space-size=16384
# 如果仍然失败，检查系统可用内存
```

### Docker 部署问题

**镜像构建失败**:
```bash
# 确保已安装 Docker
docker --version

# 检查 Dockerfile 和构建上下文
# 确保 dist 目录存在
pnpm build
```

**容器无法访问**:
```bash
# 检查容器状态
cd deploy
./manage.sh status

# 查看容器日志
./manage.sh logs

# 检查端口占用
lsof -i :31180
```

## 🎯 核心功能

### 组件自动导入
- Vant 组件自动导入，无需手动注册
- Vue API 自动导入（ref、reactive、computed 等）
- 开发体验优化，减少样板代码

### 国际化系统
- 基于 vue-i18n 的完整国际化方案
- AI 自动翻译功能（DeepSeek API）
- 交互式命令行工具管理语言包
- 支持动态语言切换

### 错误监控
- Sentry 集成，实时错误追踪
- 自动上传 Source Map
- 性能监控和用户行为追踪
- 支持开发/生产环境分离

### 代码质量保障
- ESLint + TypeScript 静态代码检查
- Stylelint 样式代码检查
- Prettier 统一代码格式
- Husky Git 钩子自动化检查
- Commitizen 规范化提交
- CSpell 拼写检查

## 📖 项目文档

本项目提供完整的开发文档，涵盖所有技术细节和最佳实践：

### 核心开发规范
- **[API接口开发规范](./docs/api-development.md)** - Orval + HttpClient + Custom Mutator完整架构，请求去重、重试机制
- **[组件开发规范](./docs/component-development.md)** - Vue 3 Composition API组件开发，ErrorBoundary、Context模式
- **[路由与状态管理规范](./docs/router-and-store.md)** - 动态路由生成、权限控制、Pinia + IndexedDB持久化
- **[类型与常量规范](./docs/types-and-constants.md)** - TypeScript类型定义、常量管理最佳实践
- **[样式开发规范](./docs/styles-development.md)** - TailwindCSS 4.x + SCSS + CSS Variables主题系统
- **[工具函数开发规范](./docs/utils-development.md)** - 工具函数设计原则、纯函数、错误处理

### 综合文档
- **[前端架构设计文档](./docs/前端架构设计文档.md)** - 完整项目架构、分层设计、性能优化、安全策略
- **[开发规范文档](./docs/开发规范文档.md)** - 综合开发规范、编码规范、提交规范

> 💡 **提示**: 开始开发前，建议先阅读相关文档了解项目架构和开发规范

## 📚 外部参考文档

- [Vue 3 官方文档](https://vuejs.org/)
- [Vite 官方文档](https://vitejs.dev/)
- [TypeScript 官方文档](https://www.typescriptlang.org/)
- [Vant 4 官方文档](https://vant-ui.github.io/vant/)
- [TailwindCSS 官方文档](https://tailwindcss.com/)
- [Pinia 官方文档](https://pinia.vuejs.org/)
- [Vitest 官方文档](https://vitest.dev/)
- [Orval 官方文档](https://orval.dev/)

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`pnpm commit`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

**注意**:
- 确保所有测试通过 (`pnpm test`)
- 确保代码检查通过 (`pnpm lint`)
- 遵循项目的代码规范和提交规范

## 📄 License

本项目采用 MIT 协议，详见 [LICENSE](./LICENSE) 文件

## 📮 联系方式

如有问题或建议，欢迎通过以下方式联系：

- 提交 Issue
- 提交 Pull Request
- 邮件联系项目维护者

---

**⭐ 如果这个项目对你有帮助，请给个 Star 支持一下！**
