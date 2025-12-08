# Capability: Navigation System

## Purpose

基于 Uni-app pages.json 的路由导航系统，提供类 Vue Router 的 API 体验，支持主包/分包架构。

## Requirements

### Requirement: Page Configuration

所有页面 SHALL 在 `pages.json` 中注册，系统使用 pages.json 作为路由配置源。

#### Scenario: Main package pages
- **GIVEN** 页面位于 `src/pages/` 目录
- **WHEN** 配置页面路由
- **THEN** 在 `pages.json` 的 `pages` 数组中注册
- **AND** TabBar 页面必须在主包中

#### Scenario: Sub-package pages
- **GIVEN** 页面位于 `src/pages-sub/` 目录
- **WHEN** 配置页面路由
- **THEN** 在 `pages.json` 的 `subPackages` 数组中注册
- **AND** 按功能模块划分分包（order、user、other）

#### Scenario: Page style configuration
- **GIVEN** 需要配置页面样式
- **WHEN** 在 pages.json 中定义页面
- **THEN** 可以设置 navigationBarTitleText、navigationStyle 等属性
- **AND** 可以启用/禁用下拉刷新

---

### Requirement: Router Composable API

系统 SHALL 提供 `useRouter` 和 `useRoute` 组合式 API，提供类 Vue Router 的开发体验。

#### Scenario: Navigate to page
- **GIVEN** 使用 useRouter 获取路由实例
- **WHEN** 调用 `router.push('/pages/detail/index', { id: 1 })`
- **THEN** 跳转到指定页面并传递参数
- **AND** 页面加入导航栈

#### Scenario: Replace current page
- **GIVEN** 使用 useRouter 获取路由实例
- **WHEN** 调用 `router.replace('/pages/login/index')`
- **THEN** 替换当前页面（不加入导航栈）

#### Scenario: Navigate back
- **GIVEN** 页面栈中有多个页面
- **WHEN** 调用 `router.back()` 或 `router.back(2)`
- **THEN** 返回上一页或指定层级
- **AND** canGoBack() 返回正确的可返回状态

#### Scenario: Switch to TabBar
- **GIVEN** 目标页面是 TabBar 页面
- **WHEN** 调用 `router.switchTab('/pages/index/index')`
- **THEN** 切换到 TabBar 页面
- **AND** 关闭所有非 TabBar 页面

#### Scenario: Relaunch application
- **GIVEN** 需要重启应用到指定页面
- **WHEN** 调用 `router.reLaunch('/pages/index/index')`
- **THEN** 关闭所有页面并打开指定页面

---

### Requirement: Route Information Access

系统 SHALL 提供 `useRoute` 获取当前路由信息。

#### Scenario: Get current route
- **GIVEN** 在页面组件中
- **WHEN** 调用 `useRoute()`
- **THEN** 返回包含 path、fullPath、query、index 的路由对象

#### Scenario: Get typed query params
- **GIVEN** 需要获取类型化的页面参数
- **WHEN** 调用 `useRouteQuery<{ id: string }>()`
- **THEN** 返回 Partial<T> 类型的参数对象
- **AND** 参数可能为 undefined，需要类型守卫

---

### Requirement: TabBar Navigation

系统 SHALL 支持底部 TabBar 导航。

#### Scenario: TabBar configuration
- **GIVEN** 需要配置 TabBar
- **WHEN** 在 pages.json 的 tabBar 中定义
- **THEN** 设置图标、文字、选中颜色等属性
- **AND** tabBar.list 中的 pagePath 必须在主包 pages 中

#### Scenario: TabBar pages
- **GIVEN** 当前 TabBar 配置
- **THEN** 首页 (pages/index/index) 为 TabBar 页面
- **AND** 我的 (pages/mine/index) 为 TabBar 页面

---

### Requirement: Sub-Package Architecture

系统 SHALL 使用分包架构优化小程序体积。

#### Scenario: Order sub-package
- **GIVEN** 订单相关页面
- **THEN** 位于 `pages-sub/order/` 分包
- **AND** 包含订单列表页

#### Scenario: User sub-package
- **GIVEN** 用户相关页面
- **THEN** 位于 `pages-sub/user/` 分包
- **AND** 包含地址管理、收藏、密码修改、资料编辑、设置页

#### Scenario: Other sub-package
- **GIVEN** 其他功能页面
- **THEN** 位于 `pages-sub/other/` 分包
- **AND** 包含关于我们、联系客服、意见反馈、WebView 页

---

### Requirement: Login Redirect

系统 SHALL 支持登录后重定向到原页面。

#### Scenario: Redirect after login
- **GIVEN** 用户访问需要登录的页面
- **WHEN** 用户未登录时被重定向到登录页
- **THEN** 登录页接收 redirect 参数
- **AND** 登录成功后跳转到原页面

#### Scenario: Default redirect
- **GIVEN** 用户直接访问登录页（无 redirect 参数）
- **WHEN** 登录成功
- **THEN** 跳转到首页 TabBar

## Technical Notes

### Navigation Methods Mapping
| Composable | Uni API |
|------------|---------|
| `router.push()` | `uni.navigateTo()` |
| `router.replace()` | `uni.redirectTo()` |
| `router.back()` | `uni.navigateBack()` |
| `router.switchTab()` | `uni.switchTab()` |
| `router.reLaunch()` | `uni.reLaunch()` |

### Current Page Structure
**主包 (7 页面)**:
- pages/index/index (TabBar)
- pages/mine/index (TabBar)
- pages/login/index
- pages/register/index
- pages/forgot-password/index
- pages/agreement/index
- pages/error/index

**分包**:
- pages-sub/order (1 页面)
- pages-sub/user (6 页面)
- pages-sub/other (4 页面)

### Restrictions
- 禁止使用 Vue Router
- TabBar 页面必须在主包
- 分包路径需要完整路径 (如 `/pages-sub/user/profile/index`)
