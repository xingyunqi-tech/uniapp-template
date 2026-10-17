## Context

现有注销流程（`auth.service.softDelete` → `users.remove`）已清空邮箱、手机号、openid、unionid 并软删除用户、删除 session。项目没有事件总线，清理改由 BullMQ 任务驱动。

## Goals / Non-Goals

- Goals：协议同意留痕、注销后学习数据清理
- Non-Goals：个人数据导出（P2）

## Decisions

- **清理器注册**：定义 `AccountDataCleaner` 端口（`name`、`clean(userId)`），各模块以 multi-provider 注册；`account-cleanup` 任务依次执行全部清理器，每个清理器幂等，失败按 BullMQ `attempts` 重试，最终失败告警。
- **清理口径**（见业务文档 4.12 表）：
  - 删除：会话、作答、错题、知识点与每日统计、打卡、目标考试、笔记、收藏、分享记录、个人生成试卷（含其会话）、用户上传文件（存储与记录）
  - 解除关联：纠错与举报记录 `userId` 置空，清空 `contact`、`images`
  - 保留：同意记录、题目全站统计、试卷 `attemptCount`
  - 删除待执行的自动交卷延时任务、Redis 中该用户的额度 key
- **触发**：`auth.service` 注销成功后调用 `ComplianceQueue.enqueueCleanup(userId)`，通过模块 exports 暴露，不跨模块引用内部文件。
- **同意记录**：`(userId, type, version)` 唯一；当前版本来自远程配置 `consent.*Version`；`GET /me/consents` 返回各协议是否需要重新同意。

## Risks / Trade-offs

- 清理任务执行期间用户数据部分存在 → 用户已无法登录旧账号，无可见影响

## Migration Plan

新增 `user_consent` 表。

## Open Questions

无。
