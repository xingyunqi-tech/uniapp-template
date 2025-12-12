/**
 * 小程序上传脚本
 * 支持微信小程序和支付宝小程序的自动上传
 *
 * 使用方式:
 *   pnpm mp:upload:weixin          # 上传微信小程序
 *   pnpm mp:upload:alipay          # 上传支付宝小程序
 *   pnpm mp:preview:weixin         # 预览微信小程序
 *
 * 环境变量:
 *   MP_VERSION                     # 版本号 (可选，默认读取 package.json)
 *   MP_DESC                        # 版本描述 (可选)
 *   MP_ROBOT                       # 微信机器人编号 1-30 (可选，默认基于分支名计算)
 *
 *   WEIXIN_APPID                   # 微信小程序 AppID
 *   WEIXIN_PRIVATE_KEY             # 微信小程序上传密钥 (base64 编码)
 *   ALIPAY_APPID                   # 支付宝小程序 AppID
 *   ALIPAY_PRIVATE_KEY             # 支付宝小程序私钥
 *   ALIPAY_TOOL_ID                 # 支付宝小程序工具 ID
 *
 * Robot 分配规则:
 *   main/master: 1
 *   develop/dev: 2
 *   staging: 3
 *   test: 4
 *   其他分支: 5-30 (基于分支名哈希)
 *
 * 密钥获取:
 *   微信: 小程序后台 -> 开发管理 -> 开发设置 -> 小程序代码上传
 *   支付宝: 开放平台 -> 开发设置 -> 开发工具密钥
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { resolve, join } from 'node:path';

// ==================== 类型定义 ====================

interface UploadConfig {
  /** 平台类型 */
  platform: 'weixin' | 'alipay';
  /** 操作类型 */
  action: 'upload' | 'preview';
  /** 版本号 */
  version: string;
  /** 版本描述 */
  description: string;
  /** 机器人编号 (1-30) */
  robot?: number;
}

interface WeixinConfig {
  appid: string;
  privateKeyPath: string;
  projectPath: string;
}

interface AlipayConfig {
  appid: string;
  privateKey: string;
  toolId: string;
  projectPath: string;
}

// ==================== 常量 ====================

const ROOT_DIR = resolve(__dirname, '..');
const DIST_DIR = resolve(ROOT_DIR, 'dist/build');
const TEMP_DIR = resolve(ROOT_DIR, '.temp');

// 构建输出目录
const BUILD_PATHS = {
  weixin: join(DIST_DIR, 'mp-weixin'),
  alipay: join(DIST_DIR, 'mp-alipay'),
};

// ==================== 工具函数 ====================

/**
 * 打印带颜色的日志
 */
function log(message: string, type: 'info' | 'success' | 'error' | 'warn' = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warn: '\x1b[33m',
  };
  const reset = '\x1b[0m';
  const prefix = {
    info: 'ℹ',
    success: '✓',
    error: '✗',
    warn: '⚠',
  };
  console.log(`${colors[type]}${prefix[type]} ${message}${reset}`);
}

/**
 * 获取 package.json 信息
 */
function getPackageInfo(): { version: string; name: string } {
  const packagePath = resolve(ROOT_DIR, 'package.json');
  const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
  return {
    version: packageJson.version,
    name: packageJson.name,
  };
}

/**
 * 解析命令行参数
 */
function parseArgs(): UploadConfig {
  const args = process.argv.slice(2);
  const platform = args[0] as 'weixin' | 'alipay';
  const action = (args[1] || 'upload') as 'upload' | 'preview';
  const packageInfo = getPackageInfo();

  // 从环境变量或命令行获取版本描述
  const description =
    process.env.MP_DESC ||
    process.env.GITHUB_SHA?.slice(0, 7) ||
    `v${packageInfo.version} - ${new Date().toLocaleString('zh-CN')}`;

  // 机器人编号 (基于分支名计算，确保同一分支使用相同 robot)
  const robot = calculateRobot();

  return {
    platform,
    action,
    version: process.env.MP_VERSION || packageInfo.version,
    description,
    robot,
  };
}

/**
 * 验证环境变量
 */
function validateEnv(platform: 'weixin' | 'alipay'): void {
  if (platform === 'weixin') {
    if (!process.env.WEIXIN_APPID) {
      throw new Error('缺少环境变量: WEIXIN_APPID');
    }
    if (!process.env.WEIXIN_PRIVATE_KEY) {
      throw new Error('缺少环境变量: WEIXIN_PRIVATE_KEY');
    }
  } else if (platform === 'alipay') {
    if (!process.env.ALIPAY_APPID) {
      throw new Error('缺少环境变量: ALIPAY_APPID');
    }
    if (!process.env.ALIPAY_PRIVATE_KEY) {
      throw new Error('缺少环境变量: ALIPAY_PRIVATE_KEY');
    }
    if (!process.env.ALIPAY_TOOL_ID) {
      throw new Error('缺少环境变量: ALIPAY_TOOL_ID');
    }
  }
}

/**
 * 确保临时目录存在
 */
function ensureTempDir(): void {
  if (!existsSync(TEMP_DIR)) {
    mkdirSync(TEMP_DIR, { recursive: true });
  }
}

/**
 * 清理临时文件
 */
function cleanupTempFiles(): void {
  const keyPath = resolve(TEMP_DIR, 'private.key');
  if (existsSync(keyPath)) {
    rmSync(keyPath);
  }
}

/**
 * 带重试机制的异步函数执行器
 * @param fn 要执行的异步函数
 * @param retries 最大重试次数
 * @param delay 重试间隔 (毫秒)
 */
async function withRetry<T>(fn: () => Promise<T>, retries: number = 3, delay: number = 3000): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < retries) {
        log(`操作失败，${delay / 1000}秒后重试 (${attempt}/${retries}): ${lastError.message}`, 'warn');
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * 递增版本号 (patch 位 +1)
 * @param version 当前版本号 (如 1.0.0)
 * @returns 递增后的版本号 (如 1.0.1)
 */
function incrementVersion(version: string): string {
  const parts = version.split('.');
  if (parts.length !== 3) {
    // 非标准版本号，追加 .1
    return `${version}.1`;
  }

  const patch = parseInt(parts[2], 10) || 0;
  parts[2] = String(patch + 1);
  return parts.join('.');
}

/**
 * 比较两个版本号
 * @param v1 版本号 1
 * @param v2 版本号 2
 * @returns 1 (v1 > v2), -1 (v1 < v2), 0 (v1 == v2)
 */
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(n => parseInt(n, 10) || 0);
  const parts2 = v2.split('.').map(n => parseInt(n, 10) || 0);

  const maxLength = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < maxLength; i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;

    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }

  return 0;
}

/**
 * 基于字符串计算稳定的哈希值
 * @param str 输入字符串
 * @returns 哈希值
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * 根据分支名计算 robot 编号 (1-30)
 * 同一分支始终返回相同的 robot 编号
 * @returns robot 编号
 */
function calculateRobot(): number {
  // 优先使用环境变量指定的 robot
  if (process.env.MP_ROBOT) {
    const robot = parseInt(process.env.MP_ROBOT, 10);
    if (robot >= 1 && robot <= 30) {
      return robot;
    }
  }

  // 获取分支名
  const branch =
    process.env.GITHUB_REF_NAME || // GitHub Actions
    process.env.GITHUB_HEAD_REF || // GitHub PR
    process.env.CI_COMMIT_REF_NAME || // GitLab CI
    process.env.BRANCH_NAME || // Jenkins
    'local';

  // 特定分支使用固定 robot
  const branchRobotMap: Record<string, number> = {
    main: 1,
    master: 1,
    develop: 2,
    dev: 2,
    staging: 3,
    test: 4,
  };

  if (branchRobotMap[branch]) {
    return branchRobotMap[branch];
  }

  // 其他分支基于分支名哈希计算 (5-30)
  // 保留 1-4 给主要分支
  const hash = hashString(branch);
  return (hash % 26) + 5;
}

// ==================== 微信小程序 ====================

/**
 * 获取微信小程序配置
 */
function getWeixinConfig(): WeixinConfig {
  ensureTempDir();

  // 将 base64 编码的密钥写入临时文件
  const privateKey = Buffer.from(process.env.WEIXIN_PRIVATE_KEY!, 'base64').toString('utf-8');
  const privateKeyPath = resolve(TEMP_DIR, 'private.key');
  writeFileSync(privateKeyPath, privateKey);

  return {
    appid: process.env.WEIXIN_APPID!,
    privateKeyPath,
    projectPath: BUILD_PATHS.weixin,
  };
}

/**
 * 上传微信小程序
 */
async function uploadWeixin(config: UploadConfig): Promise<void> {
  const { action, version, description, robot } = config;
  const weixinConfig = getWeixinConfig();

  log(`开始${action === 'upload' ? '上传' : '预览'}微信小程序...`);
  log(`版本: ${version}`);
  log(`描述: ${description}`);
  log(`机器人: ${robot}`);

  // 检查构建产物
  if (!existsSync(weixinConfig.projectPath)) {
    throw new Error(`构建产物不存在: ${weixinConfig.projectPath}\n请先执行: pnpm build:mp-weixin`);
  }

  // 动态导入 miniprogram-ci
  const ci = await import('miniprogram-ci');

  // 创建项目实例
  const project = new ci.Project({
    appid: weixinConfig.appid,
    type: 'miniProgram',
    projectPath: weixinConfig.projectPath,
    privateKeyPath: weixinConfig.privateKeyPath,
    ignores: ['node_modules/**/*'],
  });

  if (action === 'upload') {
    // 上传代码 (带重试机制)
    const uploadResult = await withRetry(
      () =>
        ci.upload({
          project,
          version,
          desc: description,
          robot,
          threads: 4, // 多线程编译，提升上传速度
          setting: {
            es6: true,
            es7: true,
            minify: true,
            autoPrefixWXSS: true,
            minifyWXML: true,
            minifyWXSS: true,
            minifyJS: true,
            codeProtect: true, // 启用代码保护
          },
          onProgressUpdate: (progress: any) => {
            if (progress._status === 'done') {
              log(`上传进度: ${progress._msg}`, 'info');
            }
          },
        }),
      3, // 最多重试 3 次
      5000, // 重试间隔 5 秒
    );

    log(`微信小程序上传成功!`, 'success');
    log(`版本: ${version}`, 'success');
    if (uploadResult) {
      console.log('上传结果:', uploadResult);
    }
  } else {
    // 预览
    const previewResult = await ci.preview({
      project,
      version,
      desc: description,
      robot,
      qrcodeFormat: 'terminal',
      qrcodeOutputDest: resolve(TEMP_DIR, 'preview-qrcode.png'),
      setting: {
        es6: true,
        es7: true,
        minify: true,
      },
      onProgressUpdate: (progress: any) => {
        if (progress._status === 'done') {
          log(`预览进度: ${progress._msg}`, 'info');
        }
      },
    });

    log(`微信小程序预览成功!`, 'success');
    log(`请扫描二维码预览`, 'success');
    if (previewResult) {
      console.log('预览结果:', previewResult);
    }
  }
}

// ==================== 支付宝小程序 ====================

/**
 * 获取支付宝小程序配置
 */
function getAlipayConfig(): AlipayConfig {
  // 处理私钥换行符: GitHub Secrets 中 \n 是字面字符串，需要转换为实际换行符
  const privateKey = process.env.ALIPAY_PRIVATE_KEY!.replace(/\\n/g, '\n');

  return {
    appid: process.env.ALIPAY_APPID!,
    privateKey,
    toolId: process.env.ALIPAY_TOOL_ID!,
    projectPath: BUILD_PATHS.alipay,
  };
}

/**
 * 上传支付宝小程序
 * 使用 minidev Node.js API (支付宝官方 CI 工具)
 * 文档: https://opendocs.alipay.com/mini/02q3an
 */
async function uploadAlipay(config: UploadConfig): Promise<void> {
  let { version } = config;
  const { description } = config;
  const alipayConfig = getAlipayConfig();

  log(`开始上传支付宝小程序...`);
  log(`描述: ${description}`);

  // 检查构建产物
  if (!existsSync(alipayConfig.projectPath)) {
    throw new Error(`构建产物不存在: ${alipayConfig.projectPath}\n请先执行: pnpm build:mp-alipay`);
  }

  // 动态导入 minidev
  const { minidev } = await import('minidev');

  // 注入授权信息
  // 文档: https://opendocs.alipay.com/mini/02q3ap
  await minidev.config.useRuntime({
    'alipay.authentication.privateKey': alipayConfig.privateKey,
    'alipay.authentication.toolId': alipayConfig.toolId,
  });

  // 版本冲突检测和自动递增
  try {
    log('检查版本冲突...', 'info');
    const existingVersion = await minidev.app.getUploadedVersion({
      appId: alipayConfig.appid,
    });

    if (existingVersion) {
      log(`当前最新上传版本: ${existingVersion}`, 'info');

      // 如果版本号相同或小于等于现有版本，自动递增
      if (existingVersion === version || compareVersions(version, existingVersion) <= 0) {
        const newVersion = incrementVersion(existingVersion);
        log(`版本 ${version} 已存在或过旧，自动递增为: ${newVersion}`, 'warn');
        version = newVersion;
      }
    }
  } catch {
    // 获取版本失败不影响上传流程
    log('无法获取现有版本信息，继续上传', 'warn');
  }

  log(`上传版本: ${version}`, 'info');

  // 上传代码 (带重试机制)
  log('正在上传...', 'info');
  const uploadResult = await withRetry(
    () =>
      minidev.upload(
        {
          appId: alipayConfig.appid,
          project: alipayConfig.projectPath,
          version: version,
          experience: true, // 自动设为体验版
          versionDescription: description, // 版本描述
        },
        {
          onLog: (data: string) => {
            log(data, 'info');
          },
        },
      ),
    3, // 最多重试 3 次
    5000, // 重试间隔 5 秒
  );

  log(`支付宝小程序上传成功!`, 'success');
  log(`版本: ${uploadResult?.version || version}`, 'success');
  if (uploadResult?.experienceQrCodeUrl) {
    log(`体验版二维码: ${uploadResult.experienceQrCodeUrl}`, 'success');
  }
}

// ==================== 主函数 ====================

async function main() {
  const startTime = Date.now();

  try {
    const config = parseArgs();

    if (!config.platform) {
      console.log(`
使用方式:
  pnpm tsx scripts/mp-upload.ts <platform> [action]

参数:
  platform    平台类型: weixin | alipay
  action      操作类型: upload | preview (默认: upload)

示例:
  pnpm tsx scripts/mp-upload.ts weixin upload
  pnpm tsx scripts/mp-upload.ts alipay preview

环境变量:
  MP_VERSION  版本号 (默认读取 package.json)
  MP_DESC     版本描述

微信小程序:
  WEIXIN_APPID         AppID
  WEIXIN_PRIVATE_KEY   上传密钥 (base64 编码)

支付宝小程序:
  ALIPAY_APPID         AppID
  ALIPAY_PRIVATE_KEY   私钥
  ALIPAY_TOOL_ID       工具 ID
      `);
      process.exit(1);
    }

    log(`平台: ${config.platform}`, 'info');
    log(`操作: ${config.action}`, 'info');

    // 验证环境变量
    validateEnv(config.platform);

    // 执行上传
    if (config.platform === 'weixin') {
      await uploadWeixin(config);
    } else if (config.platform === 'alipay') {
      await uploadAlipay(config);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log(`总耗时: ${duration}s`, 'success');
  } catch (error) {
    log(`上传失败: ${error instanceof Error ? error.message : error}`, 'error');
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    // 清理临时文件
    cleanupTempFiles();
  }
}

main();
