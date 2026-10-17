## ADDED Requirements

### Requirement: Optional Authentication

系统 SHALL 提供可选鉴权：请求携带合法 token 时识别用户，未携带或 token 无效时按游客处理且不拒绝请求。

#### Scenario: Logged-in user on public endpoint
- **GIVEN** 接口使用可选鉴权
- **WHEN** 请求携带合法 access token
- **THEN** 服务端识别出当前用户
- **AND** 响应可附带该用户的个人数据

#### Scenario: Guest on public endpoint
- **GIVEN** 接口使用可选鉴权
- **WHEN** 请求未携带 token 或 token 已过期
- **THEN** 请求正常处理且不返回 401
- **AND** 响应不包含任何个人数据

---

### Requirement: Per-User Rate Limiting

系统 SHALL 对登录用户按用户计数、对游客按 IP 计数进行限流，计数在多实例间共享。

#### Scenario: Logged-in user exceeds limit
- **GIVEN** 某接口限制每分钟 N 次
- **WHEN** 同一用户在一分钟内从不同 IP 发起第 N+1 次请求
- **THEN** 返回 429

#### Scenario: Shared counter across instances
- **GIVEN** 服务部署多个实例
- **WHEN** 同一用户的请求分散到不同实例
- **THEN** 限流计数合并计算

---

### Requirement: File Ownership and Visibility

系统 SHALL 记录文件归属与可见性，私有文件仅归属用户可读，并按用途限制文件类型与大小。

#### Scenario: Private file accessed by owner
- **GIVEN** 用户上传的手写照片为私有文件
- **WHEN** 上传者请求该文件
- **THEN** 返回文件内容

#### Scenario: Private file accessed by others
- **GIVEN** 某私有文件归属用户 A
- **WHEN** 用户 B 请求或在业务数据中引用该文件
- **THEN** 拒绝访问或引用

#### Scenario: Audio upload
- **WHEN** 管理员上传 mp3 音频
- **THEN** 上传成功并标记为公共读

#### Scenario: Disallowed type
- **WHEN** 上传不在该用途白名单内的文件类型
- **THEN** 返回 422

---

### Requirement: Content File Reference Resolution

系统 SHALL 在题目等内容中以 `file:{fileId}` 引用文件，并在接口输出时解析为当前可访问的地址。

#### Scenario: Resolve on output
- **GIVEN** 题干含 `![](file:abc)`
- **WHEN** 接口返回该题干
- **THEN** `file:abc` 被替换为可访问的 URL
- **AND** 数据库中仍保存 `file:abc`

---

### Requirement: Business Permissions

系统 SHALL 提供备考业务权限，并通过数据库授权生效：用户角色拥有 `practice:write`、`ai:chat`、`ai:grading`，管理员拥有全部权限。

#### Scenario: User calls practice write endpoint
- **GIVEN** 已执行权限 migration
- **WHEN** 普通用户调用需要 `practice:write` 的接口
- **THEN** 鉴权通过

#### Scenario: User calls content management endpoint
- **WHEN** 普通用户调用需要 `content:manage` 的接口
- **THEN** 返回 403

---

### Requirement: Background Job Infrastructure

系统 SHALL 以 BullMQ 承载业务异步任务，生产环境必须启用 Redis；业务定时任务 SHALL 以分布式锁互斥执行。

#### Scenario: Production without Redis
- **GIVEN** `NODE_ENV=production`
- **WHEN** Redis 未启用
- **THEN** 服务启动失败并输出明确原因

#### Scenario: Scheduled task on multiple instances
- **GIVEN** 多个实例同时触发同一定时任务
- **WHEN** 任务以锁互斥执行
- **THEN** 同一时刻只有一个实例执行任务体

---

### Requirement: Cached Remote Config

系统 SHALL 缓存远程配置读取，并在配置更新后使缓存失效。

#### Scenario: Config updated
- **GIVEN** 配置 `ai.enabled` 已被缓存
- **WHEN** 管理员通过 `PUT /config/ai.enabled` 修改
- **THEN** 下一次读取返回新值

---

### Requirement: Operational Alerts

系统 SHALL 记录运营告警，同一未确认告警不重复写入，并通知管理员；管理员 SHALL 能查看与确认告警。

#### Scenario: Duplicate alert suppressed
- **GIVEN** 存在未确认的告警，`dedupKey = auto-submit-delay`
- **WHEN** 同一 `dedupKey` 再次触发
- **THEN** 不新增告警记录

#### Scenario: Acknowledge alert
- **WHEN** 管理员确认告警
- **THEN** 告警记录写入 `acknowledgedAt`
- **AND** 之后同一 `dedupKey` 再次触发时新建告警

---

### Requirement: Business Error Keys

系统 SHALL 以统一错误键标识业务错误，放在响应 `data` 中；小程序 SHALL 按错误键给出对应提示。

#### Scenario: Error key returned
- **WHEN** 业务规则拒绝请求（如会话已被接管）
- **THEN** 响应包含 HTTP 状态码与 `data` 中的错误键 `sessionTakenOver`

#### Scenario: Client handles error key
- **WHEN** 小程序收到已登记的错误键
- **THEN** 显示该错误键对应的提示文案

---

### Requirement: Device Identifier

小程序 SHALL 生成并持久化设备标识 `deviceId`，在需要设备维度的请求中携带。

#### Scenario: First launch
- **WHEN** 小程序首次启动
- **THEN** 生成随机 `deviceId` 并保存到本地存储

#### Scenario: Subsequent launch
- **WHEN** 小程序再次启动
- **THEN** 复用已保存的 `deviceId`

---

### Requirement: Admin Console Foundation

运营后台 SHALL 支持管理员登录，并提供远程配置编辑与监控告警页面。

#### Scenario: Non-admin login
- **WHEN** 非管理员账号登录运营后台
- **THEN** 拒绝进入并提示无权限

#### Scenario: Edit config
- **WHEN** 管理员在配置页修改 `wrongBook.masterThreshold`
- **THEN** 调用 `PUT /config/:key` 保存并展示新值
