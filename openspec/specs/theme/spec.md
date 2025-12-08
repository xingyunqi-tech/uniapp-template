# Capability: Theme System

## Purpose

基于 CSS 变量的主题系统，支持浅色（Light）和深色（Dark）两种主题模式切换。所有颜色、阴影等视觉属性通过 CSS 变量定义，确保主题切换的一致性。使用 Pinia Store 管理主题状态并持久化到本地存储，跨平台兼容 H5、小程序和 App，自动同步导航栏和 TabBar 样式。

## Requirements

### Requirement: CSS Variables Architecture

所有颜色和视觉属性 SHALL 使用 CSS 变量定义，禁止硬编码颜色值。

#### Scenario: Use CSS variables in components
- **GIVEN** 开发组件样式
- **WHEN** 需要设置颜色属性
- **THEN** 必须使用 `var(--color-xxx)` 格式
- **AND** 禁止使用硬编码颜色值（如 `#fff`、`#323233`）

#### Scenario: Variable categories
- **GIVEN** 主题变量系统
- **THEN** 提供以下类别的变量：
  - 主题色：`--color-primary`, `--color-success`, `--color-warning`, `--color-error`
  - 文字色：`--color-text`, `--color-text-secondary`, `--color-text-placeholder`
  - 背景色：`--color-bg`, `--color-bg-grey`, `--color-bg-card`
  - 边框色：`--color-border`, `--color-border-light`, `--color-border-dark`
  - 阴影：`--shadow-sm`, `--shadow-base`, `--shadow-lg`

---

### Requirement: Light Theme (Default)

系统 SHALL 提供浅色主题作为默认主题。

#### Scenario: Light theme colors
- **GIVEN** 浅色主题激活
- **THEN** 主题色为 `#1989fa`
- **AND** 背景色为 `#fff`（主背景）、`#f7f8fa`（灰色背景）
- **AND** 文字色为 `#323233`（主文字）、`#969799`（次要文字）
- **AND** 边框色为 `#ebedf0`

#### Scenario: Light theme definition
- **GIVEN** CSS 变量定义
- **WHEN** 在 `page` 或 `:root` 选择器中
- **THEN** 定义浅色主题的所有变量值

---

### Requirement: Dark Theme

系统 SHALL 提供深色主题支持。

#### Scenario: Dark theme activation
- **GIVEN** 深色主题
- **WHEN** 页面或根元素添加 `dark-theme` 类
- **THEN** CSS 变量自动切换到深色值

#### Scenario: Dark theme colors
- **GIVEN** 深色主题激活
- **THEN** 主题色为 `#409eff`（比浅色稍亮）
- **AND** 背景色为 `#141414`（主背景）、`#1d1d1d`（灰色背景）
- **AND** 文字色为 `#e5eaf3`（主文字）、`#a3a6ad`（次要文字）
- **AND** 边框色为 `#363637`

#### Scenario: Dark theme selectors
- **GIVEN** 深色主题 CSS 定义
- **THEN** 支持以下选择器：
  - `page.dark-theme` - 小程序 page 元素
  - `:root.dark-theme` - H5 根元素
  - `.dark-theme` - 任意带有此类的元素

---

### Requirement: Theme Switching

系统 SHALL 通过 Pinia Store 管理主题切换。

#### Scenario: Set theme
- **GIVEN** 使用 `useGlobalStore()`
- **WHEN** 调用 `setTheme('dark')` 或 `setTheme('light')`
- **THEN** 更新 Store 中的 `currentTheme` 状态
- **AND** 应用主题到页面

#### Scenario: Toggle theme
- **GIVEN** 当前主题为浅色
- **WHEN** 调用 `toggleTheme()`
- **THEN** 切换到深色主题
- **AND** 反之亦然

#### Scenario: Theme persistence
- **GIVEN** 用户切换了主题
- **WHEN** 用户关闭并重新打开应用
- **THEN** 主题设置从 Pinia persist 恢复
- **AND** 保持用户上次选择的主题

---

### Requirement: Platform Theme Application

系统 SHALL 跨平台应用主题样式。

#### Scenario: H5 theme application
- **GIVEN** H5 平台
- **WHEN** 切换到深色主题
- **THEN** 在 `document.documentElement` 添加 `dark-theme` 类
- **AND** CSS 变量自动生效

#### Scenario: Navigation bar theme
- **GIVEN** 任意平台
- **WHEN** 主题切换
- **THEN** 调用 `uni.setNavigationBarColor()` 更新导航栏颜色
- **AND** 浅色主题：黑色文字 + 白色背景
- **AND** 深色主题：白色文字 + 深色背景

#### Scenario: TabBar theme
- **GIVEN** 任意平台
- **WHEN** 主题切换
- **THEN** 调用 `uni.setTabBarStyle()` 更新 TabBar 样式
- **AND** 更新背景色、文字色、选中色

---

### Requirement: Theme Computed Properties

系统 SHALL 提供便捷的主题计算属性。

#### Scenario: isDark computed
- **GIVEN** 使用 `useGlobalStore()`
- **WHEN** 访问 `isDark` 计算属性
- **THEN** 当前为深色主题时返回 `true`
- **AND** 当前为浅色主题时返回 `false`

#### Scenario: themeClass computed
- **GIVEN** 使用 `useGlobalStore()`
- **WHEN** 访问 `themeClass` 计算属性
- **THEN** 深色主题返回 `'dark-theme'`
- **AND** 浅色主题返回 `''`

#### Scenario: Apply theme class to page
- **GIVEN** 页面组件
- **WHEN** 需要应用主题
- **THEN** 在根 view 上绑定 `:class="globalStore.themeClass"`

## Technical Notes

### Variable File Location
- 主题变量定义：`src/styles/theme.scss`
- 尺寸变量定义：`src/styles/size.scss`

### Color Variables Summary

| 类别 | 浅色主题 | 深色主题 |
|------|---------|---------|
| `--color-primary` | #1989fa | #409eff |
| `--color-text` | #323233 | #e5eaf3 |
| `--color-text-secondary` | #969799 | #a3a6ad |
| `--color-bg` | #fff | #141414 |
| `--color-bg-grey` | #f7f8fa | #1d1d1d |
| `--color-border` | #ebedf0 | #363637 |

### Store Configuration
- Store 名称：`global`
- 持久化字段：`currentTheme`, `currentLocale`
- 存储方式：`uni.storage`

### Restrictions
- 禁止硬编码颜色值
- 所有组件必须使用 CSS 变量
- 主题切换必须通过 Store 进行
