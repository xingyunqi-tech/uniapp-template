## ADDED Requirements

### Requirement: Practice Modes

系统 SHALL 提供章节练习、随机练习、题型专项、智能练习、每日一练、错题重做、模拟考试与背题模式；答案展示方式由模式推导，客户端不可指定。

#### Scenario: Chapter practice
- **WHEN** 用户在知识点子树上开始章节练习
- **THEN** 创建会话，优先抽取未做过的题目，默认 10 题

#### Scenario: Smart practice fallback
- **GIVEN** 新用户没有薄弱知识点与错题
- **WHEN** 开始智能练习
- **THEN** 不足部分以未做过的题目补齐

#### Scenario: No questions available
- **WHEN** 可出题数为 0
- **THEN** 返回 `noQuestionsAvailable`

#### Scenario: Insufficient questions
- **WHEN** 可出题数少于请求题量
- **THEN** 按实际题数创建会话并返回 `insufficient: true`

---

### Requirement: Material Question Integrity

随机类出题 SHALL 以材料为单位抽取，同一材料的小题完整且连续；分段拉取题目 SHALL 按材料边界对齐。

#### Scenario: Segment boundary
- **GIVEN** 会话第 9-13 题属于同一材料
- **WHEN** 客户端请求 `from=9&size=3`
- **THEN** 返回第 9-13 题的完整材料组

---

### Requirement: Daily Practice Session

每日一练 SHALL 每用户每科目每天一个会话，重复进入返回同一会话，不可放弃、不参与过期清理，跨天后仍可继续作答。

#### Scenario: Re-enter daily
- **WHEN** 用户当天第二次进入每日一练
- **THEN** 返回同一会话与已作答进度

---

### Requirement: Answer Visibility

系统 SHALL 仅在满足可见性规则时返回答案、解析、参考答案与判分结果；题目处于用户进行中的模考时 SHALL NOT 在任何接口返回上述内容。

#### Scenario: Immediate mode graded
- **GIVEN** 章节练习会话，题目不在进行中模考
- **WHEN** 用户提交客观题答案
- **THEN** 响应返回对错、正确答案与解析

#### Scenario: Question in ongoing mock
- **GIVEN** 用户进行中的模考包含题目 Q，且某个章节练习会话也包含 Q
- **WHEN** 用户在章节练习中提交 Q
- **THEN** 拒绝写入，返回 `questionInMockInProgress`
- **AND** 响应不包含对错与答案

#### Scenario: Wrong book during mock
- **GIVEN** 错题本中有题目 Q，用户正在进行包含 Q 的模考
- **WHEN** 用户在错题本查看 Q
- **THEN** 不返回答案与解析，附带 `hiddenReason = mockInProgress`

#### Scenario: Wrong book question inside a session
- **GIVEN** 错题本中有题目 Q，且 Q 不在用户进行中的模考
- **WHEN** 用户在新的章节练习会话中拉取尚未作答的 Q
- **THEN** 不返回答案与解析；错题本、收藏与笔记关联只用于会话外查看题目

#### Scenario: Memorize mode
- **WHEN** 用户以知识点范围开始背题模式
- **THEN** 直接返回答案与解析，不产生作答记录
- **AND** 背题模式不接受试卷范围

---

### Requirement: Question Access Control

用户 SHALL NOT 按 ID 任意获取题目内容；单题接口 SHALL 校验用户与该题存在会话、错题本、收藏或笔记关联。

#### Scenario: Unrelated question
- **WHEN** 用户请求一道从未在其会话、错题本、收藏、笔记中出现过的题目
- **THEN** 返回 `questionNotAccessible`

---

### Requirement: Immediate Grading

「答完即判」模式下，客观题首次提交即判分并锁定，再次提交返回原结果；判分 SHALL 使用题目最新版本的答案。

#### Scenario: Resubmit graded question
- **GIVEN** 用户已提交 Q 并判为错误
- **WHEN** 用户改选后再次提交
- **THEN** 返回首次判分结果，不覆盖

---

### Requirement: Scoring Rules

系统 SHALL 按题型判分：单选与判断完全一致得分；多选支持全对得分与少选得一半两种规则；填空逐空匹配归一化后的候选答案。

#### Scenario: Partial multiple choice
- **GIVEN** 试卷采用 `PARTIAL` 规则，正确答案为 ACD
- **WHEN** 用户选择 AC
- **THEN** 得一半分，`isPartial = true`，`isCorrect = false`

#### Scenario: Wrong option in multiple choice
- **WHEN** 正确答案为 ACD，用户选择 AB
- **THEN** 得 0 分

#### Scenario: Fill blank normalization
- **GIVEN** 填空候选答案为 `ABC`
- **WHEN** 用户填写带尾随空格的全角字母 `ａｂｃ`
- **THEN** 判为正确

#### Scenario: Fill blank score precision
- **GIVEN** 题目 2 分、3 个空
- **WHEN** 用户全部答对
- **THEN** 每空 0.67、0.67、0.66 分，合计 2 分

---

### Requirement: Subjective Self-Assessment

主观题 SHALL 在提交作答后返回参考答案与要点，由用户自评「会 / 不会」，自评后锁定；P0 模考中主观题不计分，在交卷后的成绩报告中自评。

#### Scenario: Self-assess in chapter practice
- **WHEN** 用户在章节练习提交简答题作答
- **THEN** 返回参考答案与要点
- **AND** 用户选择「不会」后该题判为错误

#### Scenario: Self-assess state restriction
- **WHEN** 用户对进行中的模考主观题自评
- **THEN** 返回 `selfAssessmentNotAllowed`

---

### Requirement: Session Lifecycle

会话 SHALL 在 `IN_PROGRESS`、`SUBMITTED`、`ABANDONED` 之间流转；非限时会话（每日一练除外）7 天未操作 SHALL 自动置为 `ABANDONED`。

#### Scenario: Stale session cleanup
- **GIVEN** 章节练习会话 7 天无作答与进度上报
- **WHEN** 清理任务执行
- **THEN** 会话置为 `ABANDONED`

#### Scenario: Finish practice
- **WHEN** 用户在章节练习点击「结束练习」
- **THEN** 会话置为 `SUBMITTED`，不重复触发统计

---

### Requirement: Mark and Clear

用户 SHALL 能标记题目；仅标记时以空答案记录保存标记；`answeredCount` 只统计非空答案。

#### Scenario: Mark without answer
- **WHEN** 用户标记一道未作答的题
- **THEN** 保存标记，`answeredCount` 不变

---

### Requirement: Practice History and Resume

小程序 SHALL 展示练习历史，并在首页提供「继续练习」入口指向最近一个未完成会话。

#### Scenario: Resume practice
- **GIVEN** 用户有未完成的章节练习
- **WHEN** 打开首页并点击「继续练习」
- **THEN** 进入该会话的上次浏览位置
