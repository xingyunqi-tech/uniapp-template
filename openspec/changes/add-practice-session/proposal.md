# Change: 新增练习会话与模拟考试

## Why

做题是产品核心。所有练习模式与模拟考试统一抽象为「练习会话」，需要实现出题、作答、判分、答案可见性、交卷与成绩报告，并保证模考在并发、多设备、断网下的正确性（`docs/exam-prep-business.md` 4.4、4.3 按规则生成、5.1）。

## What Changes

- 后端 `practice` 模块：
  - PracticeSession、AnswerRecord 实体与索引（含 `paperId`、`dailyDate` 列与部分唯一索引）
  - 模式：章节、随机、题型、智能、每日一练、错题重做、模拟考试、背题（收藏练习为 P1）
  - 答案可见性规则与「进行中模考」前提，题目内容接口的 `hiddenReason`
  - 判分（单选、多选两种规则、判断、填空、主观题自评）；判分读取最新答案
  - 模考：单设备作答与接管、离线补交窗口、首次作答标记、交卷事务、BullMQ 延时自动交卷与兜底扫描
  - 成绩报告；按规则生成个人试卷
  - 统计事件入队（处理器在 `add-study-tracking` 实现）
  - `GET /questions/:id` 关联校验
- 小程序：答题页（虚拟 swiper、答题卡、计时、标记、音频、自评、本地缓存与补交、接管提示）、成绩报告页、练习历史、试卷详情与开考、按规则组卷入口、首页继续练习
- 运营后台：无

## Impact

- Affected specs: `practice-session`、`mock-exam`（新增）
- Affected code:
  - 后端：新增 `src/modules/practice`；`src/modules/papers` 增加生成接口；`src/modules/questions` 增加用户单题接口
  - 小程序：`src/pages-sub/exam`、`src/pages/index`、`src/pages/bank`
- 依赖：`add-exam-platform-foundation`、`add-exam-content`
- 被依赖：`add-study-tracking`、`add-question-feedback-errata`、`add-ai-question-tutor`
