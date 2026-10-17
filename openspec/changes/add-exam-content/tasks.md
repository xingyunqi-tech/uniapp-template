## 1. 后端：考试与知识点（exams）

- [x] 1.1 Exam、Subject、KnowledgePoint、UserExamProfile 的 domain、实体、mapper、仓储与 migration（含部分唯一索引）
- [x] 1.2 公开接口：`GET /exams`、`GET /exams/:id/subjects`、`GET /subjects/:id/knowledge-points`（可选鉴权，个人进度留空，由 `add-study-tracking` 补充）
- [x] 1.3 目标考试接口：`/me/exam-profiles` 系列，当前考试切换与取消关注规则
- [x] 1.4 管理端：考试、科目上下架与 CRUD；知识点树、移动、迁移题目；`questionCount` 维护与重算脚本
- [x] 1.5 单元测试与 e2e

## 2. 后端：题目（questions）

- [x] 2.1 Question、QuestionVersion、`question_knowledge_point` 实体与 migration
- [x] 2.2 状态流转（材料整组）、发布写 v1、`EDIT` 生成版本与字段限制、`contentHash` 去重
- [x] 2.3 管理端题目接口：列表筛选、详情、新建、编辑、版本历史、提交、驳回、发布、下架、批量发布
- [x] 2.4 用户与公开 DTO 排除 `answer`、`analysis`
- [x] 2.5 单元测试（版本、去重、材料整组流转）与 e2e

## 3. 后端：试卷（papers）

- [x] 3.1 Paper、PaperQuestion、PaperRule、DailyQuestionSet 实体与 migration
- [x] 3.2 管理端试卷接口：CRUD、`PUT /admin/papers/:id/questions`、发布、下架、复制；冻结校验
- [x] 3.3 管理端组卷规则 CRUD 与试生成预览
- [x] 3.4 每日一练题组定时生成（`runExclusive`）、兜底生成、管理端查看与重新生成
- [x] 3.5 公开接口：试卷列表与概要（过滤他人 `GENERATED`）、每日一练概要、游客试做与判分（IP 限流）
- [x] 3.6 单元测试与 e2e

## 4. 后端：导入

- [x] 4.1 `ImportJob` 实体与 migration、导入队列 module
- [x] 4.2 导入包解析（各工作表、答案写法、转义、assets 上传与 `file:{fileId}` 替换）
- [x] 4.3 导入单元事务写入、更新规则、错误行报告文件
- [x] 4.4 管理端：`POST /admin/imports`、列表、详情、错误报告下载
- [x] 4.5 `pnpm import:content` 脚本
- [x] 4.6 导入模板示例文件（行测样例：单选、材料题、试卷）与单元测试

## 5. 运营后台

- [ ] 5.1 考试、科目、知识点树管理页
- [ ] 5.2 题目列表、编辑器（选项、答案、知识点选择）、预览（公式、图片、音频）、版本历史
- [ ] 5.3 审核页：待审列表、驳回、发布、批量发布
- [ ] 5.4 试卷编辑：分区、选题、排序、分值、发布、复制
- [ ] 5.5 组卷规则编辑与试生成预览
- [ ] 5.6 每日一练题组查看与重新生成
- [ ] 5.7 批量导入：上传、进度、错误报告下载

## 6. 小程序

- [ ] 6.1 `pages.config.ts`：TabBar 四项、`pages-sub/exam`、`pages-sub/study`、`pages-sub/ai` 分包声明；`pages/ai` 占位页
- [ ] 6.2 公式渲染技术验证（mp-html + latex 插件 / 服务端 SVG），结论更新到业务文档第 8 节
- [ ] 6.3 `UQuestionContent` 组件：Markdown、LaTeX、图片预览、音频播放
- [ ] 6.4 选择考试页（考试日期、每日目标）、游客本地暂存与登录后同步
- [ ] 6.5 题库页：科目切换、知识点树、试卷列表
- [ ] 6.6 首页：考试倒计时、每日一练入口、游客试做
- [ ] 6.7 `exam` Store 与接口封装，单元测试

## 7. 验证

- [ ] 7.1 后端 `pnpm lint:check`、`pnpm type-check`、`pnpm test`、`pnpm test:e2e`、`migration:check` 通过
- [ ] 7.2 小程序 `pnpm lint:check`、`pnpm type-check`、`pnpm test` 通过；微信开发者工具中验证题库与试做流程
- [ ] 7.3 用行测样例导入包完成一次端到端导入、审核、发布、小程序浏览
