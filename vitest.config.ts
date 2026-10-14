import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
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
      include: ['src/utils/**', 'src/composables/**', 'src/store/**', 'src/api/core/**', 'src/api/custom/**'],
      exclude: ['node_modules/', 'tests/', 'dist/', '**/*.d.ts', '**/*.config.*', 'scripts/', 'src/api/generated/**'],
      thresholds: {
        statements: 28,
        branches: 25,
        functions: 22,
        lines: 28,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
