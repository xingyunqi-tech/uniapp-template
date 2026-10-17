## Context

判分始终读取最新答案（`add-practice-session`），因此勘误生效后的新判分自动正确；勘误任务只修正已判分的历史数据。规则见 `docs/exam-prep-business.md` 4.2 规则 9。

## Goals / Non-Goals

- Goals：纠错单、勘误版本、历史重判、统计一致性修正、通知
- Non-Goals：普通编辑后的历史重判（不做）；题目修订审计（P2）

## Decisions

- **并发约束**：`Errata` 部分唯一索引 `(questionId) WHERE status IN ('PENDING','RUNNING')`，冲突返回 `errataInProgress`。
- **版本**：勘误基于当前版本只改 `answer` 与 `analysis`；同一事务内写 `question_version`、更新 `question.currentVersion`、更新已发布试卷 `paper_question.questionVersion`、更新 `IN_PROGRESS` 会话 `questionVersions`。
- **任务分批**：按受影响用户分批（每批一个用户），在 `stats:user:{userId}` 锁与单事务内完成该用户的重判与统计修正；`processedUsers` 记录进度，任务可断点续跑。
- **统计修正**：
  - 知识点：该用户在该题叶子知识点上从已计入记录全量重建（含 `recentResults`）
  - 每日：按记录 `statDate` 对 `correct` ±1
  - 错题本：以已计入且 `isCorrect = false` 的记录重算 `wrongCount`、`lastWrongAnswer`、`firstWrongAt`；无判错记录则删除；有判错记录但无错题记录则新建 `ACTIVE`；其余不改 `status` 与 `consecutiveCorrect`
  - 全站：`firstForQuestion` 记录对 `statCorrect` ±1
- **主观题**：只更新 `questionVersion`，不重判。
- **通知**：任务完成后批量写站内通知（`NotificationCategory.STUDY`），纠错单置 `resolved` 并写 `reply`。

## Risks / Trade-offs

- 热门题勘误影响用户多 → 分批执行，进度可见，失败可续跑并告警

## Migration Plan

feedback 表新增列、`userId` 改可空、外键改 `SET NULL`；新增 `errata` 表；`NotificationCategory` 新增 `STUDY`。

## Open Questions

无。
