## 1. 后端：纠错

- [ ] 1.1 feedbacks：枚举、新增字段、`userId` 可空与外键 `SET NULL` 的 migration
- [ ] 1.2 `POST /questions/:id/reports`（访问校验）、`GET /me/question-reports`
- [ ] 1.3 管理端：`GET /admin/question-reports`、详情、`PATCH`（状态、回复、关联勘误）
- [ ] 1.4 `NotificationCategory.STUDY`

## 2. 后端：勘误

- [ ] 2.1 `Errata` 实体与 migration、勘误队列 module
- [ ] 2.2 `POST /admin/questions/:id/errata`：版本生成与引用更新（单事务）、并发约束
- [ ] 2.3 勘误任务：按用户分批、重判客观题、会话得分与正确数、断点续跑
- [ ] 2.4 统计修正：知识点重建、每日 ±1、错题本重算、全站 ±1
- [ ] 2.5 通知受影响用户、纠错单置为已解决；失败告警
- [ ] 2.6 `GET /admin/errata`、`GET /admin/errata/:id`
- [ ] 2.7 单元测试与 e2e：判错改判对、判对改判错、进行中模考、注销用户贡献保留、并发勘误

## 3. 运营后台

- [ ] 3.1 纠错单列表（类型、状态筛选）、详情、回复与状态
- [ ] 3.2 勘误表单（从纠错单或题目发起）与进度页

## 4. 小程序

- [ ] 4.1 答题页与解析页「纠错」入口与表单
- [ ] 4.2 我的纠错页
- [ ] 4.3 勘误通知在消息列表中的展示

## 5. 验证

- [ ] 5.1 后端与小程序 lint、type-check、test、e2e 通过
- [ ] 5.2 端到端：用户纠错 → 管理员勘误 → 历史成绩与错题本更新 → 用户收到通知
