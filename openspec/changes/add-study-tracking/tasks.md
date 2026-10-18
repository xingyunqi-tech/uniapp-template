## 1. 后端：统计事件处理

- [x] 1.1 `study-stats` 队列 module 与处理器：事务首句条件更新、重读记录、按用户锁、按会话批量处理
- [x] 1.2 首次作答判定与全站统计累加（部分唯一索引冲突处理）
- [x] 1.3 补偿扫描任务（`runExclusive`，`jobId = recordId`）
- [x] 1.4 单元测试：重复执行、未判分跳过、并发首次作答

## 2. 后端：错题本

- [x] 2.1 WrongQuestion 实体与 migration
- [x] 2.2 判错 upsert、每统计日最多计一次的连续答对、阈值读取远程配置、主观题规则
- [x] 2.3 接口：列表筛选、汇总、移出、恢复
- [x] 2.4 出题器接入：`WRONG` 模式排除下架题
- [x] 2.5 单元测试与 e2e

## 3. 后端：学习统计

- [x] 3.1 UserKnowledgeStat、UserDailyStat、StudyCheckin 实体与 migration
- [x] 3.2 原子写入、`recentResults` 截取、掌握度计算
- [x] 3.3 父节点聚合查询与缓存失效
- [x] 3.4 打卡判定与连续天数
- [x] 3.5 接口：`/me/study/overview`、`/me/study/daily`、`/me/study/knowledge`、`/me/study/weak-points`、`/me/checkins`；知识点树附带个人进度；`SMART` 模式接入薄弱点
- [x] 3.6 单元测试（时区、跨天、去重聚合）与 e2e

## 4. 后端：收藏与笔记

- [x] 4.1 favorites：枚举、`subjectId` 列与 migration、目标校验、关联前提、标题快照
- [x] 4.2 QuestionNote 实体、`PUT/DELETE /questions/:id/note`、`GET /me/question-notes`
- [x] 4.3 单题访问校验接入收藏与笔记关联
- [x] 4.4 e2e：进行中模考题目不可收藏、笔记长度

## 5. 小程序

- [x] 5.1 错题本页：筛选、汇总、重做、移出、恢复、已下架标注、`hiddenReason` 提示
- [x] 5.2 收藏题与笔记页；答题页收藏与笔记入口
- [x] 5.3 打卡日历页
- [x] 5.4 首页今日进度与连续打卡；题库页知识点进度与掌握度
- [x] 5.5 「我的」页入口：错题本、收藏、笔记、打卡
- [x] 5.6 Store 与单元测试

## 6. 验证

- [ ] 6.1 后端与小程序 lint、type-check、test、e2e 通过
- [ ] 6.2 端到端：练习答错 → 进错题本 → 三个统计日答对 → 已掌握
