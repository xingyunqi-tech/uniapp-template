# Change: 搭建备考业务的平台基础能力

## Why

备考刷题业务（`docs/exam-prep-business.md`）的各模块共同依赖一批后端基础能力：可选鉴权、按用户限流、文件归属与新类型、业务权限、异步任务与定时任务互斥、远程配置缓存、监控告警、统一业务错误码。现有后端（`~/workspace/template/nestjs-boilerplate`）不具备或不完整，需要先行建设，后续 change 才能落地。

## What Changes

- 后端：
  - 新增可选鉴权 guard：带合法 token 时解析用户，否则按游客处理
  - throttler 支持按用户计数，存储改为 Redis
  - files 放开音频、zip、xlsx、pdf 类型与大小限制；文件记录增加 `ownerUserId` 与可见性（公共读 / 私有读）；题目内容以 `file:{fileId}` 引用文件并在输出时解析
  - 新增业务权限（`practice:write`、`ai:chat`、`ai:grading`、`content:manage`、`content:review`、`ai:generate`、`ai:admin`），通过 migration/seed 授权并同步静态映射
  - 业务队列按 `notification-queue` 模式各自建 module；生产环境强制要求 Redis
  - 业务定时任务统一以 `LockService` 互斥
  - config 模块读取加 Redis 缓存，登记附录 9.1 的配置项
  - 新增 `AdminAlert` 告警与 `/admin/monitor/*` 接口
  - 统一业务错误键（附录 9.2）
- 运营后台（独立仓库，初始化中）：
  - 管理员登录、布局、路由与权限
  - 远程配置编辑页、监控告警页
- 小程序：
  - 请求层生成并持久化 `deviceId`
  - 按业务错误键统一处理提示
  - 执行 `pnpm api:gen` 同步接口

## Impact

- Affected specs: `platform-foundation`（新增）
- Affected code:
  - 后端：`src/common/guards`、`src/infrastructure/throttler`、`src/modules/files`、`src/core/permissions`、`src/infrastructure/queue`、`src/infrastructure/scheduler`、`src/modules/config`、新增 `src/modules/monitor`
  - 小程序：`src/api/core`、`src/utils`
  - 运营后台：新仓库
- 后续 change 依赖本 change：`add-exam-content`、`add-practice-session`、`add-study-tracking`、`add-question-feedback-errata`、`add-ai-question-tutor`、`add-compliance-account-cleanup`
