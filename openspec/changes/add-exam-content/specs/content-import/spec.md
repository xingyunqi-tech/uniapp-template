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

### Requirement: Import Updates

导入行带已有 ID 时 SHALL 更新对应记录；已发布题目更新生成新版本，修改答案、题型、选项 key 或空数的行 SHALL 判为错误。

#### Scenario: Update published question text
- **WHEN** 导入行修改已发布题目的解析
- **THEN** 生成 `EDIT` 新版本

#### Scenario: Update published answer
- **WHEN** 导入行修改已发布题目的答案
- **THEN** 该行失败，错误为 `answerChangeNotAllowed`

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
