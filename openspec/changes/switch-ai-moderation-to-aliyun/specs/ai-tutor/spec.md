## MODIFIED Requirements

### Requirement: AI Content Safety

系统 SHALL 通过阿里云内容安全文本审核增强版对用户输入（`llm_query_moderation`）与模型输出（`llm_response_moderation`）做内容安全检测；输出 SHALL 送检通过后才下发；风险等级为 `high` 或 `medium` 的内容 SHALL 视为不通过；检测调用失败 SHALL 按不通过处理且不下发内容；未绑定手机号的用户 SHALL NOT 使用 AI。内容安全检测 SHALL NOT 依赖微信 openId。

#### Scenario: Blocked input
- **WHEN** 用户输入的审核结果为 `high` 或 `medium`
- **THEN** 返回 `contentBlocked`，不扣额度

#### Scenario: Blocked output
- **WHEN** 模型输出某段的审核结果为 `high` 或 `medium`
- **THEN** 该段不下发，生成停止并追加提示语，消息记为 `BLOCKED`

#### Scenario: Moderation unavailable
- **WHEN** 阿里云审核未配置或调用失败
- **THEN** 输入阶段返回 `aiUnavailable` 且不扣额度；输出阶段消息记为 `FAILED` 并退还额度，未送检内容不下发

#### Scenario: Password account without WeChat
- **GIVEN** 用户以手机号 + 密码登录且未绑定微信
- **WHEN** 发起 AI 讲题
- **THEN** 正常进入讲题，不要求绑定微信

#### Scenario: No phone binding
- **GIVEN** 账号未绑定手机号（如仅有支付宝 openId 或仅有邮箱的账号）
- **WHEN** 发起 AI 讲题
- **THEN** 返回 `phoneBindingRequired`，小程序提示绑定手机号后使用

#### Scenario: AI on H5
- **GIVEN** 用户在 H5 端登录且已绑定手机号
- **WHEN** 发起 AI 讲题
- **THEN** 正常流式输出

#### Scenario: AI on Alipay mini program
- **GIVEN** 用户在支付宝小程序以手机号 + 密码或短信登录
- **WHEN** 发起 AI 讲题
- **THEN** 正常讲题，回答在生成完成后整段显示
