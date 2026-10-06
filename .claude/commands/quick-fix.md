---
description: 快速修复常见问题的诊断和解决方案
---

# 快速问题修复指南

遇到问题？使用下表快速定位和解决。

## 🔍 快速索引表

| 问题类型 | 常见错误 | 快速解决 | 详细说明 |
|---------|---------|---------|---------|
| **TypeScript** | Property does not exist | 运行 `pnpm type-check` | [详见](#typescript-类型错误) |
| **TypeScript** | Type is not assignable | 检查类型定义 → 类型断言 | [详见](#typescript-类型错误) |
| **TypeScript** | Cannot find module '@/xxx' | 检查 tsconfig.json paths | [详见](#typescript-类型错误) |
| **Vue 组件** | Props 类型不匹配 | 检查 Props 定义 | [详见](#vue-组件问题) |
| **Vue 组件** | Emits 未定义 | 添加 defineEmits | [详见](#vue-组件问题) |
| **API** | Network Error | 检查后端服务 → CORS | [详见](#api-调用问题) |
| **API** | 401 Unauthorized | 检查 token → 重新登录 | [详见](#api-调用问题) |
| **API** | Orval 生成失败 | 检查 orval.config.ts 中的 OpenAPI 地址 → `pnpm api:gen` | [详见](#api-调用问题) |
| **路由** | 404 Not Found | 检查路由配置 → path | [详见](#路由问题) |
| **路由** | 403 Forbidden | 检查权限配置 → roles | [详见](#路由问题) |
| **样式** | 硬编码颜色 | 使用 CSS 变量 (src/styles/theme.scss) | [详见](#样式问题) |
| **样式** | 标签选择器 | 改用 class 选择器 | [详见](#样式问题) |
| **构建** | Build 失败 | `pnpm type-check` → 修复类型 | [详见](#构建问题) |
| **构建** | 产物过大 | `pnpm analyzer` → 代码分割 | [详见](#构建问题) |
| **Store** | 状态丢失 | 添加 persist 配置 | [详见](#store-问题) |
| **Store** | State 未响应 | 使用 ref/reactive | [详见](#store-问题) |
| **i18n** | 翻译不生效 | 检查 `src/locale/*.json` 语言包 | [详见](#国际化问题) |
| **i18n** | 翻译缺失 | 在 `src/locale/*.json` 中补充 | [详见](#国际化问题) |
| **测试** | 测试失败 | 运行单个测试 → 查看错误 | [详见](#测试问题) |
| **测试** | 组件未挂载 | 检查 mount() 配置 | [详见](#测试问题) |
| **性能** | 页面加载慢 | `pnpm analyzer` → 懒加载 | [详见](#性能问题) |
| **性能** | 页面卡顿 | 检查 computed 依赖 → v-memo | [详见](#性能问题) |

---

## TypeScript 类型错误

### 🚀 快速解决方案

**推荐流程: 手动检查 → 深度学习**

```bash
# 1️⃣ 运行类型检查
pnpm type-check

# 2️⃣ 运行代码检查
pnpm lint

# 3️⃣ 如需深度学习 → @coding-standards
```

---

### 常见错误快速修复

| 错误信息 | 原因 | 快速修复 |
|---------|------|---------|
| `Property 'xxx' does not exist` | 类型定义不完整 | 定义完整接口 → 参考 @coding-standards |
| `Type 'any' is not assignable` | 使用 any 类型 | 改用明确类型 |
| `Cannot find module '@/xxx'` | 路径别名问题 | 检查 `tsconfig.json` 和 `vite.config.ts` |
| `Type is not assignable` | 类型不匹配 | 类型断言或类型守卫 |

**工具命令:**
```bash
# 类型检查
pnpm type-check

# 代码检查
pnpm lint
```

**详细文档:** [coding-standards.md#TypeScript规范](../agents/coding-standards.md#typescript规范)

---

## Vue 组件问题

### 🚀 快速解决方案

**推荐流程: 手动检查 → 深度学习**

```bash
# 1️⃣ 检查 Props 定义
# 参考 @component-development

# 2️⃣ 运行代码检查
pnpm lint

# 3️⃣ 如果问题仍未解决,查看下方具体错误类型
```

---

### 常见错误快速修复

| 错误信息 | 原因 | 快速修复 |
|---------|------|---------|
| `Props type mismatch` | Props 类型不匹配 | 检查 Props 定义 → 参考 @component-development |
| `Failed to resolve component` | 组件未被 easycom 匹配 | 检查组件名 (PascalCase，如 `<UNavBar />`) 与 `pages.config.ts` 的 easycom 规则 |
| `v-model not working` | Emits 未定义 | 定义 `update:modelValue` emit |
| `Slot content is empty` | 插槽未传入内容 | 检查父组件 slot 使用 |

**工具命令:**
```bash
# 代码检查
pnpm lint

# 深度学习
@component-development                 # 学习组件设计原则
```

**详细文档:** [component-development.md](../agents/component-development.md)

---

## API 调用问题

### 🚀 快速解决方案

**推荐流程: 手动修复 → Agents**

```bash
# 1️⃣ 检查 API 配置
pnpm api:gen              # 重新生成 API

# 2️⃣ 如果是类型问题
pnpm type-check

# 3️⃣ 如需深度学习
@api-development          # 学习 Orval API 规范

# 如果问题仍未解决,查看下方具体错误类型
```

---

### 常见错误快速修复

| 错误信息 | 原因 | 快速修复 |
|---------|------|---------|
| `404 Not Found` | API 路径错误 | 检查路径 → 检查代理配置 |
| `CORS policy blocked` | 跨域请求被阻止 | 配置 Vite 代理 → 后端 CORS |
| `401 Unauthorized` | Token 失效 | 检查 token → 重新登录 |
| `Type mismatch` | API 类型不匹配 | 1️⃣ `pnpm api:gen` → 2️⃣ `pnpm type-check` |
| `Network Error` | 后端服务未启动 | 启动后端 → 检查端口 |

**工具命令:**
```bash
# 手动执行
pnpm api:gen                 # 重新生成 API
pnpm type-check              # 类型检查
pnpm lint                    # 代码检查

# Agent (深度学习)
@api-development             # 学习 Orval API 规范
```

**详细文档:** [api-development.md](../agents/api-development.md)

---

## 路由问题

### 常见错误快速修复

| 错误信息 | 原因 | 快速修复 |
|---------|------|---------|
| `页面跳转失败` | 页面未生成或路径错误 | 检查页面文件是否位于 `src/pages`/`src/pages-sub` → 检查路径格式 |
| `页面不存在` | 页面未写入 pages.json | 页面中使用 `definePage({...})` 并重新运行 dev，由插件生成 `src/pages.json` |
| `分包加载失败` | 分包配置错误 | 检查 `pages.config.ts` 的 subPackages 与 `vite.config.ts` 的 UniPages subPackages 配置 |

**解决方案:**
```typescript
// 使用 useRouter composable
import { useRouter } from '@/composables';

const router = useRouter();

// 普通页面跳转
router.push('/pages-sub/user/profile/index');

// TabBar 页面跳转
router.switchTab('/pages/mine/index');
```

**详细文档:** [router-development.md](../agents/router-development.md)

---

## 样式问题

### 🚀 快速解决方案

**推荐流程: 检查 → 手动修复**

```bash
# 1️⃣ 检查样式问题
pnpm lint

# 2️⃣ 根据提示修复硬编码颜色
# 查看 src/styles/theme.scss 中的可用变量

# 3️⃣ 确保使用 rpx 单位
# 750rpx = 设计稿宽度
```

---

### 常见错误快速修复

| 错误信息 | 原因 | 快速修复 |
|---------|------|---------|
| `CSS 变量未生效` | 变量未定义或拼写错误 | 检查 `src/styles/theme.scss` 中的变量定义 |
| `样式在小程序不生效` | 使用了不支持的选择器 | 避免标签选择器，使用 class |
| `Scoped 样式不生效` | 选择器特异性问题 | 使用 class 选择器 → `:deep()` 穿透 |
| `单位不正确` | 使用了 px 而非 rpx | 改用 rpx (1px = 2rpx) |

**工具命令:**
```bash
# 代码检查
pnpm lint

# 深度学习
@common-patterns            # 查看 CSS 变量使用规范
```

**详细文档:** [common-patterns.md#CSS变量](../agents/common-patterns.md#css-变量使用规范)

---

## 构建问题

### 常见错误快速修复

| 错误信息 | 原因 | 快速修复 |
|---------|------|---------|
| `pnpm build:h5 失败` | 类型错误、依赖问题 | 清理缓存 → `pnpm type-check` → `pnpm lint` |
| `dist/build/h5/assets/*.js 过大` | 依赖过多、未代码分割 | `pnpm analyzer` → 检查依赖 → 代码分割 |

**工具命令:**
```bash
# 清理缓存
rm -rf node_modules dist .vite && pnpm install

# 类型检查和构建
pnpm type-check
pnpm build:h5

# 构建分析
pnpm analyzer
```

**详细文档:** `/optimize`

---

## Store 问题

### 常见错误快速修复

| 错误信息 | 原因 | 快速修复 |
|---------|------|---------|
| `刷新后 Store 状态丢失` | 未配置持久化 | 添加 `persist` 配置 |
| `State 未响应` | 未使用 ref/reactive | 使用 `ref()` 或 `reactive()` |

**解决方案:**
```typescript
// 启用持久化 (使用 uni.setStorageSync)
export const useUserStore = defineStore(
  'user',
  () => {
    const userInfo = ref<IUserInfo | null>(null);
    return { userInfo };
  },
  {
    persist: {
      pick: ['userInfo'],
    },
  }
);
```

**工具命令:**
```bash
# 参考 Store 开发文档
@store-development
```

**详细文档:** `@store-development`

---

## 国际化问题

### 常见错误快速修复

| 错误信息 | 原因 | 快速修复 |
|---------|------|---------|
| `$t('key') 显示为 key` | 语言包未定义或拼写错误 | 检查 `src/locale/*.json` 语言包 |
| `翻译缺失` | 新增文本未翻译 | 在 `src/locale/zh-CN.json`、`en-US.json` 中补充对应 key |

**详细文档:** [coding-standards.md#国际化原则](../agents/coding-standards.md#国际化原则)

---

## 测试问题

### 常见错误快速修复

| 错误信息 | 原因 | 快速修复 |
|---------|------|---------|
| `pnpm test 失败` | 测试用例错误、环境问题 | 运行单个测试 → 查看详细错误 |
| `组件未挂载` | mount() 配置错误 | 检查 `mount()` 参数 |
| `快照不匹配` | 组件输出变化 | `pnpm test -- -u` 更新快照 |

**工具命令:**
```bash
pnpm test -- UserCard.spec.ts        # 运行单个测试
pnpm test -- --reporter=verbose      # 详细错误信息
pnpm test -- -u                       # 更新快照
```

**详细文档:** `@testing`

---

## 性能问题

### 常见错误快速修复

| 错误信息 | 原因 | 快速修复 |
|---------|------|---------|
| `页面加载超过 5 秒` | 资源过大、未优化 | `pnpm analyzer` → 分包 → 代码分割 |
| `页面卡顿` | 计算量大、未缓存 | 检查 `computed` 依赖 → 使用 `v-memo` |
| `列表渲染慢` | 数据量大 | 虚拟滚动 → 分页加载 |

**工具命令:**
```bash
pnpm analyzer                 # 构建分析
# Chrome DevTools > Lighthouse
```

**优化措施:**
- 分包加载 (pages-sub)
- 图片懒加载和压缩
- 代码分割
- 使用 CDN

**详细文档:** `/optimize`

---

## 🚀 快速诊断工具

### 一键诊断

```bash
# 运行完整检查
pnpm type-check && \
pnpm lint && \
pnpm test
```

### 问题排查步骤

1. **清理缓存**
   ```bash
   rm -rf node_modules dist .vite
   pnpm install
   ```

2. **运行类型检查**
   ```bash
   pnpm type-check
   ```

3. **运行代码检查**
   ```bash
   pnpm lint
   ```

4. **运行测试**
   ```bash
   pnpm test
   ```

5. **构建检查**
   ```bash
   pnpm build:h5
   ```

---

## 📚 获取帮助

### 查阅文档

- `@common-patterns` - 通用开发模式
- `@component-development` - 组件开发规范
- `@api-development` - API 调用规范
- `@router-development` - 路由配置
- `@store-development` - Pinia Store
- `@coding-standards` - 编码规范
- `@testing` - 测试规范

### 使用 Commands 和 Agents

- `/git-workflow` - Git 工作流规范
- `/optimize` - 性能优化指南
- `/security-check` - 安全检查清单
- `@component-development` - 组件开发规范
- `@api-development` - API 开发规范
- `@testing` - 测试策略和规范

---

**问题没解决？请提供详细的错误信息和代码片段，我会帮你诊断和修复！**
