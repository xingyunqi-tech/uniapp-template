## ADDED Requirements

### Requirement: Single Ongoing Mock per Paper

同一用户同一试卷 SHALL 最多只有一个进行中的模考会话；重复进入 SHALL 返回已有会话（断点续考），并发创建只产生一个会话。

#### Scenario: Concurrent start
- **WHEN** 用户双击「开始考试」发出两个创建请求
- **THEN** 只创建一个会话，两次请求返回同一会话

#### Scenario: Restart
- **WHEN** 用户选择「重新开始」
- **THEN** 原会话置为 `ABANDONED` 后创建新会话

#### Scenario: Re-enter after the auto submit time
- **GIVEN** 用户的进行中模考已过自动交卷时间但尚未被自动交卷
- **WHEN** 用户再次进入该试卷
- **THEN** 系统先交卷并返回该已交卷的会话，不自动新开
- **AND** 用户再次开考时创建新的会话

---

### Requirement: Server-Authoritative Timing

模考计时 SHALL 以服务端为准：接口返回 `serverNow` 与 `deadlineAt`，客户端据此校准倒计时并在截止时本地锁定答题。

#### Scenario: Device clock skew
- **GIVEN** 用户手机时间比服务端快 10 分钟
- **WHEN** 打开答题页
- **THEN** 倒计时与服务端剩余时间一致

---

### Requirement: Single Active Device

模考 SHALL 同一时间只允许一个设备作答；只有创建/续考接口能以新设备接管，截止时间后禁止接管；被接管的设备再次写入 SHALL 收到 `sessionTakenOver`。

#### Scenario: Take over by new device
- **GIVEN** 用户在手机 A 作答到第 20 题
- **WHEN** 用户在手机 B 进入同一模考
- **THEN** B 成为活动设备并看到已同步的作答
- **AND** A 再次保存答案时收到 `sessionTakenOver` 并退出答题

#### Scenario: Takeover after deadline
- **WHEN** 截止时间后用户在新设备进入模考
- **THEN** 不接管，原设备仍可在补交窗口内补交

---

### Requirement: Answer Overwrite Ordering

模考作答 SHALL 允许覆盖：同一设备的写入按 `clientSeq` 递增生效，较旧的写入被忽略；清空答案为软清空并保留序号。

#### Scenario: Delayed stale write
- **GIVEN** 用户先选 A（seq=5），再清空（seq=6）
- **WHEN** seq=5 的请求因网络延迟最后到达
- **THEN** 该写入被忽略，答案保持清空

---

### Requirement: Offline Sync Window

截止时间到补交窗口结束之间，系统 SHALL 只接受当前设备标记为离线补交的批次，并逐条过滤：作答时间晚于截止时间的记录不写入，批次其余照常写入，响应返回被跳过的题目；窗口结束或会话已结束后拒绝写入。

#### Scenario: Offline answers synced
- **GIVEN** 用户在截止前 2 分钟断网并继续作答，截止后 3 分钟恢复网络
- **WHEN** 客户端批量补交，且记录的作答时间早于截止时间
- **THEN** 补交成功并计入成绩

#### Scenario: Records after the deadline in an offline batch
- **WHEN** 补交批次中部分记录的作答时间晚于截止时间
- **THEN** 这些记录不写入并在响应中列为被跳过的题目，其余记录照常写入

#### Scenario: Write after window
- **WHEN** 补交窗口结束后写入
- **THEN** 返回 `sessionClosed`

---

### Requirement: Atomic Submission

交卷 SHALL 在一个事务内完成状态条件更新、客观题判分与总分写入；重复交卷与自动交卷 SHALL 只生效一次。

#### Scenario: Manual and auto submit race
- **WHEN** 手动交卷与自动交卷同时执行
- **THEN** 只有一个生效，另一个返回已有结果

#### Scenario: Submit after window
- **WHEN** 补交窗口结束后到达手动交卷请求且会话仍未交卷
- **THEN** 交卷类型记为 `AUTO_TIMEOUT`

---

### Requirement: Automatic Submission

系统 SHALL 在补交窗口结束时自动交卷，并有兜底扫描；一题未答的超时会话 SHALL 置为 `ABANDONED`。

#### Scenario: Auto submit
- **GIVEN** 用户开考后关闭小程序
- **WHEN** 到达补交窗口结束时间
- **THEN** 会话自动交卷并生成成绩

#### Scenario: Empty timeout
- **GIVEN** 用户开考后一题未答
- **WHEN** 超时
- **THEN** 会话置为 `ABANDONED`，不计成绩与参考人数

---

### Requirement: First Attempt Tracking

用户在某试卷上首次写入非空答案的会话 SHALL 标记为首次作答并计入参考人数；之后的放弃、清空与重考 SHALL NOT 改变首次标记。

#### Scenario: Abandon after answering
- **GIVEN** 用户首次开考作答 3 题后放弃
- **WHEN** 用户重考并交卷
- **THEN** 重考成绩不进入分位样本

#### Scenario: Concurrent first answers
- **WHEN** 同一用户在同一试卷上的首次写入并发到达
- **THEN** 只有一个会话被标记为首次，参考人数只增加 1

---

### Requirement: Score Report

交卷后 SHALL 提供成绩报告：得分、正确率、用时、超过多少用户、分题型与分知识点正确率、答题卡、主观题自评入口、本次错题重做。

#### Scenario: Percentile scope
- **WHEN** 用户查看真题成绩报告
- **THEN** 「超过多少用户」只基于相同计分口径下其他用户的首次交卷成绩

#### Scenario: Wrong question redo
- **WHEN** 用户在报告中点击「本次错题重做」
- **THEN** 以本次会话的错题创建错题重做会话

---

### Requirement: Personal Generated Paper

用户 SHALL 能按组卷规则生成个人试卷并以模考方式作答；生成次数受每日上限限制，7 天未开考的个人试卷 SHALL 被清理。

#### Scenario: Generate paper
- **WHEN** 用户选择组卷规则生成试卷
- **THEN** 优先排除近 30 天做过的题目，返回仅本人可见的试卷

#### Scenario: Daily limit
- **WHEN** 用户当日生成次数超过上限
- **THEN** 返回 `generateLimitExceeded`
