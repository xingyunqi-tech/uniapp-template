## ADDED Requirements

### Requirement: Exam and Subject Catalog

系统 SHALL 提供考试与科目目录，只向用户展示已发布的考试与科目。

#### Scenario: Browse exams
- **WHEN** 用户或游客打开选择考试页
- **THEN** 按类别分组展示已发布的考试

#### Scenario: Offline subject hidden
- **GIVEN** 科目已下架
- **WHEN** 用户浏览该考试的科目
- **THEN** 该科目不再展示
- **AND** 用户在该科目下的历史记录保留

---

### Requirement: Knowledge Point Tree

系统 SHALL 以最多三级的树组织知识点，题目只能关联叶子节点。

#### Scenario: Add child to node with questions
- **GIVEN** 知识点 K 已关联题目
- **WHEN** 管理员为 K 新增子节点
- **THEN** 拒绝操作并提示先迁移题目

#### Scenario: Tag question to non-leaf
- **WHEN** 管理员把题目关联到非叶子知识点
- **THEN** 拒绝保存

#### Scenario: Question count maintained
- **WHEN** 题目发布、下架或修改知识点标签
- **THEN** 相关叶子知识点的已发布题目数在同一事务内更新

#### Scenario: Chapter practice entry
- **GIVEN** 非叶子知识点的子孙叶子节点有已发布题目
- **WHEN** 用户浏览题库页知识点树
- **THEN** 该节点显示练习入口，按子树抽题
- **AND** 题目数只在叶子节点显示

---

### Requirement: Target Exam Profile

用户 SHALL 能够关注多个目标考试，其中一个为当前考试，并设置考试日期与每日目标。

#### Scenario: First followed exam
- **WHEN** 用户首次关注考试
- **THEN** 该考试自动成为当前考试

#### Scenario: Switch current exam
- **WHEN** 用户把另一个已关注考试设为当前
- **THEN** 原当前考试取消当前标记
- **AND** 同一用户始终最多只有一个当前考试

#### Scenario: Unfollow current exam
- **GIVEN** 用户关注了考试 A（当前）与 B
- **WHEN** 用户取消关注 A
- **THEN** B 成为当前考试

#### Scenario: Followed exam taken offline
- **GIVEN** 用户关注的考试已下架
- **WHEN** 用户打开首页、题库页或选择考试页
- **THEN** 该考试不再展示，也不作为当前考试
- **AND** 未选择当前考试时引导用户重新选择

#### Scenario: Guest selection synced after login
- **GIVEN** 游客在本地选择了目标考试
- **WHEN** 游客登录
- **THEN** 本地选择同步为用户的目标考试

---

### Requirement: Exam Countdown on Home

小程序首页 SHALL 展示当前考试的倒计时与每日一练入口。

#### Scenario: Exam date set
- **GIVEN** 当前考试设置了考试日期
- **WHEN** 用户打开首页
- **THEN** 显示距考试的剩余天数

#### Scenario: No exam selected
- **WHEN** 已登录用户未设置目标考试时打开首页
- **THEN** 引导进入选择考试页

---

### Requirement: Admin Catalog Management

运营后台 SHALL 支持考试、科目、知识点的增删改查、上下架与知识点移动、题目迁移。

#### Scenario: Delete knowledge point with children
- **WHEN** 管理员删除仍有子节点或关联题目的知识点
- **THEN** 拒绝删除

#### Scenario: Migrate questions
- **WHEN** 管理员把知识点 K 的题目迁移到叶子节点 L
- **THEN** 题目关联改为 L，两节点的题目数同步更新

#### Scenario: Delete non-draft exam or subject
- **GIVEN** 考试或科目已发布或已下架
- **WHEN** 管理员删除该考试或科目
- **THEN** 拒绝删除，只能通过下架隐藏

#### Scenario: Delete exam or subject with children
- **GIVEN** 草稿考试下仍有科目，或草稿科目下仍有知识点
- **WHEN** 管理员删除该考试或科目
- **THEN** 拒绝删除并提示先删除下级
