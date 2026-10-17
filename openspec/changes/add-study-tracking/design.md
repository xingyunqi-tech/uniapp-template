## Context

规则见 `docs/exam-prep-business.md` 4.4「统计事件」、4.5、4.6。统计事件由 `add-practice-session` 入队，本 change 实现处理器与各项统计。

## Goals / Non-Goals

- Goals：统计事件处理、错题本、掌握度与每日统计、打卡、收藏与笔记
- Non-Goals：学情报告、学习计划、预测分（P1）；勘误统计修正（`add-question-feedback-errata`）

## Decisions

- **幂等依据**：处理器事务首句 `UPDATE answer_record SET statsAppliedAt = now() WHERE id = ? AND statsAppliedAt IS NULL AND isCorrect IS NOT NULL`，影响 0 行即跳过；锁只用于减少冲突。
- **首次作答**：`(userId, questionId) WHERE firstForQuestion` 部分唯一索引；处理器尝试置位，冲突视为非首次，不累加全站统计。
- **原子写入**：`UserKnowledgeStat`、`UserDailyStat` 使用 `INSERT ... ON CONFLICT DO UPDATE SET answered = answered + 1 ...`；`recentResults` 用 `(array_append(recentResults, x))[greatest(...):]` 截取最近 20 位。
- **父节点掌握度**：查询时以 `answer_record` 联表 `question_knowledge_point` 并按 `path` 前缀过滤子树，按作答记录去重后计算；结果缓存 10 分钟，统计事件处理后失效该用户缓存。
- **打卡**：处理器在同一事务内判定，日期取 `statDate`；`StudyCheckin` 唯一键防重。
- **favorites 改造**：枚举新增 `question`、`paper`（小写）；创建收藏时由服务端校验目标存在、题目关联前提（可见性规则 1-3 + `isFree`），并写入 `subjectId` 与 title 快照。

## Risks / Trade-offs

- 父节点聚合查询随作答量增长 → 缓存 + 必要时改为物化汇总

## Migration Plan

新增表与 favorites 列的 migration；favorites 现有数据 `subjectId` 为空。

## Open Questions

无。
