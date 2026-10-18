## Context

规则以 `docs/exam-prep-business.md` 4.4 为准。本 change 的难点集中在模考的并发与答案防泄露。

## Goals / Non-Goals

- Goals：会话、作答、判分、可见性、模考、报告、个人试卷生成
- Non-Goals：错题本与统计的处理逻辑（`add-study-tracking`）；勘误（`add-question-feedback-errata`）；AI 批改（P1）

## Decisions

- **可见性集中实现**：`AnswerVisibilityService.check(userId, questionId, context)` 统一判断前提与规则 1-4，所有返回题目内容或判分结果的接口与 AI 讲题都调用它。前提查询「用户进行中模考的题目集合」直接查库，走 `(userId, paperId) WHERE status = 'IN_PROGRESS' AND mode = 'MOCK'` 部分唯一索引。
- **判分读最新答案**：判分器按 `questionId` 读取 `question` 表当前答案，不按记录版本；`questionVersion` 只决定渲染。
- **作答写入**：
  - 事务内 `SELECT ... FOR NO KEY UPDATE` 锁定会话行，同一会话写入串行并与交卷、放弃互斥；校验状态、写入窗口、设备。
  - `MOCK` 覆盖规则：同 `deviceId` 比较 `clientSeq`；不同设备时以 `activeDeviceId` 为准。清空为软清空。
  - `answeredCount`、`correctCount` 以原子增减维护（依据写入前后的 `answer` 是否为空、`isCorrect` 变化）。
- **首次作答**：首条非空答案写入时在同一事务内 `INSERT ... ON CONFLICT` 风格地设置 `isFirstAttempt`（部分唯一索引 `(userId, paperId) WHERE isFirstAttempt` 兜底），成功则 `attemptCount = attemptCount + 1`。
- **交卷**：同一事务内条件更新状态、批量判分客观题、写总分；提交后按会话入队统计任务。自动交卷为 BullMQ 延时任务（`jobId = sessionId`），兜底扫描每 5 分钟、`runExclusive` 互斥；`answeredCount = 0` 置 `ABANDONED`。
- **会话接管**：只有 `POST /practice/sessions` 能更新 `activeDeviceId`，且 `now < deadlineAt`。
- **出题**：随机类以材料为抽取单位；排除进行中模考题目；排除下架题（模考除外）；分段拉取按材料边界对齐。
- **个人试卷生成**：`POST /paper-rules/:id/generate`，读取用户近 30 天作答题目集合用于排除；每日次数限制读取 `paper.generateDailyLimit`。
- **小程序作答缓存**：按会话 ID 存 storage：`{ deviceId, seq, pending: AnswerPatch[] }`，切题或每 10 秒批量同步；收到 `sessionTakenOver` 清空本地缓存并退出。

## Risks / Trade-offs

- 进行中模考的前提查询在每次题目输出与作答时执行 → 每用户同时只有少量进行中模考，走部分唯一索引
- 离线补交依赖客户端时间 → 已在业务文档声明只能缓解

## Migration Plan

新增表的 migration；无存量数据。

## Open Questions

无。
