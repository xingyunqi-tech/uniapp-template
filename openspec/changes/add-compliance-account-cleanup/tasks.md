## 1. 后端

- [x] 1.1 `compliance` 模块：UserConsent 实体与 migration、`GET/POST /me/consents`
- [x] 1.2 `AccountDataCleaner` 端口与 `account-cleanup` 队列 module
- [x] 1.3 `auth.service` 注销成功后入队清理任务
- [x] 1.4 各模块清理器：practice（会话、作答、自动交卷任务）、wrong-book、study-stats、exams（目标考试）、questions（笔记）、favorites、shares、papers（个人生成试卷）、files（上传文件）、feedbacks（解除关联）
- [x] 1.5 清理最终失败告警与管理端重新触发接口
- [x] 1.6 单元测试与 e2e：注销后数据清理、聚合统计保留、纠错匿名化

## 2. 小程序

- [ ] 2.1 启动时检查同意状态（游客读本地、登录用户读服务端），展示协议弹窗
- [ ] 2.2 同意记录上报，游客登录后同步
- [ ] 2.3 「我的」页协议与隐私入口；注销页补充清理范围说明
- [ ] 2.4 单元测试

## 3. 验证

- [ ] 3.1 后端与小程序 lint、type-check、test、e2e 通过
- [ ] 3.2 端到端：注销账号后用同一微信重新登录，确认为新账号且无旧数据
