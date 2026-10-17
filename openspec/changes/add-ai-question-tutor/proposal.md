# Change: 新增 AI 讲题

## Why

AI 讲题是个人备考产品的核心差异化：用户在做完题后可针对题目追问 AI。需要在合规（备案模型、内容安全、AI 标识与举报、服务声明同意）与成本可控（用户额度、频控、全站熔断）的前提下上线（`docs/exam-prep-business.md` 4.7、1.3、5.3）。

## What Changes

- 后端：
  - `src/integrations/llm`：`LlmProvider` 端口（流式对话），默认实现接入境内已备案模型，模型标识走配置
  - wechat：`WechatService.msgSecCheck`
  - `ai` 模块：AiConversation、AiMessage、AiUsageDaily；讲题会话创建与每条消息的答案可见性校验；上下文构建与摘要；SSE 流式输出（先送检后下发）；生成与连接解耦；停止生成（Redis pub/sub）；计费口径；用户额度、每分钟频控、全站日预算熔断、AI 总开关；卡住消息清理；投诉举报（`ai_content`）
  - 注册 AI 数据清理器（会话与消息）
  - 管理端 `GET /admin/ai/usage`
- 小程序：AI 助教 Tab（讲题会话历史）、对话详情页（流式渲染、停止、追问、点赞点踩、举报、断线恢复、AI 生成标识）、答题解析页与错题本「问 AI」入口、AI 服务声明同意与微信绑定引导、`useChatStream`
- 运营后台：AI 用量与成本页（熔断开关与额度在配置页）

## Impact

- Affected specs: `ai-tutor`（新增）
- Affected code:
  - 后端：新增 `src/integrations/llm`、`src/modules/ai`；`src/integrations/wechat`；`src/modules/feedbacks`
  - 小程序：`src/pages/ai`、`src/pages-sub/ai`、答题页、错题本、`src/composables`
  - 运营后台：AI 用量页
- 依赖：`add-practice-session`（答案可见性）、`add-question-feedback-errata`（feedbacks 字段）、`add-compliance-account-cleanup`（AI 服务声明、清理器）
- 前置决策：AI 模型选型与备案确认（业务文档第 8 节）
