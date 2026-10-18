# Change: 新增协议同意记录与注销数据清理

## Why

上架审核与个人信息保护要求：用户须同意用户协议、隐私政策（使用 AI 前还须同意 AI 服务声明）并留存记录；账号注销后须清理作答、笔记、手写照片、AI 对话等学习数据（`docs/exam-prep-business.md` 1.3、4.12）。

## What Changes

- 后端 `consents` 与 `account-cleanup` 模块：
  - UserConsent 实体与 `/me/consents` 接口；协议版本读取远程配置
  - 注销清理：现有注销流程成功后入队 `account-cleanup` 任务；`AccountDataCleaner` 端口，各业务模块注册自己的清理器
  - 本 change 覆盖的清理范围：练习会话与作答、错题、统计、打卡、目标考试、笔记、收藏、分享记录、个人生成试卷、用户上传文件、待执行自动交卷任务；纠错单解除关联并清空 `contact`、`images`
- 小程序：首次启动展示用户协议与隐私政策并上报同意；协议版本升级时重新弹出；协议与隐私入口在「设置 → 关于我们」；注销页说明清理范围
- 运营后台：无

## Impact

- Affected specs: `user-compliance`（新增）
- Affected code:
  - 后端：新增 `src/modules/consents`、`src/modules/account-cleanup`、`src/infrastructure/account-cleanup`；`src/core/users`（注销统一路径与入队）；`src/modules/files`（内容素材无主化）；各业务模块注册清理器
  - 小程序：`src/App.vue` 启动流程、`src/pages/agreement`、`src/pages/mine`、注销页
- 依赖：`add-question-feedback-errata`（纠错单字段）
- 被依赖：`add-ai-question-tutor`（AI 服务声明同意、AI 数据清理器）
