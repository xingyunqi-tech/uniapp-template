## 1. 后端（nestjs-boilerplate）

- [x] 1.1 新增 `OptionalJwtAuthGuard` 与单元测试
- [x] 1.2 throttler：自定义 tracker（用户/IP），存储切换为 Redis，Redis 故障降级为内存并告警
- [x] 1.3 files：`FileType` 新增 `ownerUserId`、`visibility`、`mimeType`、`size`；按用途配置类型白名单与大小；私有文件读取校验；migration（现有文件置为 `PUBLIC`）
- [x] 1.4 `FileUrlResolver`：解析内容中的 `file:{fileId}` 并补充单元测试
- [x] 1.5 新增业务权限枚举、静态映射与 migration；发布脚本清理权限缓存
- [x] 1.6 生产环境 Redis 必选的启动校验
- [x] 1.7 `runExclusive` 定时任务互斥封装
- [x] 1.8 config 读取缓存与写入失效；登记附录 9.1 配置项的默认值 seed
- [x] 1.9 监控模块：`AdminAlert` 实体与 migration、`AlertService`、`GET /admin/monitor/queues`、`GET /admin/monitor/alerts`、`POST /admin/monitor/alerts/:id/ack`、metrics 指标
- [x] 1.10 业务错误键常量（附录 9.2）
- [x] 1.11 e2e：可选鉴权、按用户限流、私有文件访问、权限、告警去重

## 2. 运营后台（独立仓库）

- [x] 2.1 管理员登录与 token 管理，非管理员拒绝进入
- [x] 2.2 布局、菜单、路由权限
- [x] 2.3 远程配置编辑页（附录 9.1 配置项）
- [x] 2.4 监控告警页：队列状态、告警列表、确认告警

## 3. 小程序（uniapp-template）

- [x] 3.1 `deviceId` 生成与持久化，请求层可按需携带
- [x] 3.2 错误键到提示文案的映射（i18n），在请求层统一处理
- [x] 3.3 `pnpm api:gen` 同步接口，`pnpm type-check`、`pnpm test` 通过

## 4. 验证

- [x] 4.1 后端 `pnpm lint:check`、`pnpm type-check`、`pnpm test`、`pnpm test:e2e` 通过
- [x] 4.2 `migration:check` 通过
