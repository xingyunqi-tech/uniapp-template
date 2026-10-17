## ADDED Requirements

### Requirement: Content Import Package

系统 SHALL 支持以 zip 导入包（`content.xlsx` + `assets/`）批量导入知识点、材料、题目与试卷，格式见 `docs/exam-prep-business.md` 4.11。

#### Scenario: Import package
- **WHEN** 管理员上传合法的导入包
- **THEN** 创建导入任务并异步执行
- **AND** 任务完成后可查看成功数、失败数与错误行报告

#### Scenario: Asset references
- **GIVEN** 题干中写有 `![](assets/chart1.png)`
- **WHEN** 导入完成
- **THEN** 图片上传为公共文件，题干保存为 `file:{fileId}` 引用

#### Scenario: Standalone file without assets
- **WHEN** 管理员上传单独的 `.xlsx` 或 `.json` 文件，或传入已上传导入文件的 `fileId`
- **THEN** 按与导入包相同的工作表与字段导入

#### Scenario: Error report
- **WHEN** 导入任务完成且有失败行
- **THEN** 生成私有 xlsx 错误报告，列出工作表、行号、字段、错误键、说明与详情

#### Scenario: Subject located by exam and subject name
- **GIVEN** 两个考试下都有名为「数学」的科目
- **WHEN** 导入行填写 `exam` 与 `subject`
- **THEN** 按两者组合定位到唯一科目

---

### Requirement: Atomic Import Units

材料及其全部小题 SHALL 作为一个导入单元，任一行出错则整组失败；试卷引用的题目任一失败则该试卷失败。

#### Scenario: Sub-question error
- **GIVEN** 一份材料下第 3 个小题答案格式错误
- **WHEN** 执行导入
- **THEN** 该材料及其全部小题均不写入
- **AND** 错误报告指出该行与原因

---

### Requirement: Import Asset Reuse

导入资源 SHALL 按内容复用已有公共文件；单元写入失败时 SHALL 删除本单元新上传且未被复用的文件。

#### Scenario: Re-import same package
- **GIVEN** 导入包已导入过一次
- **WHEN** 再次导入同一个导入包
- **THEN** 不新增资源文件，含图片的题目不重复创建

#### Scenario: Failed unit uploads
- **WHEN** 某导入单元上传资源后写入失败
- **THEN** 该单元新上传的资源文件被删除

---

### Requirement: Existing Content Skipped

新建行的内容与已有题目重复时 SHALL 视为已存在：键绑定到已有题目供试卷引用，计入 `skipped`，不记为失败。

#### Scenario: Duplicate question
- **GIVEN** 题目内容与已有题目的 `contentHash` 相同
- **WHEN** 导入该行
- **THEN** 该单元计入 `skipped`，`questionKey` 指向已有题目，错误报告不含该行

#### Scenario: Existing paper title
- **GIVEN** 同科目已有同名试卷
- **WHEN** 导入未填 `id` 的同名试卷行
- **THEN** 该试卷计入 `skipped`，不新建试卷

---

### Requirement: Import Updates

导入行带已有 ID 时 SHALL 更新对应记录；已发布题目更新生成新版本，修改答案、题型、选项 key 或空数的行 SHALL 判为错误。

#### Scenario: Update published question text
- **WHEN** 导入行修改已发布题目的解析
- **THEN** 生成 `EDIT` 新版本

#### Scenario: Blank cells keep values
- **WHEN** 带 `id` 的行某些单元格留空
- **THEN** 对应字段保持原值，新建行留空时使用默认值

#### Scenario: Unchanged update
- **WHEN** 带 `id` 的行内容与已发布题目相同
- **THEN** 不生成新版本

#### Scenario: Update draft paper
- **WHEN** 试卷行填写草稿试卷的 `id`
- **THEN** 更新该试卷的属性与题目，状态保持草稿

#### Scenario: Update published answer
- **WHEN** 导入行修改已发布题目的答案
- **THEN** 该行失败，错误为 `answerChangeNotAllowed`

---

### Requirement: Two-Step Paper Import

试卷 SHALL 只引用已发布的题目；含新题的导入包 SHALL 按两步导入：先导入题目并审核发布、再导入试卷，或导入时直接发布。

#### Scenario: Paper with new questions without publishing
- **WHEN** 不加发布导入包含新题与引用这些新题的试卷
- **THEN** 题目以草稿写入，试卷失败，错误为 `paperQuestionNotPublished`

#### Scenario: Paper with new questions published on import
- **WHEN** 导入时指定直接发布
- **THEN** 题目发布后试卷写入并发布

---

### Requirement: Stale Import Jobs

执行或排队超时的导入任务 SHALL 由定时任务置为 `FAILED` 并告警，不自动重跑。

#### Scenario: Worker crashed
- **GIVEN** 任务 `RUNNING` 超过 30 分钟或 `PENDING` 超过 10 分钟
- **WHEN** 定时任务执行
- **THEN** 任务置为 `FAILED`，`failureReason` 为 `importInterrupted`，并发出 `importFailed` 告警

---

### Requirement: Fill Answer Notation

填空答案 SHALL 以 `||` 分隔空、以 `|` 分隔同一空的候选答案，并支持 `\` 转义。

#### Scenario: Escaped pipe
- **WHEN** 填空答案写为 `a\|b||c`
- **THEN** 解析为两空：第一空候选 `a|b`，第二空候选 `c`

---

### Requirement: Import CLI

后端 SHALL 提供 `pnpm import:content <file> [--publish]` 脚本，复用同一导入服务。

#### Scenario: Import with publish
- **WHEN** 运行 `pnpm import:content ./data/xingce.zip --publish`
- **THEN** 导入成功的内容直接发布，并在终端输出错误行汇总
