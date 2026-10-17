## ADDED Requirements

### Requirement: Question Types

系统 SHALL 支持单选、多选、判断、填空、简答、作文/申论与材料题，材料题可挂听力音频。

#### Scenario: Material with sub-questions
- **WHEN** 管理员创建一道含 5 个小题的资料分析材料题
- **THEN** 材料与小题关联保存，小题顺序固定

#### Scenario: Listening material
- **WHEN** 管理员为材料上传音频
- **THEN** 材料保存 `audioFileId`，小程序展示音频播放器

---

### Requirement: Question Lifecycle

题目 SHALL 按 `DRAFT → REVIEWING → PUBLISHED ⇄ OFFLINE` 流转，`REVIEWING` 可驳回为 `DRAFT`；材料与其全部小题 SHALL 整体流转。

#### Scenario: Publish material
- **WHEN** 管理员发布材料题
- **THEN** 材料与全部小题在同一事务内变为 `PUBLISHED`

#### Scenario: Offline single sub-question
- **WHEN** 管理员尝试单独下架某个小题
- **THEN** 拒绝操作

#### Scenario: Delete answered question
- **GIVEN** 题目已被作答
- **WHEN** 管理员删除该题
- **THEN** 拒绝删除，只能下架

---

### Requirement: Question Versioning

系统 SHALL 在首次发布时写入 v1 版本快照，发布后每次修改生成新版本；普通编辑 SHALL NOT 修改答案、题型、选项 key 集合与填空空数。

#### Scenario: Edit published stem
- **GIVEN** 题目当前版本为 v1
- **WHEN** 管理员修改题干错别字
- **THEN** 生成 v2（`EDIT`），`currentVersion` 为 2
- **AND** v1 快照保持不变

#### Scenario: Edit answer rejected
- **WHEN** 管理员通过编辑修改已发布题目的答案
- **THEN** 返回 `answerChangeNotAllowed`

#### Scenario: Draft edit
- **GIVEN** 题目为 `DRAFT`
- **WHEN** 管理员修改任意字段
- **THEN** 直接更新，不产生版本

---

### Requirement: Question Deduplication

系统 SHALL 以内容哈希对同一科目的题目去重，材料小题的哈希 SHALL 包含所属材料。

#### Scenario: Duplicate standalone question
- **WHEN** 新建与已有题目题干和选项相同的独立题
- **THEN** 拒绝创建并提示重复

#### Scenario: Same stem under different materials
- **GIVEN** 两份听力材料的小题题干都是 "What does the man mean?"
- **WHEN** 导入第二份材料
- **THEN** 不判为重复

---

### Requirement: Answer Fields Protection

用户与公开接口 SHALL NOT 返回题目的答案与解析，除非满足答案可见性规则（见 `add-practice-session`）。

#### Scenario: Public catalog response
- **WHEN** 游客试做接口返回题目
- **THEN** 响应不包含答案与解析

---

### Requirement: Question Content Rendering

小程序 SHALL 渲染题干、选项、解析与材料中的 Markdown、LaTeX 公式、图片与音频。

#### Scenario: Image in stem
- **WHEN** 题干包含图片引用
- **THEN** 图片正常显示并支持点击预览

#### Scenario: Formula in stem
- **WHEN** 题干包含 `$\frac{a}{b}$`
- **THEN** 公式正确渲染

---

### Requirement: Admin Question Management

运营后台 SHALL 支持题目的列表筛选、新建、编辑、预览、版本历史、提交审核、驳回、发布、下架与批量发布。

#### Scenario: Preview before publish
- **WHEN** 管理员预览待审题目
- **THEN** 以小程序一致的渲染效果展示题干、选项、解析、公式、图片与音频

#### Scenario: Batch publish
- **WHEN** 管理员勾选多道待审题目批量发布
- **THEN** 全部变为 `PUBLISHED`，材料题按整组处理
