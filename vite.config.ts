import { defineConfig } from 'vitest/config';
import uniModule from '@dcloudio/vite-plugin-uni';
import { resolve } from 'node:path';
import { loadEnv } from 'vite';
import type { ConfigEnv, PluginOption } from 'vite';
import legacy from '@vitejs/plugin-legacy';
import UniPages from '@uni-helper/vite-plugin-uni-pages';
import UniManifest from '@uni-helper/vite-plugin-uni-manifest';
import { visualizer } from 'rollup-plugin-visualizer';
import { compression } from 'vite-plugin-compression2';
import { devServer } from './config/devServer';

// @dcloudio/vite-plugin-uni 是 CJS 包，ESM 下默认导入拿到的是 module.exports
const uni = (uniModule as unknown as { default?: typeof uniModule }).default ?? uniModule;

/**
 * legacy / modern 包都需要补的 core-js 补丁
 * plugin-legacy 的用量探测只覆盖语法特性，较新的内置方法需显式列出
 */
const modernLegacyPolyfills = [
  'core-js/es/array/at',
  'core-js/es/array/find-last',
  'core-js/es/array/find-last-index',
  'core-js/es/array/to-reversed',
  'core-js/es/array/to-sorted',
  'core-js/es/array/to-spliced',
  'core-js/es/typed-array/at',
  'core-js/es/typed-array/find-last',
  'core-js/es/typed-array/find-last-index',
  'core-js/es/typed-array/to-reversed',
  'core-js/es/typed-array/to-sorted',
  'core-js/es/string/replace-all',
  'core-js/es/object/has-own',
  'core-js/es/promise/any',
];

/**
 * 判断是否为 H5 平台
 */
function isH5Platform(): boolean {
  return !process.env.UNI_PLATFORM || process.env.UNI_PLATFORM === 'h5';
}

/**
 * 生成插件配置
 */
function generatePlugins(command: ConfigEnv['command']): PluginOption[] {
  const isProd = command === 'build';
  const isH5 = isH5Platform();

  let plugins: PluginOption[] = [
    // @uni-helper 插件必须在 uni() 之前
    UniPages({
      dts: 'typings/uni-pages.d.ts',
      subPackages: [
        'src/pages-sub/order',
        'src/pages-sub/user',
        'src/pages-sub/other',
        'src/pages-sub/exam',
        'src/pages-sub/study',
        'src/pages-sub/ai',
      ],
      exclude: ['node_modules', '.git', '**/__*__/**'],
    }),
    UniManifest(),
    // uni() 插件
    uni(),
  ];

  // VITE_LEGACY=true 时为 H5 额外产出 legacy 包，目标浏览器读 .browserslistrc（小程序和 App 不支持）
  if (isProd && isH5 && process.env.VITE_LEGACY === 'true') {
    plugins = [
      ...plugins,
      legacy({
        additionalLegacyPolyfills: modernLegacyPolyfills,
        additionalModernPolyfills: modernLegacyPolyfills,
      }),
    ];
  }

  // H5 产物额外输出 gzip / brotli 压缩文件（小程序和 App 不需要，会增大包体积）
  if (isProd && isH5) {
    plugins.push(
      compression({
        algorithms: ['gzip', 'brotliCompress'],
        threshold: 10240,
        include: [/assets\/.*\.(js|css)$/i],
      }),
    );
  }

  // VITE_ENABLE_ANALYZER=true 时生成包体积分析报告，放在 dist 之外避免随产物发布
  if (isProd && process.env.VITE_ENABLE_ANALYZER === 'true') {
    plugins.push(
      visualizer({
        title: 'Vite Bundle Visualizer',
        open: true,
        brotliSize: true,
        gzipSize: true,
        template: 'treemap',
        filename: 'reports/analyzer.html',
      }),
    );
  }

  return plugins;
}

// https://vitejs.dev/config/
export default ({ mode, command }: Pick<ConfigEnv, 'mode' | 'command'>) => {
  // .env 文件里的变量补进 process.env，命令行显式传入的优先
  for (const [key, value] of Object.entries(loadEnv(mode, process.cwd()))) {
    process.env[key] ??= value;
  }

  return defineConfig({
    /** 开发服务器配置 */
    server: devServer(),

    /** 插件配置 */
    plugins: generatePlugins(command),

    /** 路径别名配置 */
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },

    /** CSS 配置 */
    css: {
      preprocessorOptions: {
        scss: {
          // 抑制第三方库（如 uni-ui）的废弃警告
          silenceDeprecations: ['legacy-js-api', 'import', 'global-builtin'],
        },
      },
    },
  });
};
