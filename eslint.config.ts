import jseslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import checkFile from 'eslint-plugin-check-file';
import eslintPluginVue from 'eslint-plugin-vue';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  // ==================== 基础推荐配置 ====================
  // 应用 JavaScript 官方推荐规则
  jseslint.configs.recommended,

  // 应用 TypeScript 官方推荐规则（展开数组）
  ...tseslint.configs.recommended,

  // 应用 Vue.js 官方推荐规则（Flat Config 版本）
  ...eslintPluginVue.configs['flat/recommended'],

  // 集成 Prettier 配置，禁用与 Prettier 冲突的 ESLint 规则
  eslintConfigPrettier,

  // ==================== 全局配置 ====================
  {
    languageOptions: {
      // 定义全局变量，避免 no-undef 错误
      globals: {
        ...globals.browser, // 浏览器环境全局变量 (window, document, etc.)
        ...globals.node, // Node.js 环境全局变量 (process, Buffer, etc.)
        ...globals.es2022, // ES2022 全局变量和特性
        // UniApp 全局变量
        uni: 'readonly',
        UniApp: 'readonly',
        UniHelper: 'readonly',
        Page: 'readonly',
        getCurrentPages: 'readonly',
        getApp: 'readonly',
        plus: 'readonly',
        wx: 'readonly',
        my: 'readonly',
        // 自定义全局类型 (定义在 typings/uni.d.ts)
        UniIconsType: 'readonly',
        UniDataPickerValueArray: 'readonly',
        // @uni-helper/vite-plugin-uni-pages 编译器宏
        definePage: 'readonly',
      },
      // 指定 ECMAScript 版本为最新
      ecmaVersion: 'latest',
      // 指定模块类型为 ES Module
      sourceType: 'module',
    },
    // Linter 选项配置
    linterOptions: {
      // 报告未使用的 eslint-disable 指令
      reportUnusedDisableDirectives: true,
    },
    // 自定义规则配置
    rules: {
      // 允许使用 any 类型（在某些场景下必要）
      '@typescript-eslint/no-explicit-any': 'off',
      // 允许使用 namespace（用于类型声明等场景）
      '@typescript-eslint/no-namespace': 'off',
      // 强制每个组件都应该在它自己的文件中
      'vue/one-component-per-file': 'off',
      'vue/no-v-html': 'off',
    },
  },

  // ==================== Vue 文件专用配置 ====================
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        // 指定 ECMAScript 版本为最新
        ecmaVersion: 'latest',
        // 指定模块类型为 ES Module
        sourceType: 'module',
        // 使用 TypeScript 解析器解析 <script> 部分
        parser: tseslint.parser,
        // 支持 .vue 文件扩展名
        extraFileExtensions: ['.vue'],
        // 使用 projectService 支持 TypeScript project references
        projectService: true,
        // 设置 TypeScript 配置根目录
        tsconfigRootDir: process.cwd(),
      },
    },

    rules: {
      // ========== Vue 3 特定规则调整 ==========
      // 关闭组件名必须多单词的限制（允许 Index.vue 等单词组件名）
      'vue/multi-word-component-names': 'off',
      // 关闭模板根节点唯一性检查（Vue 3 支持多根节点）
      'vue/no-multiple-template-root': 'off',
      // 在 Vue 文件中关闭未使用变量检查（模板中使用的变量可能被误报）
      '@typescript-eslint/no-unused-vars': 'off',
      // 关闭无用赋值检查（<script setup> 中变量在模板使用，ESLint 无法追踪）
      'no-useless-assignment': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      'vue/require-default-prop': 'off',
    },
  },

  // ==================== 生成文件配置 ====================
  {
    files: ['src/api/generated/**/*'],
    rules: {
      // 允许 Orval 生成的 type/const 同名声明（枚举模式）
      '@typescript-eslint/no-redeclare': 'off',
    },
  },

  // ==================== 导入限制 ====================
  // api 层之外禁止直接引用 generated，统一从 @/api 导入，custom/ 的覆盖才能生效
  {
    files: ['src/**/*.{ts,tsx,js,jsx,vue,mts,cts}'],
    ignores: ['src/api/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/api/generated', '@/api/generated/**', '**/api/generated', '**/api/generated/**'],
              message: '禁止直接从 api/generated/ 导入，请通过 @/api 统一入口导入。',
            },
          ],
        },
      ],
    },
  },

  // ==================== 文件命名规范 ====================
  // Vue 组件：PascalCase（index.vue / App.vue 除外）
  {
    files: ['src/**/*.vue'],
    ignores: ['src/**/index.vue', 'src/App.vue'],
    plugins: { 'check-file': checkFile },
    rules: {
      'check-file/filename-naming-convention': ['error', { '**/*.vue': 'PASCAL_CASE' }],
    },
  },
  // Composables：camelCase（use 开头的文件，如 useXxx.ts）
  {
    files: ['src/**/use[A-Z]*.{ts,js}'],
    plugins: { 'check-file': checkFile },
    rules: {
      'check-file/filename-naming-convention': ['error', { '**/*.{ts,js}': 'CAMEL_CASE' }],
    },
  },
  // 其余 TS/JS 文件：kebab-case（排除 use 开头的文件、类型声明文件、自动生成文件）
  {
    files: ['src/**/*.{ts,tsx,js,jsx}'],
    ignores: ['src/**/use[A-Z]*.{ts,js}', 'src/**/*.d.ts', 'src/api/generated/**/*'],
    plugins: { 'check-file': checkFile },
    rules: {
      'check-file/filename-naming-convention': ['error', { '**/*.{ts,tsx,js,jsx}': 'KEBAB_CASE' }],
    },
  },

  // ==================== 忽略文件配置 ====================
  {
    ignores: ['dist/**/*', 'node_modules/**/*', 'public/**/*', 'coverage/**/*', 'src/uni_modules/mp-html/**/*'],
  },
];
