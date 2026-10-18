## Context

业务规则见 `docs/exam-prep-business.md` 4.1、4.2、4.3、4.11。本文记录实现层面的决策。

## Goals / Non-Goals

- Goals：内容模型、版本、审核、试卷、导入、公开目录、小程序选考试与题库目录
- Non-Goals：作答、答案可见性、按规则生成个人试卷（`add-practice-session`）；纠错与勘误（`add-question-feedback-errata`）；个人进度（`add-study-tracking`）

## Decisions

- **版本存储**：`question` 表保存当前版本的冗余字段用于检索与列表；`question_version` 保存不可变快照。发布时写 v1；`DRAFT` 修改不产生版本；`EDIT` 由 service 校验不可修改 `answer`、`type`、选项 key 集合与填空空数。小题快照记录材料版本 `materialVersion`，引用方只需记录小题版本。
- **材料题**：材料与小题同表（`parentId` 关联），状态操作以材料为单位在一个事务内更新全部小题；小题接口拒绝单独变更状态。
- **知识点**：物化路径 `path` + `isLeaf`；题目关联表 `question_knowledge_point` 仅允许叶子；已关联题目的节点禁止新增子节点；`questionCount` 在发布/下架/改标签时同事务增减，另提供重算脚本。
- **去重**：`contentHash` = sha256(归一化题干 + 选项)；小题再拼接材料哈希；唯一索引 `(subjectId, contentHash)`。
- **答案字段访问**：公开与用户接口的 DTO 不包含 `answer`、`analysis`；只有管理端 DTO 与后续可见性逻辑能读取。
- **导入**：
  - 上传 zip 到私有文件 → 创建 `ImportJob` → 队列解析 → 逐单元（材料组 / 独立题 / 试卷）事务写入 → 汇总错误行生成报告文件。
  - 后端脚本 `pnpm import:content <file> [--publish]` 直接调用同一导入服务，不经过 HTTP。
  - `assets/` 内文件上传为公共文件，内容中替换为 `file:{fileId}`。
- **每日一练题组**：定时任务每天 00:05（Asia/Shanghai）为每个已发布科目生成；首次访问兜底生成以唯一键防并发重复。
- **小程序内容渲染**：封装 `UQuestionContent` 组件，内部用 mp-html 并启用 markdown、latex 插件，公式在端上解析渲染，不采用服务端预渲染 SVG；渲染前把公式内的 Markdown 标点转为 HTML 实体，避免被 Markdown 解析改写。选型依据见 `docs/exam-prep-business.md` 第 7 节。

## Risks / Trade-offs

- 导入单元失败粒度较粗 → 错误报告精确到行与原因
- mp-html 与 latex 插件约 360KB 计入主包 → 主包构建后约 1.1MB，低于 2MB 上限；KaTeX 字体依赖 CDN，未加载时退化为系统字体

## Migration Plan

新增表的 migration；无存量数据迁移。

## Open Questions

- 无
