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
- **掌握度两种口径**：
  - 知识点树（`/me/study/knowledge`、`GET /subjects/:id/knowledge-points` 的 `progress`）的叶子与父节点统一按子树内已计入的作答记录聚合，最近 20 次按计入时间（`statsAppliedAt`）倒序；已做题数与题目数只计当前已发布的题目。作答聚合按用户缓存 10 分钟并在统计事件后失效，题目数按科目缓存 10 分钟。
  - 薄弱知识点与 `SMART` 出题使用 `UserKnowledgeStat` 实时数据，`recentResults` 按计入顺序追加。
  - 可接受的偏差：两种口径的最近 20 次在计入顺序与 `statsAppliedAt` 顺序不一致时可能相差个别记录；勘误改判、知识点关联调整或题目上下架后，知识点树按当前关联重新聚合，`UserKnowledgeStat` 保留计入时的结果；题目上下架后题目数最多延迟 10 分钟。
- **打卡**：处理器在同一事务内判定，日期取 `statDate`；判定前按 `(userId, date)` 加事务级 advisory lock，`StudyCheckin` 唯一键防重。每日一练只统计 `statDate`（主观题也可为作答时间的业务日）等于 `dailyDate` 的作答；主观题作答不产生统计事件，作答保存后按 `checkin-{userId}-{date}` 入队一个只做打卡判定的任务。
- **favorites 改造**：枚举新增 `question`、`paper`（小写）；创建收藏时由服务端校验目标存在、题目关联前提（可见性规则 1-3；`isFree` 在会员上线后启用），并写入 `subjectId` 与 title 快照。

## Risks / Trade-offs

- 父节点聚合查询随作答量增长 → 缓存 + 必要时改为物化汇总

## Migration Plan

新增表与 favorites 列的 migration；favorites 现有数据 `subjectId` 为空。

## Open Questions

无。
