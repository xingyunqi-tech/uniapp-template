---
name: router-development
description: Vue Router 路由开发指导,包括路由配置、权限控制、路由守卫和最佳实践
---

# 路由开发规范

## 职责
专门负责 Vue Router 路由开发指导,包括路由配置、权限控制、路由守卫、动态路由管理和最佳实践。

---

## 🏗️ 项目路由架构

### 路由目录结构

```
src/router/
├── index.ts                    # 路由入口,创建 router 实例
├── guards.ts                   # 路由守卫配置
└── routes/                     # 路由配置目录
    ├── index.ts                # 路由统一导出
    ├── base.ts                 # 基础路由(登录、404等)
    ├── common.ts               # 公共路由(所有登录用户可访问)
    └── async.ts                # 异步路由(需要权限控制)
```

### 三层路由体系

项目采用**三层路由体系**,根据权限需求分层管理:

| 路由类型 | 文件 | 特点 | 适用场景 |
|---------|------|------|---------|
| **基础路由** | `base.ts` | 无需登录,静态注册 | 登录页、404、403 |
| **公共路由** | `common.ts` | 需要登录,所有角色可访问 | 首页、个人中心 |
| **异步路由** | `async.ts` | 需要登录+权限,动态注册 | 管理页面、设置页面 |

---

## 📝 路由配置规范

### 路由配置模板

#### 1. 基础路由模板 (base.ts)

基础路由是**无需登录**即可访问的页面,在应用启动时**静态注册**。

```typescript
// 基础路由模板
{
  path: '/路径',
  name: '路由名称',
  component: () => import('@/views/路径/index.vue'),
  meta: {
    title: '页面标题',
  },
}
```

**适用场景:** 登录页、404、403、公开页面(帮助文档、隐私政策)

**完整示例:** 查看 `src/router/routes/base.ts`

---

#### 2. 公共路由模板 (common.ts)

公共路由是**所有登录用户**都可以访问的页面,在应用启动时**静态注册**。

```typescript
// 带 Layout 的路由模板
{
  path: '/',
  component: Layout,
  redirect: '/home',
  children: [
    {
      path: 'home',
      name: 'Home',
      component: () => import('@/views/home/index.vue'),
      meta: {
        title: '首页',
      },
    },
  ],
}
```

**适用场景:** 首页、个人中心、通知中心、所有角色都能访问的功能

**完整示例:** 查看 `src/router/routes/common.ts`

---

#### 3. 异步路由模板 (async.ts)

异步路由是**需要特定角色权限**的页面,在登录后根据用户角色**动态注册**。

```typescript
// 权限路由模板
{
  path: '/路径',
  component: Layout,
  redirect: '/路径/子路径',
  meta: {
    title: '模块标题',
    roles: [ROLES.ADMIN, ROLES.TEACHER], // 角色权限
  },
  children: [
    {
      path: '子路径',
      name: 'RouteName',
      component: () => import('@/views/路径/子路径.vue'),
      meta: {
        title: '页面标题',
        roles: [ROLES.ADMIN],
      },
    },
  ],
}
```

**适用场景:** 管理员专属功能、需要权限控制的功能、不同角色看到不同菜单

**完整示例:** 查看 `src/router/routes/async.ts`

---

## 🎯 路由配置最佳实践

### 路由命名规范

#### Path 命名规范
```typescript
// ✅ 正确:使用小写和短横线
{
  path: '/lab-reservation',        // 路径使用小写 + 短横线
  path: '/user-management',
  path: '/setting/frontend',
}

// ❌ 错误:使用驼峰或其他格式
{
  path: '/labReservation',        // 不要使用驼峰
  path: '/Lab_Reservation',       // 不要使用下划线
  path: '/LABRESERVATION',        // 不要使用全大写
}
```

#### Name 命名规范
```typescript
// ✅ 正确:使用大驼峰(PascalCase)
{
  name: 'LabReservation',        // 大驼峰
  name: 'UserManagement',
  name: 'Frontend',
}

// ❌ 错误:使用其他格式
{
  name: 'labReservation',        // 不要使用小驼峰
  name: 'lab-reservation',       // 不要使用短横线
  name: 'lab_reservation',       // 不要使用下划线
}
```

#### Name 唯一性要求
```typescript
// ✅ 正确:全局唯一的 name
export const asyncRoutes: RouteRecordRaw[] = [
  {
    path: '/setting',
    name: 'Setting',              // 父路由名称
    children: [
      {
        path: 'frontend',
        name: 'Frontend',         // 子路由名称,全局唯一
      },
      {
        path: 'theme',
        name: 'Theme',            // 子路由名称,全局唯一
      },
    ],
  },
];

// ❌ 错误:重复的 name
export const routes1 = [
  { path: '/user/list', name: 'UserList' },
];
export const routes2 = [
  { path: '/admin/user-list', name: 'UserList' }, // 重复!
];
```

### Meta 元信息配置

#### 完整的 Meta 定义
```typescript
// ✅ 正确:完整的 meta 配置
{
  path: '/lab-reservation',
  name: 'LabReservation',
  component: () => import('@/views/labreservation/index.vue'),
  meta: {
    title: '功能名称',                    // 页面标题(必需)
    roles: [ROLES.ADMIN, ROLES.STUDENT],   // 允许访问的角色(可选)
    requiresAuth: true,                    // 是否需要登录(可选,默认 true)
    icon: 'IconLab',                       // 菜单图标(可选)
    hidden: false,                         // 是否在菜单中隐藏(可选,默认 false)
    keepAlive: true,                       // 是否缓存页面(可选,默认 false)
    breadcrumb: true,                      // 是否显示面包屑(可选,默认 true)
  },
}

// ❌ 错误:缺少 meta.title
{
  path: '/lab-reservation',
  name: 'LabReservation',
  component: () => import('@/views/labreservation/index.vue'),
  // 缺少 meta
}
```

#### Meta 类型定义
```typescript
// typings/router.d.ts
declare module 'vue-router' {
  interface RouteMeta {
    /** 页面标题 */
    title?: string;
    /** 允许访问的角色列表 */
    roles?: string[];
    /** 是否需要登录(默认 true) */
    requiresAuth?: boolean;
    /** 菜单图标 */
    icon?: string;
    /** 是否在菜单中隐藏 */
    hidden?: boolean;
    /** 是否缓存页面 */
    keepAlive?: boolean;
    /** 是否显示面包屑 */
    breadcrumb?: boolean;
    /** 骨架屏配置 */
    skeleton?: SkeletonConfig;
  }
}
```

### 骨架屏配置 ⭐

> **完整的骨架屏配置指南:** [common-patterns.md#骨架屏模式](common-patterns.md#骨架屏模式)

项目支持在路由 `meta.skeleton` 配置页面级骨架屏,在页面加载时自动显示。

**快速配置:**
```typescript
meta: {
  skeleton: {
    type: 'card',           // 或 'list', 'form', 'detail', 'grid'
    props: { count: 4 },    // 可选配置
  },
}
```

**预置类型:** `card` (卡片型) | `list` (列表型) | `form` (表单型) | `detail` (详情型) | `grid` (网格型)

详细配置方法、Props 定义和自定义组件使用请查看 [common-patterns.md#骨架屏模式](common-patterns.md#骨架屏模式)。

---

### 类型定义

**路由 Meta 完整类型:**

```typescript
// typings/router.d.ts
declare module 'vue-router' {
  interface RouteMeta {
    title?: string;
    roles?: string[];
    requiresAuth?: boolean;
    icon?: string;
    hidden?: boolean;
    keepAlive?: boolean;
    breadcrumb?: boolean;
    skeleton?: SkeletonConfig;  // 骨架屏配置(详见 common-patterns.md)
  }
}
```

完整的骨架屏类型定义、工具函数和使用示例请查看 [common-patterns.md#骨架屏模式](common-patterns.md#骨架屏模式)。

---

## 🛡️ 权限控制

### 角色常量定义

```typescript
// src/constants/roles.ts
export const ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];
```

### Permission Store 实现

项目使用 `usePermissionStore` 管理动态路由生成:

```typescript
// src/store/modules/permission.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { RouteRecordRaw } from 'vue-router';

/**
 * 权限管理 Store
 */
export const usePermissionStore = defineStore('permission', () => {
  // 状态
  const routes = ref<RouteRecordRaw[]>([]);
  const isRoutesGenerated = ref(false);

  /**
   * 根据角色过滤路由
   */
  const filterRoutesByRoles = (
    routes: RouteRecordRaw[],
    roles: string[]
  ): RouteRecordRaw[] => {
    const result: RouteRecordRaw[] = [];

    routes.forEach(route => {
      const routeCopy = { ...route };

      if (hasRoutePermission(roles, routeCopy)) {
        if (routeCopy.children) {
          routeCopy.children = filterRoutesByRoles(routeCopy.children, roles);
        }
        result.push(routeCopy);
      }
    });

    return result;
  };

  /**
   * 检查是否有路由访问权限
   */
  const hasRoutePermission = (
    userRoles: string[],
    route: RouteRecordRaw
  ): boolean => {
    const routeRoles = route.meta?.roles as string[] | undefined;

    // 路由未配置 roles,任何人都可访问
    if (!routeRoles || routeRoles.length === 0) {
      return true;
    }

    // 检查用户是否拥有路由要求的任一角色
    return userRoles.some(role => routeRoles.includes(role));
  };

  /**
   * 生成可访问路由
   */
  const generateRoutes = (
    asyncRoutes: RouteRecordRaw[],
    roles: string[]
  ): RouteRecordRaw[] => {
    const accessedRoutes = filterRoutesByRoles(asyncRoutes, roles);
    routes.value = accessedRoutes;
    isRoutesGenerated.value = true;
    return accessedRoutes;
  };

  /**
   * 重置权限状态
   */
  const resetPermission = () => {
    routes.value = [];
    isRoutesGenerated.value = false;
  };

  return {
    routes,
    isRoutesGenerated,
    generateRoutes,
    resetPermission,
  };
});
```

---

## 🚦 路由守卫

### 全局前置守卫

项目在 `src/router/guards.ts` 中实现了完整的路由守卫逻辑:

```typescript
// src/router/guards.ts
import type { Router } from 'vue-router';
import { useUserStore } from '@/store/modules/user';
import { usePermissionStore } from '@/store/modules/permission';
import { showToast } from 'vant';
import { asyncRoutes } from './routes';

/**
 * 路由白名单(不需要登录)
 */
const WHITE_LIST = ['/login', '/404', '/403'];

/**
 * 设置路由守卫
 */
export function setupRouterGuard(router: Router) {
  router.beforeEach(async (to, _from, next) => {
    const userStore = useUserStore();
    const permissionStore = usePermissionStore();

    // 1. 白名单直接放行
    if (WHITE_LIST.includes(to.path)) {
      next();
      return;
    }

    // 2. 检查登录状态
    if (!userStore.token) {
      next({ path: '/login', query: { redirect: to.fullPath } });
      return;
    }

    // 3. 已登录访问登录页,跳转首页
    if (to.path === '/login') {
      next('/home');
      return;
    }

    // 4. 已生成路由,直接放行
    if (permissionStore.isRoutesGenerated) {
      next();
      return;
    }

    // 5. 获取用户信息并生成路由
    try {
      await userStore.getInfoAction();
      const roles = userStore.role ? [userStore.role] : [];

      if (!roles || roles.length === 0) {
        throw new Error('用户角色为空');
      }

      // 生成可访问的异步路由
      const accessRoutes = permissionStore.generateRoutes(asyncRoutes, roles);

      // 动态添加异步路由
      accessRoutes.forEach(route => router.addRoute(route));

      // 重新导航
      next({ ...to, replace: true });
    } catch (error) {
      console.error('获取权限失败:', error);
      showToast('获取权限失败,请重新登录');
      await userStore.logoutAction();
      permissionStore.resetPermission();
      next('/login');
    }
  });
}
```

### 路由守卫执行流程

```
用户访问路由
    ↓
1. 检查白名单 → 白名单内直接放行
    ↓
2. 检查登录状态 → 未登录跳转登录页
    ↓
3. 已登录访问登录页 → 跳转首页
    ↓
4. 检查路由是否已生成 → 已生成直接放行
    ↓
5. 获取用户信息和角色
    ↓
6. 根据角色生成可访问路由
    ↓
7. 动态添加路由到 router
    ↓
8. 重新导航到目标路由
```

### 路由守卫最佳实践

#### 白名单管理
```typescript
// ✅ 正确:集中管理白名单
const WHITE_LIST = ['/login', '/404', '/403', '/help', '/privacy'];

// 在守卫中使用
if (WHITE_LIST.includes(to.path)) {
  next();
  return;
}

// ❌ 错误:分散判断
if (to.path === '/login') next();
if (to.path === '/404') next();
if (to.path === '/403') next();
```

#### 登录重定向
```typescript
// ✅ 正确:保存原始路径用于登录后跳转
if (!userStore.token) {
  next({
    path: '/login',
    query: { redirect: to.fullPath },  // 保存原始路径
  });
  return;
}

// 登录成功后跳转回原路径
const router = useRouter();
const route = useRoute();
const redirect = route.query.redirect as string || '/home';
router.push(redirect);

// ❌ 错误:登录后总是跳转首页
if (!userStore.token) {
  next('/login');
}
```

#### 路由守卫中的错误处理
```typescript
// ✅ 正确:完整的错误处理
try {
  await userStore.getInfoAction();
  // ... 生成路由逻辑
} catch (error) {
  console.error('获取权限失败:', error);
  showToast('获取权限失败,请重新登录');

  // 清理状态
  await userStore.logoutAction();
  permissionStore.resetPermission();

  // 跳转登录页
  next('/login');
}

// ❌ 错误:不处理错误
try {
  await userStore.getInfoAction();
} catch (error) {
  // 没有处理,用户会卡在加载状态
}
```

---

## 📋 新增路由开发流程

### 步骤 1: 创建页面组件

```bash
# 创建页面目录和文件
mkdir src/views/lab-reservation
touch src/views/lab-reservation/index.vue
```

```vue
<!-- src/views/lab-reservation/index.vue -->
<template>
  <div class="lab-reservation-page">
    <h1>功能名称</h1>
    <!-- 页面内容 -->
  </div>
</template>

<script setup lang="ts">
// 页面逻辑
</script>

<style scoped lang="scss">
.lab-reservation-page {
  padding: 24px;
}
</style>
```

### 步骤 2: 配置路由

#### 场景 A: 公共路由(所有登录用户可访问)

在 `src/router/routes/common.ts` 中添加:

```typescript
// src/router/routes/common.ts
export const commonRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    component: Layout,
    redirect: '/home',
    children: [
      // ... 其他路由

      // ✅ 新增:功能名称页面
      {
        path: 'lab-reservation',
        name: 'LabReservation',
        component: () => import('@/views/lab-reservation/index.vue'),
        meta: {
          title: '功能名称',
        },
      },
    ],
  },
];
```

#### 场景 B: 异步路由(需要权限控制)

在 `src/router/routes/async.ts` 中添加:

```typescript
// src/router/routes/async.ts
export const asyncRoutes: RouteRecordRaw[] = [
  // ... 其他路由

  // ✅ 新增:实验室管理页面(仅管理员和教师)
  {
    path: '/lab',
    component: Layout,
    redirect: '/lab/management',
    meta: {
      title: '实验室管理',
      roles: [ROLES.ADMIN, ROLES.TEACHER],
    },
    children: [
      {
        path: 'management',
        name: 'LabManagement',
        component: () => import('@/views/lab-management/index.vue'),
        meta: {
          title: '实验室管理',
          roles: [ROLES.ADMIN, ROLES.TEACHER],
        },
      },
    ],
  },
];
```

### 步骤 3: 验证路由

```bash
# 启动开发服务器
pnpm dev

# 访问新路由
http://localhost:5173/lab-reservation
```

---

## 🎯 常见路由场景

### 1. 嵌套路由

```typescript
// ✅ 正确:使用嵌套路由
{
  path: '/setting',
  component: Layout,
  redirect: '/setting/frontend',
  meta: {
    title: '设置',
    roles: [ROLES.ADMIN],
  },
  children: [
    {
      path: 'frontend',                    // 相对路径,实际路径:/setting/frontend
      name: 'Frontend',
      component: () => import('@/views/setting/frontend.vue'),
      meta: {
        title: '前端配置',
        roles: [ROLES.ADMIN],
      },
    },
    {
      path: 'theme',                       // 相对路径,实际路径:/setting/theme
      name: 'Theme',
      component: () => import('@/views/setting/theme.vue'),
      meta: {
        title: '主题配置',
        roles: [ROLES.ADMIN],
      },
    },
  ],
}

// ❌ 错误:子路由使用绝对路径
children: [
  {
    path: '/setting/frontend',  // 不要用绝对路径,应该用 'frontend'
    // ...
  },
]
```

### 2. 动态路由参数

```typescript
// ✅ 正确:动态路由参数
{
  path: '/user/:id',
  name: 'UserDetail',
  component: () => import('@/views/user-detail/index.vue'),
  meta: {
    title: '用户详情',
  },
}

// 在组件中使用
<script setup lang="ts">
import { useRoute } from 'vue-router';

const route = useRoute();
const userId = route.params.id as string;
</script>
```

### 3. 路由重定向

```typescript
// ✅ 正确:路由重定向
{
  path: '/',
  redirect: '/home',  // 访问 / 重定向到 /home
}

// ✅ 正确:父路由重定向到第一个子路由
{
  path: '/setting',
  component: Layout,
  redirect: '/setting/frontend',  // 访问 /setting 重定向到 /setting/frontend
  children: [
    {
      path: 'frontend',
      name: 'Frontend',
      component: () => import('@/views/setting/frontend.vue'),
    },
  ],
}
```

### 4. 404 路由

```typescript
// ✅ 正确:404 路由必须放在最后
export const asyncRoutes: RouteRecordRaw[] = [
  // ... 其他路由

  // 404 路由(必须放在最后)
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
  },
];
```

---

## 🔧 路由工具函数

### 路由跳转

```typescript
import { useRouter } from 'vue-router';

const router = useRouter();

// ✅ 正确:使用 name 跳转
router.push({ name: 'LabReservation' });

// ✅ 正确:使用 path 跳转
router.push('/lab-reservation');

// ✅ 正确:带参数跳转
router.push({
  name: 'UserDetail',
  params: { id: '123' },
});

// ✅ 正确:带查询参数跳转
router.push({
  name: 'UserList',
  query: { page: '2', keyword: 'admin' },
});

// ✅ 正确:替换当前路由(不留历史记录)
router.replace({ name: 'Home' });

// ✅ 正确:返回上一页
router.back();
router.go(-1);
```

### 获取路由信息

```typescript
import { useRoute } from 'vue-router';

const route = useRoute();

// ✅ 获取路由参数
const userId = route.params.id as string;

// ✅ 获取查询参数
const page = route.query.page as string;
const keyword = route.query.keyword as string;

// ✅ 获取路由元信息
const title = route.meta.title as string;
const roles = route.meta.roles as string[];

// ✅ 获取当前路径
const currentPath = route.path;
const currentName = route.name;
```

---

## 📋 路由开发快速检查清单

### 路由配置检查
- [ ] 路由 `path` 使用小写和短横线(如 `/lab-reservation`)
- [ ] 路由 `name` 使用大驼峰(如 `LabReservation`)
- [ ] 路由 `name` 全局唯一
- [ ] 必须设置 `meta.title`
- [ ] 异步路由必须设置 `meta.roles`
- [ ] 使用懒加载 `() => import()`

### 权限控制检查
- [ ] 基础路由(登录、404)在 `base.ts` 中配置
- [ ] 公共路由(所有用户)在 `common.ts` 中配置
- [ ] 需要权限的路由在 `async.ts` 中配置
- [ ] 角色常量使用 `ROLES.XXX`
- [ ] 白名单路由已添加到 `WHITE_LIST`

### 路由守卫检查
- [ ] 路由守卫中有完整的错误处理
- [ ] 登录重定向保存了原始路径
- [ ] 动态路由生成后调用了 `router.addRoute()`
- [ ] 退出登录时调用了 `permissionStore.resetPermission()`

---

## ❓ 常见问题

### Q: 什么时候使用 common.ts 和 async.ts?

**A**:
- **common.ts**: 所有登录用户都能访问的页面(首页、个人中心)
- **async.ts**: 需要特定角色权限的页面(管理页面、设置页面)

### Q: 为什么路由配置后无法访问?

**A**: 检查以下几点:
1. 异步路由需要在登录后才能访问
2. 检查用户角色是否匹配 `meta.roles`
3. 确认路由是否被正确添加到 router
4. 查看控制台是否有路由守卫报错

### Q: 如何实现多级菜单?

**A**: 使用嵌套路由:
```typescript
{
  path: '/system',
  component: Layout,
  meta: { title: '系统管理' },
  children: [
    {
      path: 'user',
      name: 'UserManagement',
      component: () => import('@/views/user-management/index.vue'),
      meta: { title: '用户管理' },
    },
    {
      path: 'role',
      name: 'RoleManagement',
      component: () => import('@/views/role-management/index.vue'),
      meta: { title: '角色管理' },
    },
  ],
}
```

### Q: 如何在路由跳转时传递复杂数据?

**A**: 有三种方式:
```typescript
// 方式1: 使用 query(URL 可见)
router.push({
  name: 'UserDetail',
  query: { id: '123', tab: 'profile' },
});

// 方式2: 使用 params(需要 name,URL 不可见)
router.push({
  name: 'UserDetail',
  params: { id: '123' },
});

// 方式3: 使用 state(刷新会丢失)
router.push({
  name: 'UserDetail',
  state: { user: userInfo },
});
```

### Q: 如何实现路由缓存?

**A**: 使用 `<keep-alive>` + `meta.keepAlive`:
```vue
<!-- Layout.vue -->
<template>
  <router-view v-slot="{ Component }">
    <keep-alive>
      <component :is="Component" v-if="$route.meta.keepAlive" />
    </keep-alive>
    <component :is="Component" v-if="!$route.meta.keepAlive" />
  </router-view>
</template>
```

```typescript
// 路由配置
{
  path: '/user-list',
  name: 'UserList',
  component: () => import('@/views/user-list/index.vue'),
  meta: {
    title: '用户列表',
    keepAlive: true,  // 开启缓存
  },
}
```

---

## 📚 相关文档

- [project-structure.md](project-structure.md) - 项目目录结构
- [store-development.md](store-development.md) - 状态管理(Permission Store)
- [coding-standards.md](coding-standards.md) - 编码规范

---

通过遵循这些路由开发规范,可以构建出清晰、安全、易维护的路由系统。
