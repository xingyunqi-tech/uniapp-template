## ADDED Requirements

### Requirement: Paper Composition

系统 SHALL 以 `PaperQuestion` 组成试卷，分值唯一来源为 `PaperQuestion.score`，材料题按小题记分；已发布试卷的题目列表与题目版本 SHALL 冻结（勘误除外）。

#### Scenario: Total score derived
- **WHEN** 管理员保存试卷题目与分值
- **THEN** `totalScore` 等于全部小题分值之和，`objectiveScore` 等于客观题分值之和

#### Scenario: Modify published paper
- **WHEN** 管理员修改已发布试卷的题目
- **THEN** 拒绝修改，提示复制为新试卷

---

### Requirement: Paper Catalog

用户 SHALL 能按科目与类型浏览已发布的真题、模拟卷与专项卷，并查看试卷概要；他人的个人生成试卷 SHALL NOT 出现。

#### Scenario: Browse papers
- **WHEN** 用户打开题库页的试卷列表
- **THEN** 展示已发布试卷的标题、类型、时长、题量与参考人数

#### Scenario: Generated paper of others
- **GIVEN** 用户 A 生成了个人试卷
- **WHEN** 用户 B 浏览试卷列表或按 ID 查看
- **THEN** 看不到该试卷

---

### Requirement: Paper Rules

运营后台 SHALL 支持组卷规则的维护与试生成预览。

#### Scenario: Preview rule
- **WHEN** 管理员对组卷规则试生成
- **THEN** 返回一份抽题结果，不落库

---

### Requirement: Daily Question Set

系统 SHALL 每天为每个已发布科目生成一组全站相同的每日一练题目；当日已有用户会话时 SHALL NOT 重新生成。

#### Scenario: Scheduled generation
- **WHEN** 每天 00:05（Asia/Shanghai）
- **THEN** 为每个已发布科目生成当日题组

#### Scenario: Fallback generation
- **GIVEN** 当日题组尚未生成
- **WHEN** 首个用户访问每日一练
- **THEN** 立即生成，并发访问只生成一次

#### Scenario: Regenerate after usage
- **GIVEN** 当日题组已有用户开始作答
- **WHEN** 管理员尝试重新生成
- **THEN** 拒绝操作

---

### Requirement: Guest Daily Trial

游客 SHALL 能试做当日每日一练的前 3 题，服务端判分但不落库；遇材料题时以完整材料为单位返回。

#### Scenario: Guest trial
- **WHEN** 游客在首页试做每日一练
- **THEN** 返回前 3 题且不含答案
- **AND** 提交后返回对错，不保存任何记录

#### Scenario: Trial rate limited
- **WHEN** 同一 IP 频繁调用试做判分
- **THEN** 返回 429
