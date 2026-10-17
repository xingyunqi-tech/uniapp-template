## Context

业务规则以 `docs/exam-prep-business.md` 为准，本文只记录基础能力的技术决策。后端为 NestJS 六边形架构，现状核实结论见业务文档第 6 节。

## Goals / Non-Goals

- Goals：为后续业务 change 提供鉴权、限流、文件、权限、队列、定时任务、配置、告警、错误码的统一底座
- Non-Goals：任何具体业务实体与接口；运营后台的业务页面

## Decisions

- **可选鉴权**：新增 `OptionalJwtAuthGuard`，复用现有 JWT 策略，校验失败不抛错、`request.user` 为空。公开接口如需个人数据通过它获取用户。
- **限流**：继承 `ThrottlerGuard` 重写 `getTracker`，登录用户以 `user:{id}`、游客以 `ip:{ip}` 计数；存储改为 Redis（`@nest-lab/throttler-storage-redis` 或等价实现），路由级配置用 `@Throttle()`。
- **文件**：
  - `FileType` 增加 `ownerUserId`（可空，系统文件为空）、`visibility`（`PUBLIC` / `PRIVATE`）、`mimeType`、`size`。
  - 允许类型按用途白名单：图片（jpg/png/gif/webp）、音频（mp3/m4a）、导入包（zip/xlsx/json）、导出（pdf）；大小上限按用途配置。
  - 私有文件读取校验归属；local 驱动的 `GET /files/:path` 只对 `PUBLIC` 放行。
  - 题目等内容只存 `file:{fileId}`，输出时由 `FileUrlResolver` 统一解析（S3 预签名 URL 不入库）。
- **权限**：新增权限写入 `permission.enum.ts`、`role-permissions.ts`，并以 migration 写 `role_permission`；发布后清理 `permissions:v2:role-map` 缓存。
- **队列**：每个业务队列一个 module，以 `ConditionalModule.registerWhen(..., isRedisEnabled)` 注册；启动时若 `NODE_ENV=production` 且 Redis 关闭则直接报错退出。
- **定时任务**：封装 `runExclusive(key, ttl, fn)`，基于 `LockService.tryAcquire`；任务正确性仍由数据库条件更新保证，锁只用于减少重复执行。
- **配置缓存**：`ConfigService.get` 读取 Redis 缓存（TTL 60 秒），`PUT /config/:key` 写入后删除缓存。
- **告警**：`AlertService.raise(type, level, message, payload, dedupKey)`，部分唯一索引 `(dedupKey) WHERE acknowledgedAt IS NULL` 去重；同时给管理员发站内通知，并暴露 metrics。
- **错误键**：在 `src/common/constants` 集中定义附录 9.2 的错误键常量，抛出时放入 `errors`，由 `AllExceptionsFilter` 输出到 `data`。

## Risks / Trade-offs

- throttler 存储切到 Redis 后，Redis 故障会影响全部接口 → 存储实现降级为内存并告警
- 文件访问控制改造会影响现有头像等公开文件 → 迁移时把现有文件全部标为 `PUBLIC`

## Migration Plan

1. migration：`file` 表新增列（现有记录 `visibility = PUBLIC`）、`admin_alert` 表、`role_permission` 新权限
2. 部署后清理权限缓存
3. 回滚：删除新增列与表，权限记录随 migration revert 删除

## Open Questions

- 运营后台仓库名称与技术形态（用户初始化中）
