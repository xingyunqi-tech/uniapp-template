import { defineConfig, presetAttributify, presetIcons, type Preset } from 'unocss';
import presetUni from 'unocss-preset-uni';

export default defineConfig({
  presets: [
    // UniApp 预设 - 自动处理 rpx 单位
    presetUni() as Preset,
    // 属性模式
    presetAttributify(),
    // 图标
    presetIcons({
      scale: 1.2,
      // 关闭警告：动态类名会产生误报（如 i-carbon-view-off-xxx）
      warn: false,
      extraProperties: {
        display: 'inline-block',
        'vertical-align': 'middle',
      },
    }),
  ],

  // 自定义快捷方式
  shortcuts: {
    // 布局
    'flex-center': 'flex items-center justify-center',
    'flex-between': 'flex items-center justify-between',
    'flex-start': 'flex items-center justify-start',
    'flex-end': 'flex items-center justify-end',
    'flex-col': 'flex flex-col',
    'flex-col-center': 'flex flex-col items-center justify-center',

    // 文字省略
    'text-ellipsis': 'overflow-hidden text-ellipsis whitespace-nowrap',
    'text-ellipsis-2': 'overflow-hidden line-clamp-2',
    'text-ellipsis-3': 'overflow-hidden line-clamp-3',

    // 边框
    'border-bottom': 'border-b border-solid border-gray-200',
    'border-top': 'border-t border-solid border-gray-200',

    // 安全区域
    'safe-bottom': 'pb-[env(safe-area-inset-bottom)]',
    'safe-top': 'pt-[env(safe-area-inset-top)]',

    // 按钮
    'btn-primary': 'bg-primary text-white rounded-lg px-4 py-2 active:opacity-80',
    'btn-default': 'bg-gray-100 text-gray-700 rounded-lg px-4 py-2 active:opacity-80',
  },

  // 主题配置
  theme: {
    colors: {
      primary: '#1989fa',
      'primary-light': '#66b1ff',
      'primary-dark': '#1677ff',
      success: '#07c160',
      warning: '#ff976a',
      error: '#ee0a24',
      info: '#909399',
    },
  },

  // 规则
  rules: [
    // 自定义 rpx 单位
    [/^w-(\d+)rpx$/, ([, d]) => ({ width: `${d}rpx` })],
    [/^h-(\d+)rpx$/, ([, d]) => ({ height: `${d}rpx` })],
    [/^text-(\d+)rpx$/, ([, d]) => ({ 'font-size': `${d}rpx` })],
    [/^m-(\d+)rpx$/, ([, d]) => ({ margin: `${d}rpx` })],
    [/^p-(\d+)rpx$/, ([, d]) => ({ padding: `${d}rpx` })],
    [/^mt-(\d+)rpx$/, ([, d]) => ({ 'margin-top': `${d}rpx` })],
    [/^mb-(\d+)rpx$/, ([, d]) => ({ 'margin-bottom': `${d}rpx` })],
    [/^ml-(\d+)rpx$/, ([, d]) => ({ 'margin-left': `${d}rpx` })],
    [/^mr-(\d+)rpx$/, ([, d]) => ({ 'margin-right': `${d}rpx` })],
    [/^pt-(\d+)rpx$/, ([, d]) => ({ 'padding-top': `${d}rpx` })],
    [/^pb-(\d+)rpx$/, ([, d]) => ({ 'padding-bottom': `${d}rpx` })],
    [/^pl-(\d+)rpx$/, ([, d]) => ({ 'padding-left': `${d}rpx` })],
    [/^pr-(\d+)rpx$/, ([, d]) => ({ 'padding-right': `${d}rpx` })],
    [/^rounded-(\d+)rpx$/, ([, d]) => ({ 'border-radius': `${d}rpx` })],
    [/^gap-(\d+)rpx$/, ([, d]) => ({ gap: `${d}rpx` })],
  ],

  // 安全列表 - 确保这些类始终生成
  safelist: [
    'flex-center',
    'flex-between',
    'text-ellipsis',
    'btn-primary',
    'btn-default',
    // 动态图标 - 避免 UnoCSS 静态分析误报
    'i-carbon-view',
    'i-carbon-view-off',
    'i-carbon-checkmark',
    'i-carbon-close',
    'i-carbon-checkbox',
  ],
});
