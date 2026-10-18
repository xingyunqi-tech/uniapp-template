## Context

P0 只开放题目讲题（`contextType = QUESTION`）；自由对话、错因分析、学情建议为 P1。规则见 `docs/exam-prep-business.md` 4.7。

## Goals / Non-Goals

- Goals：讲题对话、流式输出、内容安全、额度与成本、举报、管理端用量
- Non-Goals：自由对话、AI 批改、AI 出题、AI 错因分析（P1）

## Decisions

- **LLM 端口**：`LlmProvider.streamChat({ system, messages, maxTokens, signal }) → AsyncIterable<{ type: 'reasoning' | 'answer', text } | { type: 'usage', ... }>`；默认实现使用 OpenAI 兼容协议（国内主流备案模型均提供），base URL、key、模型标识走配置，默认接入 DeepSeek（`deepseek-chat`），可切换其他兼容模型。
- **生成与连接解耦**：发送消息时创建 `AiMessage(STREAMING)` 并启动生成任务（进程内异步执行，不依赖 HTTP 连接存活）；生成器把已送检的片段写入 Redis Stream `ai:msg:{messageId}`，SSE 连接从该 stream 读取并转发；连接断开不影响生成；客户端通过 `GET /ai/messages/:id` 获取完整结果。
- **先送检后下发**：生成器按段落或 200 字缓冲，`msgSecCheck` 通过后才写入 stream；命中则停止上游、追加提示语、消息记为 `BLOCKED`。
- **停止生成**：`POST /ai/messages/:id/stop` 发布到 Redis channel `ai:stop`，持有该消息生成任务的实例取消上游请求（`AbortController`）。
- **额度**：`INCR ai:quota:{userId}:{date}:chat` 后比较上限，超限 `DECR` 回滚；`quotaDate` 写入消息，退还时按该日期 `DECR`；key TTL 48 小时。
- **熔断**：每次完成后累加 `ai:cost:{date}`（按模型单价估算）并 upsert `AiUsageDaily`；请求前比较 `ai.dailyBudget`；超出时触发告警。
- **可见性**：每次发送消息都调用 `AnswerVisibilityService`，带 `sessionId` 时校验题目属于该会话。
- **卡住清理**：定时任务把 `STREAMING` 超过 5 分钟的消息置为 `FAILED` 并退还额度。
- **小程序流式**：`uni.request({ enableChunked: true })` + `onChunkReceived`，`TextDecoder` 流式解码处理多字节截断，按 `\n\n` 分帧解析 SSE；仅微信小程序支持，H5 走 fetch。

## Risks / Trade-offs

- 模型未完成备案确认 → 通过 `ai.enabled` 总开关上线前关闭
- 先送检后下发增加首字延迟 → 首段缓冲阈值调小（如 50 字）

## Migration Plan

新增 `ai_conversation`、`ai_message`、`ai_usage_daily` 表。

## Open Questions

- 备案信息与单价（第 8 节）
