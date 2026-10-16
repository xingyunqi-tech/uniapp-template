# 部署指南

本文档涵盖 H5、小程序、App 等多平台的构建和部署配置。

## 目录

- [快速开始](#快速开始)
- [H5 部署](#h5-部署)
- [小程序部署](#小程序部署)
  - [微信小程序](#微信小程序)
  - [支付宝小程序](#支付宝小程序)
- [App 部署](#app-部署)
- [CI/CD 配置](#cicd-配置)
  - [GitHub Actions](#github-actions)
  - [Secrets 配置](#secrets-配置)
- [本地脚本使用](#本地脚本使用)
- [常见问题](#常见问题)

---

## 快速开始

### 构建命令

```bash
# H5
pnpm build:h5

# 微信小程序
pnpm build:mp-weixin

# 支付宝小程序
pnpm build:mp-alipay

# App
pnpm build:app
```

### 构建产物

| 平台 | 输出目录 |
|------|---------|
| H5 | `dist/build/h5` |
| 微信小程序 | `dist/build/mp-weixin` |
| 支付宝小程序 | `dist/build/mp-alipay` |
| App | `dist/build/app` |

---

## H5 部署

### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/h5;

    # 启用 gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # SPA 路由
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Docker 部署

```dockerfile
FROM nginx:alpine
COPY dist/build/h5 /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### 环境变量

构建时通过环境变量注入配置：

```bash
# .env.production
VITE_API_BASE_URL=https://api.example.com
VITE_ERROR_REPORT_URL=https://report.example.com
VITE_LEGACY=true
```

---

## 小程序部署

### 微信小程序

#### 1. 获取上传密钥

1. 登录 [微信小程序后台](https://mp.weixin.qq.com)
2. 进入 **开发管理** → **开发设置** → **小程序代码上传**
3. 点击 **生成** 按钮，下载密钥文件 (`private.wx.key`)

> ⚠️ **安全提示**: 密钥文件请妥善保管，不要提交到 Git 仓库

#### 2. 配置 IP 白名单

在微信小程序后台配置 CI 服务器 IP 白名单：

```bash
# 获取 GitHub Actions IP
curl https://api.github.com/meta | jq '.actions'
```

或者临时关闭 IP 白名单限制（仅开发阶段）。

#### 3. 密钥编码为 Base64

```bash
# macOS / Linux
base64 -i private.wx.key | tr -d '\n'

# Windows (PowerShell)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("private.wx.key"))
```

将输出的 Base64 字符串保存，用于配置 GitHub Secrets。

---

### 支付宝小程序

#### 1. 获取开发工具密钥

1. 登录 [支付宝开放平台](https://open.alipay.com)
2. 进入小程序详情页
3. 点击 **开发设置** → **开发工具密钥**
4. 生成并保存私钥

#### 2. 获取工具 ID

1. 下载 [小程序开发者工具](https://opendocs.alipay.com/mini/ide/download)
2. 登录后在 **设置** → **安全设置** 中查看工具 ID

---

## App 部署

### 云打包

1. 登录 [DCloud 开发者中心](https://dev.dcloud.net.cn)
2. 创建应用并获取 AppID
3. 配置 `manifest.config.ts` 中的应用信息（构建时生成 `src/manifest.json`）
4. 执行构建并提交云打包

### 本地打包

参考 [uni-app 离线打包文档](https://nativesupport.dcloud.net.cn/AppDocs/)

---

## CI/CD 配置

### GitHub Actions

项目配置了四个工作流：

| 工作流 | 文件 | 触发条件 | 说明 |
|--------|------|---------|------|
| Check | `.github/workflows/check.yml` | 推送/PR 到 master/main、手动触发、被其他工作流调用 | lint:check、checkCssVars、type-check、test:coverage |
| Release | `.github/workflows/release.yml` | Tag 推送 (`v*.*.*`) | 跑一次 Check，通过后并行调用 Deploy H5 与 Deploy MiniProgram |
| Deploy H5 | `.github/workflows/deploy-h5.yml` | 被 Release 调用 / 手动触发 | 手动触发时先调用 Check，构建 H5 后通过 SSH + rsync 部署到服务器（`StrictHostKeyChecking=yes`；主机指纹取自 `ALIYUN_KNOWN_HOSTS`，未配置时运行时 `ssh-keyscan` 获取并告警） |
| Deploy MiniProgram | `.github/workflows/deploy-mp.yml` | 被 Release 调用 / 手动触发 | 手动触发时先调用 Check，构建并上传微信 / 支付宝小程序；手动预览时微信二维码作为构建产物上传 |

并发：Release、Deploy H5、Deploy MiniProgram 各用固定的并发组，运行中的部署不会被取消；同组最多一个运行、一个等待，再次触发时等待中的那个会被取消。发布进行中不要手动触发部署，以免 H5 与小程序停在不同版本。

### Secrets 配置

在 GitHub 仓库 → **Settings** → **Secrets and variables** → **Actions** 中添加：

| Secret | 说明 | 必填 |
|--------|------|------|
| `WEIXIN_APPID` | 微信小程序 AppID | ✅ |
| `WEIXIN_PRIVATE_KEY` | 微信上传密钥 (Base64) | ✅ |
| `ALIPAY_APPID` | 支付宝小程序 AppID | 可选 |
| `ALIPAY_PRIVATE_KEY` | 支付宝私钥 | 可选 |
| `ALIPAY_TOOL_ID` | 支付宝工具 ID | 可选 |
| `ALIYUN_HOST` | H5 部署服务器 IP 或域名 | H5 部署必填 |
| `ALIYUN_PORT` | SSH 端口 (默认 22) | 可选 |
| `ALIYUN_USER` | SSH 用户名 | H5 部署必填 |
| `ALIYUN_SSH_KEY` | SSH 私钥 (完整内容) | H5 部署必填 |
| `ALIYUN_DEPLOY_PATH` | 部署目标路径 (如 `/var/www/h5`) | H5 部署必填 |
| `ALIYUN_KNOWN_HOSTS` | 服务器 known_hosts 行，用于固定主机指纹 | 可选（推荐） |

> 支付宝 secrets 未配置时：Tag 触发会跳过支付宝上传；手动选择支付宝平台则直接失败。

`ALIYUN_KNOWN_HOSTS` 未配置时，每次部署在运行时用 `ssh-keyscan` 获取主机公钥，若获取时已被中间人冒充则无法发现，工作流会输出警告。获取方式：在可信网络中执行

```bash
ssh-keyscan -p <port> -H <host>
```

用 `ssh-keygen -lf <(ssh-keyscan -p <port> <host>)` 输出的指纹与服务器上 `ssh-keygen -lf /etc/ssh/ssh_host_*_key.pub` 的结果核对一致后，把第一条命令的输出整段存为该 secret。非 22 端口时行内主机名为 `[host]:port` 格式，`-p` 参数会自动生成。

### 自动触发部署

推送版本 Tag 时自动部署 H5，并上传微信小程序（已配置支付宝 secrets 时同时上传支付宝小程序）：

```bash
# 更新版本号
npm version patch  # 或 minor / major

# 推送 Tag
git push origin --tags
```

### 手动触发部署

1. 进入 GitHub 仓库 → **Actions** → **Deploy MiniProgram**（或 **Deploy H5**）
2. 点击 **Run workflow**
3. 小程序：选择目标平台 (weixin / alipay / all)、操作类型 (upload / preview)，可选填版本号与描述；H5：选择是否部署到服务器

---

## 本地脚本使用

### 环境变量配置

`scripts/mp-upload.ts` 只读取 `process.env`，不会加载 `.env` 文件，需在 shell 中导出环境变量：

```bash
# 微信小程序
export WEIXIN_APPID=wx1234567890
export WEIXIN_PRIVATE_KEY=Base64编码的密钥内容

# 支付宝小程序 (可选)
export ALIPAY_APPID=2021001234567890
export ALIPAY_PRIVATE_KEY=私钥内容
export ALIPAY_TOOL_ID=工具ID
```

### 命令使用

```bash
# 构建并上传微信小程序
pnpm mp:upload:weixin

# 构建并预览微信小程序 (生成二维码)
pnpm mp:preview:weixin

# 构建并上传支付宝小程序
pnpm mp:upload:alipay

# 构建并预览支付宝小程序 (生成二维码)
pnpm mp:preview:alipay
```

### 指定版本和描述

```bash
MP_VERSION=1.2.0 MP_DESC="修复登录问题" pnpm mp:upload:weixin
```

---

## 工作流程图

```
┌─────────────────────────────────────────────────────────────┐
│                    Git Push Tag (v1.0.0)                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Actions                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  1. Checkout 代码                                    │   │
│  │  2. 安装依赖 (pnpm install)                         │   │
│  │  3. Check 工作流: Lint + 类型检查 + 测试             │   │
│  │  4. 构建小程序                                       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│   微信小程序上传         │     │   支付宝小程序上传       │
│  (miniprogram-ci)       │     │  (minidev)              │
└─────────────────────────┘     └─────────────────────────┘
              │                               │
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│   微信小程序后台         │     │   支付宝开放平台         │
│  体验版 → 审核 → 发布    │     │  体验版 → 审核 → 发布    │
└─────────────────────────┘     └─────────────────────────┘
```

---

## 常见问题

### Q: 上传失败，提示 "Error: 登录用户不是开发者"

**原因**: 上传密钥对应的管理员未将 CI 机器人添加为项目成员

**解决**:
1. 微信后台 → 管理 → 成员管理
2. 添加 CI 用的开发者账号

### Q: 上传失败，提示 "Error: IP 不在白名单"

**原因**: GitHub Actions 的 IP 不在白名单内

**解决**:
1. 获取 GitHub Actions IP: `curl https://api.github.com/meta`
2. 在微信后台添加 IP 白名单
3. 或临时关闭 IP 白名单限制

### Q: 如何查看上传的版本？

**微信**:
1. 登录 [微信小程序后台](https://mp.weixin.qq.com)
2. 进入 **管理** → **版本管理**
3. 在 **开发版本** 或 **体验版本** 中查看

**支付宝**:
1. 登录 [支付宝开放平台](https://open.alipay.com)
2. 进入小程序详情页 → **版本管理**

### Q: 如何让团队成员测试体验版？

1. 微信后台 → 管理 → 成员管理 → 添加体验成员
2. 体验成员扫描体验版二维码即可

### Q: H5 部署后路由刷新 404

确保 Nginx 配置了 SPA 路由：

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### Q: 构建内存不足

增加 Node.js 内存限制：

```bash
NODE_OPTIONS=--max-old-space-size=8192 pnpm build:mp-weixin
```

---

## 相关链接

- [miniprogram-ci 官方文档](https://developers.weixin.qq.com/miniprogram/dev/devtools/ci.html)
- [微信小程序后台](https://mp.weixin.qq.com)
- [支付宝开放平台](https://open.alipay.com)
- [DCloud 开发者中心](https://dev.dcloud.net.cn)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
