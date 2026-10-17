## ADDED Requirements

### Requirement: Question Error Report

用户 SHALL 能对可访问的题目提交纠错（答案错误、解析错误、题干错别字、其他），并查看自己的纠错记录与处理结果。

#### Scenario: Submit report
- **WHEN** 用户在解析页选择「答案错误」并填写说明后提交
- **THEN** 创建纠错单，记录题目与当前版本

#### Scenario: View result
- **GIVEN** 纠错单已处理并回复
- **WHEN** 用户打开我的纠错
- **THEN** 显示处理状态与回复

---

### Requirement: Admin Report Handling

运营后台 SHALL 支持按类型与状态筛选纠错单、查看题目、修改状态、回复，并可从纠错单发起勘误。

#### Scenario: Reply and close
- **WHEN** 管理员判断纠错不成立并回复
- **THEN** 纠错单状态为 `closed`，用户可见回复

---

### Requirement: Errata Versioning

勘误 SHALL 基于当前版本只修改答案与解析并生成 `ERRATA` 新版本，同步更新已发布试卷与进行中会话的版本引用；同一题同一时间 SHALL 只有一个未完成的勘误。

#### Scenario: Errata on published paper
- **GIVEN** 题目 Q 属于已发布试卷 P
- **WHEN** 管理员对 Q 执行勘误
- **THEN** P 中 Q 的版本更新为勘误版本

#### Scenario: Concurrent errata
- **GIVEN** Q 已有进行中的勘误
- **WHEN** 管理员再次对 Q 发起勘误
- **THEN** 返回 `errataInProgress`

#### Scenario: Ongoing mock
- **GIVEN** 用户正在进行含 Q 的模考
- **WHEN** 勘误完成后用户交卷
- **THEN** Q 按勘误后的答案判分

---

### Requirement: Errata Regrading

勘误任务 SHALL 按新答案重判全部已判分的客观题历史作答，并更新所属会话的得分与正确数；主观题作答只更新版本。

#### Scenario: Wrong becomes correct
- **GIVEN** 用户当时选 B 被判错，勘误后正确答案为 B
- **WHEN** 勘误任务完成
- **THEN** 该作答改判为正确，会话得分与正确数相应增加

---

### Requirement: Errata Statistics Correction

勘误任务 SHALL 修正受影响用户的知识点统计、每日统计、错题本与题目全站统计，且全站统计以增量修正保留已注销用户的贡献。

#### Scenario: Remove from wrong book
- **GIVEN** 用户对 Q 只有一次判错记录，勘误后改判为正确
- **WHEN** 勘误任务完成
- **THEN** Q 从该用户错题本中删除

#### Scenario: Add to wrong book
- **GIVEN** 用户对 Q 的唯一作答原判正确，勘误后改判为错误
- **WHEN** 勘误任务完成
- **THEN** Q 加入错题本，首次进入时间取该作答的判分时间

#### Scenario: Global stats preserved
- **GIVEN** 题目 Q 有已注销用户的历史作答贡献
- **WHEN** 勘误任务完成
- **THEN** Q 的全站作答人次不减少

---

### Requirement: Errata Progress and Notification

运营后台 SHALL 显示勘误任务进度；任务完成后 SHALL 通知受影响用户，并把关联纠错单置为已解决并回复纠错人。

#### Scenario: Progress
- **WHEN** 管理员查看勘误任务
- **THEN** 显示受影响用户数与已处理用户数

#### Scenario: Task failure
- **WHEN** 勘误任务执行失败
- **THEN** 产生告警，任务可从中断处继续
