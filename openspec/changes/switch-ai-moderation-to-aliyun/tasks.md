## 1. 后端：审核集成

- [x] 1.1 `src/integrations/aliyun-green`：`ContentModerationProvider` 端口、阿里云 `TextModerationPlus` 实现（官方 SDK 锁定版本）、配置类型与 env 校验、单元测试（mock SDK：通过、high/medium/low、超时、未配置）
- [x] 1.2 env 示例新增 `ALIYUN_GREEN_ACCESS_KEY_ID`、`ALIYUN_GREEN_ACCESS_KEY_SECRET`、`ALIYUN_GREEN_REGION`

## 2. 后端：AI 模块

- [x] 2.1 `AiContentSafetyService` 改为依赖端口，输入带 `accountId`、输出以消息 ID 作 `sessionId`；去掉 openId 参数及调用链传递
- [x] 2.2 `AiAccessService` 前置条件改为已绑定手机号（`phoneBindingRequired`），审核未配置返回 `aiUnavailable`；移除 `wechatBindingRequired` 错误码与 i18n，新增 `phoneBindingRequired`
- [x] 2.3 单元测试与 `test/ai/ai-tutor.e2e-spec.ts`：审核替身替换微信替身；密码账号无 openId 可用；无手机号账号被拒；审核失败 fail-closed

## 3. 小程序

- [x] 3.1 `useAiAccess`、对话页、`business-error`、locale：去掉微信绑定引导，处理 `phoneBindingRequired`
- [x] 3.2 H5 与支付宝端 AI 入口与对话页可用（H5 确认流式与鉴权头，支付宝确认整段返回时的展示），补测试

## 4. 文档与协议

- [x] 4.1 业务文档 4.7 内容安全、9.2 错误码、第三方共享说明同步
- [ ] 4.2 线上隐私政策与 AI 服务声明的第三方与数据处理描述改为阿里云内容安全，保存并升级版本（部署后执行）

## 5. 验证

- [x] 5.1 后端与小程序 lint、type-check、test、e2e 通过
- [ ] 5.2 部署后真机：密码账号可问 AI、违规输入被拦截、回答流式正常
