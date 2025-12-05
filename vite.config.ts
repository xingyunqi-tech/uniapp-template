import { defineConfig } from 'vitest/config';
import uni from '@dcloudio/vite-plugin-uni';
import { resolve } from 'node:path';
import { loadEnv } from 'vite';
import type { PluginOption } from 'vite';
import legacy from '@vitejs/plugin-legacy';
import UniPages from '@uni-helper/vite-plugin-uni-pages';
import UniLayouts from '@uni-helper/vite-plugin-uni-layouts';
import UniManifest from '@uni-helper/vite-plugin-uni-manifest';
import { devServer } from './config';

/**
 * Legacy polyfills 配置
 * 用于兼容老设备 (iOS 12+, Android 7+)
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
function generatePlugins(mode: string): PluginOption[] {
  const isProd = mode === 'production';
  const isH5 = isH5Platform();

  let plugins: PluginOption[] = [
    // @uni-helper 插件必须在 uni() 之前
    UniPages({
      dts: 'typings/uni-pages.d.ts',
      subPackages: ['src/pages-sub/order', 'src/pages-sub/user', 'src/pages-sub/other'],
    }),
    UniLayouts(),
    UniManifest(),
    // uni() 插件
    uni(),
  ];

  // H5 生产环境添加 legacy 兼容 (仅 H5，小程序和 App 不支持)
  if (isProd && isH5) {
    plugins = [
      ...plugins,
      legacy({
        targets: ['defaults', 'not IE 11'],
        additionalLegacyPolyfills: modernLegacyPolyfills,
        additionalModernPolyfills: modernLegacyPolyfills,
      }),
    ];
  }

  return plugins;
}

// https://vitejs.dev/config/
export default ({ mode }: { mode: string }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  return defineConfig({
    /** 开发服务器配置 */
    server: devServer(),

    /** 插件配置 */
    plugins: generatePlugins(mode),

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
          // 使用新版 Sass API，抑制废弃警告
          api: 'modern-compiler',
          // 抑制第三方库（如 uni-ui）的废弃警告
          silenceDeprecations: ['legacy-js-api', 'import', 'global-builtin'],
        },
      },
    },
  });
};
