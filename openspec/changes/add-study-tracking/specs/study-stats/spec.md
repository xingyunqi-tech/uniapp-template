## ADDED Requirements

### Requirement: Idempotent Stats Event Processing

系统 SHALL 对每条已判出对错的作答记录只计入一次统计；处理 SHALL 在单个事务内以条件更新抢占记录、重读记录后完成全部统计写入。

#### Scenario: Duplicate job
- **WHEN** 同一作答记录的统计任务被执行两次
- **THEN** 第二次不产生任何统计变化

#### Scenario: Ungraded record skipped
- **GIVEN** 作答记录尚未判出对错（主观题未自评）
- **WHEN** 统计任务执行
- **THEN** 不计入统计，记录保持未计入状态

#### Scenario: Compensation
- **GIVEN** 某条已判分记录 10 分钟后仍未计入统计
- **WHEN** 补偿任务执行
- **THEN** 该记录被重新入队并计入统计

---

### Requirement: First Answer Statistics

系统 SHALL 仅以用户对某题的首次计入作答累加题目全站作答人次与正确人次。

#### Scenario: Redo does not inflate
- **GIVEN** 用户已计入过题目 Q
- **WHEN** 用户再次作答 Q
- **THEN** Q 的全站作答人次不变

---

### Requirement: Knowledge Point Mastery

系统 SHALL 按叶子知识点统计作答与正确数，掌握度 = 最近 20 次正确率 × 0.7 + 累计正确率 × 0.3；作答不足 5 次显示「数据不足」；父节点 SHALL 按子树内作答记录去重聚合。

#### Scenario: Weak point
- **GIVEN** 叶子知识点作答 8 次，掌握度 45%
- **WHEN** 用户查看薄弱知识点
- **THEN** 该知识点出现在列表中

#### Scenario: Parent aggregation without double counting
- **GIVEN** 一道题同时关联同一父节点下的两个叶子
- **WHEN** 查询父节点掌握度
- **THEN** 该作答只计一次

---

### Requirement: Daily Statistics

系统 SHALL 按 `Asia/Shanghai` 统计日记录每日每科目的作答数、正确数与用时，统计日取作答记录的 `statDate`。

#### Scenario: Late-night answer
- **WHEN** 用户在北京时间 00:30 作答
- **THEN** 计入当天，而不是前一天

---

### Requirement: Check-in

系统 SHALL 在满足条件时自动打卡：该日每日一练客观题均已判分且主观题均已作答，或该日当前考试下各科目作答数之和达到每日目标；打卡日期取触发记录的统计日。

#### Scenario: Goal reached
- **GIVEN** 每日目标 30 题
- **WHEN** 用户当天第 30 题计入统计
- **THEN** 写入当天打卡

#### Scenario: Streak
- **GIVEN** 用户昨天与前天已打卡、今天未打卡
- **WHEN** 查看连续打卡
- **THEN** 显示 2 天

---

### Requirement: Study Overview

小程序首页 SHALL 展示今日进度、连续打卡天数、考试倒计时与累计做题数；知识点树 SHALL 附带登录用户的做题进度与掌握度。

#### Scenario: Home overview
- **WHEN** 登录用户打开首页
- **THEN** 显示今日已做题数 / 每日目标与连续打卡天数

#### Scenario: Knowledge tree progress
- **WHEN** 登录用户打开题库页知识点树
- **THEN** 每个节点显示已做题数 / 题目数与掌握度
