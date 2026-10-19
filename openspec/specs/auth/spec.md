# Capability: User Authentication

## Purpose

用户认证系统，提供完整的身份验证功能。支持密码登录、短信验证码登录、微信小程序一键登录等多种登录方式。包含用户注册、密码找回、退出登录等功能，使用 Pinia Store 管理认证状态，支持基于角色的权限控制（RBAC），跨平台兼容 H5、小程序和 App。

## Requirements

### Requirement: Password Login

用户 SHALL 能够使用手机号和密码进行登录。

#### Scenario: Successful password login
- **GIVEN** 用户在登录页面
- **WHEN** 用户输入有效的手机号和正确的密码
- **THEN** 系统验证凭据并返回 Token
- **AND** 用户信息存储到 Pinia Store
- **AND** Token 持久化到 uni.storage
- **AND** 跳转到首页或重定向地址

#### Scenario: Invalid credentials
- **GIVEN** 用户在登录页面
- **WHEN** 用户输入无效的手机号或错误的密码
- **THEN** 系统显示错误提示 "登录失败，请重试"
- **AND** 用户保持在登录页面

#### Scenario: Already logged in
- **GIVEN** 用户已登录状态
- **WHEN** 用户访问登录页面
- **THEN** 自动跳转到首页或重定向地址

---

### Requirement: SMS Code Login

用户 SHALL 能够使用手机号和短信验证码进行登录。

#### Scenario: Send SMS code
- **GIVEN** 用户在登录页面选择验证码登录
- **WHEN** 用户输入有效手机号并点击发送验证码
- **THEN** 系统发送验证码到该手机号
- **AND** 显示 60 秒倒计时
- **AND** 倒计时期间禁用发送按钮

#### Scenario: Successful SMS login
- **GIVEN** 用户已收到验证码
- **WHEN** 用户输入正确的验证码并点击登录
- **THEN** 系统验证凭据并返回 Token
- **AND** 用户信息存储到 Pinia Store
- **AND** 跳转到首页或重定向地址

#### Scenario: Invalid SMS code
- **GIVEN** 用户在验证码登录页面
- **WHEN** 用户输入错误或过期的验证码
- **THEN** 系统显示错误提示
- **AND** 用户可以重新输入或重新发送

---

### Requirement: WeChat Mini Program Login

在微信小程序环境下，用户 SHALL 能够使用微信一键登录。

#### Scenario: Successful WeChat login
- **GIVEN** 用户在微信小程序登录页面
- **WHEN** 用户点击微信登录按钮并授权获取手机号
- **THEN** 系统获取微信 code 和加密手机号数据
- **AND** 调用后端接口解密并登录
- **AND** 用户信息存储到 Pinia Store
- **AND** 跳转到首页或重定向地址

#### Scenario: User denies phone number access
- **GIVEN** 用户在微信小程序登录页面
- **WHEN** 用户点击手机号快捷登录按钮后拒绝或取消授权（含拒绝隐私授权）
- **THEN** 系统不显示提示，停留在登录页
- **AND** 用户可以选择其他登录方式

#### Scenario: Platform restriction
- **GIVEN** 用户在 H5 或 App 环境
- **WHEN** 渲染登录页面
- **THEN** 不显示微信登录按钮（条件编译 #ifdef MP-WEIXIN）

---

### Requirement: User Registration

用户 SHALL 能够注册新账号。

#### Scenario: Successful registration
- **GIVEN** 用户在注册页面
- **WHEN** 用户输入有效手机号、密码和验证码
- **AND** 同意用户协议
- **THEN** 系统创建新账号
- **AND** 自动登录并跳转到首页

#### Scenario: Phone already registered
- **GIVEN** 用户在注册页面
- **WHEN** 用户输入已注册的手机号
- **THEN** 系统显示提示 "该手机号已注册"
- **AND** 提供跳转到登录页的链接

---

### Requirement: Password Recovery

用户 SHALL 能够找回/重置密码。

#### Scenario: Reset password via SMS
- **GIVEN** 用户在忘记密码页面
- **WHEN** 用户输入注册手机号并获取验证码
- **AND** 输入正确验证码和新密码
- **THEN** 系统更新密码
- **AND** 跳转到登录页面

---

### Requirement: User Logout

已登录用户 SHALL 能够退出登录。

#### Scenario: Successful logout
- **GIVEN** 用户已登录
- **WHEN** 用户点击退出登录
- **THEN** 清除 Pinia Store 中的用户信息
- **AND** 清除 uni.storage 中的 Token
- **AND** 跳转到登录页面

#### Scenario: Logout on API failure
- **GIVEN** 用户已登录
- **WHEN** 用户点击退出登录但 API 调用失败
- **THEN** 仍然清除本地状态和 Token
- **AND** 跳转到登录页面

---

### Requirement: Authentication State Management

系统 SHALL 使用 Pinia Store 管理认证状态。

#### Scenario: State persistence
- **GIVEN** 用户已登录
- **WHEN** 用户关闭并重新打开应用
- **THEN** Token 从 uni.storage 恢复
- **AND** userInfo 从 Pinia persist 恢复
- **AND** 用户保持登录状态

#### Scenario: Token expiration handling
- **GIVEN** 用户的 Token 已过期
- **WHEN** 用户访问需要认证的页面
- **THEN** 系统清除本地状态
- **AND** 重定向到登录页面（携带原始 URL）

---

### Requirement: Role-Based Access Control

系统 SHALL 支持基于角色的权限控制。

#### Scenario: Role check
- **GIVEN** 用户已登录且角色为 USER
- **WHEN** 系统检查用户是否为 ADMIN
- **THEN** hasRole(ADMIN) 返回 false
- **AND** hasRoleOrAbove(USER) 返回 true

#### Scenario: Permission check
- **GIVEN** 用户已登录且拥有特定权限列表
- **WHEN** 系统检查用户是否拥有某权限
- **THEN** hasPermission() 根据权限列表返回结果
- **AND** ADMIN 角色拥有所有权限

## Technical Notes

### Storage Strategy
- **Token**: 使用 `@/utils/storage` 独立存储到 uni.storage
- **UserInfo**: 使用 Pinia persist 插件持久化

### API Integration
- 认证操作在 `src/store/modules/user.ts` 中调用 `@/api` 的生成函数：`loginWithPhone`、`loginWithSms`、`loginWithWechat`、`registerWithPhone`、`sendSmsCode`、`resetPasswordByPhone` 等
- `refreshToken`、`logout` 由 `src/api/custom/override.ts` 覆盖（`skipAuthHandling`）

### Cross-Platform Considerations
- 微信登录仅在 `MP-WEIXIN` 平台可用（条件编译）
- 存储使用 uni.storage API，兼容所有平台
