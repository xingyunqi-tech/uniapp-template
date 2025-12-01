---
name: deployment
description: 应用部署、运维监控、性能优化和环境管理的完整解决方案指导
---

# 部署指导 Agent

专门负责应用部署、运维监控、性能优化和环境管理，为AI提供完整的部署和运维解决方案指导。

---

## 🎯 当前项目部署配置

### 部署文件结构

```
.
├── Dockerfile          # Docker 镜像构建文件
├── package.sh         # 生产环境打包脚本
└── deploy/
    ├── manage.sh      # 容器管理脚本
    └── nginx.conf     # Nginx 配置
```

### Dockerfile 说明

**位置**: `Dockerfile`（项目根目录）

**特点**:
- 单阶段构建，使用官方 `nginx:alpine` 镜像
- 假设 dist/ 已存在（由 package.sh 预先构建）
- 支持 `--build-arg BASE_IMAGE` 参数
- 包含 version.html 版本信息

**工作流程**:
1. package.sh 执行 `pnpm build` 生成 dist/
2. package.sh 生成 version.html 版本信息文件
3. 使用 Dockerfile 构建镜像（只复制文件）

### package.sh - 生产环境打包

**标准构建**:
```bash
./package.sh
```

**完整构建（包含静态资源包）**:
```bash
./package.sh --full
```

**执行流程**:
1. 检查必需工具（docker、git、pnpm、perl）
2. 创建构建信息（Git Hash、分支、构建时间）
3. 执行 `pnpm build` 构建前端
4. 使用 Dockerfile 构建 Docker 镜像
5. 保存镜像到 tar 文件
6. 创建部署包

**输出文件**:
- `vue-admin-web_{git-hash}_{datetime}.tar.gz` - 完整部署包
- `static_assets_{git-hash}.tar.gz` - 静态资源包（--full 模式）

**重要配置**:
```bash
DOCKERFILE_PATH="./Dockerfile"
BASE_IMAGE="nginx:alpine"
REPO_PREFIX='vue-admin-template/web'
packagePrefix='vue-admin-web'
```

---

## 🐳 Docker 容器管理

### manage.sh - 容器管理脚本

**位置**: `deploy/manage.sh`

**可用命令**:

| 命令 | 说明 |
|------|------|
| `start` | 启动容器（自动创建/加载镜像） |
| `stop` | 停止容器 |
| `restart` | 重启容器 |
| `remove` | 删除容器 |
| `status` | 查看状态 |
| `logs` | 查看日志 |
| `build` | 从源码构建镜像 |
| `help` | 帮助信息 |

**快速启动**:
```bash
cd deploy
./manage.sh start
```

**自定义端口**:
```bash
PORT=3000 ./manage.sh start
```

**查看状态**:
```bash
./manage.sh status
```

**查看日志**:
```bash
./manage.sh logs
```

**配置**:
- 容器名称: `vue-admin-web`
- 镜像名称: `vue-admin-web:local`
- 默认端口: `31180`

**访问地址**:
- 应用: http://localhost:31180
- 版本: http://localhost:31180/web/version

---

## 🚀 部署流程

### 开发环境

```bash
# 使用 Vite 开发服务器（推荐）
pnpm start

# 或使用 HTTPS
pnpm start:https
```

### 测试环境

```bash
# 1. 构建前端资源
pnpm build

# 2. 启动 Docker 容器
cd deploy
./manage.sh start

# 3. 访问测试
curl http://localhost:31180
curl http://localhost:31180/web/version
```

### 生产环境部署

**1. 构建部署包**:
```bash
# 在项目根目录执行
./package.sh
```

**2. 传输部署包到服务器**:
```bash
scp vue-admin-web_*.tar.gz user@server:/path/to/deploy/
```

**3. 解压并部署**:
```bash
# 在服务器上执行
tar -xzf vue-admin-web_*.tar.gz
cd vue_admin_web
./manage.sh start
```

**4. 验证部署**:
```bash
./manage.sh status
curl http://localhost:31180/web/version
```

---

## ⚙️ Nginx 配置

**位置**: `deploy/nginx.conf`

**主要特性**:
- ✅ SPA 路由支持（`try_files`）
- ✅ 静态资源缓存（1年）
- ✅ Gzip 压缩
- ✅ 安全头设置
- ✅ 版本信息端点（`/web/version`）

**配置 API 代理**:

编辑 `deploy/nginx.conf`，取消注释并修改：

```nginx
location /api/ {
    proxy_pass http://your-backend-service:3000/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

修改后重新打包：`./package.sh`

---

## 🐛 故障排查

### 端口被占用

```bash
# 查看端口占用
lsof -i :31180

# 换端口启动
PORT=3000 ./manage.sh start
```

### 容器无法启动

```bash
# 查看日志
./manage.sh logs

# 清理重建
./manage.sh remove
./manage.sh build
./manage.sh start
```

### 镜像不存在

```bash
# 构建前端资源
cd .. && pnpm build

# 构建镜像
cd deploy && ./manage.sh build
```

### 构建失败

```bash
# 清理缓存
pnpm store prune

# 重新安装依赖
pnpm install

# 重新构建
pnpm build
```

---

## 📋 部署检查清单

### 构建前检查
- [ ] 代码通过所有测试
- [ ] TypeScript 类型检查通过
- [ ] ESLint 检查通过
- [ ] 环境变量配置正确
- [ ] API 代理配置正确

### 部署前检查
- [ ] 确认 dist/ 目录存在
- [ ] 确认 Docker 服务运行正常
- [ ] 确认网络连接正常
- [ ] 确认端口未被占用
- [ ] 备份当前运行版本

### 部署后验证
- [ ] 容器启动成功
- [ ] 应用可以访问
- [ ] 版本信息正确
- [ ] API 请求正常
- [ ] 静态资源加载正常
- [ ] 路由跳转正常

---

## 💡 最佳实践

### 1. 开发环境
- 使用 `pnpm start` 而不是 Docker
- 启用热重载提高开发效率
- 配置本地代理访问后端 API

### 2. 测试环境
- 使用 `./manage.sh build` 本地构建测试
- 验证 Docker 镜像功能完整性
- 测试 Nginx 配置正确性

### 3. 生产环境
- 使用 CI/CD 构建部署包
- 保留最近 3-5 个版本用于回滚
- 定期检查容器日志
- 监控资源使用情况

### 4. 版本管理
- 使用 Git Hash 作为版本标识
- 在 version.html 中记录构建信息
- 部署前打 Git Tag

### 5. 安全建议
- 定期更新基础镜像（nginx:alpine）
- 使用 HTTPS（生产环境）
- 配置防火墙规则
- 限制容器资源使用
- 定期检查安全漏洞

---

## 📦 常用 Docker 命令

```bash
# 查看容器
docker ps -a

# 查看镜像
docker images

# 查看日志
docker logs vue-admin-web

# 进入容器
docker exec -it vue-admin-web sh

# 查看资源占用
docker stats vue-admin-web

# 清理未使用的镜像
docker image prune -a

# 清理未使用的容器
docker container prune
```

---

## 🔄 更新和回滚

### 更新部署

```bash
# 1. 停止旧容器
./manage.sh stop

# 2. 备份当前版本（可选）
docker tag vue-admin-web:local vue-admin-web:backup

# 3. 加载新镜像
docker load -i vue-admin-web-new.tar

# 4. 启动新容器
./manage.sh start

# 5. 验证部署
curl http://localhost:31180/web/version
```

### 快速回滚

```bash
# 1. 停止当前容器
./manage.sh stop

# 2. 恢复备份版本
docker tag vue-admin-web:backup vue-admin-web:local

# 3. 启动容器
./manage.sh start
```

---

## 📚 相关文档

- [deploy/README.md](../../deploy/README.md) - 详细的容器管理脚本使用说明
- [README.md](../../README.md) - 项目主文档，包含 Docker 部署章节
- [Dockerfile](../../Dockerfile) - Docker 镜像构建文件
- [package.sh](../../package.sh) - 生产环境打包脚本

---

## 🎯 重要注意事项

1. **部署方式**:
   - 本地开发: 使用 `pnpm start`
   - 生产打包: 使用 `./package.sh`
   - 容器管理: 使用 `deploy/manage.sh`

2. **构建上下文**:
   - package.sh 必须在项目根目录执行
   - Dockerfile 从根目录复制 dist 和 version.html
   - manage.sh 从 deploy 目录执行

3. **镜像配置**:
   - 使用官方 `nginx:alpine` 镜像
   - 自动支持多架构（amd64/arm64）

4. **配置修改后**:
   - Nginx 配置修改: 重新执行 `./package.sh`
   - 前端代码修改: 先 `pnpm build` 再打包

5. **端口配置**:
   - 默认端口: 31180
   - 可通过 PORT 环境变量自定义
   - 容器内部始终使用 80 端口
