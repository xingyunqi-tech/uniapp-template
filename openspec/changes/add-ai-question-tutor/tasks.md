## 0. 前置

- [ ] 0.1 确认备案信息与单价（模型已定：OpenAI 兼容协议，默认 DeepSeek），更新业务文档第 8 节

## 1. 后端：集成

- [x] 1.1 `src/integrations/llm`：`LlmProvider` 端口、OpenAI 兼容实现、配置类型、单元测试（mock 上游流）
- [x] 1.2 `WechatService.msgSecCheck` 与单元测试（已由 `switch-ai-moderation-to-aliyun` 替换为阿里云审核）

## 2. 后端：AI 模块

- [x] 2.1 AiConversation、AiMessage、AiUsageDaily 实体与 migration
- [x] 2.2 会话接口：创建（可见性、会话归属校验）、列表、消息列表、删除
- [x] 2.3 发送消息：前置条件（`ai.enabled`、微信绑定、AI 声明同意；微信绑定已由 `switch-ai-moderation-to-aliyun` 改为手机号绑定）→ 输入送检 → 熔断 → 额度扣减 → 启动生成
- [x] 2.4 生成任务：上下文与摘要构建、按段送检、写入 Redis Stream、usage 与成本累计、`AiUsageDaily` upsert
- [x] 2.5 SSE 接口（`@SkipResponseTransform()`，异常转 `error` 事件）与 `GET /ai/messages/:id`
- [x] 2.6 停止生成（Redis pub/sub）、计费口径与额度退还
- [x] 2.7 每分钟频控、卡住消息清理任务、熔断告警
- [x] 2.8 反馈与举报：`/ai/messages/:id/feedback`、`/ai/messages/:id/report`（`ai_content`）
- [x] 2.9 注册 AI 数据清理器
- [x] 2.10 `GET /admin/ai/usage`、`GET /ai/quota`
- [x] 2.11 e2e：可见性每消息校验、额度与退还、熔断、停止、断线恢复

## 3. 运营后台

- [x] 3.1 AI 用量与成本页
- [x] 3.2 纠错与举报列表支持 `ai_content` 类型展示消息内容

## 4. 小程序

- [x] 4.1 `useChatStream`：`enableChunked`、UTF-8 流式解码、SSE 分帧、中断、按 `messageId` 恢复；单元测试
- [x] 4.2 AI 助教 Tab：讲题会话历史
- [x] 4.3 对话详情页：流式渲染（Markdown + LaTeX）、停止、追问建议、点赞点踩、举报、AI 生成标识、剩余额度
- [x] 4.4 答题解析页、成绩报告、错题本「问 AI」入口；`answerHidden` 提示
- [x] 4.5 AI 服务声明弹窗与同意上报；未绑定微信引导（已由 `switch-ai-moderation-to-aliyun` 改为未绑定手机号时引导退出后以手机号登录）

## 5. 验证

- [x] 5.1 后端与小程序 lint、type-check、test、e2e 通过
- [ ] 5.2 真机验证：流式输出、切后台恢复、停止生成、额度用尽提示
