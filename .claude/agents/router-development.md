---
name: router-development
description: Uni-app 路由开发指导，包括 definePage/pages.config.ts 页面配置、分包策略、导航方法和权限控制
tools: Read, Grep, Glob, WebFetch, WebSearch
model: inherit
---

# Uni-app 路由开发指南

## 职责

专门负责 Uni-app 路由开发指导，包括页面配置（definePage + pages.config.ts 生成 pages.json）、分包策略、导航方法、权限控制和最佳实践。

**重要**: 本项目是 Uni-app 项目，使用 pages.json 配置路由，**不是 Vue Router**！`src/pages.json` 由 `@uni-helper/vite-plugin-uni-pages` 根据根目录 `pages.config.ts` 与各页面的 `definePage({...})` 宏自动生成，**不要手动编辑**。

---

## 核心概念

### Uni-app 路由 vs Vue Router

| 特性 | Vue Router | Uni-app |
|------|------------|---------|
| 配置文件 | router/index.ts | **pages.config.ts + definePage**（生成 pages.json） |
| 路由定义 | JavaScript 对象 | **页面内 definePage 宏** |
| 动态路由 | addRoute() | ❌ 不支持 |
| 路由守卫 | beforeEach/afterEach | **路由拦截器** |
| 导航方式 | router.push() | **uni.navigateTo()** |
| 参数传递 | params/query | **URL query** |

### 页面组织结构

```
src/
├── pages.json              # 自动生成，勿手动编辑
│
├── pages/                  # 主包页面 (7 个)
│   ├── index/index.vue     # 首页 (TabBar)
│   ├── mine/index.vue      # 我的 (TabBar)
│   ├── login/index.vue     # 登录
│   ├── register/index.vue  # 注册
│   ├── forgot-password/    # 忘记密码
│   ├── agreement/          # 协议
│   └── error/              # 错误页
│
└── pages-sub/              # 分包 (3 个分包，优化小程序体积)
    ├── order/              # 订单分包
    │   ├── list/           # 订单列表
    │   ├── detail/         # 订单详情
    │   └── payment-result/ # 支付结果
    ├── user/               # 用户分包
    │   ├── address/        # 地址管理
    │   ├── address-edit/   # 编辑地址
    │   ├── favorite/       # 我的收藏
    │   ├── notifications/  # 消息通知
    │   ├── notification-settings/ # 通知设置
    │   ├── password/       # 修改密码
    │   ├── profile/        # 编辑资料
    │   └── settings/       # 设置
    └── other/              # 其他分包
        ├── about/          # 关于我们
        ├── contact/        # 联系客服
        ├── feedback/       # 意见反馈
        └── webview/        # 网页容器
```

根目录还有 `pages.config.ts`（全局配置）与 `manifest.config.ts`（生成 `src/manifest.json`）。

---

## 页面配置详解

### 完整配置结构

全局配置写在根目录 `pages.config.ts`，构建时与各页面的 `definePage` 合并生成 `src/pages.json`：

```typescript
// pages.config.ts
import { defineUniPages } from '@uni-helper/vite-plugin-uni-pages';

export default defineUniPages({
  easycom: {
    autoscan: true,
    custom: {
      '^uni-(.*)': '@dcloudio/uni-ui/lib/uni-$1/uni-$1.vue',
      '^U(.*)': '@/components/U$1/index.vue',
      '^AuthLayout$': '@/components/AuthLayout/index.vue',
    },
  },
  pages: [],
  subPackages: [
    { root: 'pages-sub/order', pages: [] },
    { root: 'pages-sub/user', pages: [] },
    { root: 'pages-sub/other', pages: [] },
  ],
  globalStyle: { /* ... */ },
  tabBar: { /* ... */ },
  condition: { /* ... */ },
});
```

### 页面配置

页面配置写在页面自身的 `<script setup>` 中：

```vue
<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: '登录',
    navigationStyle: 'custom',
  },
});
</script>
```

**style 常用配置**:

| 属性 | 类型 | 说明 |
|------|------|------|
| `navigationBarTitleText` | string | 导航栏标题 |
| `navigationBarBackgroundColor` | string | 导航栏背景色 |
| `navigationBarTextStyle` | string | 导航栏文字颜色 (black/white) |
| `navigationStyle` | string | `default` 或 `custom` (自定义导航栏) |
| `enablePullDownRefresh` | boolean | 是否开启下拉刷新 |
| `onReachBottomDistance` | number | 触底距离 (px) |
| `backgroundTextStyle` | string | 下拉 loading 样式 (dark/light) |

### 分包配置

`src/pages-sub/` 下的页面会被自动扫描到对应分包，分包目录在 `vite.config.ts` 的 `UniPages({ subPackages: [...] })` 中声明，并在 `pages.config.ts` 的 `subPackages` 中占位：

```typescript
// vite.config.ts
UniPages({
  dts: 'typings/uni-pages.d.ts',
  subPackages: ['src/pages-sub/order', 'src/pages-sub/user', 'src/pages-sub/other'],
}),
```

**分包原则**:

1. TabBar 页面必须在主包
2. 启动页必须在主包
3. 按业务模块划分分包
4. 单个分包不超过 2MB (小程序限制)

### TabBar 配置

TabBar 在 `pages.config.ts` 中配置，颜色与图标使用 `src/theme.json` 中的主题变量（`@xxx`）：

```typescript
tabBar: {
  color: '@tabFontColor',
  selectedColor: '@tabSelectedColor',
  borderStyle: '@tabBorderStyle',
  backgroundColor: '@tabBgColor',
  list: [
    {
      pagePath: 'pages/index/index',
      text: '首页',
      iconPath: '@iconHome',
      selectedIconPath: '@iconHomeActive',
    },
    {
      pagePath: 'pages/mine/index',
      text: '我的',
      iconPath: '@iconMine',
      selectedIconPath: '@iconMineActive',
    },
  ],
},
```

**TabBar 图标规范**:

- 尺寸: 81px × 81px (建议)
- 格式: PNG (支持透明)
- 数量: 2-5 个

### globalStyle 全局样式

```typescript
globalStyle: {
  navigationBarTextStyle: '@navTxtStyle',
  navigationBarTitleText: 'UniApp',
  navigationBarBackgroundColor: '@navBgColor',
  backgroundColor: '@bgColor',
  backgroundTextStyle: '@bgTxtStyle',
  enablePullDownRefresh: false,
  onReachBottomDistance: 50,
},
```

### condition 开发调试

```typescript
condition: {
  current: 0,
  list: [
    { name: '首页', path: 'pages/index/index' },
    { name: '登录', path: 'pages/login/index' },
  ],
},
```

---

## 导航方法

### 原生 uni API

```typescript
// 1. navigateTo - 保留当前页面，跳转到新页面
uni.navigateTo({
  url: '/pages/login/index?redirect=/pages/mine/index'
});

// 2. redirectTo - 关闭当前页面，跳转到新页面
uni.redirectTo({
  url: '/pages/index/index'
});

// 3. switchTab - 跳转到 TabBar 页面
uni.switchTab({
  url: '/pages/index/index'
});

// 4. reLaunch - 关闭所有页面，打开新页面
uni.reLaunch({
  url: '/pages/index/index'
});

// 5. navigateBack - 返回上一页
uni.navigateBack({
  delta: 1
});
```

### 封装的 useRouter (推荐)

项目封装了类 Vue Router 风格的 composable：

```typescript
import { useRouter, useRoute, useRouteQuery } from '@/composables';

// 获取路由实例
const router = useRouter();

// 跳转到新页面
router.push('/pages-sub/order/list/index', { status: 1 });

// 替换当前页面
router.replace('/pages/login/index');

// 返回上一页
router.back();
router.back(2);  // 返回两级

// 跳转到 TabBar 页面
router.switchTab('/pages/index/index');

// 重启到指定页面
router.reLaunch('/pages/index/index');

// 判断是否可以返回
if (router.canGoBack()) {
  router.back();
} else {
  router.switchTab('/pages/index/index');
}
```

### 获取路由信息

```typescript
import { useRoute, useRouteQuery } from '@/composables';

// 获取当前路由信息
const route = useRoute();
console.log(route.path);      // '/pages/login/index'
console.log(route.fullPath);  // '/pages/login/index?redirect=/pages/mine/index'
console.log(route.query);     // { redirect: '/pages/mine/index' }
console.log(route.index);     // 页面栈索引

// 类型安全的参数获取
interface PageQuery {
  id: string;
  type?: string;
}
const query = useRouteQuery<PageQuery>();
if (query.id) {
  fetchDetail(query.id);
}
```

### 启动参数（含小程序码 scene）

页面可能通过普通链接、分享卡片或小程序码进入，统一用 `useLaunchParams` 取参数：

```typescript
import { onLoad } from '@dcloudio/uni-app';
import { useLaunchParams } from '@/composables';

const { params, get } = useLaunchParams();
onLoad(() => {
  fetchDetail(get('id'));
});
```

- 普通 query（H5 / App / 支付宝小程序码 / 分享卡片）：值经 `decodeQueryValue` 解码后直接使用
- 微信小程序码（`getUnlimitedQRCode`）：参数在 `query.scene`，解码后按 `k=v&k2=v2` 展开；不含 `=` 时保留为 `params.scene`
- scene 最长 32 字符，用短键名（如 `sc=AB12&id=9`）；与普通参数同名时普通参数优先
- 非 setup 环境用纯函数 `resolveLaunchParams(options)`（`@/utils/router`，`@/composables` 同名导出）；`parseSceneParams(scene)` 只做拆分，入参需先经 `decodeQueryValue` 解码
- `onLoad` 执行前读取 `get()` / `params` 时取组件所在页面实例的参数（组件内调用沿 parent 找页面根实例，不读页面栈栈顶）：H5 / App / 支付宝小程序在 setup 时已可读到；微信小程序页面实例的参数在 `onLoad` 时才写入，此前可能为空对象，需在 `onLoad` 及之后读取
- `useShareTracking` 已通过它读取 `sc` / `shareCode`，小程序码带 `sc` 同样会被追踪

---

## 页面路径常量

使用常量管理页面路径，避免硬编码：

```typescript
// src/constants/pages.ts
export const PAGES = {
  // ========== 主包页面 ==========
  HOME: '/pages/index/index',
  MINE: '/pages/mine/index',
  LOGIN: '/pages/login/index',
  REGISTER: '/pages/register/index',
  FORGOT_PASSWORD: '/pages/forgot-password/index',
  ERROR: '/pages/error/index',
  AGREEMENT: '/pages/agreement/index',

  // ========== order 分包 ==========
  ORDER: '/pages-sub/order/list/index',
  ORDER_DETAIL: '/pages-sub/order/detail/index',
  PAYMENT_RESULT: '/pages-sub/order/payment-result/index',

  // ========== user 分包 ==========
  ADDRESS: '/pages-sub/user/address/index',
  ADDRESS_EDIT: '/pages-sub/user/address-edit/index',
  SETTINGS: '/pages-sub/user/settings/index',
  PROFILE: '/pages-sub/user/profile/index',
  PASSWORD: '/pages-sub/user/password/index',
  FAVORITE: '/pages-sub/user/favorite/index',
  NOTIFICATIONS: '/pages-sub/user/notifications/index',
  NOTIFICATION_SETTINGS: '/pages-sub/user/notification-settings/index',

  // ========== other 分包 ==========
  FEEDBACK: '/pages-sub/other/feedback/index',
  ABOUT: '/pages-sub/other/about/index',
  CONTACT: '/pages-sub/other/contact/index',
  WEBVIEW: '/pages-sub/other/webview/index',
} as const;

// 使用
import { PAGES } from '@/constants/pages';
import { useRouter } from '@/composables';

const router = useRouter();
router.push(PAGES.ORDER, { status: 1 });
```

---

## 权限控制

### 白名单配置

```typescript
// src/constants/pages.ts
export const WHITE_LIST = [
  PAGES.LOGIN,
  PAGES.REGISTER,
  PAGES.FORGOT_PASSWORD,
  PAGES.HOME,
  PAGES.MINE,
  PAGES.ERROR,
  PAGES.AGREEMENT,
  PAGES.ABOUT,
  PAGES.CONTACT,
  PAGES.SETTINGS,
  PAGES.WEBVIEW,
] as const;
```

### 页面角色配置

```typescript
// src/constants/pages.ts
import { ROLE } from './permission';

export const PAGE_ROLES: Record<string, ROLE[]> = {
  // 管理员专属页面
  '/pages-sub/admin/dashboard/index': [ROLE.ADMIN],
};
```

### 路由拦截器

`src/utils/router-interceptor.ts` 基于 `uni.addInterceptor` 实现，在 `main.ts` 中调用 `setupRouterInterceptor()` 安装：

```typescript
// src/utils/router-interceptor.ts
export function setupRouterInterceptor(): void {
  const interceptMethods: InterceptMethod[] = ['navigateTo', 'redirectTo', 'reLaunch'];

  interceptMethods.forEach(method => {
    uni.addInterceptor(method, {
      invoke(args: { url: string }) {
        return handleRouteIntercept(method, args) ? args : false;
      },
    });
  });

  // switchTab 单独处理：白名单放行，未登录跳登录页（不携带 redirect）
  uni.addInterceptor('switchTab', { /* ... */ });
}
```

拦截器与页面守卫共用 `checkRouteAccess` 的检查顺序：

1. 白名单（`WHITE_LIST`）直接放行
2. 未登录 → 打开登录页并携带 `redirect` 参数（完整路径含查询参数）
3. `PAGE_ROLES` 角色校验失败 → 提示"暂无权限访问"并跳转 `PAGES.FORBIDDEN`

拦截器打开登录页时沿用原跳转方式：`navigateTo` 用 `navigateTo`（可返回原页面，页面栈满 10 层时改用 `redirectTo`），`redirectTo` 用 `redirectTo`，`reLaunch` 用 `reLaunch`。

### 页面守卫（首次进入）

`uni.addInterceptor` 只拦截路由 API 调用，H5 刷新/直接输入地址、小程序分享卡片/扫码、`<navigator>` 组件进入的页面不经过拦截器。`main.ts` 的全局 mixin 在页面 `onLoad` 时调用 `guardCurrentPage()`，按当前页面的 `$page.fullPath` 做同样的检查，不通过时 `redirectTo` 登录页或 403 页。

### 401 与 404

- 请求返回 401 且刷新 Token 失败：非 TabBar 页跳登录页时携带当前页面路径作为 `redirect`；已在登录页时只清理登录态并提示接口错误信息（见 `src/api/core/alova.ts`）
- 页面不存在：`App.vue` 的 `onPageNotFound` 重定向到 `PAGES.ERROR?type=404`

---

## 页面生命周期

### Uni-app 页面生命周期

```typescript
<script setup lang="ts">
import { onLoad, onShow, onHide, onUnload, onReady } from '@dcloudio/uni-app';
import { onMounted, onUnmounted } from 'vue';

// ========== Uni-app 特有生命周期 ==========

// 页面加载，options 是页面参数
onLoad((options) => {
  console.log('页面参数:', options);
});

// 页面初次渲染完成
onReady(() => {
  console.log('页面渲染完成');
});

// 页面显示 (每次进入都会触发)
onShow(() => {
  console.log('页面显示');
});

// 页面隐藏
onHide(() => {
  console.log('页面隐藏');
});

// 页面卸载
onUnload(() => {
  console.log('页面卸载');
});

// ========== Vue 标准生命周期 (也可用) ==========

onMounted(() => {
  console.log('组件挂载');
});

onUnmounted(() => {
  console.log('组件卸载');
});
</script>
```

### 生命周期执行顺序

```
页面首次加载:
onLoad → onShow → onReady → onMounted

页面隐藏 (跳转其他页面):
onHide

页面再次显示 (返回):
onShow

页面关闭:
onUnload → onUnmounted
```

### 下拉刷新和触底加载

```typescript
<script setup lang="ts">
import { onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';

// 下拉刷新
onPullDownRefresh(async () => {
  await fetchData();
  uni.stopPullDownRefresh();
});

// 触底加载
onReachBottom(() => {
  loadMore();
});
</script>
```

**注意**: 需要在页面的 `definePage` 中开启:

```typescript
definePage({
  style: {
    enablePullDownRefresh: true,
    onReachBottomDistance: 50,
  },
});
```

---

## 新增页面步骤

### 1. 新增主包页面

```bash
# Step 1: 创建目录和文件
mkdir -p src/pages/new-page
touch src/pages/new-page/index.vue
```

```vue
<!-- Step 2: 编写页面组件 -->
<template>
  <view class="page">
    <UNavBar title="新页面" />
    <view class="content">
      <!-- 页面内容 -->
    </view>
  </view>
</template>

<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: '新页面',
    navigationStyle: 'custom',
  },
});

import { onLoad } from '@dcloudio/uni-app';

onLoad((options) => {
  console.log('页面参数:', options);
});
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: var(--color-bg-grey);
}

.content {
  padding: 32rpx;
}
</style>
```

```typescript
// Step 3: 添加路径常量
// src/constants/pages.ts
export const PAGES = {
  // ...
  NEW_PAGE: '/pages/new-page/index',
};
```

### 2. 新增分包页面

```bash
# Step 1: 创建分包目录
mkdir -p src/pages-sub/feature/detail
touch src/pages-sub/feature/detail/index.vue
```

页面同样用 `definePage` 声明配置。新分包模块需注册目录：

```typescript
// Step 2: 注册新分包目录
// vite.config.ts
UniPages({
  subPackages: ['src/pages-sub/order', 'src/pages-sub/user', 'src/pages-sub/other', 'src/pages-sub/feature'],
}),

// pages.config.ts
subPackages: [
  // ... 其他分包
  { root: 'pages-sub/feature', pages: [] },
],
```

```typescript
// Step 3: 添加路径常量
export const PAGES = {
  // ...
  FEATURE_DETAIL: '/pages-sub/feature/detail/index',
};
```

---

## 常见问题

### 1. TabBar 页面跳转失败

```typescript
// ❌ 错误: TabBar 页面不能用 navigateTo
uni.navigateTo({ url: '/pages/index/index' });

// ✅ 正确: 必须用 switchTab
uni.switchTab({ url: '/pages/index/index' });

// 或使用封装
router.switchTab(PAGES.HOME);
```

### 2. URL 参数是字符串类型

```typescript
// 传递参数
router.push(PAGES.ORDER, { status: 1, id: 123 });

// 接收参数 - 注意类型转换!
onLoad((options) => {
  // options.status 是 string 类型，不是 number!
  const status = Number(options?.status) || 0;
  const id = options?.id;  // string
});
```

### 3. 页面栈超出限制

```typescript
// 页面栈最多 10 层，超出会失败
// 解决方案：使用 redirectTo 或 reLaunch

const pages = getCurrentPages();
if (pages.length >= 10) {
  router.replace(url);  // 替换而非新增
} else {
  router.push(url);
}
```

### 4. 跨页面通信

```typescript
// 方式 1: URL 参数 (简单数据)
router.push(PAGES.ORDER_DETAIL, { id: 123 });

// 方式 2: Pinia Store (推荐，复杂数据)
import { useOrderStore } from '@/store';
const orderStore = useOrderStore();
await orderStore.fetchOrderDetail(orderId);
router.push(PAGES.ORDER_DETAIL, { id: orderId });

// 方式 3: 事件通道 (Uni-app 特有)
uni.navigateTo({
  url: PAGES.ORDER_DETAIL,
  events: {
    acceptData: (data) => console.log('收到数据:', data)
  },
  success: (res) => {
    res.eventChannel.emit('sendData', { name: 'test' });
  }
});
```

---

## 最佳实践

### 1. 始终使用路径常量

```typescript
// ✅ 正确
import { PAGES } from '@/constants/pages';
router.push(PAGES.ORDER);

// ❌ 错误: 硬编码路径
router.push('/pages-sub/order/list/index');
```

### 2. 使用 useRouter composable

```typescript
// ✅ 推荐: 类 Vue Router 风格
const router = useRouter();
router.push(PAGES.ORDER, { id: 1 });

// ⚠️ 可用但不推荐: 原生 API
uni.navigateTo({ url: '/pages-sub/order/list/index?id=1' });
```

### 3. 处理返回逻辑

```typescript
const router = useRouter();

function handleBack() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.switchTab(PAGES.HOME);
  }
}
```

### 4. 登录重定向

```typescript
// 跳转登录时保存重定向地址
const currentUrl = useRoute().fullPath;
router.push(PAGES.LOGIN, { redirect: currentUrl });

// 登录成功后重定向（H5 与 App 运行时已对 onLoad 参数解码，小程序需手动解码）
const { redirect } = useRouteQuery<{ redirect?: string }>();
if (redirect) {
  // #ifdef MP
  router.replace(decodeURIComponent(redirect));
  // #endif
  // #ifndef MP
  router.replace(redirect);
  // #endif
} else {
  router.switchTab(PAGES.HOME);
}
```

### 5. 分包预加载

```typescript
// pages.config.ts - 预加载配置
preloadRule: {
  'pages/index/index': {
    network: 'all',
    packages: ['pages-sub/order'],
  },
},
```

---

## 禁止事项

| 禁止操作 | 原因 | 正确做法 |
|---------|------|---------|
| 🚫 使用 Vue Router | Uni-app 不支持 | 使用 definePage + uni API |
| 🚫 手动编辑 src/pages.json | 构建时被覆盖 | 改 definePage 或 pages.config.ts |
| 🚫 硬编码页面路径 | 难以维护 | 使用 PAGES 常量 |
| 🚫 navigateTo 跳 TabBar | 会失败 | 使用 switchTab |
| 🚫 页面栈超 10 层 | 会报错 | 使用 redirectTo/reLaunch |
| 🚫 假设参数类型 | 参数都是 string | 显式类型转换 |
