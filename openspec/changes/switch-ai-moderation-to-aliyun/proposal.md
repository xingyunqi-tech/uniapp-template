# Change: AI 内容安全改用阿里云文本审核增强版

## Why

AI 讲题的内容安全目前依赖微信 `msgSecCheck`，该接口必须携带当前用户的微信 openId，导致：

- 手机号 + 密码、短信登录的账号没有 openId，无法使用 AI（返回 `wechatBindingRequired`）；
- 唯一能补齐 openId 的「手机号快捷登录」依赖小程序微信认证与付费额度，尚未开通；
- H5、支付宝端无法使用 AI。

改用不依赖 openId 的阿里云内容安全「文本审核增强版」大模型审核服务后，AI 只要求账号已登录且已绑定手机号，各端账号均可使用。

## What Changes

- 后端：
  - 新增内容审核端口 `ContentModerationProvider` 与阿里云实现（`src/integrations/aliyun-green`）：输入走 `llm_query_moderation`，输出走 `llm_response_moderation`（以消息 ID 作为 `sessionId` 关联同一回答的分段）
  - `AiContentSafetyService` 改为依赖该端口，不再使用微信 `msgSecCheck`；送检时机、分段下发、未通过与检测失败的处理（`contentBlocked` / `BLOCKED` / fail-closed 退额度）保持不变
  - **BREAKING**：AI 前置条件由「已绑定微信」改为「已绑定手机号」，错误码 `wechatBindingRequired` 替换为 `phoneBindingRequired`
  - 配置：`ALIYUN_GREEN_ACCESS_KEY_ID`、`ALIYUN_GREEN_ACCESS_KEY_SECRET`、`ALIYUN_GREEN_REGION`（默认 `cn-shanghai`）；未配置时 AI 返回 `aiUnavailable`
- 小程序：去掉「绑定微信后即可使用 AI 助教」及跳转登录绑定的引导，改为未绑定手机号时的提示；微信、H5、支付宝各端以手机号登录的账号均可使用 AI（支付宝端无流式，整段返回）
- 文档与协议：业务文档 4.7、9.2 与第三方共享说明；线上隐私政策、AI 服务声明的第三方与数据处理描述改为阿里云内容安全并升级版本

## Impact

- Affected specs: `ai-tutor`（修改 AI Content Safety 需求）
- Affected code:
  - 后端：新增 `src/integrations/aliyun-green`；修改 `src/modules/ai/ai-content-safety.service.ts`、`ai-access.service.ts`、`ai-chat.service.ts`、`ai-generation.service.ts`、错误码与 i18n、env 示例
  - 小程序：`src/composables/useAiAccess.ts`、`src/pages-sub/ai/chat/index.vue`、`src/utils/business-error.ts`、locale
- 依赖：`add-ai-question-tutor`（未归档，本变更修改其 `ai-tutor` 规格中的 AI Content Safety 需求；须先归档该变更再归档本变更）
- 费用：按量付费 15 元 / 万次（每次成功调用计费），每轮对话约 1 次输入审核 + 若干次分段输出审核
