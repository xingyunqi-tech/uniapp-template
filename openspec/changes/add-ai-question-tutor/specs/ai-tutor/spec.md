## ADDED Requirements

### Requirement: AI Question Explanation

用户 SHALL 能针对答案可见的题目发起 AI 讲题并多轮追问；同一用户同一题同一版本复用会话。

#### Scenario: Ask AI after answering
- **GIVEN** 用户在章节练习中已作答题目 Q
- **WHEN** 用户点击「问 AI」
- **THEN** 创建或复用 Q 的讲题会话，AI 结合题干、正确答案、解析与用户答案讲解

#### Scenario: Ask AI from wrong book
- **WHEN** 用户在错题本中对 Q 点击「问 AI」且未携带会话
- **THEN** 按错题本规则判定可见并创建会话

---

### Requirement: Visibility Check per Message

系统 SHALL 在每次发送消息时重新校验题目答案可见性；携带会话时 SHALL 校验题目属于该会话；不可见时拒绝并返回 `answerHidden`。

#### Scenario: Mock started after conversation
- **GIVEN** 用户已有 Q 的讲题会话
- **WHEN** 用户开始包含 Q 的模考后在旧会话中继续提问
- **THEN** 返回 `answerHidden`

#### Scenario: Question not in session
- **WHEN** 用户携带的会话不包含该题
- **THEN** 拒绝创建讲题会话

---

### Requirement: Streaming Response

系统 SHALL 以 SSE 流式返回回答，事件包括 `message.start`、`reasoning.delta`、`answer.delta`、`suggestions`、`message.done`、`error`；客户端断开 SHALL NOT 中止生成，回到页面后可获取完整结果。

#### Scenario: Leave and return
- **GIVEN** AI 正在生成回答
- **WHEN** 用户切到后台 30 秒后返回
- **THEN** 页面展示完整回答

#### Scenario: Stop generation
- **WHEN** 用户点击停止
- **THEN** 生成在任一实例上被取消，已生成内容保存为 `STOPPED`

---

### Requirement: AI Content Safety

系统 SHALL 对用户输入与模型输出做内容安全检测；输出 SHALL 送检通过后才下发；未绑定微信的用户 SHALL NOT 使用 AI。

#### Scenario: Blocked input
- **WHEN** 用户输入未通过检测
- **THEN** 返回 `contentBlocked`，不扣额度

#### Scenario: Blocked output
- **WHEN** 模型输出某段未通过检测
- **THEN** 该段不下发，生成停止并追加提示语，消息记为 `BLOCKED`

#### Scenario: No WeChat binding
- **GIVEN** 用户以手机号注册且未绑定微信
- **WHEN** 发起 AI 讲题
- **THEN** 返回 `wechatBindingRequired`，小程序引导绑定

---

### Requirement: AI Service Consent and Labeling

用户 SHALL 在首次使用 AI 前同意当前版本的 AI 服务声明；每条 AI 回答 SHALL 标注「内容由 AI 生成」。

#### Scenario: Consent required
- **GIVEN** 用户未同意当前版本 AI 服务声明
- **WHEN** 发起 AI 讲题
- **THEN** 返回 `aiConsentRequired`，小程序展示声明

---

### Requirement: AI Content Report

用户 SHALL 能对任一 AI 回答投诉举报，举报进入运营后台纠错与举报列表处理。

#### Scenario: Report answer
- **WHEN** 用户举报一条 AI 回答
- **THEN** 创建 `ai_content` 类型的反馈并关联该消息

---

### Requirement: Usage Quota and Cost Control

系统 SHALL 按用户每日额度、每分钟频控限制 AI 请求，并在全站当日成本超过预算或 AI 总开关关闭时暂停服务；计费口径 SHALL 为完成、停止与输出被拦截时扣额度，输入被拦截不扣，上游失败退还至原日期额度。

#### Scenario: Quota exhausted
- **WHEN** 用户当日额度用尽后再次提问
- **THEN** 返回 `aiQuotaExceeded`

#### Scenario: Budget exceeded
- **WHEN** 全站当日估算成本超过 `ai.dailyBudget`
- **THEN** 所有 AI 请求返回 `aiUnavailable`，并产生告警

#### Scenario: Refund across midnight
- **GIVEN** 用户 23:59 发起请求并扣减当日额度
- **WHEN** 00:01 上游失败
- **THEN** 退还前一天的额度

#### Scenario: Stale streaming message
- **GIVEN** 消息处于生成中超过 5 分钟
- **WHEN** 清理任务执行
- **THEN** 消息置为 `FAILED` 并退还额度

---

### Requirement: Admin AI Usage

运营后台 SHALL 展示按日、按模型的 AI 请求数、失败数、token 用量与估算成本。

#### Scenario: View usage
- **WHEN** 管理员查看最近 7 天 AI 用量
- **THEN** 按日展示请求数、失败数、token 与成本

---

### Requirement: AI Data Cleanup

账号注销后，系统 SHALL 删除该用户的 AI 会话与消息。

#### Scenario: Cleanup
- **WHEN** 用户注销账号并完成清理任务
- **THEN** 该用户的 AI 会话与消息不存在
