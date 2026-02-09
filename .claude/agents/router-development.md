---
name: router-development
description: Uni-app 路由开发指导，包括 pages.json 配置、分包策略、导航方法和权限控制
tools: Read, Grep, Glob, WebFetch, WebSearch
model: inherit
---

# Uni-app 路由开发指南

## 职责

专门负责 Uni-app 路由开发指导，包括 pages.json 配置、分包策略、导航方法、权限控制和最佳实践。

**重要**: 本项目是 Uni-app 项目，使用 pages.json 配置路由，**不是 Vue Router**！

---

## 核心概念

### Uni-app 路由 vs Vue Router

| 特性 | Vue Router | Uni-app |
|------|------------|---------|
| 配置文件 | router/index.ts | **pages.json** |
| 路由定义 | JavaScript 对象 | **JSON 配置** |
| 动态路由 | addRoute() | ❌ 不支持 |
| 路由守卫 | beforeEach/afterEach | **路由拦截器** |
| 导航方式 | router.push() | **uni.navigateTo()** |
| 参数传递 | params/query | **URL query** |

### 页面组织结构

```
src/
├── pages.json              # 路由配置 (核心!)
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
    │   └── list/           # 订单列表
    ├── user/               # 用户分包
    │   ├── address/        # 地址管理
    │   ├── address-edit/   # 编辑地址
    │   ├── favorite/       # 我的收藏
    │   ├── password/       # 修改密码
    │   ├── profile/        # 编辑资料
    │   └── settings/       # 设置
    └── other/              # 其他分包
        ├── about/          # 关于我们
        ├── contact/        # 联系客服
        └── feedback/       # 意见反馈
```

---

## pages.json 配置详解

### 完整配置结构

```json
{
  "easycom": {
    "autoscan": true,
    "custom": {
      "^uni-(.*)": "@dcloudio/uni-ui/lib/uni-$1/uni-$1.vue",
      "^u-(.*)": "@/components/U$1/index.vue"
    }
  },
  "pages": [
    // 主包页面配置...
  ],
  "subPackages": [
    // 分包配置...
  ],
  "globalStyle": {
    // 全局样式配置...
  },
  "tabBar": {
    // TabBar 配置...
  },
  "condition": {
    // 开发调试配置...
  }
}
```

### 页面配置

```json
{
  "pages": [
    {
      "path": "pages/index/index",
      "type": "home",
      "style": {
        "navigationBarTitleText": "首页",
        "enablePullDownRefresh": true
      }
    },
    {
      "path": "pages/login/index",
      "type": "page",
      "style": {
        "navigationBarTitleText": "登录",
        "navigationStyle": "custom"
      }
    }
  ]
}
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

```json
{
  "subPackages": [
    {
      "root": "pages-sub/order",
      "pages": [
        {
          "path": "list/index",
          "type": "page",
          "style": {
            "navigationBarTitleText": "我的订单"
          }
        }
      ]
    },
    {
      "root": "pages-sub/user",
      "pages": [
        { "path": "address/index", "style": { "navigationBarTitleText": "地址管理" } },
        { "path": "address-edit/index", "style": { "navigationBarTitleText": "编辑地址" } },
        { "path": "favorite/index", "style": { "navigationBarTitleText": "我的收藏" } },
        { "path": "password/index", "style": { "navigationBarTitleText": "修改密码" } },
        { "path": "profile/index", "style": { "navigationBarTitleText": "编辑资料" } },
        { "path": "settings/index", "style": { "navigationBarTitleText": "设置" } }
      ]
    }
  ]
}
```

**分包原则**:

1. TabBar 页面必须在主包
2. 启动页必须在主包
3. 按业务模块划分分包
4. 单个分包不超过 2MB (小程序限制)

### TabBar 配置

```json
{
  "tabBar": {
    "color": "#999999",
    "selectedColor": "#07c160",
    "borderStyle": "black",
    "backgroundColor": "#ffffff",
    "list": [
      {
        "pagePath": "pages/index/index",
        "text": "首页",
        "iconPath": "static/tabbar/home.png",
        "selectedIconPath": "static/tabbar/home-active.png"
      },
      {
        "pagePath": "pages/mine/index",
        "text": "我的",
        "iconPath": "static/tabbar/mine.png",
        "selectedIconPath": "static/tabbar/mine-active.png"
      }
    ]
  }
}
```

**TabBar 图标规范**:

- 尺寸: 81px × 81px (建议)
- 格式: PNG (支持透明)
- 数量: 2-5 个

### globalStyle 全局样式

```json
{
  "globalStyle": {
    "navigationBarTextStyle": "black",
    "navigationBarTitleText": "UniApp",
    "navigationBarBackgroundColor": "#ffffff",
    "backgroundColor": "#f7f8fa",
    "backgroundTextStyle": "dark",
    "enablePullDownRefresh": false,
    "onReachBottomDistance": 50
  }
}
```

### condition 开发调试

```json
{
  "condition": {
    "current": 0,
    "list": [
      { "name": "首页", "path": "pages/index/index" },
      { "name": "登录", "path": "pages/login/index" },
      { "name": "订单", "path": "pages-sub/order/list/index", "query": "status=1" }
    ]
  }
}
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

  // ========== user 分包 ==========
  ADDRESS: '/pages-sub/user/address/index',
  ADDRESS_EDIT: '/pages-sub/user/address-edit/index',
  SETTINGS: '/pages-sub/user/settings/index',
  PROFILE: '/pages-sub/user/profile/index',
  PASSWORD: '/pages-sub/user/password/index',
  FAVORITE: '/pages-sub/user/favorite/index',

  // ========== other 分包 ==========
  FEEDBACK: '/pages-sub/other/feedback/index',
  ABOUT: '/pages-sub/other/about/index',
  CONTACT: '/pages-sub/other/contact/index',
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
  PAGES.ERROR,
  PAGES.AGREEMENT,
  PAGES.ABOUT,
] as const;
```

### 页面角色配置

```typescript
// src/constants/pages.ts
import { ROLE } from './permission';

export const PAGE_ROLES: Record<string, ROLE[]> = {
  // 管理员专属页面
  '/pages-sub/admin/dashboard/index': [ROLE.ADMIN],
  // VIP 用户专属页面
  '/pages-sub/vip/exclusive/index': [ROLE.ADMIN, ROLE.VIP],
};
```

### 路由拦截器

```typescript
// src/utils/routerInterceptor.ts
import { useUserStore } from '@/store';
import { WHITE_LIST, PAGES, PAGE_ROLES } from '@/constants/pages';
import { isInWhiteList, getPathFromUrl } from '@/utils/router';

/**
 * 安装路由拦截器
 */
export function setupRouterInterceptor() {
  // 拦截 navigateTo
  const originalNavigateTo = uni.navigateTo;
  uni.navigateTo = function (options) {
    if (checkPermission(options.url)) {
      return originalNavigateTo.call(this, options);
    }
    return Promise.reject(new Error('Permission denied'));
  };

  // 拦截 redirectTo
  const originalRedirectTo = uni.redirectTo;
  uni.redirectTo = function (options) {
    if (checkPermission(options.url)) {
      return originalRedirectTo.call(this, options);
    }
    return Promise.reject(new Error('Permission denied'));
  };

  // 拦截 reLaunch
  const originalReLaunch = uni.reLaunch;
  uni.reLaunch = function (options) {
    if (checkPermission(options.url)) {
      return originalReLaunch.call(this, options);
    }
    return Promise.reject(new Error('Permission denied'));
  };
}

/**
 * 检查页面访问权限
 */
function checkPermission(url: string): boolean {
  const path = getPathFromUrl(url);

  // 1. 白名单检查 - 直接放行
  if (isInWhiteList(url, WHITE_LIST)) {
    return true;
  }

  // 2. 登录检查
  const userStore = useUserStore();
  if (!userStore.isLoggedIn) {
    uni.navigateTo({
      url: `${PAGES.LOGIN}?redirect=${encodeURIComponent(url)}`
    });
    return false;
  }

  // 3. 角色权限检查
  const requiredRoles = PAGE_ROLES[path];
  if (requiredRoles && requiredRoles.length > 0) {
    if (!requiredRoles.includes(userStore.role)) {
      uni.showToast({ title: '无权限访问', icon: 'none' });
      return false;
    }
  }

  return true;
}
```

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

**注意**: 需要在 pages.json 中开启:

```json
{
  "path": "pages/index/index",
  "style": {
    "enablePullDownRefresh": true,
    "onReachBottomDistance": 50
  }
}
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
    <u-nav-bar title="新页面" />
    <view class="content">
      <!-- 页面内容 -->
    </view>
  </view>
</template>

<script setup lang="ts">
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

```json
// Step 3: pages.json 添加页面配置
{
  "pages": [
    // ... 其他页面
    {
      "path": "pages/new-page/index",
      "style": {
        "navigationBarTitleText": "新页面",
        "navigationStyle": "custom"
      }
    }
  ]
}
```

```typescript
// Step 4: 添加路径常量
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

```json
// Step 2: pages.json 添加分包配置
{
  "subPackages": [
    // ... 其他分包
    {
      "root": "pages-sub/feature",
      "pages": [
        {
          "path": "detail/index",
          "style": {
            "navigationBarTitleText": "详情页"
          }
        }
      ]
    }
  ]
}
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
router.push(PAGES.DETAIL, { id: 123 });

// 方式 2: Pinia Store (推荐，复杂数据)
import { useOrderStore } from '@/store';
const orderStore = useOrderStore();
orderStore.setCurrentOrder(orderData);
router.push(PAGES.DETAIL);

// 方式 3: 事件通道 (Uni-app 特有)
uni.navigateTo({
  url: PAGES.DETAIL,
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

// 登录成功后重定向
const { redirect } = useRouteQuery<{ redirect?: string }>();
if (redirect) {
  router.replace(decodeURIComponent(redirect));
} else {
  router.switchTab(PAGES.HOME);
}
```

### 5. 分包预加载

```json
// pages.json - 预加载配置
{
  "preloadRule": {
    "pages/index/index": {
      "network": "all",
      "packages": ["pages-sub/order"]
    }
  }
}
```

---

## 禁止事项

| 禁止操作 | 原因 | 正确做法 |
|---------|------|---------|
| 🚫 使用 Vue Router | Uni-app 不支持 | 使用 pages.json + uni API |
| 🚫 硬编码页面路径 | 难以维护 | 使用 PAGES 常量 |
| 🚫 navigateTo 跳 TabBar | 会失败 | 使用 switchTab |
| 🚫 页面栈超 10 层 | 会报错 | 使用 redirectTo/reLaunch |
| 🚫 假设参数类型 | 参数都是 string | 显式类型转换 |
