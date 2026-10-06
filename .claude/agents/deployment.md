---
name: deployment
description: 应用部署、运维监控、性能优化和环境管理的完整解决方案指导
tools: Read, Grep, Glob, Bash
model: inherit
---

# 部署指导 Agent

专门负责应用部署、运维监控、性能优化和环境管理，为AI提供完整的部署和运维解决方案指导。

> 完整的部署说明见 [docs/deploy.md](../../docs/deploy.md)，本文只做速查。

---

## 🎯 当前项目部署配置

### 部署文件结构

```
.
├── .github/workflows/
│   ├── check.yml        # lint / type-check / test
│   ├── deploy-h5.yml    # H5 构建并通过 SSH + rsync 部署到服务器
│   └── deploy-mp.yml    # 微信 / 支付宝小程序构建并上传
├── scripts/
│   └── mp-upload.ts     # 小程序上传 / 预览脚本 (miniprogram-ci / minidev)
├── .env.development     # 开发环境变量
└── .env.production      # 生产环境变量
```

### 构建产物

| 平台 | 命令 | 输出目录 |
|------|------|----------|
| H5 | `pnpm build:h5` | `dist/build/h5` |
| 微信小程序 | `pnpm build:mp-weixin` | `dist/build/mp-weixin` |
| 支付宝小程序 | `pnpm build:mp-alipay` | `dist/build/mp-alipay` |
| App | `pnpm build:app` | `dist/build/app` |

---

## 🚀 部署流程

### 开发环境

```bash
pnpm dev:h5           # H5
pnpm dev:mp-weixin    # 微信小程序
pnpm dev:mp-alipay    # 支付宝小程序
pnpm dev:app          # App
```

### H5 部署 (deploy-h5.yml)

- **触发**: 推送 `v*.*.*` tag，或手动触发
- **流程**: 调用 `check.yml` → `pnpm build:h5` → rsync 同步 `dist/build/h5/` 到服务器
- **Secrets**: `ALIYUN_HOST`、`ALIYUN_PORT`（可选，默认 22）、`ALIYUN_USER`、`ALIYUN_SSH_KEY`、`ALIYUN_DEPLOY_PATH`

### 小程序部署 (deploy-mp.yml)

- **触发**: 推送 `v*.*.*` tag（上传微信与支付宝），或手动触发（选择平台与 upload / preview）
- **流程**: 调用 `check.yml` → 构建 → 检查包体大小 → `scripts/mp-upload.ts` 上传
- **Secrets**: `WEIXIN_APPID`、`WEIXIN_PRIVATE_KEY`（base64）；`ALIPAY_APPID`、`ALIPAY_PRIVATE_KEY`、`ALIPAY_TOOL_ID`
- tag 触发时未配置支付宝 secrets 会跳过支付宝上传；手动选择支付宝时缺失则失败

### 本地上传小程序

```bash
pnpm mp:upload:weixin     # 构建并上传微信小程序
pnpm mp:preview:weixin    # 构建并生成微信预览二维码
pnpm mp:upload:alipay     # 构建并上传支付宝小程序 (minidev)
pnpm mp:preview:alipay    # 构建并生成支付宝预览二维码
```

`scripts/mp-upload.ts` 只读取 `process.env`，不加载 `.env` 文件，需在命令行环境中提供上述密钥变量。

---

## 🐛 故障排查

### 构建失败

```bash
# 清理构建产物
pnpm clean

# 重新安装依赖
pnpm install

# 重新构建
pnpm build:h5
```

### 包体积过大

```bash
# 分析 H5 包体积
pnpm analyzer
```

小程序主包限制 2MB，非 TabBar 页面放入 `src/pages-sub/` 分包。

---

## 📋 部署检查清单

### 构建前检查
- [ ] 代码通过所有测试
- [ ] TypeScript 类型检查通过
- [ ] `pnpm lint:check` 通过
- [ ] 环境变量配置正确

### 部署后验证
- [ ] 应用可以访问
- [ ] API 请求正常
- [ ] 静态资源加载正常
- [ ] 路由跳转正常

---

## 📚 相关文档

- [docs/deploy.md](../../docs/deploy.md) - 部署与 CI/CD 详细说明
- [README.md](../../README.md) - 项目主文档
