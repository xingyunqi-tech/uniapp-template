/**
 * ==================== API 导出更新脚本 ====================
 *
 * 功能：自动扫描 src/api/generated/ 和 src/api/custom/ 目录，更新 src/api/index.ts 的导出语句
 *
 * 执行时机：在 Orval 生成 API 代码后自动执行（通过 orval.config.ts 的 hooks 配置）
 *
 * 工作流程：
 * 1. 扫描 src/api/generated/ 下的所有模块目录（排除 model）
 * 2. 扫描 src/api/custom/ 下的所有 .ts 文件（排除 .d.ts）
 * 3. 生成对应的导出语句
 * 4. 更新 src/api/index.ts 文件
 *
 * 特性：
 * - ✅ 自动发现 generated 模块并提取函数名
 * - ✅ 自动发现 custom 目录下的所有自定义模块
 * - ✅ 支持多个自定义模块文件（upload.ts, download.ts, auth.ts 等）
 * - ✅ 按字母顺序排序，保持导出顺序一致
 * - ✅ 详细的控制台输出，便于调试
 *
 * 使用示例：
 * 1. 在 custom/ 目录新增 upload.ts
 * 2. 运行 pnpm api:gen
 * 3. 脚本自动检测并导出 custom/upload.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 项目根目录
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const GENERATED_DIR = path.join(PROJECT_ROOT, 'src/api/generated');
const CUSTOM_DIR = path.join(PROJECT_ROOT, 'src/api/custom');
const API_INDEX_FILE = path.join(PROJECT_ROOT, 'src/api/index.ts');

/**
 * 从模块文件中提取导出的函数名
 * @param modulePath 模块文件路径
 * @returns 导出的函数名列表
 */
function extractExportedFunctions(modulePath: string): string[] {
  try {
    const content = fs.readFileSync(modulePath, 'utf-8');
    const functionPattern = /export const (\w+) = \(/g;
    const functions: string[] = [];
    let match;

    while ((match = functionPattern.exec(content)) !== null) {
      functions.push(match[1]);
    }

    return functions;
  } catch (error) {
    console.error(`提取函数失败 (${modulePath}):`, error);
    return [];
  }
}

/**
 * 扫描 generated 目录，获取所有 API 模块及其函数
 * @returns API 模块信息列表
 */
function scanGeneratedModules(): Array<{ name: string; functions: string[] }> {
  try {
    const entries = fs.readdirSync(GENERATED_DIR, { withFileTypes: true });

    return entries
      .filter(entry => {
        // 只保留目录
        if (!entry.isDirectory()) return false;

        // 排除 model 目录（类型定义单独导出）
        if (entry.name === 'model') return false;

        // 检查目录下是否有 .ts 文件
        const modulePath = path.join(GENERATED_DIR, entry.name);
        const files = fs.readdirSync(modulePath);
        return files.some(file => file.endsWith('.ts'));
      })
      .map(entry => {
        const moduleName = entry.name;
        const modulePath = path.join(GENERATED_DIR, moduleName, `${moduleName}.ts`);
        const functions = extractExportedFunctions(modulePath);
        return { name: moduleName, functions };
      })
      .sort((a, b) => a.name.localeCompare(b.name)); // 按字母排序
  } catch (error) {
    console.error('扫描 generated 目录失败:', error);
    return [];
  }
}

/**
 * 扫描 custom 目录，获取所有自定义模块
 * @returns 自定义模块文件名列表（不含扩展名）
 */
function scanCustomModules(): string[] {
  try {
    // 检查 custom 目录是否存在
    if (!fs.existsSync(CUSTOM_DIR)) {
      console.log('ℹ️  custom 目录不存在，跳过自定义模块扫描');
      return [];
    }

    const entries = fs.readdirSync(CUSTOM_DIR, { withFileTypes: true });

    return entries
      .filter(entry => {
        // 只保留 .ts 文件（排除 .d.ts）
        return entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts');
      })
      .map(entry => {
        // 移除 .ts 扩展名
        return entry.name.replace(/\.ts$/, '');
      })
      .sort((a, b) => a.localeCompare(b)); // 按字母排序
  } catch (error) {
    console.error('扫描 custom 目录失败:', error);
    return [];
  }
}

/**
 * 生成 API 导出代码
 * @param modules API 模块信息列表
 * @param customModules 自定义模块列表
 * @returns 完整的 index.ts 内容
 */
function generateIndexContent(modules: Array<{ name: string; functions: string[] }>, customModules: string[]): string {
  // 生成 generated 模块导出语句
  const exportStatements = modules
    .map(({ name, functions }) => {
      const funcList = functions.join(',\n  ');
      return `export {\n  ${funcList},\n} from './generated/${name}/${name}';`;
    })
    .join('\n\n');

  // 生成 custom 模块导出语句
  const customExportStatements =
    customModules.length > 0
      ? customModules.map(moduleName => `export * from './custom/${moduleName}';`).join('\n')
      : '';

  return `/**
 * ==================== API 模块统一导出 ====================
 *
 * 本文件仅导出公共 API，内部实现细节不对外暴露
 *
 * 导出内容：
 * - API 调用函数：postAuthLogin, getAuthUserInfo 等
 * - 自定义工具函数：uploadWithProgress, downloadFile 等
 * - 公共类型定义：LoginRequest, LoginResponse, UserInfo
 *
 * 使用指南：
 * - API 函数：import { postAuthLogin } from '@/api'
 * - 类型定义：import type { LoginRequest } from '@/api'
 */

/**
 * ==================== 导出策略 ====================
 *
 * 1. 优先导出 model 中的类型定义 (接口、枚举等)
 * 2. 导出各模块的 API 函数 (只导出函数,不导出 *Result 类型别名)
 * 3. 导出自定义扩展和工具函数
 *
 * 为什么这样做：
 * - model 中的接口 (如 UploadCertificateResult) 是后端返回的数据结构
 * - API 模块中的类型别名 (如 UploadCertificateResult) 是整个响应的类型
 * - 两者同名但不同,会导致 TypeScript 报错,因此只导出函数
 */

// 1. 从 model 目录导出所有类型定义 (优先导出)
export * from './generated/model';

// 2. 自动生成的 API 函数 (只导出函数,不导出类型)
${exportStatements}

// 3. 自定义工具函数 (自动扫描 custom 目录)
${customExportStatements}
`;
}

/**
 * 主函数
 */
function main() {
  console.log('🔄 开始更新 API 导出文件...\n');

  // 1. 扫描 generated 模块
  console.log('📂 扫描 generated 目录...');
  const modules = scanGeneratedModules();

  if (modules.length === 0) {
    console.log('⚠️  未找到任何 API 模块');
    return;
  }

  console.log(`✅ 找到 ${modules.length} 个生成模块:`);
  modules.forEach(({ name }) => console.log(`   - ${name}`));
  console.log();

  // 2. 扫描 custom 模块
  console.log('📂 扫描 custom 目录...');
  const customModules = scanCustomModules();

  if (customModules.length > 0) {
    console.log(`✅ 找到 ${customModules.length} 个自定义模块:`);
    customModules.forEach(name => console.log(`   - ${name}`));
  } else {
    console.log('ℹ️  未找到自定义模块');
  }
  console.log();

  // 3. 生成内容
  console.log('📝 生成导出代码...');
  const content = generateIndexContent(modules, customModules);

  // 4. 写入文件
  console.log('💾 更新 src/api/index.ts...');
  fs.writeFileSync(API_INDEX_FILE, content, 'utf-8');

  console.log('✅ API 导出文件更新完成!\n');

  // 5. 显示导出信息
  console.log('📋 导出统计:');
  console.log(`   生成模块: ${modules.length} 个`);
  modules.forEach(({ name, functions }) => {
    console.log(`     - ${name}: ${functions.length} 个函数`);
  });
  console.log(`   自定义模块: ${customModules.length} 个`);
  if (customModules.length > 0) {
    customModules.forEach(name => {
      console.log(`     - ${name}`);
    });
  }
  console.log();
}

// 执行
main();
