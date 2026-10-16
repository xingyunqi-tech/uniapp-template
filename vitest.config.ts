import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';
import vue from '@vitejs/plugin-vue';

/** uni-app 内置组件，测试中按原生元素渲染 */
const UNI_TAGS = new Set(['view', 'text', 'image', 'scroll-view', 'swiper', 'swiper-item', 'navigator', 'web-view']);

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: tag => UNI_TAGS.has(tag),
          // 去掉模板注释，与构建产物一致，组件保持单根节点
          comments: false,
        },
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/unpackage/**'],
    setupFiles: ['./tests/setup.ts'],
    server: {
      deps: {
        inline: ['@alova/adapter-uniapp'],
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: [
        'src/utils/**',
        'src/composables/**',
        'src/store/**',
        'src/api/core/**',
        'src/api/custom/**',
        'src/components/**',
      ],
      exclude: ['node_modules/', 'tests/', 'dist/', '**/*.d.ts', '**/*.config.*', 'scripts/', 'src/api/generated/**'],
      thresholds: {
        statements: 70,
        branches: 68,
        functions: 67,
        lines: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
