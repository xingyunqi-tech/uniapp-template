## Context

AI 讲题已实现「输入送检 → 生成 → 分段送检后下发」，送检实现为微信 `msgSecCheck`，需要用户 openId。阿里云文本审核增强版 PLUS 提供面向大模型的两个服务：`llm_query_moderation`（输入，单次 ≤2000 字）与 `llm_response_moderation`（输出，单次 ≤5000 字，支持 `sessionId` 拼接流式分段后审核），按成功调用次数计费，不依赖平台账号标识。

## Goals / Non-Goals

- Goals：去除 AI 对微信 openId 的依赖；保持现有送检时机、下发策略与失败处理不变；可在测试中替换审核实现
- Non-Goals：多审核服务并存与按平台切换；人工复核流程；图片/音频审核；支付宝端流式输出

## Decisions

- **端口**：`ContentModerationProvider.moderate({ kind: 'input' | 'output', content, userId, sessionId? }) → { verdict: 'pass' | 'block', riskLevel, labels, requestId }`，失败抛错由调用方按 fail-closed 处理。`AiContentSafetyService` 只依赖端口，对外接口去掉 `openId` 参数。
- **阿里云实现**：使用官方 SDK `@alicloud/green20220302`（锁定确切版本）调用 `TextModerationPlus`；`Service` 取 `llm_query_moderation` / `llm_response_moderation`；`ServiceParameters` 中输入带 `accountId = userId`，输出带 `sessionId = messageId`。接入点按 `ALIYUN_GREEN_REGION` 拼接（如 `green-cip.cn-shanghai.aliyuncs.com`），连接、读取超时各 3 秒，不重试。
- **判定口径**：`RiskLevel` 为 `high` 或 `medium` 判为不通过；`low`、`none` 通过（`low` 记录日志）。与现有「微信 review 也视为不通过」的保守口径一致。
- **前置条件**：`ai.enabled` → 账号已绑定手机号（`phoneBindingRequired`）→ AI 服务声明已同意。手机号作为实名依据。各端现有登录方式（手机号 + 密码、短信、微信手机号快捷登录）建立的账号均带手机号；仅有支付宝 openId 或仅有邮箱的账号不可用。
- **未配置**：AccessKey 缺失时前置检查返回 `aiUnavailable`，不调用模型。
- **分段**：保持现有分段阈值（首段约 50 字、后续约 100 字、单段 ≤200 字），不新增配置；费用随分段次数线性增长，后续如需节省再调大阈值。
- **微信集成**：`WechatService.msgSecCheck` 保留在集成层，AI 模块不再引用。

## Risks / Trade-offs

- 审核调用增加首字延迟（单次约百毫秒级）→ 维持首段小阈值
- 阿里云调用费用 → 已有每日额度与全站预算熔断；审核费用不计入 `ai.dailyBudget`（只统计模型成本），在用量页之外由阿里云账单观察
- 阿里云文档推荐「AI 安全护栏」作为新产品 → 端口抽象允许后续替换实现，不影响 AI 模块

## Migration Plan

1. 后端部署前在 ECS `.env` 写入三项阿里云配置
2. 部署后端与小程序；`wechatBindingRequired` 在小程序旧版本上仍按通用错误提示处理，不影响使用
3. 更新线上隐私政策与 AI 服务声明的第三方描述并升级版本，用户重新同意

## Open Questions

- 无
