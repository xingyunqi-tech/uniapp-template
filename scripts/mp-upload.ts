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
 *   WEIXIN_APPID                   # 微信小程序 AppID
 *   WEIXIN_PRIVATE_KEY             # 微信小程序上传密钥 (base64 编码)
 *   ALIPAY_APPID                   # 支付宝小程序 AppID
 *   ALIPAY_PRIVATE_KEY             # 支付宝小程序私钥
 *   ALIPAY_TOOL_ID                 # 支付宝小程序工具 ID
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

  // 机器人编号 (CI 环境自动分配)
  const robot = process.env.CI ? Math.floor(Math.random() * 30) + 1 : 1;

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
    // 上传代码
    const uploadResult = await ci.upload({
      project,
      version,
      desc: description,
      robot,
      setting: {
        es6: true,
        es7: true,
        minify: true,
        autoPrefixWXSS: true,
        minifyWXML: true,
        minifyWXSS: true,
        minifyJS: true,
      },
      onProgressUpdate: (progress: any) => {
        if (progress._status === 'done') {
          log(`上传进度: ${progress._msg}`, 'info');
        }
      },
    });

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
  return {
    appid: process.env.ALIPAY_APPID!,
    privateKey: process.env.ALIPAY_PRIVATE_KEY!,
    toolId: process.env.ALIPAY_TOOL_ID!,
    projectPath: BUILD_PATHS.alipay,
  };
}

/**
 * 上传支付宝小程序
 * 使用 minidev Node.js API (支付宝官方 CI 工具)
 * 文档: https://opendocs.alipay.com/mini/miniu/api
 */
async function uploadAlipay(config: UploadConfig): Promise<void> {
  const { action, version, description } = config;
  const alipayConfig = getAlipayConfig();

  log(`开始${action === 'upload' ? '上传' : '预览'}支付宝小程序...`);
  log(`版本: ${version}`);
  log(`描述: ${description}`);

  // 检查构建产物
  if (!existsSync(alipayConfig.projectPath)) {
    throw new Error(`构建产物不存在: ${alipayConfig.projectPath}\n请先执行: pnpm build:mp-alipay`);
  }

  // 动态导入 minidev
  const minidev = await import('minidev');

  // 配置 minidev
  // 文档: https://opendocs.alipay.com/mini/miniu/api
  minidev.setConfig({
    toolId: alipayConfig.toolId,
    privateKey: alipayConfig.privateKey,
  });

  if (action === 'upload') {
    // 上传代码
    log('正在上传...', 'info');
    const uploadResult = await minidev.miniUpload({
      appId: alipayConfig.appid,
      clientType: 'alipay',
      project: alipayConfig.projectPath,
      version: version,
      experience: true, // 自动设为体验版
      onProgressUpdate: (info: { status: string; data: any }) => {
        if (info.status === 'upload') {
          log(`上传进度: ${JSON.stringify(info.data)}`, 'info');
        }
      },
    });

    log(`支付宝小程序上传成功!`, 'success');
    log(`版本: ${version}`, 'success');
    if (uploadResult) {
      console.log('上传结果:', uploadResult);
    }
  } else {
    // 预览
    log('正在生成预览...', 'info');
    const previewResult = await minidev.miniPreview({
      appId: alipayConfig.appid,
      clientType: 'alipay',
      project: alipayConfig.projectPath,
      qrcodeFormat: 'terminal',
      onProgressUpdate: (info: { status: string; data: any }) => {
        if (info.status === 'preview') {
          log(`预览进度: ${JSON.stringify(info.data)}`, 'info');
        }
      },
    });

    log(`支付宝小程序预览成功!`, 'success');
    log(`请扫描二维码预览`, 'success');
    if (previewResult) {
      console.log('预览结果:', previewResult);
    }
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
