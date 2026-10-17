## ADDED Requirements

### Requirement: Agreement Consent

小程序 SHALL 在首次启动时展示用户协议与隐私政策，用户同意后 SHALL 记录同意的协议类型、版本与时间；协议版本升级后 SHALL 重新征得同意。

#### Scenario: First launch
- **WHEN** 用户首次打开小程序
- **THEN** 弹出用户协议与隐私政策
- **AND** 用户同意后才可继续使用

#### Scenario: Version upgrade
- **GIVEN** 用户已同意隐私政策 v1
- **WHEN** 远程配置的隐私政策版本变为 v2 且用户打开小程序
- **THEN** 再次弹出隐私政策并记录 v2 的同意

#### Scenario: Guest consent synced
- **GIVEN** 游客在本地同意了协议
- **WHEN** 游客登录
- **THEN** 同意记录上报到服务端

---

### Requirement: Consent Records

系统 SHALL 保存每个用户对每个协议版本的同意记录，并提供当前各协议的同意状态。

#### Scenario: Query consent status
- **WHEN** 用户查询同意状态
- **THEN** 返回各协议当前版本以及该用户是否已同意

---

### Requirement: Account Data Cleanup

账号注销成功后，系统 SHALL 异步清理该用户的学习数据：删除会话、作答、错题、统计、打卡、目标考试、笔记、收藏、分享记录、个人生成试卷与上传文件；纠错与举报记录 SHALL 解除用户关联并清空联系方式与图片；同意记录与聚合统计 SHALL 保留。

#### Scenario: Cleanup after deletion
- **WHEN** 用户注销账号
- **THEN** 入队清理任务，完成后该用户的作答、错题、笔记、上传文件均不存在

#### Scenario: Feedback retained anonymously
- **GIVEN** 用户提交过纠错
- **WHEN** 清理完成
- **THEN** 纠错内容保留，`userId`、联系方式与图片被清空

#### Scenario: Aggregates retained
- **WHEN** 清理完成
- **THEN** 题目全站作答人次与试卷参考人数不变

#### Scenario: Pending auto-submit removed
- **GIVEN** 用户注销时有进行中的模考
- **WHEN** 清理完成
- **THEN** 对应的自动交卷延时任务被删除

---

### Requirement: Cleanup Reliability

清理任务 SHALL 由各模块注册的幂等清理器组成，失败时重试，最终失败 SHALL 产生告警。

#### Scenario: Cleaner failure
- **WHEN** 某清理器连续失败超过重试次数
- **THEN** 产生告警，管理员可重新触发该用户的清理任务
