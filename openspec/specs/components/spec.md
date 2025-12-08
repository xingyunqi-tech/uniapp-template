# Capability: Component System

## Purpose

基于 Uni-app easycom 机制的组件系统，提供 20+ 业务组件自动注册功能。自定义组件统一使用 U 前缀命名（如 UNavBar、UEmpty），无需手动 import 即可在模板中使用。组件涵盖导航、反馈、表单、展示、交互、列表等多个类别，全部支持 CSS 变量主题切换，使用 TypeScript 定义 Props 和 Emits 类型。

## Requirements

### Requirement: Easycom Auto Registration

系统 SHALL 使用 easycom 机制自动注册组件，无需手动导入。

#### Scenario: Use custom component
- **GIVEN** 组件位于 `src/components/UXxx/index.vue`
- **WHEN** 在模板中使用 `<u-xxx />`
- **THEN** easycom 自动解析并注册组件
- **AND** 无需在 script 中 import

#### Scenario: Use uni-ui component
- **GIVEN** @dcloudio/uni-ui 组件库
- **WHEN** 在模板中使用 `<uni-xxx />`
- **THEN** easycom 自动解析并注册组件

#### Scenario: Easycom configuration
- **GIVEN** pages.json 配置
- **THEN** easycom 规则如下：
  - `^uni-(.*)` → `@dcloudio/uni-ui/lib/uni-$1/uni-$1.vue`
  - `^(U[A-Z][a-zA-Z]*)$` → `@/components/$1/index.vue`
  - `^(AuthLayout)$` → `@/components/$1/index.vue`

---

### Requirement: Component Naming Convention

系统 SHALL 遵循统一的组件命名规范。

#### Scenario: Custom component naming
- **GIVEN** 创建自定义组件
- **WHEN** 命名组件
- **THEN** 使用 PascalCase 并以 `U` 开头（如 `UNavBar`）
- **AND** 模板中使用 kebab-case（如 `<u-nav-bar />`）

#### Scenario: Directory structure
- **GIVEN** 自定义组件
- **THEN** 目录结构为 `src/components/UXxx/index.vue`
- **AND** 入口文件必须命名为 `index.vue`

---

### Requirement: Navigation Components

系统 SHALL 提供导航相关组件。

#### Scenario: UNavBar - Custom navigation bar
- **GIVEN** 页面需要自定义导航栏
- **WHEN** 使用 `<u-nav-bar title="标题" />`
- **THEN** 显示自定义导航栏
- **AND** 支持 title、leftIcon、rightIcon 等属性
- **AND** 支持 @click-left、@click-right 事件

#### Scenario: UTabs - Tab switching
- **GIVEN** 需要标签页切换
- **WHEN** 使用 `<u-tabs v-model="active" :tabs="tabs" />`
- **THEN** 显示可切换的标签页
- **AND** 支持下划线指示器动画

---

### Requirement: Feedback Components

系统 SHALL 提供反馈类组件。

#### Scenario: ULoading - Loading indicator
- **GIVEN** 需要显示加载状态
- **WHEN** 使用 `<u-loading />`
- **THEN** 显示加载动画
- **AND** 支持 size、color 等属性

#### Scenario: UEmpty - Empty state
- **GIVEN** 列表或页面无数据
- **WHEN** 使用 `<u-empty description="暂无数据" />`
- **THEN** 显示空状态占位图
- **AND** 支持自定义图片和描述

#### Scenario: USkeleton - Skeleton screen
- **GIVEN** 内容加载中
- **WHEN** 使用 `<u-skeleton :loading="loading" />`
- **THEN** 显示骨架屏占位
- **AND** loading 为 false 时显示实际内容

#### Scenario: UNoticeBar - Notice bar
- **GIVEN** 需要显示通知信息
- **WHEN** 使用 `<u-notice-bar text="通知内容" />`
- **THEN** 显示滚动通知栏
- **AND** 支持 scrollable、closeable 等属性

---

### Requirement: Form Components

系统 SHALL 提供表单相关组件。

#### Scenario: UFormItem - Form item wrapper
- **GIVEN** 表单项需要标签和布局
- **WHEN** 使用 `<u-form-item label="用户名" />`
- **THEN** 显示带标签的表单项
- **AND** 支持 required、error 等状态

#### Scenario: USmsInput - SMS code input
- **GIVEN** 需要短信验证码输入
- **WHEN** 使用 `<u-sms-input v-model="code" @send="handleSend" />`
- **THEN** 显示验证码输入框和发送按钮
- **AND** 支持倒计时显示

#### Scenario: UPasswordStrength - Password strength
- **GIVEN** 需要显示密码强度
- **WHEN** 使用 `<u-password-strength :password="pwd" />`
- **THEN** 显示密码强度指示器
- **AND** 根据密码复杂度显示不同等级

#### Scenario: UImageUpload - Image upload
- **GIVEN** 需要上传图片
- **WHEN** 使用 `<u-image-upload v-model="images" />`
- **THEN** 显示图片上传区域
- **AND** 支持预览、删除、多选等功能

---

### Requirement: Display Components

系统 SHALL 提供展示类组件。

#### Scenario: UImage - Lazy load image
- **GIVEN** 需要显示图片
- **WHEN** 使用 `<u-image src="url" />`
- **THEN** 支持懒加载
- **AND** 支持加载中、加载失败状态

#### Scenario: UBanner - Carousel banner
- **GIVEN** 需要轮播图
- **WHEN** 使用 `<u-banner :list="banners" />`
- **THEN** 显示轮播图组件
- **AND** 支持自动播放、指示器

#### Scenario: URichText - Rich text display
- **GIVEN** 需要显示富文本内容
- **WHEN** 使用 `<u-rich-text :content="html" />`
- **THEN** 安全渲染 HTML 内容
- **AND** 处理图片自适应

#### Scenario: UTag - Tag label
- **GIVEN** 需要显示标签
- **WHEN** 使用 `<u-tag type="primary">标签</u-tag>`
- **THEN** 显示标签样式
- **AND** 支持多种类型和大小

---

### Requirement: Interactive Components

系统 SHALL 提供交互类组件。

#### Scenario: UPopup - Popup layer
- **GIVEN** 需要弹出层
- **WHEN** 使用 `<u-popup v-model:show="visible" />`
- **THEN** 从指定方向弹出内容
- **AND** 支持 position（top/bottom/left/right/center）

#### Scenario: UActionSheet - Action sheet
- **GIVEN** 需要操作菜单
- **WHEN** 使用 `<u-action-sheet :actions="actions" />`
- **THEN** 从底部弹出操作菜单
- **AND** 支持取消按钮

#### Scenario: UFixedButton - Fixed button
- **GIVEN** 需要固定悬浮按钮
- **WHEN** 使用 `<u-fixed-button @click="handleClick" />`
- **THEN** 在页面固定位置显示按钮
- **AND** 支持自定义位置和样式

---

### Requirement: List Components

系统 SHALL 提供列表相关组件。

#### Scenario: UMenuItem - Menu item
- **GIVEN** 需要菜单项
- **WHEN** 使用 `<u-menu-item title="设置" @click="goSettings" />`
- **THEN** 显示可点击的菜单项
- **AND** 支持图标、副标题、箭头

#### Scenario: UMenuGroup - Menu group
- **GIVEN** 需要分组菜单
- **WHEN** 使用 `<u-menu-group title="分组标题" />`
- **THEN** 显示带标题的菜单分组
- **AND** 包裹多个 UMenuItem

#### Scenario: ULoadMore - Load more
- **GIVEN** 列表需要加载更多
- **WHEN** 使用 `<u-load-more :status="loadStatus" />`
- **THEN** 显示加载更多状态
- **AND** 支持 loading、noMore、error 状态

---

### Requirement: Layout Components

系统 SHALL 提供布局相关组件。

#### Scenario: AuthLayout - Authentication layout
- **GIVEN** 认证相关页面（登录/注册/忘记密码）
- **WHEN** 使用 `<AuthLayout title="欢迎" />`
- **THEN** 提供统一的认证页面布局
- **AND** 包含背景、卡片容器、标题等

## Technical Notes

### Component List (21 components)

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
| `UTag` | 标签 | `ULoadMore` | 加载更多 |
| `AuthLayout` | 认证布局 | - | - |

### Style Guidelines
- 所有组件必须使用 CSS 变量
- 尺寸使用 rpx 单位
- Props 和 Emits 必须有 TypeScript 类型定义
- 支持主题切换（浅色/深色）

### Restrictions
- 禁止在使用 easycom 组件时手动 import
- 组件入口文件必须为 `index.vue`
- 自定义组件必须以 `U` 开头
