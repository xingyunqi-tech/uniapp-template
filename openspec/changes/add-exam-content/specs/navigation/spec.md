## MODIFIED Requirements

### Requirement: TabBar Navigation

系统 SHALL 支持底部 TabBar 导航。

#### Scenario: TabBar configuration
- **GIVEN** 需要配置 TabBar
- **WHEN** 在 `pages.config.ts` 的 tabBar 中定义
- **THEN** 设置图标、文字、选中颜色等属性
- **AND** tabBar.list 中的 pagePath 必须在主包 pages 中

#### Scenario: TabBar pages
- **GIVEN** 当前 TabBar 配置
- **THEN** 首页 (pages/index/index) 为 TabBar 页面
- **AND** 题库 (pages/bank/index) 为 TabBar 页面
- **AND** AI 助教 (pages/ai/index) 为 TabBar 页面
- **AND** 我的 (pages/mine/index) 为 TabBar 页面

---

### Requirement: Sub-Package Architecture

系统 SHALL 使用分包架构优化小程序体积。

#### Scenario: Order sub-package
- **GIVEN** 订单相关页面
- **THEN** 位于 `pages-sub/order/` 分包
- **AND** 包含订单列表、订单详情、支付结果页

#### Scenario: User sub-package
- **GIVEN** 用户相关页面
- **THEN** 位于 `pages-sub/user/` 分包
- **AND** 包含地址管理、地址编辑、收藏、消息通知、通知设置、密码修改、资料编辑、设置页

#### Scenario: Other sub-package
- **GIVEN** 其他功能页面
- **THEN** 位于 `pages-sub/other/` 分包
- **AND** 包含关于我们、联系客服、意见反馈、WebView 页、组件演示页

#### Scenario: Exam sub-package
- **GIVEN** 考试与作答相关页面
- **THEN** 位于 `pages-sub/exam/` 分包
- **AND** 包含选择考试、答题、成绩报告、试卷详情、按规则组卷、每日一练试做、练习历史页

#### Scenario: Study sub-package
- **GIVEN** 学习记录相关页面
- **THEN** 位于 `pages-sub/study/` 分包
- **AND** 包含错题本、收藏题、我的笔记、打卡日历、我的纠错、题目详情页

#### Scenario: AI sub-package
- **GIVEN** AI 相关页面
- **THEN** 位于 `pages-sub/ai/` 分包
- **AND** 包含对话详情页
