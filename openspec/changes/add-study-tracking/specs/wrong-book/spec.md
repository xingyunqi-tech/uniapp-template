## ADDED Requirements

### Requirement: Wrong Question Collection

系统 SHALL 在统计事件中把判错（含部分正确与自评「不会」）的题目加入错题本，累计错误次数并重置连续答对次数。

#### Scenario: First wrong
- **WHEN** 用户首次答错题目 Q
- **THEN** 错题本新增 Q，状态 `ACTIVE`，错误次数 1

#### Scenario: Partial correct
- **WHEN** 用户多选题少选得一半分
- **THEN** 该题进入错题本

---

### Requirement: Mastering Wrong Questions

错题 SHALL 在连续答对达到阈值（默认 3）后自动变为 `MASTERED`；同一统计日多次答对只计一次，乱序到达的较早记录不计入；主观题只能手动移出。

#### Scenario: Same-day repeated correct
- **GIVEN** 错题 Q 连续答对次数为 0
- **WHEN** 用户当天连续 3 次答对 Q
- **THEN** 连续答对次数为 1

#### Scenario: Mastered after threshold
- **GIVEN** 错题 Q 已在两个不同统计日答对
- **WHEN** 第三个统计日再次答对
- **THEN** Q 变为 `MASTERED`

#### Scenario: Subjective self-assessed known
- **WHEN** 错题本中的主观题被自评「会」
- **THEN** 连续答对次数不变

---

### Requirement: Manual Wrong Book Management

用户 SHALL 能手动移出与恢复错题；恢复时连续答对次数归零；下架题保留并标注「已下架」，不再被抽入错题重做。

#### Scenario: Restore
- **WHEN** 用户恢复已掌握的错题
- **THEN** 状态为 `ACTIVE`，连续答对次数为 0

#### Scenario: Offline question
- **GIVEN** 错题 Q 已下架
- **WHEN** 用户开始错题重做
- **THEN** Q 不被抽入，错题本中显示「已下架」

---

### Requirement: Wrong Book Browsing

小程序 SHALL 提供错题本页，支持按科目、知识点、错误次数、时间筛选，展示错题总数、本周新增与本周消灭，并可发起错题重做。

#### Scenario: Weekly summary
- **WHEN** 用户打开错题本
- **THEN** 显示 `ACTIVE` 错题总数、本周首次进入的数量、本周已掌握的数量
