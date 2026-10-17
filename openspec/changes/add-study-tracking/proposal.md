# Change: 新增错题本、学习统计与题目收藏笔记

## Why

练习产生的作答需要沉淀为错题、知识点掌握度、每日统计与打卡，形成「错题沉淀 → 薄弱点 → 针对性练习」闭环；收藏与笔记是复习的基本工具（`docs/exam-prep-business.md` 4.5、4.6、4.2 笔记、第 6 节 favorites）。

## What Changes

- 后端：
  - 统计事件处理器：事务化幂等、重读记录、首次作答判定、按用户锁、补偿扫描
  - `wrong-book` 模块：WrongQuestion、状态流转、每日最多计一次连续答对、接口
  - `study-stats` 模块：UserKnowledgeStat、UserDailyStat、StudyCheckin；掌握度、薄弱点、父节点聚合查询与缓存；打卡判定；首页概览、每日统计、打卡日历接口；知识点树附带个人进度
  - 笔记：QuestionNote 与接口
  - favorites：增加 `question`、`paper` 目标类型、目标校验、关联前提、`subjectId` 字段
- 小程序：错题本页（筛选、重做、移出、恢复）、收藏题与笔记页、打卡日历、首页今日进度与连续打卡、知识点树进度、答题页收藏与笔记入口、「我的」页入口
- 运营后台：无

## Impact

- Affected specs: `wrong-book`、`study-stats`、`question-collection`（新增）
- Affected code:
  - 后端：新增 `src/modules/wrong-book`、`src/modules/study-stats`；`src/modules/questions`（笔记）；`src/modules/favorites`
  - 小程序：`src/pages-sub/study`、`src/pages/index`、`src/pages/mine`、`src/pages/bank`、答题页
- 依赖：`add-practice-session`
- 被依赖：`add-question-feedback-errata`
