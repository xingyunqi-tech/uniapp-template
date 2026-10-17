# Change: 新增考试内容体系与运营录入

## Why

刷题、模考、错题等所有学习功能都建立在「考试 → 科目 → 知识点 → 题目 → 试卷」的内容体系之上。首发科目为国考 · 行测，需要先具备内容模型、题目版本、运营录入与审核能力，才能生产题库（`docs/exam-prep-business.md` 4.1、4.2、4.3、4.11）。

## What Changes

- 后端：
  - `exams` 模块：Exam、Subject、KnowledgePoint、UserExamProfile 与接口
  - `questions` 模块：Question、QuestionVersion、材料题、状态流转（材料与小题整体流转）、`contentHash` 去重、编辑限制
  - `papers` 模块：Paper、PaperQuestion、PaperRule、DailyQuestionSet；每日一练题组生成任务
  - 导入服务：BullMQ 导入任务、`ImportJob`、导入包解析（附 4.11 格式）、错误行报告；后端脚本 `pnpm import:content`
  - 全部 `/admin/*` 内容管理接口（考试、科目、知识点、题目、审核、试卷、组卷规则、每日一练、导入）
  - 公开目录接口：考试、科目、知识点树、试卷列表与概要、每日一练概要与游客试做
- 运营后台：考试/科目/知识点树管理、题目编辑与预览（公式、图片、音频）、审核发布、试卷组题、组卷规则、每日一练题组、批量导入
- 小程序：
  - TabBar 调整为首页 / 题库 / AI 助教 / 我的
  - 选择考试页（考试日期、每日目标），游客选择本地暂存、登录后同步
  - 题库页：科目切换、知识点树、试卷列表
  - 首页：考试倒计时、每日一练入口与游客试做
  - 题目内容渲染组件（Markdown + LaTeX + 图片 + 音频）

## Impact

- Affected specs: `exam-catalog`、`question-bank`、`paper-catalog`、`content-import`（新增）；`navigation`（修改 TabBar、分包）
- Affected code:
  - 后端：新增 `src/modules/exams`、`src/modules/questions`、`src/modules/papers`
  - 小程序：`pages.config.ts`、`src/pages/index`、新增 `src/pages/bank`、`src/pages/ai`（占位）、`src/pages-sub/exam`
  - 运营后台：内容管理页面
- 依赖：`add-exam-platform-foundation`
- 被依赖：`add-practice-session`
