## Context

现有注销流程（`auth.service.softDelete` → `users.remove`）已清空邮箱、手机号、openid、unionid 并软删除用户、删除 session。项目没有事件总线，清理改由 BullMQ 任务驱动。

## Goals / Non-Goals

- Goals：协议同意留痕、注销后学习数据清理
- Non-Goals：个人数据导出（P2）

## Decisions

- **模块划分**：
  - `ConsentsModule`：同意记录与 `/me/consents`，导出 `ConsentsService`（含 `hasAgreedAiService`，供 AI 模块使用）。
  - `AccountCleanupModule`：清理执行器、管理端重新触发接口、补偿定时任务；`account-cleanup` 队列 processor 依赖它。
  - `AccountCleanupProducerModule`：只负责入队的 `AccountCleanupProducer`，`UsersModule` 依赖它；未启用 Redis 时由 `AccountCleanupModule` 注册的进程内执行器执行，producer 不依赖业务模块，避免循环依赖。
- **清理器注册**：`AccountDataCleaner` 端口（`name`、`clean(userId)`）；各模块用 `@AccountCleaner({ order })` 装饰自己的清理器 provider，执行器通过 `DiscoveryService` 收集并按 `order` 升序执行，新增清理器无需修改清理模块。任务依次执行全部清理器，单个失败不中断其余清理器；每个清理器幂等，失败按 BullMQ `attempts` 重试，最终失败告警；全部成功后在 `account_cleanup` 表记录完成时间。
- **清理顺序**：练习会话（先移除进行中模考的自动交卷任务）先于个人生成试卷（`practice_session.paperId` 为 `RESTRICT`）与统计；解除头像引用先于文件删除。
- **清理口径**（见业务文档 4.12 表）：
  - 删除：会话、作答、错题、知识点与每日统计、打卡、目标考试、笔记、收藏、分享记录、个人生成试卷（含其会话）、站内通知与通知设置、收货地址、勘误受影响用户记录、用户的个人文件（存储与记录，仍被外键引用的保留）
  - 解除关联：纠错与举报记录 `userId` 置空，清空 `contact`、`images`
  - 保留：同意记录、订单与审计日志、题目全站统计、试卷 `attemptCount`、内容素材
  - 删除待执行的自动交卷延时任务、Redis 中该用户的额度 key
- **内容素材与个人文件分离**：`content-image`（需 `content:manage`，公共读）、`audio` 用途上传与导入素材一律为无主文件（`ownerUserId` 为空）；导入去重只复用无主文件；数据迁移把题目、题目版本、考试图标引用的文件与音频文件改为无主。文件删除在事务内先删记录、再删存储对象，失败回滚。
- **触发**：用户自助注销与管理员删除用户都走 `UsersService.remove`：删除会话、软删除用户、`AccountCleanupProducer.enqueueCleanup(userId)`。jobId 按用户固定，已有任务排队或执行中时不重复入队，已结束的任务移除后重新入队。补偿定时任务把注销超过 30 分钟仍未完成清理的用户重新入队，覆盖注销与入队之间进程崩溃的情况。
- **重新触发**：`POST /admin/users/:id/cleanup`（`user:delete` 权限），仅限已注销用户。
- **勘误通知**：已注销用户不再接收勘误通知。
- **同意记录**：`(userId, type, version)` 唯一；当前版本来自远程配置 `consent.*Version`；`GET /me/consents` 返回各协议是否需要重新同意；`POST /me/consents` 只接受当前版本，返回本次同意版本的记录。

## Risks / Trade-offs

- 清理任务执行期间用户数据部分存在 → 用户已无法登录旧账号，无可见影响

## Migration Plan

新增 `user_consent`、`account_cleanup` 表；数据迁移把题目内容引用的文件与音频文件的 `ownerUserId` 置空。

## Open Questions

无。
