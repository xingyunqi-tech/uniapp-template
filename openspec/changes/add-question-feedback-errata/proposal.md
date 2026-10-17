# Change: 新增题目纠错与勘误

## Why

题库含自编与 AI 生成题，答案错误不可避免。需要用户纠错入口、运营处理流程，以及答案修正后对历史判分、成绩、错题本与统计的一致性修正（`docs/exam-prep-business.md` 4.2 规则 9、4.11）。

## What Changes

- 后端：
  - feedbacks 改造：`FeedbackType` 新增 `question_error`（`ai_content` 由 `add-ai-question-tutor` 使用）；新增 `questionId`、`questionVersion`、`reason`、`errataId`、`messageId` 字段；`userId` 改为可空、外键改为 `SET NULL`；回复复用现有 `reply`
  - 用户纠错接口与我的纠错记录
  - 管理端纠错单接口（列表、详情、状态、回复、关联勘误）
  - 勘误：`Errata` 实体与任务队列；生成 `ERRATA` 版本；更新试卷与进行中会话的版本引用；重判客观题历史记录；按用户锁修正知识点统计、每日统计、错题本、全站统计；通知受影响用户与纠错人
  - 管理端勘误接口与进度
- 运营后台：纠错单列表与处理、勘误操作与进度
- 小程序：答题页与解析页「纠错」入口、我的纠错记录页、勘误通知展示

## Impact

- Affected specs: `question-feedback`（新增）
- Affected code:
  - 后端：`src/modules/feedbacks`、`src/modules/questions`、`src/modules/practice`、`src/modules/wrong-book`、`src/modules/study-stats`、`src/modules/notifications`（`NotificationCategory.STUDY`）
  - 小程序：答题页、`src/pages-sub/study`
  - 运营后台：纠错与勘误页面
- 依赖：`add-study-tracking`
