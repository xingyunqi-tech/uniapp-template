## ADDED Requirements

### Requirement: Question Favorites

用户 SHALL 能收藏题目与试卷；收藏题目要求该题在用户某个会话中已满足答案可见性规则 1-3（免费限制在会员上线后启用，P0 不校验）；服务端 SHALL 校验目标存在并保存标题快照与科目。

#### Scenario: Favorite after answering
- **GIVEN** 用户在章节练习中已作答题目 Q
- **WHEN** 用户收藏 Q
- **THEN** 收藏成功，可在收藏题列表中查看 Q 的答案

#### Scenario: Favorite during ongoing mock
- **GIVEN** 题目 Q 只出现在用户进行中或已放弃的模考中
- **WHEN** 用户收藏 Q
- **THEN** 返回 `questionNotAccessible`

#### Scenario: Filter by subject
- **WHEN** 用户在收藏题列表按科目筛选
- **THEN** 只显示该科目的收藏题

---

### Requirement: Question Notes

用户 SHALL 能为可访问的题目保存一条不超过 1000 字的笔记，并查看笔记列表；建立笔记的前提与收藏相同。

#### Scenario: Save note
- **WHEN** 用户在答题解析页保存笔记
- **THEN** 笔记保存，再次打开该题时显示

#### Scenario: Note too long
- **WHEN** 笔记超过 1000 字
- **THEN** 返回 422
